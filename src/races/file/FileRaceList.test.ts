import { expect, it } from "@effect/vitest"
import { ConfigProvider, Effect, FileSystem, Layer, PlatformError } from "effect"
import { captureLogs } from "../../testing/captureLogs.ts"
import { RaceList } from "../RaceList.ts"
import * as FileRaceList from "./FileRaceList.ts"

const fileSystemWith = (files: Record<string, string>) =>
  FileSystem.layerNoop({
    readFileString: (path) =>
      path in files
        ? Effect.succeed(files[path] ?? "")
        : Effect.fail(
            PlatformError.systemError({
              _tag: "NotFound",
              module: "FileSystem",
              method: "readFileString",
              pathOrDescriptor: path,
            }),
          ),
  })

const layerWith = (env: Record<string, string>, files: Record<string, string>) =>
  FileRaceList.layer.pipe(
    Layer.provide(fileSystemWith(files)),
    Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(env))),
  )

it.effect("reads the names from the file named by RACES_FILE", () =>
  Effect.gen(function* () {
    const list = yield* RaceList

    const names = yield* list.names

    expect(names).toEqual(["Chianti UTMB", "Brunello Crossing"])
  }).pipe(
    Effect.provide(
      layerWith(
        { RACES_FILE: "./gare.txt" },
        { "./gare.txt": "Chianti UTMB\nBrunello Crossing\n" },
      ),
    ),
  ),
)

it.effect("defaults to races.txt when RACES_FILE is absent", () =>
  Effect.gen(function* () {
    const list = yield* RaceList

    const names = yield* list.names

    expect(names).toEqual(["Chianti UTMB"])
  }).pipe(Effect.provide(layerWith({}, { "races.txt": "Chianti UTMB\n" }))),
)

it.effect("warns about a duplicated name and keeps the first", () =>
  Effect.gen(function* () {
    const logs: Array<string> = []
    const list = yield* RaceList

    const names = yield* list.names.pipe(Effect.provide(captureLogs(logs)))

    expect(names).toEqual(["Chianti UTMB"])
    expect(logs).toHaveLength(1)
    expect(logs[0]).toContain("Warn")
    expect(logs[0]).toContain("chianti utmb")
    expect(logs[0]).toContain("riga 2")
  }).pipe(Effect.provide(layerWith({}, { "races.txt": "Chianti UTMB\nchianti utmb\n" }))),
)

it.effect("fails with RaceListError naming the path when the file is unreadable", () =>
  Effect.gen(function* () {
    const list = yield* RaceList

    const error = yield* Effect.flip(list.names)

    expect(error._tag).toBe("RaceListError")
    expect(error.message).toContain("./missing.txt")
  }).pipe(Effect.provide(layerWith({ RACES_FILE: "./missing.txt" }, {}))),
)

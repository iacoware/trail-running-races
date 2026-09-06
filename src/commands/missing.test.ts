import { expect, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { RaceList } from "../races/RaceList.ts"
import { SheetReader } from "../sheet/SheetReader.ts"
import { captureLogs } from "../testing/captureLogs.ts"
import { missing } from "./missing.ts"

const header = ["Nome", "Data (+ o -)", "Luogo", "Da FI", "Tipo", "Distanze"]

const sheetWith = (...rows: ReadonlyArray<ReadonlyArray<string>>) =>
  Layer.succeed(SheetReader, SheetReader.of({ rows: Effect.succeed([header, ...rows]) }))

const listOf = (...names: ReadonlyArray<string>) =>
  Layer.succeed(RaceList, RaceList.of({ names: Effect.succeed(names) }))

it.effect("returns the list names that have no race row in the sheet, in list order", () =>
  Effect.gen(function* () {
    const names = yield* missing

    expect(names).toEqual(["Nuova Gara", "Altra Gara"])
  }).pipe(
    Effect.provide(listOf("Nuova Gara", "chianti utmb", "Altra Gara")),
    Effect.provide(sheetWith(["Toscana"], ["Chianti UTMB", "18-21 marzo"])),
  ),
)

it.effect("warns about rows outside every section but still counts them as present", () =>
  Effect.gen(function* () {
    const logs: Array<string> = []

    const names = yield* missing.pipe(Effect.provide(captureLogs(logs)))

    expect(names).toEqual([])
    expect(logs).toHaveLength(1)
    expect(logs[0]).toContain("Warn")
    expect(logs[0]).toContain("fuori da ogni sezione")
  }).pipe(
    Effect.provide(listOf("Orfana")),
    Effect.provide(sheetWith(["Toscana"], [], ["Orfana", "2 maggio"])),
  ),
)

it.effect("fails with SheetColumnMissingError when a header column is missing", () =>
  Effect.gen(function* () {
    const error = yield* Effect.flip(missing)

    expect(error._tag).toBe("SheetColumnMissingError")
  }).pipe(
    Effect.provide(listOf("Nuova Gara")),
    Effect.provide(
      Layer.succeed(
        SheetReader,
        SheetReader.of({ rows: Effect.succeed([["Nome", "Data", "Luogo", "Da FI", "Tipo"]]) }),
      ),
    ),
  ),
)

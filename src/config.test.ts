import { expect, it } from "@effect/vitest"
import { ConfigProvider, Effect, Option } from "effect"
import { raceListConfig, sheetConfig } from "./config.ts"

const parse = (env: Record<string, string>) => sheetConfig.parse(ConfigProvider.fromUnknown(env))

const validEnv = { SHEET_ID: "sheet-1", GOOGLE_SERVICE_ACCOUNT_JSON: "./key.json" }

it.effect("fails naming SHEET_ID when it is missing", () =>
  Effect.gen(function* () {
    const error = yield* Effect.flip(parse({ GOOGLE_SERVICE_ACCOUNT_JSON: "./key.json" }))

    expect(error._tag).toBe("ConfigError")
    expect(error.message).toContain("SHEET_ID")
  }),
)

it.effect("fails naming GOOGLE_SERVICE_ACCOUNT_JSON when it is blank", () =>
  Effect.gen(function* () {
    const error = yield* Effect.flip(
      parse({ SHEET_ID: "sheet-1", GOOGLE_SERVICE_ACCOUNT_JSON: "  " }),
    )

    expect(error.message).toContain("GOOGLE_SERVICE_ACCOUNT_JSON")
  }),
)

it.effect("treats a blank SHEET_TAB as absent", () =>
  Effect.gen(function* () {
    const config = yield* parse({ ...validEnv, SHEET_TAB: "" })

    expect(config.tab).toEqual(Option.none())
  }),
)

it.effect("trims SHEET_TAB when present", () =>
  Effect.gen(function* () {
    const config = yield* parse({ ...validEnv, SHEET_TAB: " Gare " })

    expect(config.tab).toEqual(Option.some("Gare"))
  }),
)

it.effect("reads GOOGLE_SERVICE_ACCOUNT_JSON as inline JSON when it starts with a brace", () =>
  Effect.gen(function* () {
    const inline = '{"client_email":"a"}'

    const config = yield* parse({ ...validEnv, GOOGLE_SERVICE_ACCOUNT_JSON: inline })

    expect(config.serviceAccount).toEqual({ _tag: "InlineJson", json: inline })
  }),
)

it.effect("reads GOOGLE_SERVICE_ACCOUNT_JSON as a file path otherwise", () =>
  Effect.gen(function* () {
    const config = yield* parse(validEnv)

    expect(config.serviceAccount).toEqual({ _tag: "FilePath", path: "./key.json" })
  }),
)

it.effect("defaults RACES_FILE to races.txt", () =>
  Effect.gen(function* () {
    const config = yield* raceListConfig.parse(ConfigProvider.fromUnknown({}))

    expect(config.path).toBe("races.txt")
  }),
)

it.effect("reads RACES_FILE when present", () =>
  Effect.gen(function* () {
    const config = yield* raceListConfig.parse(
      ConfigProvider.fromUnknown({ RACES_FILE: "./gare.txt" }),
    )

    expect(config.path).toBe("./gare.txt")
  }),
)

it.effect("falls back to races.txt when RACES_FILE is blank", () =>
  Effect.gen(function* () {
    const config = yield* raceListConfig.parse(ConfigProvider.fromUnknown({ RACES_FILE: "  " }))

    expect(config.path).toBe("races.txt")
  }),
)

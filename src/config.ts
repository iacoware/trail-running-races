import { Config, Schema } from "effect"

export type ServiceAccountSource =
  | { readonly _tag: "InlineJson"; readonly json: string }
  | { readonly _tag: "FilePath"; readonly path: string }

const NonBlank = Schema.Trim.pipe(Schema.check(Schema.isNonEmpty()))

const serviceAccountSource = (value: string): ServiceAccountSource =>
  value.startsWith("{") ? { _tag: "InlineJson", json: value } : { _tag: "FilePath", path: value }

export const sheetConfig = Config.all({
  spreadsheetId: Config.schema(NonBlank, "SHEET_ID"),
  tab: Config.schema(NonBlank, "SHEET_TAB").pipe(Config.option),
  serviceAccount: Config.schema(NonBlank, "GOOGLE_SERVICE_ACCOUNT_JSON").pipe(
    Config.map(serviceAccountSource),
  ),
})

const DEFAULT_RACES_FILE = "races.txt"

export const raceListConfig = Config.all({
  path: Config.schema(Schema.Trim, "RACES_FILE").pipe(
    Config.withDefault(""),
    Config.map((path) => (path === "" ? DEFAULT_RACES_FILE : path)),
  ),
})

const DEFAULT_AGENT_CMD = [
  "claude -p --output-format text --allowedTools WebSearch,WebFetch",
  "--model opus --effort medium",
].join(" ")
const DEFAULT_AGENT_TIMEOUT_SECONDS = 300

const PositiveIntFromString = Schema.NumberFromString.pipe(
  Schema.check(Schema.isInt(), Schema.isGreaterThan(0)),
)

// A blank value behaves like an absent one, so a commented-out .env line and an empty one agree.
const blankAsDefault = <A>(schema: Schema.Codec<A, string>, name: string, fallback: A) =>
  Config.schema(
    Schema.Trim.pipe(Schema.decodeTo(Schema.Union([Schema.Literal(""), schema]))),
    name,
  ).pipe(
    Config.withDefault(fallback),
    Config.map((value) => (value === "" ? fallback : value)),
  )

export const agentConfig = Config.all({
  command: blankAsDefault(Schema.String, "AGENT_CMD", DEFAULT_AGENT_CMD),
  timeoutSeconds: blankAsDefault(
    PositiveIntFromString,
    "AGENT_TIMEOUT",
    DEFAULT_AGENT_TIMEOUT_SECONDS,
  ),
})

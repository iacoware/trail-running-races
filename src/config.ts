import { Config, Data, Redacted, Schema } from "effect"

export type ServiceAccountSource = Data.TaggedEnum<{
    InlineJson: { readonly json: Redacted.Redacted<string> }
    FilePath: { readonly path: string }
}>

export const ServiceAccountSource = Data.taggedEnum<ServiceAccountSource>()

const NonBlank = Schema.Trim.pipe(Schema.check(Schema.isNonEmpty()))

const serviceAccountSourceFromEnv = (value: Redacted.Redacted<string>): ServiceAccountSource =>
    Redacted.value(value).startsWith("{")
        ? ServiceAccountSource.InlineJson({ json: value })
        : ServiceAccountSource.FilePath({ path: Redacted.value(value) })

export const sheetConfig = Config.all({
    spreadsheetId: Config.schema(NonBlank, "SHEET_ID"),
    tab: Config.schema(NonBlank, "SHEET_TAB").pipe(Config.option),
    serviceAccount: Config.schema(Schema.Redacted(NonBlank), "GOOGLE_SERVICE_ACCOUNT_JSON").pipe(
        Config.map(serviceAccountSourceFromEnv),
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
    "--model sonnet --effort medium",
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

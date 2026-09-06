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

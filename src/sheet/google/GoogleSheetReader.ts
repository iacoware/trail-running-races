import { auth, sheets } from "@googleapis/sheets"
import { Effect, Layer, Option, Schema } from "effect"
import { sheetConfig } from "../../config.ts"
import { SheetApiError, SheetTabNotFoundError } from "../errors.ts"
import { SheetReader } from "../SheetReader.ts"
import { quoteSheetTitle } from "./a1Range.ts"
import { toSheetError } from "./googleError.ts"
import { loadServiceAccountKey } from "./serviceAccountKey.ts"

const SPREADSHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets"

const Rows = Schema.Array(Schema.Array(Schema.String))

const TabProperties = Schema.Struct({
  title: Schema.String,
  hidden: Schema.optional(Schema.Boolean),
})

const TabList = Schema.Struct({
  sheets: Schema.optional(Schema.Array(Schema.Struct({ properties: TabProperties }))),
})

export const layer = Layer.effect(
  SheetReader,
  Effect.gen(function* () {
    const { spreadsheetId, tab, serviceAccount } = yield* sheetConfig
    const key = yield* loadServiceAccountKey(serviceAccount)
    const api = sheets({
      version: "v4",
      auth: new auth.JWT({
        email: key.client_email,
        key: key.private_key,
        scopes: [SPREADSHEETS_SCOPE],
      }),
    })

    const call = <A>(request: () => Promise<A>) =>
      Effect.tryPromise({ try: request, catch: toSheetError(spreadsheetId) })

    const decode = <S extends Schema.Top>(schema: S, value: unknown) =>
      Schema.decodeUnknownEffect(schema)(value).pipe(
        Effect.mapError(
          (cause) =>
            new SheetApiError({
              spreadsheetId,
              message: `risposta inattesa da Google Sheets: ${cause.message}`,
              cause,
            }),
        ),
      )

    const tabs = Effect.gen(function* () {
      const response = yield* call(() =>
        api.spreadsheets.get({ spreadsheetId, fields: "sheets.properties(title,hidden)" }),
      )
      const { sheets: list = [] } = yield* decode(TabList, response.data)
      return list.map((sheet) => sheet.properties)
    })

    // Like the Sheets UI and a sheet-less A1 range, "first tab" means the first visible one.
    const resolveTabTitle = Effect.gen(function* () {
      const available = yield* tabs
      const titles = available.map((properties) => properties.title)
      const firstVisible = available.find((properties) => properties.hidden !== true)
      const chosen = Option.getOrElse(tab, () => firstVisible?.title)
      if (chosen === undefined || !titles.includes(chosen)) {
        return yield* new SheetTabNotFoundError({
          spreadsheetId,
          message:
            `tab ${chosen ?? "(nessuno)"} non trovato nel foglio ${spreadsheetId}; ` +
            `tab disponibili: ${titles.join(", ")}`,
        })
      }
      return chosen
    })

    const rows = Effect.gen(function* () {
      const title = yield* resolveTabTitle
      const response = yield* call(() =>
        api.spreadsheets.values.get({ spreadsheetId, range: quoteSheetTitle(title) }),
      )
      return yield* decode(Rows, response.data.values ?? [])
    })

    return SheetReader.of({ rows })
  }),
)

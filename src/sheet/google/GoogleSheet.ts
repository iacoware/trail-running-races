import { auth, sheets } from "@googleapis/sheets"
import { Context, Effect, Layer, Option, Schema } from "effect"

import { sheetConfig } from "../../config.ts"
import type { PlannedRow } from "../../plan/planRow.ts"
import { SheetApiError, SheetTabNotFoundError } from "../errors.ts"
import { SheetReader } from "../SheetReader.ts"
import { SheetWriter } from "../SheetWriter.ts"
import { quoteSheetTitle } from "./a1Range.ts"
import { chooseTab } from "./chooseTab.ts"
import { toSheetError } from "./googleError.ts"
import { insertRowRequests } from "./insertRowRequests.ts"
import { loadServiceAccountKey } from "./serviceAccountKey.ts"

const READ_ONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly"
const READ_WRITE_SCOPE = "https://www.googleapis.com/auth/spreadsheets"

const Rows = Schema.Array(Schema.Array(Schema.String))

const TabProperties = Schema.Struct({
    sheetId: Schema.optional(Schema.Int),
    title: Schema.String,
    hidden: Schema.optional(Schema.Boolean),
})

const TabList = Schema.Struct({
    sheets: Schema.optional(Schema.Array(Schema.Struct({ properties: TabProperties }))),
})

const decodeRows = Schema.decodeUnknownEffect(Rows)
const decodeTabList = Schema.decodeUnknownEffect(TabList)

const unexpectedResponse = (spreadsheetId: string) => (cause: Schema.SchemaError) =>
    SheetApiError.make({
        spreadsheetId,
        message: `risposta inattesa da Google Sheets: ${cause.message}`,
        cause,
    })

const openTab = Effect.fn("openTab")(function* (scope: string) {
    const { spreadsheetId, tab, serviceAccount } = yield* sheetConfig
    const key = yield* loadServiceAccountKey(serviceAccount)
    const api = sheets({
        version: "v4",
        auth: new auth.JWT({
            email: key.client_email,
            key: key.private_key,
            scopes: [scope],
        }),
    })

    const call = <A>(request: () => Promise<A>) =>
        Effect.tryPromise({ try: request, catch: toSheetError(spreadsheetId) })

    const listed = yield* call(() =>
        api.spreadsheets.get({ spreadsheetId, fields: "sheets.properties(sheetId,title,hidden)" }),
    )
    const { sheets: list = [] } = yield* decodeTabList(listed.data).pipe(
        Effect.mapError(unexpectedResponse(spreadsheetId)),
    )
    // The JSON API leaves out zero-valued fields, so the very first tab of a spreadsheet
    // comes back without the `sheetId` it does have, which is 0.
    const available = list.map(({ properties }) => ({
        ...properties,
        sheetId: properties.sheetId ?? 0,
    }))
    const chosen = chooseTab(available, tab)
    if (Option.isNone(chosen)) {
        return yield* SheetTabNotFoundError.make({
            spreadsheetId,
            message:
                `tab ${Option.getOrElse(tab, () => "(nessuno)")} non trovato nel foglio ` +
                `${spreadsheetId}; tab disponibili: ` +
                available.map((properties) => properties.title).join(", "),
        })
    }

    // Formatted values, so the match on the Nome column sees the same text a person sees.
    const rows = Effect.gen(function* () {
        const response = yield* call(() =>
            api.spreadsheets.values.get({
                spreadsheetId,
                range: quoteSheetTitle(chosen.value.title),
            }),
        )
        return yield* decodeRows(response.data.values ?? []).pipe(
            Effect.mapError(unexpectedResponse(spreadsheetId)),
        )
    }).pipe(Effect.withSpan("rows"))

    const insert = (planned: PlannedRow) =>
        call(() =>
            api.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [...insertRowRequests(chosen.value.sheetId, planned)],
                },
            }),
        ).pipe(Effect.asVoid)

    return { rows, insert }
})

export const readerLayer = Layer.effect(
    SheetReader,
    Effect.map(openTab(READ_ONLY_SCOPE), ({ rows }) => SheetReader.of({ rows })),
)

// Reading and writing share one authenticated client and one tab lookup, so the row a plan
// names and the row the batch update inserts are always in the same tab.
export const layer = Layer.effectContext(
    Effect.map(openTab(READ_WRITE_SCOPE), ({ rows, insert }) =>
        Context.make(SheetReader, SheetReader.of({ rows })).pipe(
            Context.add(SheetWriter, SheetWriter.of({ insert })),
        ),
    ),
)

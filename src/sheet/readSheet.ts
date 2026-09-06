import { Effect } from "effect"
import { parseSheet, type SheetWarning } from "./parseSheet.ts"
import { SheetReader } from "./SheetReader.ts"

const describe = (warning: SheetWarning) =>
  `riga ${warning.firstRow}: righe fuori da ogni sezione, manca l'header di sezione dopo la riga vuota`

// Every insertion shifts the rows below it, so a position is only valid against the sheet as
// it is now; the warnings belong to the first read and would only repeat noise on a reread.
export const readSheetQuietly = Effect.gen(function* () {
  const reader = yield* SheetReader
  return yield* Effect.fromResult(parseSheet(yield* reader.rows))
})

export const readSheet = Effect.gen(function* () {
  const sheet = yield* readSheetQuietly
  yield* Effect.forEach(sheet.warnings, (warning) => Effect.logWarning(describe(warning)))
  return sheet
})

import { Effect } from "effect"
import { parseSheet, type SheetWarning } from "./parseSheet.ts"
import { SheetReader } from "./SheetReader.ts"

const describe = (warning: SheetWarning) =>
  `riga ${warning.firstRow}: righe fuori da ogni sezione, manca l'header di sezione dopo la riga vuota`

export const readSheet = Effect.gen(function* () {
  const reader = yield* SheetReader
  const sheet = yield* Effect.fromResult(parseSheet(yield* reader.rows))
  yield* Effect.forEach(sheet.warnings, (warning) => Effect.logWarning(describe(warning)))
  return sheet
})

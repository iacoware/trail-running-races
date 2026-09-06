import { Effect } from "effect"
import { missingRaces } from "../races/missingRaces.ts"
import { RaceList } from "../races/RaceList.ts"
import { parseSheet, type SheetWarning } from "../sheet/parseSheet.ts"
import { SheetReader } from "../sheet/SheetReader.ts"

const describe = (warning: SheetWarning) =>
  `riga ${warning.firstRow}: righe fuori da ogni sezione, manca l'header di sezione dopo la riga vuota`

export const missing = Effect.gen(function* () {
  const list = yield* RaceList
  const reader = yield* SheetReader
  const names = yield* list.names
  const sheet = yield* Effect.fromResult(parseSheet(yield* reader.rows))
  yield* Effect.forEach(sheet.warnings, (warning) => Effect.logWarning(describe(warning)))
  return missingRaces(names, sheet)
})

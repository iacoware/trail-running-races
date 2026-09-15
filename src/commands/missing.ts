import { Effect } from "effect"
import { missingRaces } from "../races/missingRaces.ts"
import { RaceList } from "../races/RaceList.ts"
import type { Sheet } from "../sheet/parseSheet.ts"
import { readSheet } from "../sheet/readSheet.ts"

export const missingIn = Effect.fn("missingIn")(function* (sheet: Sheet) {
  const list = yield* RaceList
  return missingRaces(yield* list.names, sheet)
})

export const missing = Effect.gen(function* () {
  return yield* missingIn(yield* readSheet)
})

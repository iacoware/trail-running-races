import { Effect } from "effect"
import { missingRaces } from "../races/missingRaces.ts"
import { RaceList } from "../races/RaceList.ts"
import { readSheet } from "../sheet/readSheet.ts"

export const missing = Effect.gen(function* () {
  const list = yield* RaceList
  const names = yield* list.names
  return missingRaces(names, yield* readSheet)
})

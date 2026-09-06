import { raceRows, type Sheet } from "../sheet/parseSheet.ts"
import { raceKey } from "./raceKey.ts"

export const missingRaces = (names: ReadonlyArray<string>, sheet: Sheet): ReadonlyArray<string> => {
  const present = new Set(raceRows(sheet).map((race) => raceKey(race.cells.name)))
  return names.filter((name) => !present.has(raceKey(name)))
}

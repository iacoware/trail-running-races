import { Result } from "effect"
import type { Region } from "../agent/RaceCard.ts"
import { raceKey } from "../races/raceKey.ts"
import type { Section, Sheet } from "../sheet/parseSheet.ts"

export const REST_OF_ITALY = "Resto di Italia"

// Hyphens and spaces are interchangeable in a section name, so `Emilia Romagna` and
// `Emilia-Romagna` name the same section.
const sectionKey = (name: string) => raceKey(name).replaceAll("-", " ").replace(/\s+/g, " ")

const named = (sheet: Sheet, name: string) =>
  sheet.sections.find((section) => sectionKey(section.name) === sectionKey(name))

// The script never creates a regional section: an Italian region without one falls back
// to `Resto di Italia`. A missing destination is reported by name.
export const targetSection = (sheet: Sheet, region: Region): Result.Result<Section, string> => {
  const own = named(sheet, region)
  if (own !== undefined) return Result.succeed(own)
  if (region === "Estero") return Result.fail("Estero")
  const rest = named(sheet, REST_OF_ITALY)
  return rest === undefined ? Result.fail(REST_OF_ITALY) : Result.succeed(rest)
}

import { Option, Result } from "effect"
import type { FoundRace } from "../agent/RaceCard.ts"
import { parseDate } from "../dates/parseDate.ts"
import type { Cells, Columns } from "../sheet/columns.ts"
import type { Sheet } from "../sheet/parseSheet.ts"
import { SectionMissingError, UnparsableDateError, type PlanError } from "./errors.ts"
import { formatCells } from "./formatCells.ts"
import { insertionAt } from "./insertionAt.ts"
import { reviewSection, targetSection } from "./targetSection.ts"

export type PlannedRow = {
  readonly name: string
  readonly url: Option.Option<string>
  readonly section: string
  readonly row: number
  readonly after: Option.Option<string>
  readonly columns: Columns
  readonly cells: Cells
}

type ReviewOutcome = "non_trovata" | "ambigua"

const reviewMessage: Readonly<Record<ReviewOutcome, string>> = {
  non_trovata: "non ho trovato niente",
  ambigua: "più di un evento con questo nome",
}

const missingSection = (race: string) => (section: string) =>
  new SectionMissingError({
    race,
    section,
    message: `sezione ${section} assente dal foglio, "${race}" non ha una destinazione`,
  })

// Every position is computed against the sheet as it was read, not against the rows planned
// earlier in the same run: two new races in one section can name the same target row.
export const planRow = (
  sheet: Sheet,
  name: string,
  race: FoundRace,
): Result.Result<PlannedRow, PlanError> => {
  const start = parseDate(race.data)
  if (Option.isNone(start)) {
    return Result.fail(
      new UnparsableDateError({
        race: name,
        date: race.data,
        message: `data della scheda fuori grammatica: ${race.data}`,
      }),
    )
  }
  return targetSection(sheet, race.regione).pipe(
    Result.mapError(missingSection(name)),
    Result.map((section) => ({
      name,
      url: Option.some(race.url),
      section: section.name,
      ...insertionAt(section, start.value),
      columns: sheet.columns,
      cells: formatCells(name, race),
    })),
  )
}

export const planReviewRow = (
  sheet: Sheet,
  name: string,
  outcome: ReviewOutcome,
): Result.Result<PlannedRow, SectionMissingError> =>
  reviewSection(sheet).pipe(
    Result.mapError(missingSection(name)),
    Result.map((section) => {
      const previous = section.races.at(-1)
      return {
        name,
        url: Option.none(),
        section: section.name,
        row: (previous?.row ?? section.headerRow) + 1,
        after: previous === undefined ? Option.none() : Option.some(previous.cells.name.trim()),
        columns: sheet.columns,
        cells: {
          name,
          date: reviewMessage[outcome],
          place: "",
          fromFlorence: "",
          type: "",
          distances: "",
        },
      }
    }),
  )

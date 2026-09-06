import { Option, Result } from "effect"
import type { FoundRace } from "../agent/RaceCard.ts"
import { parseDate } from "../dates/parseDate.ts"
import type { Cells, Columns } from "../sheet/columns.ts"
import type { Sheet } from "../sheet/parseSheet.ts"
import { SectionMissingError, UnparsableDateError, type PlanError } from "./errors.ts"
import { formatCells } from "./formatCells.ts"
import { insertionAt } from "./insertionAt.ts"
import { targetSection } from "./targetSection.ts"

export type PlannedRow = {
  readonly name: string
  readonly url: string
  readonly section: string
  readonly row: number
  readonly after: Option.Option<string>
  readonly columns: Columns
  readonly cells: Cells
}

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
    Result.mapError(
      (section) =>
        new SectionMissingError({
          race: name,
          section,
          message: `sezione ${section} assente dal foglio, "${name}" non ha una destinazione`,
        }),
    ),
    Result.map((section) => ({
      name,
      url: race.url,
      section: section.name,
      ...insertionAt(section, start.value),
      columns: sheet.columns,
      cells: formatCells(name, race),
    })),
  )
}

import { Option, Result } from "effect"
import type { FoundRace } from "../agent/RaceCard.ts"
import { parseDate, type DayOfYear } from "../dates/parseDate.ts"
import type { Cells, Columns } from "../sheet/columns.ts"
import type { Sheet } from "../sheet/parseSheet.ts"
import { UnparsableDateError, type PlanError } from "./errors.ts"
import { formatCells } from "./formatCells.ts"
import { insertionAt } from "./insertionAt.ts"
import {
  reviewSection,
  targetSection,
  type SectionAction,
  type SectionTarget,
} from "./targetSection.ts"

export type PlannedRow = {
  readonly name: string
  readonly url: Option.Option<string>
  readonly section: string
  readonly row: number
  readonly after: Option.Option<string>
  readonly sectionAction: SectionAction
  readonly columns: Columns
  readonly cells: Cells
}

type ReviewOutcome = "non_trovata" | "ambigua"

const reviewMessage: Readonly<Record<ReviewOutcome, string>> = {
  non_trovata: "non ho trovato niente",
  ambigua: "più di un evento con questo nome",
}

const missingSectionPosition = (
  target: Extract<SectionTarget, { readonly _tag: "MissingSpecialSection" }>,
) => ({
  section: target.name,
  row: target.action.headerRow + 1,
  after: Option.none<string>(),
  sectionAction: target.action,
})

const positionIn = (target: SectionTarget, start: DayOfYear) =>
  target._tag === "ExistingSection"
    ? {
        section: target.section.name,
        ...insertionAt(target.section, start),
        sectionAction: target.action,
      }
    : missingSectionPosition(target)

const reviewPositionIn = (target: SectionTarget) => {
  if (target._tag === "MissingSpecialSection") {
    return missingSectionPosition(target)
  }
  const previous = target.section.races.at(-1)
  return {
    section: target.section.name,
    row: (previous?.row ?? target.section.headerRow) + 1,
    after:
      previous === undefined ? Option.none<string>() : Option.some(previous.cells.name.trim()),
    sectionAction: target.action,
  }
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
  return Result.succeed({
    name,
    url: Option.some(race.url),
    ...positionIn(targetSection(sheet, race.regione), start.value),
    columns: sheet.columns,
    cells: formatCells(name, race),
  })
}

export const planReviewRow = (
  sheet: Sheet,
  name: string,
  outcome: ReviewOutcome,
): Result.Result<PlannedRow, never> =>
  Result.succeed({
    name,
    url: Option.none(),
    ...reviewPositionIn(reviewSection(sheet)),
    columns: sheet.columns,
    cells: {
      name,
      date: reviewMessage[outcome],
      place: "",
      fromFlorence: "",
      type: "",
      distances: "",
    },
  })

import { Data, Option, Result } from "effect"

import type { FoundRace } from "../agent/RaceCard.ts"
import { parseDate, type DayOfYear } from "../dates/parseDate.ts"
import type { Cells, Columns } from "../sheet/columns.ts"
import type { Sheet } from "../sheet/parseSheet.ts"
import { UnparsableDateError, type PlanError } from "./errors.ts"
import { formatCells } from "./formatCells.ts"
import { insertionAt } from "./insertionAt.ts"
import { reviewSection, SectionTarget, targetSection, type SectionAction } from "./targetSection.ts"

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

type ReviewEsito = "non_trovata" | "ambigua"

const reviewMessage: Readonly<Record<ReviewEsito, string>> = {
    non_trovata: "non ho trovato niente",
    ambigua: "più di un evento con questo nome",
}

const missingSectionPosition = (
    target: Data.TaggedEnum.Value<SectionTarget, "MissingSpecialSection">,
) => ({
    section: target.name,
    row: target.action.headerRow + 1,
    after: Option.none<string>(),
    sectionAction: target.action,
})

const positionIn = (target: SectionTarget, start: DayOfYear) =>
    SectionTarget.$match(target, {
        ExistingSection: (existing) => ({
            section: existing.section.name,
            ...insertionAt(existing.section, start),
            sectionAction: existing.action,
        }),
        MissingSpecialSection: missingSectionPosition,
    })

const endOfExistingSection = (
    existing: Data.TaggedEnum.Value<SectionTarget, "ExistingSection">,
) => {
    const previous = existing.section.races.at(-1)
    return {
        section: existing.section.name,
        row: (previous?.row ?? existing.section.headerRow) + 1,
        after:
            previous === undefined
                ? Option.none<string>()
                : Option.some(previous.cells.name.trim()),
        sectionAction: existing.action,
    }
}

const reviewPositionIn = (target: SectionTarget) =>
    SectionTarget.$match(target, {
        ExistingSection: endOfExistingSection,
        MissingSpecialSection: missingSectionPosition,
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
    esito: ReviewEsito,
): Result.Result<PlannedRow, never> =>
    Result.succeed({
        name,
        url: Option.none(),
        ...reviewPositionIn(reviewSection(sheet)),
        columns: sheet.columns,
        cells: {
            name,
            date: reviewMessage[esito],
            place: "",
            fromFlorence: "",
            type: "",
            distances: "",
        },
    })

import { Option } from "effect"

import type { DayOfYear } from "../dates/parseDate.ts"
import { parseDate } from "../dates/parseDate.ts"
import type { Section } from "../sheet/parseSheet.ts"

export type Insertion = {
    readonly row: number
    readonly after: Option.Option<string>
}

const order = ({ month, day }: DayOfYear) => month * 100 + day

// Rows in a section are assumed sorted by date: the new row goes after the last row with a
// parsable date less than or equal to its own, and in any case before the first unparsable
// one, which closes the sorted part of the section.
export const insertionAt = (section: Section, start: DayOfYear): Insertion => {
    let insertion: Insertion = { row: section.headerRow + 1, after: Option.none() }
    for (const race of section.races) {
        const existing = parseDate(race.cells.date)
        if (Option.isNone(existing) || order(existing.value) > order(start)) return insertion
        insertion = { row: race.row + 1, after: Option.some(race.cells.name.trim()) }
    }
    return insertion
}

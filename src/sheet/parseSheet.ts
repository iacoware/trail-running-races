import { Data, Result } from "effect"

import { COLUMN_KEYS, cellsOf, resolveColumns, type Cells, type Columns } from "./columns.ts"
import type { Row } from "./SheetReader.ts"

export type RaceRow = {
    readonly row: number
    readonly cells: Cells
}

export type Section = {
    readonly name: string
    readonly headerRow: number
    readonly races: ReadonlyArray<RaceRow>
}

export type SheetWarning = Data.TaggedEnum<{
    RowsOutsideSection: { readonly firstRow: number }
}>

export const SheetWarning = Data.taggedEnum<SheetWarning>()

export type Sheet = {
    readonly columns: Columns
    readonly sections: ReadonlyArray<Section>
    readonly orphans: ReadonlyArray<RaceRow>
    readonly warnings: ReadonlyArray<SheetWarning>
    readonly lastRow: number
}

const isBlank = (cell: string) => cell.trim() === ""

const isBlankRow = (row: Row) => row.every(isBlank)

const hasOnlyName = (cells: Cells) =>
    !isBlank(cells.name) && COLUMN_KEYS.every((key) => key === "name" || isBlank(cells[key]))

// Sections are recognized by structure, not by bold: a name-only row right after the
// header or after an empty row opens one; the same row after a race row is a race
// without date. Rows after an empty row that is not followed by a header belong to no
// section and are only reported.
type MutableSection = { name: string; headerRow: number; races: Array<RaceRow> }

type Cursor = Data.TaggedEnum<{
    AfterSeparator: object
    InSection: { readonly section: MutableSection }
    Orphans: object
}>

const Cursor = Data.taggedEnum<Cursor>()

const readSections = (columns: Columns, rows: ReadonlyArray<Row>) => {
    const sections: Array<MutableSection> = []
    const orphans: Array<RaceRow> = []
    const warnings: Array<SheetWarning> = []
    let cursor: Cursor = Cursor.AfterSeparator()

    rows.forEach((row, index) => {
        if (index === 0) return
        const rowNumber = index + 1
        if (isBlankRow(row)) {
            cursor = Cursor.AfterSeparator()
            return
        }
        const cells = cellsOf(columns, row)
        cursor = Cursor.$match(cursor, {
            AfterSeparator: () => {
                if (hasOnlyName(cells)) {
                    const section: MutableSection = {
                        name: cells.name.trim(),
                        headerRow: rowNumber,
                        races: [],
                    }
                    sections.push(section)
                    return Cursor.InSection({ section })
                }
                warnings.push(SheetWarning.RowsOutsideSection({ firstRow: rowNumber }))
                orphans.push({ row: rowNumber, cells })
                return Cursor.Orphans()
            },
            InSection: (current) => {
                current.section.races.push({ row: rowNumber, cells })
                return current
            },
            Orphans: (current) => {
                orphans.push({ row: rowNumber, cells })
                return current
            },
        })
    })

    return { sections, orphans, warnings }
}

export const parseSheet = (rows: ReadonlyArray<Row>) =>
    Result.map(resolveColumns(rows[0] ?? []), (columns) => ({
        columns,
        ...readSections(columns, rows),
        lastRow: rows.length,
    }))

export const raceRows = (sheet: Sheet): ReadonlyArray<RaceRow> => [
    ...sheet.sections.flatMap((section) => section.races),
    ...sheet.orphans,
]

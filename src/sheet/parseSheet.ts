import { Result } from "effect"
import { COLUMN_KEYS, cellsOf, resolveColumns, type Cells, type Columns } from "./columns.ts"
import type { SheetColumnMissingError } from "./errors.ts"
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

export type SheetWarning = { readonly _tag: "RowsOutsideSection"; readonly firstRow: number }

export type Sheet = {
  readonly columns: Columns
  readonly sections: ReadonlyArray<Section>
  readonly orphans: ReadonlyArray<RaceRow>
  readonly warnings: ReadonlyArray<SheetWarning>
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

type Cursor =
  | { readonly _tag: "AfterSeparator" }
  | { readonly _tag: "InSection"; readonly section: MutableSection }
  | { readonly _tag: "Orphans" }

const readSections = (columns: Columns, rows: ReadonlyArray<Row>) => {
  const sections: Array<MutableSection> = []
  const orphans: Array<RaceRow> = []
  const warnings: Array<SheetWarning> = []
  let cursor: Cursor = { _tag: "AfterSeparator" }

  rows.forEach((row, index) => {
    if (index === 0) return
    const rowNumber = index + 1
    if (isBlankRow(row)) {
      cursor = { _tag: "AfterSeparator" }
      return
    }
    const cells = cellsOf(columns, row)
    switch (cursor._tag) {
      case "AfterSeparator":
        if (hasOnlyName(cells)) {
          const section = { name: cells.name.trim(), headerRow: rowNumber, races: [] }
          sections.push(section)
          cursor = { _tag: "InSection", section }
        } else {
          warnings.push({ _tag: "RowsOutsideSection", firstRow: rowNumber })
          orphans.push({ row: rowNumber, cells })
          cursor = { _tag: "Orphans" }
        }
        return
      case "InSection":
        cursor.section.races.push({ row: rowNumber, cells })
        return
      case "Orphans":
        orphans.push({ row: rowNumber, cells })
        return
    }
  })

  return { sections, orphans, warnings }
}

export const parseSheet = (
  rows: ReadonlyArray<Row>,
): Result.Result<Sheet, SheetColumnMissingError> =>
  Result.map(resolveColumns(rows[0] ?? []), (columns) => ({
    columns,
    ...readSections(columns, rows),
  }))

export const raceRows = (sheet: Sheet): ReadonlyArray<RaceRow> => [
  ...sheet.sections.flatMap((section) => section.races),
  ...sheet.orphans,
]

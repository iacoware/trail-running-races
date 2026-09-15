import type { sheets_v4 } from "@googleapis/sheets"
import { Option } from "effect"
import type { PlannedRow } from "../../plan/planRow.ts"
import { SectionAction } from "../../plan/targetSection.ts"
import { COLUMN_KEYS, type Columns } from "../columns.ts"

const WRITTEN_FIELDS = "userEnteredValue,textFormatRuns"

const width = (columns: Columns) => Math.max(...COLUMN_KEYS.map((key) => columns[key])) + 1

// An empty cell is left blank rather than filled with an empty string, so the sheet keeps
// telling apart "nothing known" from "known to be nothing".
const cell = (value: string): sheets_v4.Schema$CellData =>
  value === "" ? {} : { userEnteredValue: { stringValue: value } }

// The link spans the whole visible name, which keeps the Nome column matchable as plain
// text: a `=HYPERLINK` formula would make the separator depend on the sheet's locale. A run
// without text behind it is rejected, so a blank name stays a blank cell.
const linkedCell = (value: string, uri: string): sheets_v4.Schema$CellData =>
  value === ""
    ? {}
    : { ...cell(value), textFormatRuns: [{ startIndex: 0, format: { link: { uri } } }] }

const blankRowValues = (columns: Columns): Array<sheets_v4.Schema$CellData> =>
  Array.from({ length: width(columns) }, () => ({}))

const rowValues = (planned: PlannedRow) => {
  const values = blankRowValues(planned.columns)
  for (const key of COLUMN_KEYS) values[planned.columns[key]] = cell(planned.cells[key])
  values[planned.columns.name] = Option.match(planned.url, {
    onNone: () => cell(planned.cells.name),
    onSome: (url) => linkedCell(planned.cells.name, url),
  })
  return values
}

const sectionHeaderValues = (planned: PlannedRow) => {
  const values = blankRowValues(planned.columns)
  values[planned.columns.name] = cell(planned.section)
  return values
}

const bold = (sheetId: number, row: number, value: boolean): sheets_v4.Schema$Request => ({
  repeatCell: {
    range: {
      sheetId,
      startRowIndex: row - 1,
      endRowIndex: row,
    },
    cell: { userEnteredFormat: { textFormat: { bold: value } } },
    fields: "userEnteredFormat.textFormat.bold",
  },
})

const createSectionRequests = (
  sheetId: number,
  planned: PlannedRow,
): ReadonlyArray<sheets_v4.Schema$Request> => {
  const action = planned.sectionAction
  if (!SectionAction.$is("CreateSection")(action)) return []
  const { separatorRow, headerRow, trailingSeparator } = action
  const index = separatorRow - 1
  const insertedRows = trailingSeparator ? 4 : 3

  return [
    {
      insertDimension: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: index,
          endIndex: index + insertedRows,
        },
        inheritFromBefore: false,
      },
    },
    {
      updateCells: {
        start: { sheetId, rowIndex: headerRow - 1, columnIndex: 0 },
        rows: [{ values: sectionHeaderValues(planned) }, { values: rowValues(planned) }],
        fields: WRITTEN_FIELDS,
      },
    },
    bold(sheetId, headerRow, true),
    bold(sheetId, planned.row, false),
  ]
}

// The whole returned array is sent in one batchUpdate: a crash leaves neither an empty row nor
// a newly-created special section without its first race.
export const insertRowRequests = (
  sheetId: number,
  planned: PlannedRow,
): ReadonlyArray<sheets_v4.Schema$Request> => {
  if (SectionAction.$is("CreateSection")(planned.sectionAction)) {
    return createSectionRequests(sheetId, planned)
  }
  const index = planned.row - 1
  return [
    {
      insertDimension: {
        range: { sheetId, dimension: "ROWS", startIndex: index, endIndex: index + 1 },
        // A row opening a section would inherit the bold of the section header above it, so
        // only a row that follows a race row copies the row before — and such a row is never
        // the first of the sheet, which is what inheriting from before requires.
        inheritFromBefore: Option.isSome(planned.after),
      },
    },
    {
      // The blanks written over the unmapped columns clear nothing: the row this fills is the
      // empty one the request above just inserted, never a row that was already there.
      updateCells: {
        start: { sheetId, rowIndex: index, columnIndex: 0 },
        rows: [{ values: rowValues(planned) }],
        fields: WRITTEN_FIELDS,
      },
    },
  ]
}

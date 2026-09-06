import type { sheets_v4 } from "@googleapis/sheets"
import { Option } from "effect"
import type { PlannedRow } from "../../plan/planRow.ts"
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

const rowValues = (planned: PlannedRow) => {
  const values: Array<sheets_v4.Schema$CellData> = Array.from(
    { length: width(planned.columns) },
    () => ({}),
  )
  for (const key of COLUMN_KEYS) values[planned.columns[key]] = cell(planned.cells[key])
  values[planned.columns.name] = Option.match(planned.url, {
    onNone: () => cell(planned.cells.name),
    onSome: (url) => linkedCell(planned.cells.name, url),
  })
  return values
}

// One atomic request inserts the row and fills it: a crash never leaves an empty row behind.
export const insertRowRequests = (
  sheetId: number,
  planned: PlannedRow,
): ReadonlyArray<sheets_v4.Schema$Request> => {
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

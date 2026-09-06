import { Option } from "effect"
import { expect, test } from "vitest"
import type { PlannedRow } from "../../plan/planRow.ts"
import { plannedRow } from "../../testing/plannedRow.ts"
import { insertRowRequests } from "./insertRowRequests.ts"

const SHEET_ID = 1234

const planned = plannedRow({
  name: "Garfagnana Epic Trail",
  url: Option.some("https://www.garfagnanaepictrail.it"),
  row: 4,
  after: Option.some("Brunello Crossing"),
  cells: {
    name: "Garfagnana Epic Trail",
    date: "5-6 marzo",
    place: "Castelnuovo di Garfagnana",
    fromFlorence: "~1h30",
    type: "Trail",
    distances: "42km 2500m+\n21km 1200m+",
  },
})

const requestsFor = (over: Partial<PlannedRow> = {}) =>
  insertRowRequests(SHEET_ID, { ...planned, ...over })

test("inserts a single row at the planned position, before the rows that follow it", () => {
  const [insert] = requestsFor()

  expect(insert?.insertDimension?.range).toEqual({
    sheetId: SHEET_ID,
    dimension: "ROWS",
    startIndex: 3,
    endIndex: 4,
  })
})

test("inherits the formatting of the race row above when one precedes the new row", () => {
  expect(requestsFor()[0]?.insertDimension?.inheritFromBefore).toBe(true)
})

test("inherits from the row below when the new row opens the section", () => {
  const [insert] = requestsFor({ row: 3, after: Option.none() })

  expect(insert?.insertDimension?.inheritFromBefore).toBe(false)
})

test("writes the six cells in their own columns, in the same request", () => {
  const [, update] = requestsFor()

  expect(update?.updateCells?.start).toEqual({ sheetId: SHEET_ID, rowIndex: 3, columnIndex: 0 })
  expect(update?.updateCells?.rows?.[0]?.values?.map((cell) => cell.userEnteredValue)).toEqual([
    { stringValue: "Garfagnana Epic Trail" },
    { stringValue: "5-6 marzo" },
    { stringValue: "Castelnuovo di Garfagnana" },
    { stringValue: "~1h30" },
    { stringValue: "Trail" },
    { stringValue: "42km 2500m+\n21km 1200m+" },
  ])
})

test("links the whole name to the official site as rich text, not as a formula", () => {
  const [, update] = requestsFor()

  expect(update?.updateCells?.rows?.[0]?.values?.[0]?.textFormatRuns).toEqual([
    { startIndex: 0, format: { link: { uri: "https://www.garfagnanaepictrail.it" } } },
  ])
})

test("leaves an unresolved race name as plain text without a link", () => {
  const [, update] = requestsFor({ url: Option.none() })

  expect(update?.updateCells?.rows?.[0]?.values?.[0]).toEqual({
    userEnteredValue: { stringValue: "Garfagnana Epic Trail" },
  })
})

test("leaves an empty cell blank instead of writing an empty string into it", () => {
  const [, update] = requestsFor({ cells: { ...planned.cells, distances: "" } })

  expect(update?.updateCells?.rows?.[0]?.values?.[5]).toEqual({})
})

test("spans every column up to the last one, filling the gaps with blanks", () => {
  const columns = { ...planned.columns, distances: 7 }

  const [, update] = requestsFor({ columns })

  const values = update?.updateCells?.rows?.[0]?.values
  expect(values).toHaveLength(8)
  expect(values?.[6]).toEqual({})
  expect(values?.[7]?.userEnteredValue).toEqual({ stringValue: "42km 2500m+\n21km 1200m+" })
})

test("atomically inserts a separator, section header and race when creating a section", () => {
  const requests = requestsFor({
    section: "Estero",
    row: 8,
    after: Option.none(),
    sectionAction: {
      _tag: "CreateSection",
      separatorRow: 6,
      headerRow: 7,
      trailingSeparator: false,
    },
  })

  expect(requests).toHaveLength(4)
  expect(requests[0]?.insertDimension).toEqual({
    range: { sheetId: SHEET_ID, dimension: "ROWS", startIndex: 5, endIndex: 8 },
    inheritFromBefore: false,
  })
  expect(requests[1]?.updateCells?.start).toEqual({
    sheetId: SHEET_ID,
    rowIndex: 6,
    columnIndex: 0,
  })
  expect(requests[1]?.updateCells?.rows?.map((row) => row.values?.[0]?.userEnteredValue)).toEqual([
    { stringValue: "Estero" },
    { stringValue: "Garfagnana Epic Trail" },
  ])
  expect(requests[2]?.repeatCell).toEqual({
    range: {
      sheetId: SHEET_ID,
      startRowIndex: 6,
      endRowIndex: 7,
    },
    cell: { userEnteredFormat: { textFormat: { bold: true } } },
    fields: "userEnteredFormat.textFormat.bold",
  })
  expect(requests[3]?.repeatCell).toEqual({
    range: {
      sheetId: SHEET_ID,
      startRowIndex: 7,
      endRowIndex: 8,
    },
    cell: { userEnteredFormat: { textFormat: { bold: false } } },
    fields: "userEnteredFormat.textFormat.bold",
  })
})

test("adds a trailing separator when creating before a section directly below the sheet header", () => {
  const [insert] = requestsFor({
    row: 4,
    sectionAction: {
      _tag: "CreateSection",
      separatorRow: 2,
      headerRow: 3,
      trailingSeparator: true,
    },
  })

  expect(insert?.insertDimension?.range).toEqual({
    sheetId: SHEET_ID,
    dimension: "ROWS",
    startIndex: 1,
    endIndex: 5,
  })
})

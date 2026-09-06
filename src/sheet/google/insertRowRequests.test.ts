import { Option } from "effect"
import { expect, test } from "vitest"
import type { PlannedRow } from "../../plan/planRow.ts"
import { plannedRow } from "../../testing/plannedRow.ts"
import { insertRowRequests } from "./insertRowRequests.ts"

const SHEET_ID = 1234

const planned = plannedRow({
  name: "Garfagnana Epic Trail",
  url: "https://www.garfagnanaepictrail.it",
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

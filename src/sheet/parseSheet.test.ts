import { Result } from "effect"
import { expect, test } from "vitest"

import { parseSheet } from "./parseSheet.ts"

const header = ["Nome", "Data (+ o -)", "Luogo", "Da FI", "Tipo", "Distanze"]

const parse = (rows: ReadonlyArray<ReadonlyArray<string>>) => Result.getOrThrow(parseSheet(rows))

const failure = (rows: ReadonlyArray<ReadonlyArray<string>>) =>
  Result.getOrThrow(Result.flip(parseSheet(rows)))

test("resolves columns by normalized header, matching Data as a prefix of Data (+ o -)", () => {
  const sheet = parse([[" nome ", "DATA (+ o -)", "Luogo", "da fi", "Tipo", "Distanze"]])

  expect(sheet.columns).toEqual({
    name: 0,
    date: 1,
    place: 2,
    fromFlorence: 3,
    type: 4,
    distances: 5,
  })
})

test("resolves columns wherever they are in the header", () => {
  const sheet = parse([["Distanze", "Nome", "Tipo", "Da FI", "Luogo", "Data (+ o -)"]])

  expect(sheet.columns).toEqual({
    name: 1,
    date: 5,
    place: 4,
    fromFlorence: 3,
    type: 2,
    distances: 0,
  })
})

test("fails naming the column when a header is missing", () => {
  const error = failure([["Nome", "Data (+ o -)", "Luogo", "Da FI", "Tipo", "Percorsi"]])

  expect(error._tag).toBe("SheetColumnMissingError")
  expect(error.column).toBe("Distanze")
  expect(error.message).toContain("Distanze")
})

test("fails naming the column when the sheet is empty", () => {
  const error = failure([])

  expect(error.column).toBe("Nome")
})

test("reads no sections from a header-only sheet", () => {
  const sheet = parse([header])

  expect(sheet.sections).toEqual([])
  expect(sheet.orphans).toEqual([])
  expect(sheet.warnings).toEqual([])
})

const race = (name: string, date = "2 maggio") => [
  name,
  date,
  "Luogo",
  "~1h",
  "Trail",
  "10km 400m+",
]

test("groups race rows under the section header that precedes them", () => {
  const sheet = parse([header, ["Toscana"], race("Chianti UTMB"), race("Brunello Crossing")])

  expect(sheet.sections).toHaveLength(1)
  expect(sheet.sections[0]?.name).toBe("Toscana")
  expect(sheet.sections[0]?.headerRow).toBe(2)
  expect(sheet.sections[0]?.races.map((r) => [r.row, r.cells.name, r.cells.date])).toEqual([
    [3, "Chianti UTMB", "2 maggio"],
    [4, "Brunello Crossing", "2 maggio"],
  ])
})

test("closes a section at the empty row and opens the next one after it", () => {
  const sheet = parse([
    header,
    ["Toscana"],
    race("Chianti UTMB"),
    [],
    ["Umbria"],
    race("Trail dei Monti"),
  ])

  expect(sheet.sections.map((s) => [s.name, s.races.map((r) => r.cells.name)])).toEqual([
    ["Toscana", ["Chianti UTMB"]],
    ["Umbria", ["Trail dei Monti"]],
  ])
})

test("treats an empty row from the API and a row of blank cells alike", () => {
  const sheet = parse([header, ["Toscana"], race("Chianti UTMB"), ["", "", ""], ["Umbria"]])

  expect(sheet.sections.map((s) => s.name)).toEqual(["Toscana", "Umbria"])
})

test("reads a name-only row after a race row as a race without date, not a section", () => {
  const sheet = parse([header, ["Toscana"], race("Chianti UTMB"), ["Gara senza data"]])

  expect(sheet.sections.map((s) => s.name)).toEqual(["Toscana"])
  expect(sheet.sections[0]?.races.map((r) => r.cells.name)).toEqual([
    "Chianti UTMB",
    "Gara senza data",
  ])
})

test("fills cells missing from a short row with the empty string", () => {
  const sheet = parse([header, ["Toscana"], ["Chianti UTMB", "18-21 marzo"]])

  expect(sheet.sections[0]?.races[0]?.cells).toEqual({
    name: "Chianti UTMB",
    date: "18-21 marzo",
    place: "",
    fromFlorence: "",
    type: "",
    distances: "",
  })
})

test("keeps rows that follow an empty row without a section header out of every section, with a warning", () => {
  const sheet = parse([
    header,
    ["Toscana"],
    race("Chianti UTMB"),
    [],
    race("Orfana 1"),
    race("Orfana 2"),
    [],
    ["Umbria"],
  ])

  expect(sheet.sections.map((s) => s.name)).toEqual(["Toscana", "Umbria"])
  expect(sheet.orphans.map((r) => [r.row, r.cells.name])).toEqual([
    [5, "Orfana 1"],
    [6, "Orfana 2"],
  ])
  expect(sheet.warnings).toEqual([{ _tag: "RowsOutsideSection", firstRow: 5 }])
})

test("keeps section headers out of the race rows", () => {
  const sheet = parse([header, ["Toscana"], [], ["Resto di Italia"], [], ["Estero"]])

  expect(sheet.sections.map((s) => [s.name, s.races.length])).toEqual([
    ["Toscana", 0],
    ["Resto di Italia", 0],
    ["Estero", 0],
  ])
})

test("opens a section from a name-only row whose other cells hold only spaces", () => {
  const sheet = parse([header, ["Toscana", " ", "", "  "], race("Chianti UTMB")])

  expect(sheet.sections.map((s) => [s.name, s.races.map((r) => r.cells.name)])).toEqual([
    ["Toscana", ["Chianti UTMB"]],
  ])
  expect(sheet.warnings).toEqual([])
})

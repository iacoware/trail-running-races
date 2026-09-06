import { expect, test } from "vitest"
import { parseCsv } from "./parseCsv.ts"

test("reads no rows from empty text", () => {
  expect(parseCsv("")).toEqual([])
})

test("reads plain cells row by row, keeping empty ones", () => {
  expect(parseCsv("Nome,Data\nToscana,,\n")).toEqual([
    ["Nome", "Data"],
    ["Toscana", "", ""],
  ])
})

test("keeps commas and newlines inside a quoted cell", () => {
  const rows = parseCsv('Chianti UTMB,"Radda,Gaiole","10km 400m+\n20km 920m+"')

  expect(rows).toEqual([["Chianti UTMB", "Radda,Gaiole", "10km 400m+\n20km 920m+"]])
})

test("reads a doubled quote inside a quoted cell as one quote", () => {
  expect(parseCsv('"dice ""ciao"""')).toEqual([['dice "ciao"']])
})

test("reads CRLF line endings, inside quoted cells too", () => {
  expect(parseCsv('a,b\r\n"c\r\nd",e\r\n')).toEqual([
    ["a", "b"],
    ["c\nd", "e"],
  ])
})

test("reads a last row without trailing newline", () => {
  expect(parseCsv("a,b\nc,d")).toEqual([
    ["a", "b"],
    ["c", "d"],
  ])
})

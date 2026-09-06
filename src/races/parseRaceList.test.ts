import { expect, test } from "vitest"
import { parseRaceList } from "./parseRaceList.ts"

test("keeps one name per line in file order", () => {
  const list = parseRaceList("Chianti UTMB\nBrunello Crossing\n")

  expect(list.names).toEqual(["Chianti UTMB", "Brunello Crossing"])
})

test("ignores blank lines and lines starting with #", () => {
  const list = parseRaceList("# gare toscane\n\nChianti UTMB\n   \n  # altro\nBrunello Crossing")

  expect(list.names).toEqual(["Chianti UTMB", "Brunello Crossing"])
})

test("trims surrounding spaces from each name", () => {
  const list = parseRaceList("  Chianti UTMB  \n")

  expect(list.names).toEqual(["Chianti UTMB"])
})

test("keeps the first of two names with the same key and reports the duplicate", () => {
  const list = parseRaceList("Chianti UTMB\nBrunello Crossing\nchianti  utmb\n")

  expect(list.names).toEqual(["Chianti UTMB", "Brunello Crossing"])
  expect(list.duplicates).toEqual([{ line: 3, name: "chianti  utmb", firstLine: 1 }])
})

import { expect, test } from "vitest"
import { Option } from "effect"
import { parseDate } from "./parseDate.ts"

test.each([
  ["2 maggio", { day: 2, month: 5 }],
  ["20-21 febbraio", { day: 20, month: 2 }],
  ["28 febbraio-1 marzo", { day: 28, month: 2 }],
  ["18-21 Marzo", { day: 18, month: 3 }],
  ["  2  maggio ", { day: 2, month: 5 }],
])("reads the start day and month of %j", (text, start) => {
  expect(parseDate(text)).toEqual(Option.some(start))
})

test.each([
  "",
  "maggio",
  "2 mai",
  "1° maggio",
  "20 - 21 febbraio",
  "2 maggio 2026",
  "0 maggio",
  "32 maggio",
  "20-32 febbraio",
  "28 febbraio-1 xyz",
  "28 febbraio-0 marzo",
  "da confermare",
])("rejects %j as outside the grammar", (text) => {
  expect(parseDate(text)).toEqual(Option.none())
})

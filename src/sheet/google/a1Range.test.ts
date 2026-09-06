import { expect, test } from "vitest"
import { quoteSheetTitle } from "./a1Range.ts"

test("wraps the tab title in single quotes", () => {
  expect(quoteSheetTitle("Gare")).toBe("'Gare'")
})

test("escapes single quotes inside the title by doubling them", () => {
  expect(quoteSheetTitle("Valle d'Aosta")).toBe("'Valle d''Aosta'")
})

import { expect, test } from "vitest"
import { raceKey } from "./raceKey.ts"

test("matches names that differ only by case and surrounding spaces", () => {
  expect(raceKey("  Chianti UTMB ")).toBe(raceKey("chianti utmb"))
})

test("collapses runs of whitespace inside the name", () => {
  expect(raceKey("Ultra   trail\tMugello")).toBe("ultra trail mugello")
})

test("keeps accents while composing them to NFC", () => {
  const decomposedAccent = "Trail élite"

  expect(raceKey(decomposedAccent)).toBe("trail élite")
})

test("maps typographic apostrophes to the ASCII one", () => {
  expect(raceKey("Trail dell’Etna")).toBe("trail dell'etna")
  expect(raceKey("Trail dell‘Etna")).toBe("trail dell'etna")
})

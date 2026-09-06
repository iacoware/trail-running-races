import { Option } from "effect"
import { expect, test } from "vitest"
import type { PlannedRow } from "../../plan/planRow.ts"
import { describePlan } from "./PrintSheetWriter.ts"

const planned: PlannedRow = {
  name: "Garfagnana Epic Trail",
  section: "Toscana",
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
}

test("describes section, destination row, preceding race and the six cells", () => {
  expect(describePlan(planned)).toEqual([
    "== Garfagnana Epic Trail",
    "Toscana, riga 4, dopo Brunello Crossing",
    "Nome: Garfagnana Epic Trail",
    "Data: 5-6 marzo",
    "Luogo: Castelnuovo di Garfagnana",
    "Da FI: ~1h30",
    "Tipo: Trail",
    "Distanze: 42km 2500m+",
    "          21km 1200m+",
  ])
})

test("says the row opens the section when no race precedes it", () => {
  const lines = describePlan({ ...planned, row: 3, after: Option.none() })

  expect(lines[1]).toBe("Toscana, riga 3, in testa alla sezione")
})

test("prints an empty cell as its bare label", () => {
  const lines = describePlan({ ...planned, cells: { ...planned.cells, distances: "" } })

  expect(lines.at(-1)).toBe("Distanze:")
})

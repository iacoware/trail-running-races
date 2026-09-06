import { Option } from "effect"
import type { PlannedRow } from "../plan/planRow.ts"

const DEFAULTS: PlannedRow = {
  name: "Gara Nuova",
  url: Option.some("https://www.esempio.it"),
  section: "Toscana",
  row: 4,
  after: Option.some("Brunello Crossing"),
  sectionAction: { _tag: "UseExistingSection" },
  columns: { name: 0, date: 1, place: 2, fromFlorence: 3, type: 4, distances: 5 },
  cells: {
    name: "Gara Nuova",
    date: "2 maggio",
    place: "Firenze",
    fromFlorence: "~30min",
    type: "Trail",
    distances: "20km 900m+",
  },
}

export const plannedRow = (over: Partial<PlannedRow> = {}): PlannedRow => ({
  ...DEFAULTS,
  ...over,
})

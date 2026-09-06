import { Option, Result } from "effect"
import { expect, test } from "vitest"
import type { FoundRace } from "../agent/RaceCard.ts"
import { parseSheet, type Sheet } from "../sheet/parseSheet.ts"
import { planRow } from "./planRow.ts"

const header = ["Nome", "Data (+ o -)", "Luogo", "Da FI", "Tipo", "Distanze"]

const sheetOf = (...rows: ReadonlyArray<ReadonlyArray<string>>): Sheet =>
  Result.getOrThrow(parseSheet([header, ...rows]))

const race = (over: Partial<FoundRace> = {}): FoundRace => ({
  esito: "trovata",
  url: "https://www.esempio.it",
  data: "2 maggio",
  luogo: ["Firenze"],
  regione: "Toscana",
  minutiDaFirenze: 30,
  tipo: "Trail",
  distanze: [{ km: 20, dislivello: 900, camminata: false, bambini: false }],
  ...over,
})

const plan = (sheet: Sheet, name: string, found: FoundRace) =>
  Result.getOrThrow(planRow(sheet, name, found))

const planFailure = (sheet: Sheet, name: string, found: FoundRace) =>
  Result.getOrThrow(Result.flip(planRow(sheet, name, found)))

const tuscany = sheetOf(
  ["Toscana"],
  ["Brunello Crossing", "20-21 febbraio"],
  ["Chianti UTMB", "18-21 marzo"],
  ["Ultra trail Mugello", "2 maggio"],
  [],
  ["Resto di Italia"],
  [],
  ["Estero"],
)

test("places a race between the two existing races that bracket its date", () => {
  const planned = plan(tuscany, "Garfagnana Epic Trail", race({ data: "5-6 marzo" }))

  expect(planned.section).toBe("Toscana")
  expect(planned.row).toBe(4)
  expect(planned.after).toEqual(Option.some("Brunello Crossing"))
})

test("places a race earlier than every existing one right under the section header", () => {
  const planned = plan(tuscany, "Gara Gennaio", race({ data: "3 gennaio" }))

  expect(planned.row).toBe(3)
  expect(planned.after).toEqual(Option.none())
})

test("places a race later than every existing one after the last row of the section", () => {
  const planned = plan(tuscany, "Gara Dicembre", race({ data: "3 dicembre" }))

  expect(planned.row).toBe(6)
  expect(planned.after).toEqual(Option.some("Ultra trail Mugello"))
})

test("places a race dated like an existing one after it", () => {
  const planned = plan(tuscany, "Gara Pari", race({ data: "18-21 marzo" }))

  expect(planned.after).toEqual(Option.some("Chianti UTMB"))
})

test("sends an Italian region without its own section to Resto di Italia", () => {
  const planned = plan(tuscany, "Gara Lombarda", race({ regione: "Lombardia" }))

  expect(planned.section).toBe("Resto di Italia")
  expect(planned.row).toBe(8)
})

test("sends a foreign race to Estero", () => {
  const planned = plan(tuscany, "Gara Francese", race({ regione: "Estero" }))

  expect(planned.section).toBe("Estero")
  expect(planned.row).toBe(10)
})

test("matches a section name that spells the region with spaces instead of hyphens", () => {
  const sheet = sheetOf(["Emilia Romagna"], ["Gara Esistente", "2 maggio"])

  const planned = plan(sheet, "Gara Nuova", race({ regione: "Emilia-Romagna" }))

  expect(planned.section).toBe("Emilia Romagna")
})

test("fails naming the missing destination section, without a plan", () => {
  const sheet = sheetOf(["Toscana"], ["Brunello Crossing", "20-21 febbraio"])

  const error = planFailure(sheet, "Gara Francese", race({ regione: "Estero" }))

  expect(error._tag).toBe("SectionMissingError")
  expect(error.message).toContain("Estero")
})

test("stops before the first unparsable row even when the new date is later", () => {
  const sheet = sheetOf(
    ["Toscana"],
    ["Brunello Crossing", "20-21 febbraio"],
    ["Gara Da Chiarire", "non ho trovato niente"],
    ["Gara Tardiva", "15 giugno"],
  )

  const planned = plan(sheet, "Gara Nuova", race({ data: "20 giugno" }))

  expect(planned.row).toBe(4)
  expect(planned.after).toEqual(Option.some("Brunello Crossing"))
})

test("computes each position against the sheet as read, not against earlier plans", () => {
  const first = plan(tuscany, "Prima Nuova", race({ data: "5 marzo" }))
  const second = plan(tuscany, "Seconda Nuova", race({ data: "6 marzo" }))

  expect(second.row).toBe(first.row)
})

test("fills the six cells of the planned row", () => {
  const planned = plan(
    tuscany,
    "Garfagnana Epic Trail",
    race({ data: "5-6 marzo", luogo: ["Castelnuovo", "Careggine"], minutiDaFirenze: 90 }),
  )

  expect(planned.cells).toEqual({
    name: "Garfagnana Epic Trail",
    date: "5-6 marzo",
    place: "Castelnuovo, Careggine",
    fromFlorence: "~1h30",
    type: "Trail",
    distances: "20km 900m+",
  })
})

import { expect, test } from "vitest"
import type { Distance, FoundRace } from "../agent/RaceCard.ts"
import { formatCells } from "./formatCells.ts"

const distance = (over: Partial<Distance> = {}): Distance => ({
  km: 20,
  dislivello: 900,
  camminata: false,
  bambini: false,
  ...over,
})

const race = (over: Partial<FoundRace> = {}): FoundRace => ({
  esito: "trovata",
  url: "https://www.esempio.it",
  data: "2 maggio",
  luogo: ["Badia di Moscheta"],
  regione: "Toscana",
  minutiDaFirenze: 50,
  tipo: "Trail",
  distanze: [distance()],
  ...over,
})

test("cleans double spaces out of the date", () => {
  expect(formatCells("Gara", race({ data: " 28 febbraio-1  marzo " })).date).toBe(
    "28 febbraio-1 marzo",
  )
})

test("joins the places with a comma and a space", () => {
  const cells = formatCells("Gara", race({ luogo: ["Radda", "Gaiole", "Castellina in Chianti"] }))

  expect(cells.place).toBe("Radda, Gaiole, Castellina in Chianti")
})

test.each([
  [50, "~50min"],
  [60, "~1h"],
  [90, "~1h30"],
  [125, "~2h5"],
])("renders %i minutes from Florence as %s", (minutes, expected) => {
  expect(formatCells("Gara", race({ minutiDaFirenze: minutes })).fromFlorence).toBe(expected)
})

test("orders the distances by descending km, with the climb and the walk suffix", () => {
  const cells = formatCells(
    "Gara",
    race({
      distanze: [
        distance({ km: 17.5, dislivello: 750, camminata: true }),
        distance({ km: 45, dislivello: 1820 }),
        distance({ km: 24, dislivello: null }),
      ],
    }),
  )

  expect(cells.distances).toBe("45km 1820m+\n24km\n17.5km 750m+, camminata")
})

test("drops the children routes and the walks under 5km, keeping a competitive short one", () => {
  const cells = formatCells(
    "Gara",
    race({
      distanze: [
        distance({ km: 3, bambini: true }),
        distance({ km: 4, dislivello: 100, camminata: true }),
        distance({ km: 12, dislivello: 300, camminata: true }),
        distance({ km: 4, dislivello: 200 }),
      ],
    }),
  )

  expect(cells.distances).toBe("12km 300m+, camminata\n4km 200m+")
})

test("leaves the distances cell empty when nothing is left", () => {
  const cells = formatCells("Gara", race({ distanze: [distance({ km: 2, bambini: true })] }))

  expect(cells.distances).toBe("")
})

test("writes decimals with a dot", () => {
  const cells = formatCells("Gara", race({ distanze: [distance({ km: 23.5, dislivello: 1280 })] }))

  expect(cells.distances).toBe("23.5km 1280m+")
})

test("writes the name as it is spelled in the race list", () => {
  expect(formatCells("Garfagnana Epic Trail", race()).name).toBe("Garfagnana Epic Trail")
})

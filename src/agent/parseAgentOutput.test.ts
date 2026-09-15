import { expect, test } from "vitest"
import { Result } from "effect"
import { parseAgentOutput } from "./parseAgentOutput.ts"

const found = {
  esito: "trovata",
  url: "https://www.chiantiultratrail.com",
  data: "18-21 marzo",
  luogo: ["Radda", "Gaiole"],
  regione: "Toscana",
  minutiDaFirenze: 60,
  tipo: "Trail",
  distanze: [{ km: 17.5, dislivello: 750, camminata: true, bambini: false }],
}

const failureMessage = (output: string) => {
  const result = parseAgentOutput("Gara", output)
  if (Result.isSuccess(result)) throw new Error("expected a failure")
  expect(result.failure._tag).toBe("AgentInvalidOutput")
  return result.failure.message
}

test("decodes a found card surrounded by prose, trimming the date", () => {
  const output = `Ecco:\n${JSON.stringify({ ...found, data: " 18-21 marzo " })}\nFine.`

  expect(parseAgentOutput("Gara", output)).toEqual(Result.succeed(found))
})

test("decodes a not-found card with only the esito", () => {
  expect(parseAgentOutput("Gara", '{"esito":"non_trovata"}')).toEqual(
    Result.succeed({ esito: "non_trovata" }),
  )
})

test("decodes an ambiguous card with its candidates", () => {
  const card = { esito: "ambigua", candidati: ["Trail A", "Trail B"] }

  expect(parseAgentOutput("Gara", JSON.stringify(card))).toEqual(Result.succeed(card))
})

test("accepts a null dislivello and no dislivello key", () => {
  const distanze = [
    { km: 10, dislivello: null, camminata: false, bambini: false },
    { km: 5, camminata: false, bambini: true },
  ]

  const result = parseAgentOutput("Gara", JSON.stringify({ ...found, distanze }))

  expect(result).toEqual(Result.succeed({ ...found, distanze }))
})

test("fails with AgentInvalidOutput when there is no JSON", () => {
  expect(failureMessage("Non ho trovato nulla.")).toContain("nessun oggetto JSON")
})

test("fails when the date is outside the grammar", () => {
  expect(failureMessage(JSON.stringify({ ...found, data: "1° maggio 2026" }))).toContain(
    "data fuori grammatica",
  )
})

test("fails when the region is not one of the twenty regions or Estero", () => {
  expect(failureMessage(JSON.stringify({ ...found, regione: "Tuscany" }))).toContain("regione")
})

test("fails when the type is not Trail or Sky", () => {
  expect(failureMessage(JSON.stringify({ ...found, tipo: "Road" }))).toContain("tipo")
})

test("fails when the esito is unknown", () => {
  expect(failureMessage('{"esito":"forse"}')).toContain("esito")
})

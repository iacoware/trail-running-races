import { expect, test } from "vitest"
import { Option } from "effect"
import { extractJson } from "./extractJson.ts"

test("parses an output that is only a JSON object", () => {
  expect(extractJson('{"esito":"trovata"}')).toEqual(Option.some({ esito: "trovata" }))
})

test("finds the first JSON object surrounded by prose and fences", () => {
  const output =
    'Ecco la scheda:\n```json\n{"esito":"non_trovata"}\n```\nSpero sia utile {non json}'

  expect(extractJson(output)).toEqual(Option.some({ esito: "non_trovata" }))
})

test("skips a brace that does not open a valid object and keeps looking", () => {
  const output = 'Uso {{nome}} come placeholder. Risposta: {"a":{"b":[1,"}"]}}'

  expect(extractJson(output)).toEqual(Option.some({ a: { b: [1, "}"] } }))
})

test("returns none when the output has no JSON object", () => {
  expect(extractJson("Non ho trovato nulla.")).toEqual(Option.none())
  expect(extractJson("aperta { senza chiusura")).toEqual(Option.none())
})

import { expect, it } from "@effect/vitest"
import { Effect, Layer, Option, Stream } from "effect"
import { Agent } from "../agent/Agent.ts"
import { AgentTimeout } from "../agent/errors.ts"
import type { FoundRace, RaceCard } from "../agent/RaceCard.ts"
import type { PlannedRow } from "../plan/planRow.ts"
import { RaceList } from "../races/RaceList.ts"
import { SheetReader } from "../sheet/SheetReader.ts"
import { SheetWriter } from "../sheet/SheetWriter.ts"
import { captureLogs } from "../testing/captureLogs.ts"
import { fill } from "./fill.ts"

const header = ["Nome", "Data (+ o -)", "Luogo", "Da FI", "Tipo", "Distanze"]

const sheetWith = (...rows: ReadonlyArray<ReadonlyArray<string>>) =>
  Layer.succeed(SheetReader, SheetReader.of({ rows: Effect.succeed([header, ...rows]) }))

const listOf = (...names: ReadonlyArray<string>) =>
  Layer.succeed(RaceList, RaceList.of({ names: Effect.succeed(names) }))

const writerInto = (written: Array<PlannedRow>) =>
  Layer.succeed(
    SheetWriter,
    SheetWriter.of({ insert: (row) => Effect.sync(() => void written.push(row)) }),
  )

const notFound: RaceCard = { esito: "non_trovata" }

const found = (over: Partial<FoundRace> = {}): FoundRace => ({
  esito: "trovata",
  url: "https://www.esempio.it",
  data: "5-6 marzo",
  luogo: ["Castelnuovo"],
  regione: "Toscana",
  minutiDaFirenze: 90,
  tipo: "Trail",
  distanze: [{ km: 20, dislivello: 900, camminata: false, bambini: false }],
  ...over,
})

const agentAnswering = (searched: Array<string>, answers: Record<string, RaceCard> = {}) =>
  Layer.succeed(
    Agent,
    Agent.of({
      search: (name) => {
        searched.push(name)
        const card = answers[name]
        return card === undefined
          ? Effect.fail(new AgentTimeout({ race: name, seconds: 1, message: "timeout" }))
          : Effect.succeed(card)
      },
    }),
  )

const outcomes = (only: Option.Option<string>) => Stream.runCollect(fill({ only }))

const tuscany = sheetWith(
  ["Toscana"],
  ["Brunello Crossing", "20-21 febbraio"],
  ["Chianti UTMB", "18-21 marzo"],
)

it.effect("plans a row for every found race and hands it to the writer", () =>
  Effect.gen(function* () {
    const searched: Array<string> = []
    const written: Array<PlannedRow> = []

    const results = yield* outcomes(Option.none()).pipe(
      Effect.provide(agentAnswering(searched, { "Garfagnana Epic Trail": found() })),
      Effect.provide(writerInto(written)),
    )

    expect(searched).toEqual(["Garfagnana Epic Trail"])
    expect(written.map((row) => [row.section, row.row])).toEqual([["Toscana", 4]])
    expect(results).toEqual([
      { _tag: "Filled", name: "Garfagnana Epic Trail", row: written[0] },
    ])
  }).pipe(Effect.provide(listOf("Garfagnana Epic Trail", "Chianti UTMB")), Effect.provide(tuscany)),
)

it.effect("reports not found and ambiguous races without planning a row", () =>
  Effect.gen(function* () {
    const written: Array<PlannedRow> = []

    const results = yield* outcomes(Option.none()).pipe(
      Effect.provide(
        agentAnswering([], {
          "Gara Assente": notFound,
          "Gara Doppia": { esito: "ambigua", candidati: ["2024", "2025"] },
        }),
      ),
      Effect.provide(writerInto(written)),
    )

    expect(written).toEqual([])
    expect(results).toEqual([
      { _tag: "NotFound", name: "Gara Assente" },
      { _tag: "Ambiguous", name: "Gara Doppia", candidates: ["2024", "2025"] },
    ])
  }).pipe(Effect.provide(listOf("Gara Assente", "Gara Doppia")), Effect.provide(tuscany)),
)

it.effect("keeps searching the next race after one fails, reporting the tagged error", () =>
  Effect.gen(function* () {
    const searched: Array<string> = []
    const written: Array<PlannedRow> = []

    const results = yield* outcomes(Option.none()).pipe(
      Effect.provide(agentAnswering(searched, { "Gara Buona": found() })),
      Effect.provide(writerInto(written)),
    )

    expect(searched).toEqual(["Gara Rotta", "Gara Buona"])
    expect(results.map((outcome) => outcome._tag)).toEqual(["Failed", "Filled"])
    expect(written).toHaveLength(1)
  }).pipe(Effect.provide(listOf("Gara Rotta", "Gara Buona")), Effect.provide(tuscany)),
)

it.effect("reports the missing destination section as an error and plans nothing", () =>
  Effect.gen(function* () {
    const written: Array<PlannedRow> = []

    const results = yield* outcomes(Option.none()).pipe(
      Effect.provide(agentAnswering([], { "Gara Francese": found({ regione: "Estero" }) })),
      Effect.provide(writerInto(written)),
    )

    expect(written).toEqual([])
    expect(results).toHaveLength(1)
    const [outcome] = results
    expect(outcome?._tag === "Failed" && outcome.error._tag).toBe("SectionMissingError")
  }).pipe(Effect.provide(listOf("Gara Francese")), Effect.provide(tuscany)),
)

it.effect("with --only searches that name even when it is absent from the list", () =>
  Effect.gen(function* () {
    const searched: Array<string> = []

    const results = yield* outcomes(Option.some("Fuori Elenco")).pipe(
      Effect.provide(agentAnswering(searched, { "Fuori Elenco": notFound })),
      Effect.provide(writerInto([])),
    )

    expect(searched).toEqual(["Fuori Elenco"])
    expect(results).toHaveLength(1)
  }).pipe(Effect.provide(listOf("Gara Nuova")), Effect.provide(tuscany)),
)

it.effect("with --only does not invoke the agent for a race already in the sheet and says so", () =>
  Effect.gen(function* () {
    const searched: Array<string> = []
    const logs: Array<string> = []

    const results = yield* outcomes(Option.some("chianti utmb")).pipe(
      Effect.provide(agentAnswering(searched)),
      Effect.provide(writerInto([])),
      Effect.provide(captureLogs(logs)),
    )

    expect(searched).toEqual([])
    expect(results).toEqual([])
    expect(logs).toEqual(['Info: "chianti utmb" è già nel foglio, agente non invocato'])
  }).pipe(Effect.provide(listOf("Gara Nuova")), Effect.provide(tuscany)),
)

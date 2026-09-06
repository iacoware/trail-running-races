import { expect, it } from "@effect/vitest"
import { Effect, Layer, Option, Result, Stream } from "effect"
import { Agent } from "../agent/Agent.ts"
import { AgentTimeout } from "../agent/errors.ts"
import type { RaceCard } from "../agent/RaceCard.ts"
import { RaceList } from "../races/RaceList.ts"
import { SheetReader } from "../sheet/SheetReader.ts"
import { captureLogs } from "../testing/captureLogs.ts"
import { fill } from "./fill.ts"

const header = ["Nome", "Data (+ o -)", "Luogo", "Da FI", "Tipo", "Distanze"]

const sheetWith = (...rows: ReadonlyArray<ReadonlyArray<string>>) =>
  Layer.succeed(SheetReader, SheetReader.of({ rows: Effect.succeed([header, ...rows]) }))

const listOf = (...names: ReadonlyArray<string>) =>
  Layer.succeed(RaceList, RaceList.of({ names: Effect.succeed(names) }))

const notFound: RaceCard = { esito: "non_trovata" }

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

it.effect("searches every missing race in list order and yields each outcome, errors included", () =>
  Effect.gen(function* () {
    const searched: Array<string> = []

    const results = yield* outcomes(Option.none()).pipe(
      Effect.provide(agentAnswering(searched, { "Nuova Gara": notFound })),
    )

    expect(searched).toEqual(["Nuova Gara", "Altra Gara"])
    expect(results).toEqual([
      { name: "Nuova Gara", result: Result.succeed(notFound) },
      {
        name: "Altra Gara",
        result: Result.fail(new AgentTimeout({ race: "Altra Gara", seconds: 1, message: "timeout" })),
      },
    ])
  }).pipe(
    Effect.provide(listOf("Nuova Gara", "Chianti UTMB", "Altra Gara")),
    Effect.provide(sheetWith(["Toscana"], ["Chianti UTMB", "18-21 marzo"])),
  ),
)

it.effect("with --only searches that name even when it is absent from the list", () =>
  Effect.gen(function* () {
    const searched: Array<string> = []

    const results = yield* outcomes(Option.some("Fuori Elenco")).pipe(
      Effect.provide(agentAnswering(searched, { "Fuori Elenco": notFound })),
    )

    expect(searched).toEqual(["Fuori Elenco"])
    expect(results).toHaveLength(1)
  }).pipe(
    Effect.provide(listOf("Nuova Gara")),
    Effect.provide(sheetWith(["Toscana"], ["Chianti UTMB", "18-21 marzo"])),
  ),
)

it.effect("with --only does not invoke the agent for a race already in the sheet and says so", () =>
  Effect.gen(function* () {
    const searched: Array<string> = []
    const logs: Array<string> = []

    const results = yield* outcomes(Option.some("chianti utmb")).pipe(
      Effect.provide(agentAnswering(searched)),
      Effect.provide(captureLogs(logs)),
    )

    expect(searched).toEqual([])
    expect(results).toEqual([])
    expect(logs).toEqual(['Info: "chianti utmb" è già nel foglio, agente non invocato'])
  }).pipe(
    Effect.provide(listOf("Nuova Gara")),
    Effect.provide(sheetWith(["Toscana"], ["Chianti UTMB", "18-21 marzo"])),
  ),
)

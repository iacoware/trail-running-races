import { effect as test, expect } from "@effect/vitest"
import { Effect, Layer, Option, Stream } from "effect"

import { Agent } from "../agent/Agent.ts"
import { AgentTimeout } from "../agent/errors.ts"
import type { FoundRace, RaceCard } from "../agent/RaceCard.ts"
import type { PlannedRow } from "../plan/planRow.ts"
import { SectionAction } from "../plan/targetSection.ts"
import { RaceList } from "../races/RaceList.ts"
import { SheetApiError } from "../sheet/errors.ts"
import { SheetReader } from "../sheet/SheetReader.ts"
import { SheetWriter } from "../sheet/SheetWriter.ts"
import { captureLogs } from "../testing/captureLogs.ts"
import { fill, RaceFillResult } from "./fill.ts"

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
                    ? Effect.fail(AgentTimeout.make({ race: name, seconds: 1, message: "timeout" }))
                    : Effect.succeed(card)
            },
        }),
    )

// A writer that really inserts, so the next race is planned against the sheet it left behind.
const insertingSheet = (...rows: Array<Array<string>>) => {
    const current = [header, ...rows]
    return Layer.merge(
        Layer.succeed(SheetReader, SheetReader.of({ rows: Effect.sync(() => [...current]) })),
        Layer.succeed(
            SheetWriter,
            SheetWriter.of({
                insert: (planned) =>
                    Effect.sync(() => {
                        if (SectionAction.$is("CreateSection")(planned.sectionAction)) {
                            current.splice(
                                planned.sectionAction.separatorRow - 1,
                                0,
                                [],
                                [planned.section],
                                [planned.cells.name, planned.cells.date],
                                ...(planned.sectionAction.trailingSeparator ? [[]] : []),
                            )
                            return
                        }
                        current.splice(planned.row - 1, 0, [planned.cells.name, planned.cells.date])
                    }),
            }),
        ),
    )
}

const fillResults = (only: Option.Option<string>) => Stream.runCollect(fill({ only }))

const tuscany = sheetWith(
    ["Toscana"],
    ["Brunello Crossing", "20-21 febbraio"],
    ["Chianti UTMB", "18-21 marzo"],
)

const startingFrom = <ROut, E>(names: ReadonlyArray<string>, sheet: Layer.Layer<ROut, E>) =>
    Effect.provide(Layer.mergeAll(listOf(...names), sheet))

const watching = (
    searched: Array<string>,
    answers: Record<string, RaceCard>,
    written: Array<PlannedRow>,
) => Effect.provide(Layer.mergeAll(agentAnswering(searched, answers), writerInto(written)))

test("plans a row for every found race and hands it to the writer", () =>
    Effect.gen(function* () {
        const searched: Array<string> = []
        const written: Array<PlannedRow> = []

        const results = yield* fillResults(Option.none()).pipe(
            watching(searched, { "Garfagnana Epic Trail": found() }, written),
        )

        expect(searched).toEqual(["Garfagnana Epic Trail"])
        expect(written.map((row) => [row.section, row.row])).toEqual([["Toscana", 4]])
        expect(results).toEqual([
            { _tag: "Filled", name: "Garfagnana Epic Trail", row: written[0] },
        ])
    }).pipe(startingFrom(["Garfagnana Epic Trail", "Chianti UTMB"], tuscany)))

test("parks not found and ambiguous races at the end of Da verificare", () =>
    Effect.gen(function* () {
        const written: Array<PlannedRow> = []

        const results = yield* fillResults(Option.none()).pipe(
            watching(
                [],
                {
                    "Gara Assente": notFound,
                    "Gara Doppia": { esito: "ambigua", candidati: ["2024", "2025"] },
                },
                written,
            ),
        )

        expect(written).toEqual([
            {
                name: "Gara Assente",
                url: Option.none(),
                section: "Da verificare",
                row: 7,
                after: Option.none(),
                sectionAction: { _tag: "UseExistingSection" },
                columns: {
                    name: 0,
                    date: 1,
                    place: 2,
                    fromFlorence: 3,
                    type: 4,
                    distances: 5,
                },
                cells: {
                    name: "Gara Assente",
                    date: "non ho trovato niente",
                    place: "",
                    fromFlorence: "",
                    type: "",
                    distances: "",
                },
            },
            {
                name: "Gara Doppia",
                url: Option.none(),
                section: "Da verificare",
                row: 7,
                after: Option.none(),
                sectionAction: { _tag: "UseExistingSection" },
                columns: {
                    name: 0,
                    date: 1,
                    place: 2,
                    fromFlorence: 3,
                    type: 4,
                    distances: 5,
                },
                cells: {
                    name: "Gara Doppia",
                    date: "più di un evento con questo nome",
                    place: "",
                    fromFlorence: "",
                    type: "",
                    distances: "",
                },
            },
        ])
        expect(results).toEqual([
            { _tag: "NotFound", name: "Gara Assente" },
            { _tag: "Ambiguous", name: "Gara Doppia", candidates: ["2024", "2025"] },
        ])
    }).pipe(
        startingFrom(
            ["Gara Assente", "Gara Doppia"],
            sheetWith(
                ["Toscana"],
                ["Brunello Crossing", "20-21 febbraio"],
                ["Chianti UTMB", "18-21 marzo"],
                [],
                ["Da verificare"],
            ),
        ),
    ))

test("appends an unresolved race after the last row in Da verificare", () =>
    Effect.gen(function* () {
        const written: Array<PlannedRow> = []

        yield* fillResults(Option.none()).pipe(watching([], { "Gara Assente": notFound }, written))

        expect(written.map((row) => [row.row, row.after])).toEqual([
            [7, Option.some("Gara già da controllare")],
        ])
    }).pipe(
        startingFrom(
            ["Gara Assente"],
            sheetWith(
                ["Toscana"],
                ["Brunello Crossing", "20-21 febbraio"],
                [],
                ["Da verificare"],
                ["Gara già da controllare", "non ho trovato niente"],
            ),
        ),
    ))

test("creates Da verificare when parking the first unresolved race", () =>
    Effect.gen(function* () {
        const written: Array<PlannedRow> = []

        const results = yield* fillResults(Option.none()).pipe(
            watching([], { "Gara Assente": notFound }, written),
        )

        expect(results.map((result) => result._tag)).toEqual(["NotFound"])
        expect(written[0]?.section).toBe("Da verificare")
        expect(written[0]?.sectionAction._tag).toBe("CreateSection")
    }).pipe(
        startingFrom(
            ["Gara Assente"],
            sheetWith(["Toscana"], ["Brunello Crossing", "20-21 febbraio"]),
        ),
    ))

test("skips a parked race on the next run until its row is removed", () => {
    const searched: Array<string> = []

    return Effect.gen(function* () {
        const first = yield* fillResults(Option.none())
        const second = yield* fillResults(Option.none())

        expect(first.map((result) => result._tag)).toEqual(["NotFound"])
        expect(second).toEqual([])
        expect(searched).toEqual(["Gara Assente"])
    }).pipe(
        Effect.provide(
            Layer.mergeAll(
                listOf("Gara Assente"),
                agentAnswering(searched, { "Gara Assente": notFound }),
                insertingSheet(
                    ["Toscana"],
                    ["Brunello Crossing", "20-21 febbraio"],
                    [],
                    ["Da verificare"],
                ),
            ),
        ),
    )
})

test("keeps searching the next race after one fails, reporting the tagged error", () =>
    Effect.gen(function* () {
        const searched: Array<string> = []
        const written: Array<PlannedRow> = []

        const results = yield* fillResults(Option.none()).pipe(
            watching(searched, { "Gara Buona": found() }, written),
        )

        expect(searched).toEqual(["Gara Rotta", "Gara Buona"])
        expect(results.map((result) => result._tag)).toEqual(["Failed", "Filled"])
        expect(written).toHaveLength(1)
    }).pipe(startingFrom(["Gara Rotta", "Gara Buona"], tuscany)))

test("creates Estero when a foreign race first needs it", () =>
    Effect.gen(function* () {
        const written: Array<PlannedRow> = []

        const results = yield* fillResults(Option.none()).pipe(
            watching([], { "Gara Francese": found({ regione: "Estero" }) }, written),
        )

        expect(results.map((result) => result._tag)).toEqual(["Filled"])
        expect(written[0]?.section).toBe("Estero")
        expect(written[0]?.sectionAction._tag).toBe("CreateSection")
    }).pipe(startingFrom(["Gara Francese"], tuscany)))

test("plans a second race against the special section created by the first", () =>
    Effect.gen(function* () {
        const results = yield* fillResults(Option.none()).pipe(
            Effect.provide(
                agentAnswering([], {
                    "Prima Francese": found({ regione: "Estero", data: "5 marzo" }),
                    "Seconda Francese": found({ regione: "Estero", data: "6 marzo" }),
                }),
            ),
        )

        const filled = results.filter(RaceFillResult.$is("Filled"))
        expect(filled.map((result) => [result.row.row, result.row.sectionAction._tag])).toEqual([
            [6, "CreateSection"],
            [7, "UseExistingSection"],
        ])
    }).pipe(
        startingFrom(
            ["Prima Francese", "Seconda Francese"],
            insertingSheet(["Toscana"], ["Brunello Crossing", "20-21 febbraio"]),
        ),
    ))

test("with --only searches that name even when it is absent from the list", () =>
    Effect.gen(function* () {
        const searched: Array<string> = []

        const results = yield* fillResults(Option.some("Fuori Elenco")).pipe(
            watching(searched, { "Fuori Elenco": notFound }, []),
        )

        expect(searched).toEqual(["Fuori Elenco"])
        expect(results).toHaveLength(1)
    }).pipe(
        startingFrom(
            ["Gara Nuova"],
            sheetWith(
                ["Toscana"],
                ["Brunello Crossing", "20-21 febbraio"],
                ["Chianti UTMB", "18-21 marzo"],
                [],
                ["Da verificare"],
            ),
        ),
    ))

test("with --only does not invoke the agent for a race already in the sheet and says so", () =>
    Effect.gen(function* () {
        const searched: Array<string> = []
        const logs: Array<string> = []

        const results = yield* fillResults(Option.some("chianti utmb")).pipe(
            Effect.provide(
                Layer.mergeAll(agentAnswering(searched), writerInto([]), captureLogs(logs)),
            ),
        )

        expect(searched).toEqual([])
        expect(results).toEqual([])
        expect(logs).toEqual(['Info: "chianti utmb" è già nel foglio, agente non invocato'])
    }).pipe(startingFrom(["Gara Nuova"], tuscany)))

test("plans the second race of a section against the row the first one just took", () =>
    Effect.gen(function* () {
        const results = yield* fillResults(Option.none()).pipe(
            Effect.provide(
                agentAnswering([], {
                    "Prima Nuova": found({ data: "5 marzo" }),
                    "Seconda Nuova": found({ data: "6 marzo" }),
                }),
            ),
        )

        const rows = results.map((result) =>
            RaceFillResult.$is("Filled")(result) ? result.row.row : 0,
        )
        expect(rows).toEqual([4, 5])
    }).pipe(
        startingFrom(
            ["Prima Nuova", "Seconda Nuova"],
            insertingSheet(
                ["Toscana"],
                ["Brunello Crossing", "20-21 febbraio"],
                ["Chianti UTMB", "18-21 marzo"],
            ),
        ),
    ))

test("reports the write error of one race and keeps inserting the next one", () =>
    Effect.gen(function* () {
        const written: Array<PlannedRow> = []
        const failing = Layer.succeed(
            SheetWriter,
            SheetWriter.of({
                insert: (row) =>
                    row.name === "Gara Rifiutata"
                        ? Effect.fail(
                              SheetApiError.make({
                                  spreadsheetId: "foglio",
                                  message: "quota superata",
                                  cause: undefined,
                              }),
                          )
                        : Effect.sync(() => void written.push(row)),
            }),
        )

        const results = yield* fillResults(Option.none()).pipe(
            Effect.provide(
                Layer.mergeAll(
                    agentAnswering([], { "Gara Rifiutata": found(), "Gara Buona": found() }),
                    failing,
                ),
            ),
        )

        expect(results.map((result) => result._tag)).toEqual(["Failed", "Filled"])
        expect(written.map((row) => row.name)).toEqual(["Gara Buona"])
    }).pipe(startingFrom(["Gara Rifiutata", "Gara Buona"], tuscany)))

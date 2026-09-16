import { expect, test } from "vitest"

import { AgentTimeout } from "../agent/errors.ts"
import { plannedRow } from "../testing/plannedRow.ts"
import type { RaceFillResult } from "./fill.ts"
import { hasErrors, summaryLines } from "./summary.ts"

const filled = (name: string): RaceFillResult => ({
    _tag: "Filled",
    name,
    row: plannedRow({ name }),
})

const timedOut = (name: string): RaceFillResult => ({
    _tag: "Failed",
    name,
    error: AgentTimeout.make({
        race: name,
        seconds: 300,
        message: "agente senza risposta entro 300s",
    }),
})

test("counts every category and lists the races behind each one", () => {
    const lines = summaryLines(
        [
            filled("Garfagnana Epic Trail"),
            { _tag: "NotFound", name: "Gara inesistente di prova" },
            { _tag: "Ambiguous", name: "Sky trail Covigliaio", candidates: ["2024", "2025"] },
            timedOut("Ultra trail Mugello"),
        ],
        "pianificate",
    )

    expect(lines).toEqual([
        "== riepilogo",
        "pianificate: 1",
        "  - Garfagnana Epic Trail",
        "non trovate: 1",
        "  - Gara inesistente di prova",
        "ambigue: 1",
        "  - Sky trail Covigliaio: candidati 2024, 2025",
        "errori: 1",
        "  - Ultra trail Mugello: AgentTimeout: agente senza risposta entro 300s",
    ])
})

test("keeps the zero counts of an empty run", () => {
    expect(summaryLines([], "pianificate")).toEqual([
        "== riepilogo",
        "pianificate: 0",
        "non trovate: 0",
        "ambigue: 0",
        "errori: 0",
    ])
})

test("reports errors only for a failed race, not for a missing or ambiguous one", () => {
    expect(hasErrors([{ _tag: "NotFound", name: "Gara" }])).toBe(false)
    expect(hasErrors([timedOut("Gara")])).toBe(true)
})

import { Duration, Match } from "effect"

import type { RaceFillResult } from "./fill.ts"

// A dry run plans the rows it would write, a real run has already written them.
export type FilledLabel = "pianificate" | "inserite"

const singular = { pianificate: "pianificata", inserite: "inserita" } as const

export const readingSheetLine = "lettura foglio…"

export const candidatesLine = (count: number) =>
    count === 0 ? "nessuna gara da cercare" : `${count} ${count === 1 ? "gara" : "gare"} da cercare`

const counter = (index: number, total: number) => `[${index + 1}/${total}]`

export const searchingLine = (index: number, total: number, name: string) =>
    `${counter(index, total)} ${name}: ricerca…`

// Whole seconds are enough for a search that takes minutes; milliseconds would only add noise.
export const formatElapsed = (elapsed: Duration.Duration) => {
    const seconds = Math.round(Duration.toSeconds(elapsed))
    return seconds === 0 ? "0s" : Duration.format(Duration.seconds(seconds))
}

const outcome = (result: RaceFillResult, filled: FilledLabel) =>
    Match.valueTags(result, {
        Filled: ({ row }) => `${singular[filled]} in ${row.section}, riga ${row.row}`,
        NotFound: () => "non trovata → Da verificare",
        Ambiguous: () => "ambigua → Da verificare",
        Failed: ({ error }) => `errore ${error._tag}`,
    })

export const outcomeLine = (
    index: number,
    total: number,
    result: RaceFillResult,
    filled: FilledLabel,
    elapsed: Duration.Duration,
) =>
    `${counter(index, total)} ${result.name}: ${outcome(result, filled)} (${formatElapsed(elapsed)})`

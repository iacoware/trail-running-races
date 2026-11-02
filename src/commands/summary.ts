import { Data, Predicate } from "effect"

import { RaceFillResult } from "./fill.ts"
import type { FilledLabel } from "./progress.ts"

type FailedRace = Data.TaggedEnum.Value<RaceFillResult, "Failed">

const withTag = <T extends RaceFillResult["_tag"]>(
    results: ReadonlyArray<RaceFillResult>,
    tag: T,
) => results.filter(RaceFillResult.$is(tag))

const count = (label: string, lines: ReadonlyArray<string>) => [
    `${label}: ${lines.length}`,
    ...lines.map((line) => `  - ${line}`),
]

// The decode error alone does not say what the agent wrote; its raw output does.
const failureLines = (result: FailedRace) => {
    const headline = `  - ${result.name}: ${result.error._tag}: ${result.error.message}`
    if (!Predicate.isTagged(result.error, "AgentInvalidOutput")) return [headline]
    const output = result.error.output.trim()
    if (output === "") return [headline, "    output dell'agente: (vuoto)"]
    return [
        headline,
        "    output dell'agente:",
        ...output.split("\n").map((line) => `      ${line}`),
    ]
}

const failures = (failed: ReadonlyArray<FailedRace>) => [
    `errori: ${failed.length}`,
    ...failed.flatMap(failureLines),
]

export const summaryLines = (
    results: ReadonlyArray<RaceFillResult>,
    filled: FilledLabel,
): ReadonlyArray<string> => [
    "== riepilogo",
    ...count(
        filled,
        withTag(results, "Filled").map((result) => result.name),
    ),
    ...count(
        "non trovate",
        withTag(results, "NotFound").map((result) => result.name),
    ),
    ...count(
        "ambigue",
        withTag(results, "Ambiguous").map(
            (result) => `${result.name}: candidati ${result.candidates.join(", ")}`,
        ),
    ),
    ...failures(withTag(results, "Failed")),
]

// Only an error is worth a failing exit code: a race not found or ambiguous is a result.
export const hasErrors = (results: ReadonlyArray<RaceFillResult>) =>
    results.some(RaceFillResult.$is("Failed"))

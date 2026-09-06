import type { RaceOutcome } from "./fill.ts"

const withTag = <T extends RaceOutcome["_tag"]>(
  outcomes: ReadonlyArray<RaceOutcome>,
  tag: T,
): ReadonlyArray<Extract<RaceOutcome, { _tag: T }>> =>
  outcomes.filter((outcome): outcome is Extract<RaceOutcome, { _tag: T }> => outcome._tag === tag)

const count = (label: string, lines: ReadonlyArray<string>) => [
  `${label}: ${lines.length}`,
  ...lines.map((line) => `  - ${line}`),
]

// The plan is printed race by race as the run goes; not found and ambiguous appear here only.
export const summaryLines = (outcomes: ReadonlyArray<RaceOutcome>): ReadonlyArray<string> => [
  "== riepilogo",
  ...count(
    "pianificate",
    withTag(outcomes, "Filled").map((outcome) => outcome.name),
  ),
  ...count(
    "non trovate",
    withTag(outcomes, "NotFound").map((outcome) => outcome.name),
  ),
  ...count(
    "ambigue",
    withTag(outcomes, "Ambiguous").map(
      (outcome) => `${outcome.name}: candidati ${outcome.candidates.join(", ")}`,
    ),
  ),
  ...count(
    "errori",
    withTag(outcomes, "Failed").map(
      (outcome) => `${outcome.name}: ${outcome.error._tag}: ${outcome.error.message}`,
    ),
  ),
]

// Only an error is worth a failing exit code: a race not found or ambiguous is a result.
export const hasErrors = (outcomes: ReadonlyArray<RaceOutcome>) =>
  outcomes.some((outcome) => outcome._tag === "Failed")

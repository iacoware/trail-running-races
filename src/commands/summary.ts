import { RaceOutcome } from "./fill.ts"

const withTag = <T extends RaceOutcome["_tag"]>(outcomes: ReadonlyArray<RaceOutcome>, tag: T) =>
  outcomes.filter(RaceOutcome.$is(tag))

const count = (label: string, lines: ReadonlyArray<string>) => [
  `${label}: ${lines.length}`,
  ...lines.map((line) => `  - ${line}`),
]

// The plan is printed race by race as the run goes; not found and ambiguous appear here only.
// A dry run plans the rows it would write, a real run has already written them.
export type FilledLabel = "pianificate" | "inserite"

export const summaryLines = (
  outcomes: ReadonlyArray<RaceOutcome>,
  filled: FilledLabel,
): ReadonlyArray<string> => [
  "== riepilogo",
  ...count(
    filled,
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
  outcomes.some(RaceOutcome.$is("Failed"))

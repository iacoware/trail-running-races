import { RaceFillResult } from "./fill.ts"

const withTag = <T extends RaceFillResult["_tag"]>(results: ReadonlyArray<RaceFillResult>, tag: T) =>
  results.filter(RaceFillResult.$is(tag))

const count = (label: string, lines: ReadonlyArray<string>) => [
  `${label}: ${lines.length}`,
  ...lines.map((line) => `  - ${line}`),
]

// The plan is printed race by race as the run goes; not found and ambiguous appear here only.
// A dry run plans the rows it would write, a real run has already written them.
export type FilledLabel = "pianificate" | "inserite"

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
  ...count(
    "errori",
    withTag(results, "Failed").map(
      (result) => `${result.name}: ${result.error._tag}: ${result.error.message}`,
    ),
  ),
]

// Only an error is worth a failing exit code: a race not found or ambiguous is a result.
export const hasErrors = (results: ReadonlyArray<RaceFillResult>) =>
  results.some(RaceFillResult.$is("Failed"))

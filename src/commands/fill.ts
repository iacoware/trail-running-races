import { Data, Effect, Option, Result, Stream } from "effect"
import { Agent } from "../agent/Agent.ts"
import type { AgentError } from "../agent/errors.ts"
import type { FoundRace } from "../agent/RaceCard.ts"
import type { PlanError } from "../plan/errors.ts"
import { missingRaces } from "../races/missingRaces.ts"
import { planReviewRow, planRow, type PlannedRow } from "../plan/planRow.ts"
import type {
  SheetColumnMissingError,
  SheetReadError,
  SheetWriteError,
} from "../sheet/errors.ts"
import type { Sheet } from "../sheet/parseSheet.ts"
import { readSheet, readSheetQuietly } from "../sheet/readSheet.ts"
import { SheetReader } from "../sheet/SheetReader.ts"
import { SheetWriter } from "../sheet/SheetWriter.ts"
import { missingIn } from "./missing.ts"

export type RaceOutcome = Data.TaggedEnum<{
  Filled: { readonly name: string; readonly row: PlannedRow }
  NotFound: { readonly name: string }
  Ambiguous: { readonly name: string; readonly candidates: ReadonlyArray<string> }
  Failed: {
    readonly name: string
    readonly error:
      | AgentError
      | PlanError
      | SheetColumnMissingError
      | SheetReadError
      | SheetWriteError
  }
}>

export const RaceOutcome = Data.taggedEnum<RaceOutcome>()

// `--only` narrows the candidates to one name, even one absent from the list, but a race
// already in the sheet is never searched: the presence check always runs.
const candidates = (sheet: Sheet, only: Option.Option<string>) =>
  Option.match(only, {
    onNone: () => missingIn(sheet),
    onSome: (name) =>
      Effect.gen(function* () {
        const wanted = missingRaces([name], sheet)
        if (wanted.length === 0) {
          yield* Effect.logInfo(`"${name}" è già nel foglio, agente non invocato`)
        }
        return wanted
      }),
  })

const insert = (plannedFor: (sheet: Sheet) => Result.Result<PlannedRow, PlanError>) =>
  Effect.gen(function* () {
    const writer = yield* SheetWriter
    // The sheet is read again here: a race inserted earlier in this run moved the rows below it.
    const sheet = yield* readSheetQuietly
    const planned = yield* Effect.fromResult(plannedFor(sheet))
    yield* writer.insert(planned)
    return planned
  })

const writeFound = (name: string, race: FoundRace) =>
  insert((sheet) => planRow(sheet, name, race)).pipe(
    Effect.map((row) => RaceOutcome.Filled({ name, row })),
  )

const park = (name: string, outcome: "non_trovata" | "ambigua") =>
  insert((sheet) => planReviewRow(sheet, name, outcome))

const outcomeFor = (
  name: string,
): Effect.Effect<RaceOutcome, never, Agent | SheetReader | SheetWriter> =>
  Effect.gen(function* () {
    const agent = yield* Agent
    const card = yield* Effect.result(agent.search(name))
    if (Result.isFailure(card)) return RaceOutcome.Failed({ name, error: card.failure })
    switch (card.success.esito) {
      case "non_trovata":
        yield* park(name, card.success.esito)
        return RaceOutcome.NotFound({ name })
      case "ambigua":
        yield* park(name, card.success.esito)
        return RaceOutcome.Ambiguous({ name, candidates: card.success.candidati })
      case "trovata":
        return yield* writeFound(name, card.success)
    }
  }).pipe(
    // One race in error never stops the run: it is reported and the next race is searched.
    Effect.catch((error) => Effect.succeed(RaceOutcome.Failed({ name, error }))),
  )

export const fill = (options: { readonly only: Option.Option<string> }) =>
  Stream.unwrap(
    Effect.gen(function* () {
      const sheet = yield* readSheet
      const names = yield* candidates(sheet, options.only)
      return Stream.fromIterable(names).pipe(Stream.mapEffect(outcomeFor))
    }),
  )

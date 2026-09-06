import { Effect, Option, Result, Stream } from "effect"
import { Agent } from "../agent/Agent.ts"
import type { AgentError } from "../agent/errors.ts"
import type { FoundRace } from "../agent/RaceCard.ts"
import type { PlanError } from "../plan/errors.ts"
import { missingRaces } from "../races/missingRaces.ts"
import { planRow, type PlannedRow } from "../plan/planRow.ts"
import type { SheetWriteError } from "../sheet/errors.ts"
import type { Sheet } from "../sheet/parseSheet.ts"
import { readSheet } from "../sheet/readSheet.ts"
import { SheetWriter } from "../sheet/SheetWriter.ts"
import { missingIn } from "./missing.ts"

export type RaceOutcome =
  | { readonly _tag: "Filled"; readonly name: string; readonly row: PlannedRow }
  | { readonly _tag: "NotFound"; readonly name: string }
  | {
      readonly _tag: "Ambiguous"
      readonly name: string
      readonly candidates: ReadonlyArray<string>
    }
  | {
      readonly _tag: "Failed"
      readonly name: string
      readonly error: AgentError | PlanError | SheetWriteError
    }

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

const write = (sheet: Sheet, name: string, race: FoundRace) =>
  Effect.gen(function* () {
    const writer = yield* SheetWriter
    const planned = yield* Effect.fromResult(planRow(sheet, name, race))
    yield* writer.insert(planned)
    return { _tag: "Filled", name, row: planned } as const
  })

const outcomeFor = (
  sheet: Sheet,
  name: string,
): Effect.Effect<RaceOutcome, never, Agent | SheetWriter> =>
  Effect.gen(function* () {
    const agent = yield* Agent
    const card = yield* Effect.result(agent.search(name))
    if (Result.isFailure(card)) return { _tag: "Failed", name, error: card.failure } as const
    switch (card.success.esito) {
      case "non_trovata":
        return { _tag: "NotFound", name } as const
      case "ambigua":
        return { _tag: "Ambiguous", name, candidates: card.success.candidati } as const
      case "trovata":
        return yield* write(sheet, name, card.success)
    }
  }).pipe(
    // One race in error never stops the run: it is reported and the next race is searched.
    Effect.catch((error) => Effect.succeed({ _tag: "Failed", name, error } as const)),
  )

export const fill = (options: { readonly only: Option.Option<string> }) =>
  Stream.unwrap(
    Effect.gen(function* () {
      const sheet = yield* readSheet
      const names = yield* candidates(sheet, options.only)
      return Stream.fromIterable(names).pipe(
        Stream.mapEffect((name) => outcomeFor(sheet, name)),
      )
    }),
  )

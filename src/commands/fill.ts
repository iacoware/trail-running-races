import { Effect, Option, type Result, Stream } from "effect"
import { Agent } from "../agent/Agent.ts"
import type { AgentError } from "../agent/errors.ts"
import type { RaceCard } from "../agent/RaceCard.ts"
import { missingRaces } from "../races/missingRaces.ts"
import { readSheet } from "../sheet/readSheet.ts"
import { missing } from "./missing.ts"

export type FillOutcome = {
  readonly name: string
  readonly result: Result.Result<RaceCard, AgentError>
}

// `--only` narrows the candidates to one name, even one absent from the list, but a race
// already in the sheet is never searched: the presence check always runs.
const candidates = (only: Option.Option<string>) =>
  Option.match(only, {
    onNone: () => missing,
    onSome: (name) =>
      Effect.gen(function* () {
        const candidates = missingRaces([name], yield* readSheet)
        if (candidates.length === 0) {
          yield* Effect.logInfo(`"${name}" è già nel foglio, agente non invocato`)
        }
        return candidates
      }),
  })

export const fill = (options: { readonly only: Option.Option<string> }) =>
  Stream.unwrap(
    Effect.gen(function* () {
      const agent = yield* Agent
      const names = yield* candidates(options.only)
      return Stream.fromIterable(names).pipe(
        Stream.mapEffect((name) =>
          Effect.map(Effect.result(agent.search(name)), (result) => ({ name, result })),
        ),
      )
    }),
  )

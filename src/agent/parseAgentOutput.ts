import { Option, Result, Schema } from "effect"

import { AgentInvalidOutput } from "./errors.ts"
import { extractJson } from "./extractJson.ts"
import { RaceCard } from "./RaceCard.ts"

const decodeCard = Schema.decodeUnknownResult(RaceCard)

export const parseAgentOutput = (
  race: string,
  output: string,
): Result.Result<RaceCard, AgentInvalidOutput> => {
  const json = extractJson(output)
  if (Option.isNone(json)) {
    const message = "nessun oggetto JSON nell'output dell'agente"
    return Result.fail(new AgentInvalidOutput({ race, output, message }))
  }
  return Result.mapError(
    decodeCard(json.value),
    (cause) =>
      new AgentInvalidOutput({
        race,
        output,
        message: `scheda non conforme allo schema: ${cause.message}`,
      }),
  )
}

import { Context, type Effect } from "effect"

import type { AgentError } from "./errors.ts"
import type { RaceCard } from "./RaceCard.ts"

export class Agent extends Context.Service<
    Agent,
    {
        readonly search: (name: string) => Effect.Effect<RaceCard, AgentError>
    }
>()("trail-running-races/agent/Agent") {}

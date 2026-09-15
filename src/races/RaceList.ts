import { Context, type Effect } from "effect"

import type { RaceListError } from "./errors.ts"

export class RaceList extends Context.Service<
    RaceList,
    {
        readonly names: Effect.Effect<ReadonlyArray<string>, RaceListError>
    }
>()("trail-running-races/races/RaceList") {}

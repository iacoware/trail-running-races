import { Context, type Effect } from "effect"

import type { PlannedRow } from "../plan/planRow.ts"
import type { SheetWriteError } from "./errors.ts"

export class SheetWriter extends Context.Service<
    SheetWriter,
    {
        readonly insert: (row: PlannedRow) => Effect.Effect<void, SheetWriteError>
    }
>()("trail-running-races/sheet/SheetWriter") {}

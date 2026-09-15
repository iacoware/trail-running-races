import { Context, type Effect } from "effect"

import type { SheetReadError } from "./errors.ts"

export type Row = ReadonlyArray<string>

export class SheetReader extends Context.Service<
  SheetReader,
  {
    readonly rows: Effect.Effect<ReadonlyArray<Row>, SheetReadError>
  }
>()("trail-running-races/sheet/SheetReader") {}

import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Effect } from "effect"
import * as GoogleSheetReader from "./sheet/google/GoogleSheetReader.ts"
import { SheetReader } from "./sheet/SheetReader.ts"

const printHeader = Effect.gen(function* () {
  const reader = yield* SheetReader
  const rows = yield* reader.rows
  console.log(rows[0] ?? [])
})

NodeRuntime.runMain(
  printHeader.pipe(
    Effect.provide(GoogleSheetReader.layer),
    Effect.provide(NodeServices.layer),
    // Expected failures are reported as one tagged line; only defects reach runMain's reporter.
    Effect.catch((error) =>
      Effect.sync(() => {
        console.error(`${error._tag}: ${error.message}`)
        process.exitCode = 1
      }),
    ),
  ),
)

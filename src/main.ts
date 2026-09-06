import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Effect, Layer, Logger } from "effect"
import { missing } from "./commands/missing.ts"
import * as FileRaceList from "./races/file/FileRaceList.ts"
import * as GoogleSheetReader from "./sheet/google/GoogleSheetReader.ts"

const USAGE = "uso: pnpm start missing"

// Warnings are meant for a person at the terminal: one plain line on stderr, no timestamps.
const stderrLogger = Logger.layer([
  Logger.make<unknown, void>(({ logLevel, message }) => {
    const label = logLevel === "Warn" ? "avviso" : logLevel.toLowerCase()
    console.error(`${label}: ${String(message)}`)
  }),
])

const printMissing = Effect.gen(function* () {
  const names = yield* missing
  for (const name of names) console.log(name)
}).pipe(Effect.provide(Layer.mergeAll(FileRaceList.layer, GoogleSheetReader.layer)))

const run = (subcommand: string | undefined) => {
  switch (subcommand) {
    case "missing":
      return printMissing
    default:
      return Effect.sync(() => {
        console.error(USAGE)
        process.exitCode = 1
      })
  }
}

NodeRuntime.runMain(
  run(process.argv[2]).pipe(
    Effect.provide(NodeServices.layer),
    Effect.provide(stderrLogger),
    // Expected failures are reported as one tagged line; only defects reach runMain's reporter.
    Effect.catch((error) =>
      Effect.sync(() => {
        console.error(`${error._tag}: ${error.message}`)
        process.exitCode = 1
      }),
    ),
  ),
)

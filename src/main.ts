import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Effect, Layer, Logger, Result, Stream } from "effect"
import * as ProcessAgent from "./agent/process/ProcessAgent.ts"
import { fill, type FillOutcome } from "./commands/fill.ts"
import { parseFillArgs } from "./commands/fillArgs.ts"
import { missing } from "./commands/missing.ts"
import * as FileRaceList from "./races/file/FileRaceList.ts"
import * as GoogleSheetReader from "./sheet/google/GoogleSheetReader.ts"

const USAGE = "uso: pnpm start missing | pnpm start fill --dry-run [--only <nome>]"

// Warnings are meant for a person at the terminal: one plain line on stderr, no timestamps.
const stderrLogger = Logger.layer([
  Logger.make<unknown, void>(({ logLevel, message }) => {
    const label = logLevel === "Warn" ? "avviso" : logLevel.toLowerCase()
    console.error(`${label}: ${String(message)}`)
  }),
])

const usageError = (message: string) =>
  Effect.sync(() => {
    console.error(`${message}\n${USAGE}`)
    process.exitCode = 1
  })

const printMissing = Effect.gen(function* () {
  const names = yield* missing
  for (const name of names) console.log(name)
}).pipe(Effect.provide(Layer.mergeAll(FileRaceList.layer, GoogleSheetReader.layer)))

const printOutcome = ({ name, result }: FillOutcome) =>
  Effect.sync(() => {
    console.log(`== ${name}`)
    if (Result.isSuccess(result)) {
      console.log(JSON.stringify(result.success, null, 2))
    } else {
      console.log(`${result.failure._tag}: ${result.failure.message}`)
      process.exitCode = 1
    }
  })

const runFill = (args: ReadonlyArray<string>) =>
  Result.match(parseFillArgs(args), {
    onFailure: usageError,
    onSuccess: ({ dryRun, only }) =>
      dryRun
        ? Stream.runForEach(fill({ only }), printOutcome).pipe(
            Effect.provide(
              Layer.mergeAll(FileRaceList.layer, GoogleSheetReader.layer, ProcessAgent.layer),
            ),
          )
        : usageError("fill senza --dry-run non è ancora disponibile"),
  })

const run = ([subcommand, ...args]: ReadonlyArray<string>) => {
  switch (subcommand) {
    case "missing":
      return printMissing
    case "fill":
      return runFill(args)
    default:
      return usageError(`sottocomando mancante o sconosciuto: ${subcommand ?? ""}`.trim())
  }
}

NodeRuntime.runMain(
  run(process.argv.slice(2)).pipe(
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

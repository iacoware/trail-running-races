import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Effect, Layer, Logger, Option, Result, Stream } from "effect"
import * as ProcessAgent from "./agent/process/ProcessAgent.ts"
import { fill } from "./commands/fill.ts"
import { parseFillArgs, type FillArgs } from "./commands/fillArgs.ts"
import { missing } from "./commands/missing.ts"
import { hasErrors, summaryLines } from "./commands/summary.ts"
import * as FileRaceList from "./races/file/FileRaceList.ts"
import * as CsvSheetReader from "./sheet/csv/CsvSheetReader.ts"
import * as GoogleSheetReader from "./sheet/google/GoogleSheetReader.ts"
import * as PrintSheetWriter from "./sheet/print/PrintSheetWriter.ts"

const USAGE =
  "uso: pnpm start missing | pnpm start fill --dry-run [--only <nome>] [--sheet-csv <path>]"

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

// `--sheet-csv` reads a local export and needs no Google credentials; `--dry-run` alone
// reads the real sheet.
const sheetReader = (sheetCsv: Option.Option<string>) =>
  Option.match(sheetCsv, {
    onNone: () => GoogleSheetReader.layer,
    onSome: CsvSheetReader.layer,
  })

const dryRunFill = ({ only, sheetCsv }: FillArgs) =>
  Effect.gen(function* () {
    const outcomes = yield* Stream.runCollect(fill({ only }))
    for (const line of summaryLines(outcomes)) console.log(line)
    if (hasErrors(outcomes)) process.exitCode = 1
  }).pipe(
    Effect.provide(
      Layer.mergeAll(
        FileRaceList.layer,
        sheetReader(sheetCsv),
        PrintSheetWriter.layer,
        ProcessAgent.layer,
      ),
    ),
  )

const runFill = (args: ReadonlyArray<string>) =>
  Result.match(parseFillArgs(args), {
    onFailure: usageError,
    onSuccess: (args) =>
      args.dryRun
        ? dryRunFill(args)
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

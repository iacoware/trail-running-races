import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Console, Effect, Layer, Logger, Option, Result, Stream } from "effect"
import * as ProcessAgent from "./agent/process/ProcessAgent.ts"
import { fill } from "./commands/fill.ts"
import { parseFillArgs } from "./commands/fillArgs.ts"
import { missing } from "./commands/missing.ts"
import { hasErrors, summaryLines, type FilledLabel } from "./commands/summary.ts"
import * as FileRaceList from "./races/file/FileRaceList.ts"
import * as CsvSheetReader from "./sheet/csv/CsvSheetReader.ts"
import * as GoogleSheet from "./sheet/google/GoogleSheet.ts"
import * as PrintSheetWriter from "./sheet/print/PrintSheetWriter.ts"
import type { SheetReader } from "./sheet/SheetReader.ts"
import type { SheetWriter } from "./sheet/SheetWriter.ts"

const USAGE =
  "uso: pnpm start missing | pnpm start fill [--dry-run] [--only <nome>] [--sheet-csv <path>]"

// Warnings are meant for a person at the terminal: one plain line on stderr, no timestamps.
const stderrLogger = Logger.layer([
  Logger.make<unknown, void>(({ logLevel, message }) => {
    const label = logLevel === "Warn" ? "avviso" : logLevel.toLowerCase()
    // oxlint-disable-next-line effecttsgo/global-console -- this is the sink the Logger writes to
    console.error(`${label}: ${String(message)}`)
  }),
])

const usageError = (message: string) =>
  Effect.gen(function* () {
    yield* Console.error(`${message}\n${USAGE}`)
    process.exitCode = 1
  })

const printMissing = Effect.gen(function* () {
  const names = yield* missing
  for (const name of names) yield* Console.log(name)
}).pipe(Effect.provide(Layer.mergeAll(FileRaceList.layer, GoogleSheet.layer)))

// `--sheet-csv` reads a local export and needs no Google credentials; `--dry-run` alone
// reads the real sheet.
const dryRunSheet = (sheetCsv: Option.Option<string>) =>
  Layer.merge(
    Option.match(sheetCsv, { onNone: () => GoogleSheet.layer, onSome: CsvSheetReader.layer }),
    PrintSheetWriter.layer,
  )

const fillWith = <E, R>(
  only: Option.Option<string>,
  filled: FilledLabel,
  sheet: Layer.Layer<SheetReader | SheetWriter, E, R>,
) =>
  Effect.gen(function* () {
    const outcomes = yield* Stream.runCollect(fill({ only }))
    for (const line of summaryLines(outcomes, filled)) yield* Console.log(line)
    if (hasErrors(outcomes)) process.exitCode = 1
  }).pipe(Effect.provide(Layer.mergeAll(FileRaceList.layer, sheet, ProcessAgent.layer)))

const runFill = (args: ReadonlyArray<string>) =>
  Result.match(parseFillArgs(args), {
    onFailure: usageError,
    onSuccess: ({ dryRun, only, sheetCsv }) =>
      dryRun
        ? fillWith(only, "pianificate", dryRunSheet(sheetCsv))
        : fillWith(only, "inserite", GoogleSheet.layer),
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
    Effect.provide(Layer.mergeAll(NodeServices.layer, stderrLogger)),
    // Expected failures are reported as one tagged line; only defects reach runMain's reporter.
    Effect.catch((error) =>
      Effect.gen(function* () {
        yield* Console.error(`${error._tag}: ${error.message}`)
        process.exitCode = 1
      }),
    ),
  ),
)

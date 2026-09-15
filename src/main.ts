import { NodeRuntime, NodeServices } from "@effect/platform-node"
import { Console, Effect, Layer, Logger, Option, Result, Stream } from "effect"

import * as ProcessAgent from "./agent/process/ProcessAgent.ts"
import { CliCommand, parseArgs } from "./commands/cliArgs.ts"
import { fill } from "./commands/fill.ts"
import { missing } from "./commands/missing.ts"
import { hasErrors, summaryLines, type FilledLabel } from "./commands/summary.ts"
import * as FileRaceList from "./races/file/FileRaceList.ts"
import * as CsvSheetReader from "./sheet/csv/CsvSheetReader.ts"
import * as GoogleSheet from "./sheet/google/GoogleSheet.ts"
import * as PrintSheetWriter from "./sheet/print/PrintSheetWriter.ts"

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

const platformLayer = Layer.mergeAll(NodeServices.layer, stderrLogger)

const usageError = Effect.fn("usageError")(function* (message: string) {
    yield* Console.error(`${message}\n${USAGE}`)
    process.exitCode = 1
})

const missingLayer = Layer.mergeAll(FileRaceList.layer, GoogleSheet.readerLayer)

const fillLayer = Layer.mergeAll(FileRaceList.layer, GoogleSheet.layer, ProcessAgent.layer)

// `--sheet-csv` reads a local export and needs no Google credentials; `--dry-run` alone
// reads the real sheet.
const planLayer = (sheetCsv: Option.Option<string>) =>
    Layer.mergeAll(
        FileRaceList.layer,
        Option.match(sheetCsv, {
            onNone: () => GoogleSheet.readerLayer,
            onSome: CsvSheetReader.layer,
        }),
        PrintSheetWriter.layer,
        ProcessAgent.layer,
    )

const printMissing = Effect.gen(function* () {
    const names = yield* missing
    for (const name of names) yield* Console.log(name)
})

const printFillSummary = Effect.fn("printFillSummary")(function* (
    only: Option.Option<string>,
    filled: FilledLabel,
) {
    const results = yield* Stream.runCollect(fill({ only }))
    for (const line of summaryLines(results, filled)) yield* Console.log(line)
    if (hasErrors(results)) process.exitCode = 1
})

const run = (argv: ReadonlyArray<string>) => {
    const parsed = parseArgs(argv)
    if (Result.isFailure(parsed)) return usageError(parsed.failure)

    return CliCommand.$match(parsed.success, {
        Missing: () => printMissing.pipe(Effect.provide(missingLayer)),
        Fill: ({ only }) => printFillSummary(only, "inserite").pipe(Effect.provide(fillLayer)),
        Plan: ({ only, sheetCsv }) =>
            printFillSummary(only, "pianificate").pipe(Effect.provide(planLayer(sheetCsv))),
    })
}

NodeRuntime.runMain(
    run(process.argv.slice(2)).pipe(
        Effect.provide(platformLayer),
        Effect.catch((error) =>
            Effect.gen(function* () {
                yield* Console.error(`${error._tag}: ${error.message}`)
                process.exitCode = 1
            }),
        ),
    ) satisfies Effect.Effect<void, never>,
)

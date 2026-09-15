import { Data, Option, Result } from "effect"

export type CliCommand = Data.TaggedEnum<{
    Missing: {}
    Fill: { readonly only: Option.Option<string> }
    Plan: { readonly only: Option.Option<string>; readonly sheetCsv: Option.Option<string> }
}>

export const CliCommand = Data.taggedEnum<CliCommand>()

const unknownArgument = (arg: string | undefined) => `argomento non riconosciuto: ${arg}`

const valueAfter = (args: ReadonlyArray<string>, index: number) => {
    const value = args[index + 1]?.trim()
    return value === undefined || value === "" || value.startsWith("--")
        ? Option.none<string>()
        : Option.some(value)
}

const parseMissing = (args: ReadonlyArray<string>): Result.Result<CliCommand, string> =>
    args.length === 0 ? Result.succeed(CliCommand.Missing()) : Result.fail(unknownArgument(args[0]))

const parseFill = (args: ReadonlyArray<string>): Result.Result<CliCommand, string> => {
    let dryRun = false
    let only = Option.none<string>()
    let sheetCsv = Option.none<string>()
    for (let index = 0; index < args.length; index++) {
        const arg = args[index]
        if (arg === "--dry-run") {
            dryRun = true
        } else if (arg === "--only") {
            only = valueAfter(args, index)
            if (Option.isNone(only)) return Result.fail("--only richiede il nome di una gara")
            index++
        } else if (arg === "--sheet-csv") {
            sheetCsv = valueAfter(args, index)
            if (Option.isNone(sheetCsv))
                return Result.fail("--sheet-csv richiede il percorso di un CSV")
            index++
        } else {
            return Result.fail(unknownArgument(arg))
        }
    }
    // Reading a CSV copy of the sheet has no way to write back: it implies the dry run.
    return Result.succeed(
        dryRun || Option.isSome(sheetCsv)
            ? CliCommand.Plan({ only, sheetCsv })
            : CliCommand.Fill({ only }),
    )
}

export const parseArgs = ([subcommand, ...args]: ReadonlyArray<string>): Result.Result<
    CliCommand,
    string
> => {
    switch (subcommand) {
        case "missing":
            return parseMissing(args)
        case "fill":
            return parseFill(args)
        default:
            return Result.fail(`sottocomando mancante o sconosciuto: ${subcommand ?? ""}`.trim())
    }
}

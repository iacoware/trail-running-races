import { Option, Result } from "effect"

export type FillArgs = {
  readonly dryRun: boolean
  readonly only: Option.Option<string>
  readonly sheetCsv: Option.Option<string>
}

const valueAfter = (args: ReadonlyArray<string>, index: number) => {
  const value = args[index + 1]?.trim()
  return value === undefined || value === "" || value.startsWith("--")
    ? Option.none<string>()
    : Option.some(value)
}

export const parseFillArgs = (args: ReadonlyArray<string>): Result.Result<FillArgs, string> => {
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
      if (Option.isNone(sheetCsv)) return Result.fail("--sheet-csv richiede il percorso di un CSV")
      index++
    } else {
      return Result.fail(`argomento non riconosciuto: ${arg}`)
    }
  }
  // Reading a CSV copy of the sheet has no way to write back: it implies the dry run.
  return Result.succeed({ dryRun: dryRun || Option.isSome(sheetCsv), only, sheetCsv })
}

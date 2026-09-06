import { Option, Result } from "effect"

export type FillArgs = {
  readonly dryRun: boolean
  readonly only: Option.Option<string>
}

export const parseFillArgs = (args: ReadonlyArray<string>): Result.Result<FillArgs, string> => {
  let dryRun = false
  let only = Option.none<string>()
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === "--dry-run") {
      dryRun = true
    } else if (arg === "--only") {
      const name = args[index + 1]?.trim()
      if (name === undefined || name === "" || name.startsWith("--")) {
        return Result.fail("--only richiede il nome di una gara")
      }
      only = Option.some(name)
      index++
    } else {
      return Result.fail(`argomento non riconosciuto: ${arg}`)
    }
  }
  return Result.succeed({ dryRun, only })
}

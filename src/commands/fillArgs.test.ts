import { expect, test } from "vitest"
import { Option, Result } from "effect"
import { parseFillArgs } from "./fillArgs.ts"

test("reads --dry-run and --only with its name in any order", () => {
  expect(parseFillArgs(["--only", "Chianti UTMB", "--dry-run"])).toEqual(
    Result.succeed({ dryRun: true, only: Option.some("Chianti UTMB") }),
  )
  expect(parseFillArgs([])).toEqual(Result.succeed({ dryRun: false, only: Option.none() }))
})

test.each([[["--only"]], [["--only", "--dry-run"]], [["--only", " "]]])(
  "fails when --only has no name: %j",
  (args) => {
    const result = parseFillArgs(args)

    expect(Result.isFailure(result)).toBe(true)
  },
)

test("fails on an unknown argument", () => {
  const result = parseFillArgs(["--dry-run", "--sheet-csv", "x.csv"])

  expect(result).toEqual(Result.fail("argomento non riconosciuto: --sheet-csv"))
})

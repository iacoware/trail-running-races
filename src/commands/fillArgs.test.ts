import { Option, Result } from "effect"
import { expect, test } from "vitest"

import { parseFillArgs } from "./fillArgs.ts"

test("reads --dry-run and --only with its name in any order", () => {
    expect(parseFillArgs(["--only", "Chianti UTMB", "--dry-run"])).toEqual(
        Result.succeed({
            dryRun: true,
            only: Option.some("Chianti UTMB"),
            sheetCsv: Option.none(),
        }),
    )
    expect(parseFillArgs([])).toEqual(
        Result.succeed({ dryRun: false, only: Option.none(), sheetCsv: Option.none() }),
    )
})

test("reads --sheet-csv with its path and takes it as a dry run", () => {
    expect(parseFillArgs(["--sheet-csv", "fixtures/sheet.csv"])).toEqual(
        Result.succeed({
            dryRun: true,
            only: Option.none(),
            sheetCsv: Option.some("fixtures/sheet.csv"),
        }),
    )
})

test.each([[["--only"]], [["--only", "--dry-run"]], [["--only", " "]]])(
    "fails when --only has no name: %j",
    (args) => {
        expect(Result.isFailure(parseFillArgs(args))).toBe(true)
    },
)

test.each([[["--sheet-csv"]], [["--sheet-csv", "--only", "Gara"]]])(
    "fails when --sheet-csv has no path: %j",
    (args) => {
        expect(parseFillArgs(args)).toEqual(
            Result.fail("--sheet-csv richiede il percorso di un CSV"),
        )
    },
)

test("fails on an unknown argument", () => {
    expect(parseFillArgs(["--dry-run", "--verbose"])).toEqual(
        Result.fail("argomento non riconosciuto: --verbose"),
    )
})

import { Option, Result } from "effect"
import { expect, test } from "vitest"

import { CliCommand, parseArgs } from "./cliArgs.ts"

test("reads missing without arguments", () => {
    expect(parseArgs(["missing"])).toEqual(Result.succeed(CliCommand.Missing()))
})

test("fails when missing gets an argument", () => {
    expect(parseArgs(["missing", "--dry-run"])).toEqual(
        Result.fail("argomento non riconosciuto: --dry-run"),
    )
})

test.each([[[]], [["publish"]]])("fails on a missing or unknown subcommand: %j", (argv) => {
    expect(Result.isFailure(parseArgs(argv))).toBe(true)
})

test("reads fill without flags as a real fill", () => {
    expect(parseArgs(["fill"])).toEqual(Result.succeed(CliCommand.Fill({ only: Option.none() })))
})

test("reads --dry-run and --only with its name in any order as a plan", () => {
    expect(parseArgs(["fill", "--only", "Chianti UTMB", "--dry-run"])).toEqual(
        Result.succeed(
            CliCommand.Plan({ only: Option.some("Chianti UTMB"), sheetCsv: Option.none() }),
        ),
    )
})

test("reads --only without --dry-run as a real fill", () => {
    expect(parseArgs(["fill", "--only", "Chianti UTMB"])).toEqual(
        Result.succeed(CliCommand.Fill({ only: Option.some("Chianti UTMB") })),
    )
})

test("reads --sheet-csv with its path and takes it as a plan", () => {
    expect(parseArgs(["fill", "--sheet-csv", "fixtures/sheet.csv"])).toEqual(
        Result.succeed(
            CliCommand.Plan({ only: Option.none(), sheetCsv: Option.some("fixtures/sheet.csv") }),
        ),
    )
})

test.each([[["--only"]], [["--only", "--dry-run"]], [["--only", " "]]])(
    "fails when --only has no name: %j",
    (args) => {
        expect(Result.isFailure(parseArgs(["fill", ...args]))).toBe(true)
    },
)

test.each([[["--sheet-csv"]], [["--sheet-csv", "--only", "Gara"]]])(
    "fails when --sheet-csv has no path: %j",
    (args) => {
        expect(parseArgs(["fill", ...args])).toEqual(
            Result.fail("--sheet-csv richiede il percorso di un CSV"),
        )
    },
)

test("fails on an unknown fill argument", () => {
    expect(parseArgs(["fill", "--dry-run", "--verbose"])).toEqual(
        Result.fail("argomento non riconosciuto: --verbose"),
    )
})

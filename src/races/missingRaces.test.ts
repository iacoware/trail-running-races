import { Result } from "effect"
import { expect, test } from "vitest"

import { parseSheet } from "../sheet/parseSheet.ts"
import { missingRaces } from "./missingRaces.ts"

const header = ["Nome", "Data (+ o -)", "Luogo", "Da FI", "Tipo", "Distanze"]

const sheetWith = (...rows: ReadonlyArray<ReadonlyArray<string>>) =>
    Result.getOrThrow(parseSheet([header, ...rows]))

test("returns the names without a race row, in list order", () => {
    const sheet = sheetWith(["Toscana"], ["Chianti UTMB", "18-21 marzo"])

    const missing = missingRaces(["Nuova Gara", "Chianti UTMB", "Altra Gara"], sheet)

    expect(missing).toEqual(["Nuova Gara", "Altra Gara"])
})

test("matches a name written with different case and spacing than the sheet", () => {
    const sheet = sheetWith(["Toscana"], ["Chianti  UTMB", "18-21 marzo"])

    const missing = missingRaces(["chianti utmb"], sheet)

    expect(missing).toEqual([])
})

test("counts a race outside every section as present", () => {
    const sheet = sheetWith(["Toscana"], [], ["Orfana", "2 maggio"])

    const missing = missingRaces(["Orfana"], sheet)

    expect(missing).toEqual([])
})

test("does not count a section header as a race", () => {
    const sheet = sheetWith(["Toscana"])

    const missing = missingRaces(["Toscana"], sheet)

    expect(missing).toEqual(["Toscana"])
})

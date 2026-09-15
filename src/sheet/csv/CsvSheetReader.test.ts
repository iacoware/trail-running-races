import { NodeServices } from "@effect/platform-node"
import { expect, it } from "@effect/vitest"
import { Effect, Layer } from "effect"

import { readSheet } from "../readSheet.ts"
import * as CsvSheetReader from "./CsvSheetReader.ts"

const readFrom = (path: string) =>
    readSheet().pipe(Effect.provide(Layer.provide(CsvSheetReader.layer(path), NodeServices.layer)))

it.effect("reads the exported sheet with its sections and multi-line cells", () =>
    Effect.gen(function* () {
        const sheet = yield* readFrom("fixtures/sheet.csv")

        expect(sheet.sections.map((section) => section.name)).toEqual([
            "Toscana",
            "Resto di Italia",
            "Estero",
            "Da verificare",
        ])
        expect(sheet.sections[0]?.races.map((race) => race.cells.name)).toEqual([
            "Brunello Crossing",
            "Chianti UTMB",
            "Ultra trail Mugello",
        ])
        expect(sheet.sections[0]?.races[0]?.cells.distances).toContain("45km 1820m+")
    }),
)

it.effect("fails with a tagged error naming the missing file", () =>
    Effect.gen(function* () {
        const error = yield* Effect.flip(readFrom("fixtures/assente.csv"))

        expect(error._tag).toBe("SheetCsvError")
        expect(error.message).toContain("fixtures/assente.csv")
    }),
)

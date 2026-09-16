import { Effect, FileSystem, Layer } from "effect"

import { SheetCsvError } from "../errors.ts"
import { SheetReader } from "../SheetReader.ts"
import { parseCsv } from "./parseCsv.ts"

export const layer = (path: string) =>
    Layer.effect(
        SheetReader,
        Effect.gen(function* () {
            const fs = yield* FileSystem.FileSystem

            const rows = fs.readFileString(path).pipe(
                Effect.map(parseCsv),
                Effect.mapError((cause) =>
                    SheetCsvError.make({
                        path,
                        message: `foglio CSV non leggibile da ${path}: ${cause.message}`,
                        cause,
                    }),
                ),
            )

            return SheetReader.of({ rows })
        }),
    )

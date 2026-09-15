import { Effect, FileSystem, Layer } from "effect"

import { raceListConfig } from "../../config.ts"
import { RaceListError } from "../errors.ts"
import { parseRaceList, type DuplicateName } from "../parseRaceList.ts"
import { RaceList } from "../RaceList.ts"

const warnDuplicate = (path: string, duplicate: DuplicateName) =>
    Effect.logWarning(
        `${path} riga ${duplicate.line}: "${duplicate.name}" ripete la riga ${duplicate.firstLine}, tengo la prima`,
    )

export const layer = Layer.effect(
    RaceList,
    Effect.gen(function* () {
        const { path } = yield* raceListConfig
        const fs = yield* FileSystem.FileSystem

        const names = Effect.gen(function* () {
            const text = yield* fs.readFileString(path).pipe(
                Effect.mapError(
                    (cause) =>
                        new RaceListError({
                            path,
                            message: `elenco gare non leggibile da ${path}: ${cause.message}`,
                            cause,
                        }),
                ),
            )
            const list = parseRaceList(text)
            yield* Effect.forEach(list.duplicates, (duplicate) => warnDuplicate(path, duplicate))
            return list.names
        })

        return RaceList.of({ names })
    }),
)

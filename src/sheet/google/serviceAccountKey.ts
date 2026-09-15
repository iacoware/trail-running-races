import { Effect, FileSystem, Match, Redacted, Schema } from "effect"

import type { ServiceAccountSource } from "../../config.ts"
import { ServiceAccountKeyError } from "../errors.ts"

const ServiceAccountKey = Schema.Struct({
    client_email: Schema.String,
    private_key: Schema.String,
})

export type ServiceAccountKey = typeof ServiceAccountKey.Type

const decodeKey = Schema.decodeUnknownEffect(Schema.fromJsonString(ServiceAccountKey))

const readKeyFile = Effect.fn("readKeyFile")(function* (path: string) {
    const fs = yield* FileSystem.FileSystem
    return yield* fs.readFileString(path).pipe(
        Effect.mapError(
            (cause) =>
                new ServiceAccountKeyError({
                    message: `chiave del service account non leggibile da ${path}: ${cause.message}`,
                    cause,
                }),
        ),
    )
})

const describe = (source: ServiceAccountSource) =>
    Match.valueTags(source, {
        InlineJson: () => "GOOGLE_SERVICE_ACCOUNT_JSON inline",
        FilePath: ({ path }) => path,
    })

export const loadServiceAccountKey = Effect.fn("loadServiceAccountKey")(function* (
    source: ServiceAccountSource,
) {
    const json = yield* Match.valueTags(source, {
        InlineJson: ({ json }) => Effect.succeed(Redacted.value(json)),
        FilePath: ({ path }) => readKeyFile(path),
    })

    return yield* decodeKey(json).pipe(
        Effect.mapError(
            (cause) =>
                new ServiceAccountKeyError({
                    message: `chiave del service account non valida (${describe(source)}): ${cause.message}`,
                    cause,
                }),
        ),
    )
})

import { expect, it } from "@effect/vitest"
import { Effect, FileSystem, PlatformError, Redacted } from "effect"
import { loadServiceAccountKey } from "./serviceAccountKey.ts"

const keyJson = JSON.stringify({
  type: "service_account",
  client_email: "bot@project.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
})

const fileSystemWith = (files: Record<string, string>) =>
  FileSystem.layerNoop({
    readFileString: (path) =>
      path in files ? Effect.succeed(files[path] ?? "") : Effect.die(`unexpected read of ${path}`),
  })

it.effect("decodes the key from inline JSON", () =>
  Effect.gen(function* () {
    const key = yield* loadServiceAccountKey({ _tag: "InlineJson", json: Redacted.make(keyJson) })

    expect(key.client_email).toBe("bot@project.iam.gserviceaccount.com")
    expect(key.private_key).toContain("BEGIN PRIVATE KEY")
  }).pipe(Effect.provide(fileSystemWith({}))),
)

it.effect("decodes the key from a file path", () =>
  Effect.gen(function* () {
    const key = yield* loadServiceAccountKey({ _tag: "FilePath", path: "./key.json" })

    expect(key.client_email).toBe("bot@project.iam.gserviceaccount.com")
  }).pipe(Effect.provide(fileSystemWith({ "./key.json": keyJson }))),
)

it.effect("fails with ServiceAccountKeyError when the JSON lacks the private key", () =>
  Effect.gen(function* () {
    const error = yield* Effect.flip(
      loadServiceAccountKey({ _tag: "InlineJson", json: Redacted.make('{"client_email":"bot@x"}') }),
    )

    expect(error._tag).toBe("ServiceAccountKeyError")
    expect(error.message).toContain("private_key")
  }).pipe(Effect.provide(fileSystemWith({}))),
)

it.effect("fails with ServiceAccountKeyError naming the path when the file is unreadable", () =>
  Effect.gen(function* () {
    const error = yield* Effect.flip(
      loadServiceAccountKey({ _tag: "FilePath", path: "./missing.json" }).pipe(
        Effect.provide(
          FileSystem.layerNoop({
            readFileString: (path) =>
              Effect.fail(
                PlatformError.systemError({
                  _tag: "NotFound",
                  module: "FileSystem",
                  method: "readFileString",
                  pathOrDescriptor: path,
                }),
              ),
          }),
        ),
      ),
    )

    expect(error._tag).toBe("ServiceAccountKeyError")
    expect(error.message).toContain("./missing.json")
  }),
)

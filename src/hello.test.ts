import { expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { hello } from "./hello.ts"

it.effect("hello greets by name", () =>
  Effect.gen(function* () {
    const greeting = yield* hello("Effect")

    expect(greeting).toBe("Hello, Effect!")
  }),
)

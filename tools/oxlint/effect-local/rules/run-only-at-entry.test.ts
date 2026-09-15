import { RuleTester } from "oxlint/plugins-dev"

import { runOnlyAtEntryRule } from "./run-only-at-entry.ts"

new RuleTester().run("run-only-at-entry", runOnlyAtEntryRule, {
    valid: ["const program = Effect.provide(main, layer)", "const launched = Layer.launch(layer)"],
    invalid: [
        {
            code: "const done = Effect.runPromise(program)",
            errors: [{ messageId: "runOutsideEntry", data: { name: "Effect.runPromise" } }],
        },
        {
            code: "NodeRuntime.runMain(program)",
            errors: [{ messageId: "runOutsideEntry", data: { name: "NodeRuntime.runMain" } }],
        },
        {
            code: "const runtime = ManagedRuntime.make(layer)",
            errors: [{ messageId: "runOutsideEntry", data: { name: "ManagedRuntime.make" } }],
        },
        {
            code: "const run = Effect.runSync",
            errors: [{ messageId: "runOutsideEntry", data: { name: "Effect.runSync" } }],
        },
    ],
})

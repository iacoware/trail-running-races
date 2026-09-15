import { RuleTester } from "oxlint/plugins-dev"

import { preferEffectFnRule } from "./prefer-effect-fn.ts"

new RuleTester().run("prefer-effect-fn", preferEffectFnRule, {
    valid: [
        'const search = Effect.fn("search")(function* (name) { return yield* find(name) })',
        'const search = Effect.fn("search")(function* (name) { return yield* find(name) }, Effect.catch(toFailed))',
        "const loop = Effect.fnUntraced(function* () { return yield* step })",
        "const rows = Effect.gen(function* () { return yield* read })",
        'test("fills the row", () => Effect.gen(function* () { yield* fill }))',
        "const load = (path) => readFile(path).pipe(Effect.map(parse))",
    ],
    invalid: [
        {
            code: "const search = (name) => Effect.gen(function* () { return yield* find(name) })",
            errors: [{ messageId: "useEffectFn" }],
        },
        {
            code: "const search = (name) => Effect.gen(function* () { return yield* find(name) }).pipe(Effect.catch(toFailed))",
            errors: [{ messageId: "useEffectFn" }],
        },
        {
            code: "function search(name) { return Effect.gen(function* () { return yield* find(name) }) }",
            errors: [{ messageId: "useEffectFn" }],
        },
        {
            code: "const service = { search: (name) => Effect.gen(function* () { return yield* find(name) }) }",
            errors: [{ messageId: "useEffectFn" }],
        },
        {
            code: "const search = Effect.fn(function* (name) { return yield* find(name) })",
            errors: [{ messageId: "missingName" }],
        },
        {
            code: 'const search = Effect.fn("search")(function* (name) { return yield* find(name) }).pipe(Effect.catch(toFailed))',
            errors: [{ messageId: "pipeOnEffectFn" }],
        },
    ],
})

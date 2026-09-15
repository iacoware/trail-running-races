import { RuleTester } from "oxlint/plugins-dev"

import { noProvideOnDefinitionRule } from "./no-provide-on-definition.ts"

new RuleTester().run("no-provide-on-definition", noProvideOnDefinitionRule, {
    valid: [
        "const wired = printMissing.pipe(Effect.provide(missingLayer))",
        'const wired = printFillSummary(only, "inserite").pipe(Effect.provide(fillLayer))',
        "const wired = Effect.provide(program, appLayer)",
        "const program = Effect.gen(function* () {}).pipe(Effect.map(format))",
    ],
    invalid: [
        {
            code: "const printMissing = Effect.gen(function* () {}).pipe(Effect.provide(missingLayer))",
            errors: [{ messageId: "provideOnDefinition" }],
        },
        {
            code: "const printMissing = Effect.gen(function* () {}).pipe(Effect.map(format), Effect.provide(missingLayer))",
            errors: [{ messageId: "provideOnDefinition" }],
        },
        {
            code: 'const summary = Effect.fn("summary")(function* () {}, Effect.provide(fillLayer))',
            errors: [{ messageId: "provideOnDefinition" }],
        },
        {
            code: "const printMissing = Effect.provide(Effect.gen(function* () {}), missingLayer)",
            errors: [{ messageId: "provideOnDefinition" }],
        },
    ],
})

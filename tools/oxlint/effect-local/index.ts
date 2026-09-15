import { eslintCompatPlugin } from "@oxlint/plugins"

import { boundaryEntrypointShapeRule } from "./rules/boundary-entrypoint-shape.ts"
import { errorHandlingInEffectFnHandlerRule } from "./rules/error-handling-in-effect-fn-handler.ts"
import { noBareErrorInEffectRule } from "./rules/no-bare-error-in-effect.ts"
import { noEffectPromiseRule } from "./rules/no-effect-promise.ts"
import { noInlineYieldStarRule } from "./rules/no-inline-yield-star.ts"
import { noNestedMatchRule } from "./rules/no-nested-match.ts"
import { noParameterlessCatchAllRule } from "./rules/no-parameterless-catch-all.ts"
import { noProvideOnDefinitionRule } from "./rules/no-provide-on-definition.ts"
import { noTransportTypesInGeneratorRule } from "./rules/no-transport-types-in-generator.ts"
import { preferEffectFnRule } from "./rules/prefer-effect-fn.ts"
import { provideNamedLayerRule } from "./rules/provide-named-layer.ts"
import { redactedSecretNamesRule } from "./rules/redacted-secret-names.ts"
import { runOnlyAtEntryRule } from "./rules/run-only-at-entry.ts"
import { servicePortShapeOnlyRule } from "./rules/service-port-shape-only.ts"
import { singleStylePerFunctionRule } from "./rules/single-style-per-function.ts"
import { tryObjectFormRule } from "./rules/try-object-form.ts"
import { untracedRecursionRule } from "./rules/untraced-recursion.ts"

const effectLocalPlugin = eslintCompatPlugin({
    meta: { name: "effect-local" },
    rules: {
        "boundary-entrypoint-shape": boundaryEntrypointShapeRule,
        "error-handling-in-effect-fn-handler": errorHandlingInEffectFnHandlerRule,
        "no-bare-error-in-effect": noBareErrorInEffectRule,
        "no-effect-promise": noEffectPromiseRule,
        "no-inline-yield-star": noInlineYieldStarRule,
        "no-nested-match": noNestedMatchRule,
        "no-parameterless-catch-all": noParameterlessCatchAllRule,
        "no-provide-on-definition": noProvideOnDefinitionRule,
        "no-transport-types-in-generator": noTransportTypesInGeneratorRule,
        "prefer-effect-fn": preferEffectFnRule,
        "provide-named-layer": provideNamedLayerRule,
        "redacted-secret-names": redactedSecretNamesRule,
        "run-only-at-entry": runOnlyAtEntryRule,
        "service-port-shape-only": servicePortShapeOnlyRule,
        "single-style-per-function": singleStylePerFunctionRule,
        "try-object-form": tryObjectFormRule,
        "untraced-recursion": untracedRecursionRule,
    },
})

export default effectLocalPlugin

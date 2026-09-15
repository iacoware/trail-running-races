import { defineRule, type ESTree } from "@oxlint/plugins"

import { memberOf } from "../shared/effect-ast.ts"

const runtimeEntries: ReadonlyArray<readonly [string, string]> = [
  ["NodeRuntime", "runMain"],
  ["BunRuntime", "runMain"],
  ["ManagedRuntime", "make"],
]

const runnerName = (node: ESTree.MemberExpression) => {
  const effectMember = memberOf(node, "Effect")
  if (effectMember?.startsWith("run")) return `Effect.${effectMember}`
  const entry = runtimeEntries.find(([object, property]) => memberOf(node, object) === property)
  return entry === undefined ? undefined : `${entry[0]}.${entry[1]}`
}

// Reports references too, not only calls: `const run = Effect.runPromise` escapes nothing.
// The entry point is exempted by an `overrides` entry in .oxlintrc.json, not by an option.
export const runOnlyAtEntryRule = defineRule({
  meta: {
    type: "problem",
    docs: {
      description: "Run Effect programs only at the entry point.",
    },
    messages: {
      runOutsideEntry:
        "`{{name}}` runs an Effect program: only the entry point may do that. Tests use `it.effect`.",
    },
  },
  createOnce(context) {
    return {
      MemberExpression(node) {
        const name = runnerName(node)
        if (name !== undefined)
          context.report({ node, messageId: "runOutsideEntry", data: { name } })
      },
    }
  },
})

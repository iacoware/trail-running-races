import { defineRule, type ESTree } from "@oxlint/plugins"

import { isFunctionNode, memberOf, type FunctionNode } from "../shared/effect-ast.ts"

const modulesWithMatch = ["Option", "Result", "Exit", "Either"]

const isMatchCall = (node: ESTree.Node | null | undefined): node is ESTree.CallExpression => {
    if (node?.type !== "CallExpression") return false
    const { callee } = node
    if (modulesWithMatch.some((module) => memberOf(callee, module) === "match")) return true
    if (memberOf(callee, "Match") === "valueTags") return true
    return (
        callee.type === "MemberExpression" &&
        !callee.computed &&
        callee.property.type === "Identifier" &&
        callee.property.name === "$match"
    )
}

const returnedExpressions = (fn: FunctionNode): ReadonlyArray<ESTree.Node> => {
    if (fn.body?.type !== "BlockStatement") return fn.body ? [fn.body] : []
    return fn.body.body.flatMap((statement) =>
        statement.type === "ReturnStatement" && statement.argument ? [statement.argument] : [],
    )
}

// A handler that is itself a data-last match, or returns a match or a ternary, branches twice.
const nestedBranches = (handler: ESTree.Node): ReadonlyArray<ESTree.Node> => {
    if (isMatchCall(handler)) return [handler]
    if (!isFunctionNode(handler)) return []
    return returnedExpressions(handler).filter(
        (expression) => isMatchCall(expression) || expression.type === "ConditionalExpression",
    )
}

const handlersOf = (match: ESTree.CallExpression) =>
    match.arguments.flatMap((argument) =>
        argument.type === "ObjectExpression"
            ? argument.properties.flatMap((property) =>
                  property.type === "Property" ? [property.value] : [],
              )
            : [],
    )

export const noNestedMatchRule = defineRule({
    meta: {
        type: "suggestion",
        docs: {
            description:
                "Flatten a match whose handler branches again: guard the exit case first, then the happy path.",
        },
        messages: {
            nestedBranch:
                "This handler branches again inside a match. Return early on the exit case (`if (Result.isFailure(parsed)) return ...`) and keep the remaining branches at the top level.",
        },
    },
    createOnce(context) {
        return {
            CallExpression(node) {
                if (!isMatchCall(node)) return
                for (const branch of handlersOf(node).flatMap(nestedBranches)) {
                    context.report({ node: branch, messageId: "nestedBranch" })
                }
            },
        }
    },
})

import { defineRule, type ESTree, type SourceCode } from "@oxlint/plugins"

import { nearestFunction, type FunctionNode } from "../shared/effect-ast.ts"

const branchesOf = (expression: ESTree.Node): ReadonlyArray<ESTree.Node> =>
    expression.type === "ConditionalExpression"
        ? [...branchesOf(expression.consequent), ...branchesOf(expression.alternate)]
        : [expression]

// Checked against the annotation, an object literal gets excess property errors that an
// inferred type would skip.
const returnsOnlyObjectLiterals = (branches: ReadonlyArray<ESTree.Node>) =>
    branches.length > 0 && branches.every((branch) => branch.type === "ObjectExpression")

// Without type information, branches built differently (`Result.fail` and `Result.succeed`,
// two error classes) stand in for an inferred union that the annotation folds into one type.
const returnsDifferentShapes = (branches: ReadonlyArray<ESTree.Node>, sourceCode: SourceCode) => {
    const shapeOf = (branch: ESTree.Node) => {
        if (branch.type === "CallExpression" || branch.type === "NewExpression") {
            return `${branch.type} ${sourceCode.getText(branch.callee)}`
        }
        const isAbsent =
            (branch.type === "Identifier" && branch.name === "undefined") ||
            (branch.type === "Literal" && branch.value === null)
        return isAbsent ? "absent" : branch.type
    }
    return new Set(branches.map(shapeOf)).size > 1
}

// Inference widens `'Italia'` to `string` and `[]` to `never[]`: here the annotation is the type.
const isWidened = (branch: ESTree.Node) =>
    (branch.type === "Literal" &&
        (typeof branch.value === "string" || typeof branch.value === "number")) ||
    (branch.type === "TemplateLiteral" && branch.expressions.length === 0) ||
    (branch.type === "ArrayExpression" && branch.elements.length === 0)

// Inference types an array literal as a mutable array: `ReadonlyArray` there is a choice.
const isReadonlyArrayOfLiterals = (
    annotation: ESTree.TSType,
    branches: ReadonlyArray<ESTree.Node>,
) =>
    ((annotation.type === "TSTypeReference" &&
        annotation.typeName.type === "Identifier" &&
        annotation.typeName.name === "ReadonlyArray") ||
        (annotation.type === "TSTypeOperator" && annotation.operator === "readonly")) &&
    branches.length > 0 &&
    branches.every((branch) => branch.type === "ArrayExpression")

const isInside = (node: ESTree.Node, ancestor: ESTree.Node) => {
    for (let current = node.parent; current; current = current.parent) {
        if (current === ancestor) return true
    }
    return false
}

// TypeScript cannot infer the return type of a function that calls itself: it falls back to
// `any` and asks for the annotation.
const isRecursive = (node: FunctionNode, sourceCode: SourceCode) => {
    const declaration = node.type === "FunctionDeclaration" ? node : node.parent
    if (declaration?.type !== "FunctionDeclaration" && declaration?.type !== "VariableDeclarator") {
        return false
    }
    return sourceCode
        .getDeclaredVariables(declaration)
        .some((variable) =>
            variable.references.some((reference) => isInside(reference.identifier, node)),
        )
}

export const noRedundantReturnTypeRule = defineRule({
    meta: {
        type: "suggestion",
        docs: {
            description:
                "Let inference type what a function returns: an annotation that repeats it has to be fixed by hand on every refactoring.",
        },
        hasSuggestions: true,
        messages: {
            redundantReturnType:
                "Remove the return type annotation: inference already produces this type.",
            removeReturnType: "Remove the return type annotation.",
        },
    },
    createOnce(context) {
        const returned = new Map<FunctionNode, Array<ESTree.Node>>()

        const collect = (node: ESTree.ReturnStatement) => {
            const fn = nearestFunction(node)
            if (fn === undefined || node.argument === null) return
            returned.set(fn, [...(returned.get(fn) ?? []), node.argument])
        }

        const check = (node: FunctionNode) => {
            const statements = returned.get(node) ?? []
            returned.delete(node)
            if (!node.returnType || node.returnType.typeAnnotation.type === "TSTypePredicate") {
                return
            }
            const expressions =
                node.body?.type === "BlockStatement" ? statements : node.body ? [node.body] : []
            const branches = expressions.flatMap(branchesOf)
            if (returnsOnlyObjectLiterals(branches)) return
            if (returnsDifferentShapes(branches, context.sourceCode)) return
            if (branches.some(isWidened)) return
            if (isReadonlyArrayOfLiterals(node.returnType.typeAnnotation, branches)) return
            if (isRecursive(node, context.sourceCode)) return
            const { returnType } = node
            // A suggestion, not a fix: the inferred type can still differ in ways the heuristics
            // above miss, so each removal waits for the typecheck.
            context.report({
                node: returnType,
                messageId: "redundantReturnType",
                suggest: [
                    {
                        messageId: "removeReturnType",
                        fix: (fixer) => fixer.remove(returnType),
                    },
                ],
            })
        }

        return {
            ReturnStatement: collect,
            "ArrowFunctionExpression:exit": check,
            "FunctionDeclaration:exit": check,
            "FunctionExpression:exit": check,
        }
    },
})

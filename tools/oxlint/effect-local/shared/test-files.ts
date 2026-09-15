import { matchesGlob, relative, sep } from "node:path"

// `src/testing/` helpers are not matched on purpose: they are support code, not tests.
export const defaultTestFiles = [
    "**/*.test.*",
    "**/*.spec.*",
    "**/__tests__/**",
    "**/test/**",
    "**/tests/**",
]

export const testFilesSchema = { type: "array", items: { type: "string" }, uniqueItems: true }

type FileContext = {
    readonly filename: string
    readonly cwd: string
    readonly options: ReadonlyArray<unknown>
}

const configuredTestFiles = (options: ReadonlyArray<unknown>): ReadonlyArray<string> => {
    const [first] = options
    if (typeof first !== "object" || first === null || !("testFiles" in first)) {
        return defaultTestFiles
    }
    const patterns = first.testFiles
    return Array.isArray(patterns) ? patterns.filter((pattern) => typeof pattern === "string") : []
}

// Globs match the path relative to the working directory, with `/` on every platform.
export const isTestFile = (context: FileContext) => {
    const path = relative(context.cwd, context.filename).split(sep).join("/")
    return configuredTestFiles(context.options).some((pattern) => matchesGlob(path, pattern))
}

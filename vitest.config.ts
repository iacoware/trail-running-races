import { configDefaults, defineConfig } from "vitest/config"

// I test delle regole oxlint in tools/ girano col RuleTester di oxlint, non con Vitest.
export default defineConfig({
    test: {
        exclude: [...configDefaults.exclude, "tools/**"],
    },
})

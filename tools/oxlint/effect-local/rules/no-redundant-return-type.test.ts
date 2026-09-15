import { RuleTester } from "oxlint/plugins-dev"

import { noRedundantReturnTypeRule } from "./no-redundant-return-type.ts"

new RuleTester({ languageOptions: { parserOptions: { lang: "ts" } } }).run(
    "no-redundant-return-type",
    noRedundantReturnTypeRule,
    {
        valid: [
            "const next = (count: number) => count + 1",
            "const isText = (value: unknown): value is string => typeof value === 'string'",
            "function assertText(value: unknown): asserts value is string { check(value) }",
            "function parse(text: string): number; function parse(text: string, radix: number): number; function parse(text: string, radix?: number) { return Number.parseInt(text, radix) }",
            "declare function parse(text: string): number",
            "abstract class Reader { abstract read(): string }",
            "const race = (over: Partial<Race> = {}): Race => ({ name: 'Tor', ...over })",
            "function cellsOf(row: Row): Cells { if (row.length === 0) return { name: '' }; return { name: row[0] } }",
            "const parse = (text: string): Result.Result<Row, ParseError> => { if (text === '') return Result.fail(new ParseError()); return Result.succeed(rowOf(text)) }",
            "const source = (value: string): Source => value.startsWith('{') ? Source.Inline({ json: value }) : Source.File({ path: value })",
            "const toError = (cause: unknown): CallError => { if (isAuth(cause)) return new AuthError({ cause }); return new ApiError({ cause }) }",
            "const find = (rows: ReadonlyArray<Row>): Row | undefined => { for (const row of rows) if (row.ok) return row; return undefined }",
            "function total(node: Tree): number { return node.value + sum(node.children.map(total)) }",
            "const total = (node: Tree): number => node.value + sum(node.children.map((child) => total(child)))",
            "const region = (italian: boolean): 'Italia' | 'Estero' => { if (italian) return 'Italia'; return 'Estero' }",
            "const noRows = (): ReadonlyArray<Row> => []",
            "const lines = (race: Race): ReadonlyArray<string> => [`== ${race.name}`, ...details(race)]",
            "const pair = (race: Race): readonly string[] => { if (race.url === '') return [race.name]; return [race.name, race.url] }",
        ],
        invalid: [
            {
                code: "const next = (count: number): number => count + 1",
                errors: [
                    {
                        messageId: "redundantReturnType",
                        suggestions: [
                            {
                                messageId: "removeReturnType",
                                output: "const next = (count: number) => count + 1",
                            },
                        ],
                    },
                ],
            },
            {
                code: "const insertionAt = (section: Section): Insertion => { let insertion = first(section); for (const race of section.races) { if (race.late) return insertion; insertion = after(race) } return insertion }",
                errors: [{ messageId: "redundantReturnType" }],
            },
            {
                code: "const label = (race: Race): string => race.name === '' ? format(race.url) : format(race.name)",
                errors: [{ messageId: "redundantReturnType" }],
            },
        ],
    },
)

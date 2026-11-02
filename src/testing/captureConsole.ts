import { Console } from "effect"

// Console has many members; only log is captured, the rest fall back to the real console.
export const consoleInto = (output: Array<string>): Console.Console =>
    Object.assign(Object.create(console), {
        log: (...args: ReadonlyArray<unknown>) => void output.push(args.map(String).join(" ")),
    })

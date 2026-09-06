import { Effect } from "effect"

export const hello = (name: string) => Effect.succeed(`Hello, ${name}!`)

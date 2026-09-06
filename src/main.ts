import { NodeRuntime } from "@effect/platform-node"
import { Effect } from "effect"
import { hello } from "./hello.ts"

NodeRuntime.runMain(Effect.map(hello("trail-running-races"), (greeting) => console.log(greeting)))

import { fileURLToPath } from "node:url"

import { NodeServices } from "@effect/platform-node"
import { expect, it } from "@effect/vitest"
import { ConfigProvider, Effect, Layer } from "effect"

import { Agent } from "../Agent.ts"
import * as ProcessAgent from "./ProcessAgent.ts"

const FAKE_AGENT = fileURLToPath(new URL("../../testing/fakeAgent.ts", import.meta.url))

const layerWith = (mode: string, env: Record<string, string> = {}) =>
  ProcessAgent.layer.pipe(
    Layer.provide(NodeServices.layer),
    Layer.provide(
      ConfigProvider.layer(
        ConfigProvider.fromUnknown({ AGENT_CMD: `node ${FAKE_AGENT} ${mode}`, ...env }),
      ),
    ),
  )

const search = (name: string) => Effect.flatMap(Agent, (agent) => agent.search(name))

const failure = (name: string) => Effect.flip(search(name))

// Real child processes and a real timeout need the wall clock, hence it.live over it.effect.
it.live("sends the prompt with the race name in place of the placeholder on stdin", () =>
  Effect.gen(function* () {
    const card = yield* search("Chianti UTMB")

    expect(card.esito).toBe("ambigua")
    if (card.esito !== "ambigua") return
    expect(card.candidati[0]).toContain("Gara da cercare: Chianti UTMB")
    expect(card.candidati[0]).not.toContain("{{nome}}")
  }).pipe(Effect.provide(layerWith("echo-prompt"))),
)

it.live("decodes the card even when the agent wraps the JSON in prose and fences", () =>
  Effect.gen(function* () {
    const card = yield* search("Chianti UTMB")

    expect(card.esito).toBe("trovata")
    if (card.esito !== "trovata") return
    expect(card.url).toBe("https://www.esempio.it")
    expect(card.data).toBe("18-21 marzo")
  }).pipe(Effect.provide(layerWith("card"))),
)

it.live("fails with AgentInvalidOutput when the agent prints text without JSON", () =>
  Effect.gen(function* () {
    const error = yield* failure("Chianti UTMB")

    expect(error._tag).toBe("AgentInvalidOutput")
    expect(error.race).toBe("Chianti UTMB")
  }).pipe(Effect.provide(layerWith("text"))),
)

it.live("fails with AgentTimeout after AGENT_TIMEOUT seconds", () =>
  Effect.gen(function* () {
    const error = yield* failure("Chianti UTMB")

    expect(error._tag).toBe("AgentTimeout")
    expect(error.message).toContain("1s")
  }).pipe(Effect.provide(layerWith("sleep", { AGENT_TIMEOUT: "1" }))),
)

it.live("fails with AgentProcessError carrying stderr when the agent exits non-zero", () =>
  Effect.gen(function* () {
    const error = yield* failure("Chianti UTMB")

    expect(error._tag).toBe("AgentProcessError")
    expect(error.message).toContain("exit code 2")
    expect(error.message).toContain("boom")
  }).pipe(Effect.provide(layerWith("fail"))),
)

it.live("fails with AgentProcessError when AGENT_CMD cannot be spawned", () =>
  Effect.gen(function* () {
    const error = yield* failure("Chianti UTMB")

    expect(error._tag).toBe("AgentProcessError")
    expect(error.message).toContain("no-such-agent-xyz")
  }).pipe(Effect.provide(layerWith("card", { AGENT_CMD: "no-such-agent-xyz --flag" }))),
)

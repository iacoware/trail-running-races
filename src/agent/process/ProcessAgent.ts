import { fileURLToPath } from "node:url"

import { Duration, Effect, FileSystem, Layer, type PlatformError, Stream } from "effect"
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process"

import { agentConfig } from "../../config.ts"
import { Agent } from "../Agent.ts"
import { AgentProcessError, AgentTimeout, PromptFileError } from "../errors.ts"
import { parseAgentOutput } from "../parseAgentOutput.ts"
import { REGIONS } from "../RaceCard.ts"

const PROMPT_PATH = fileURLToPath(new URL("../../../prompt.md", import.meta.url))
const NAME_PLACEHOLDER = "{{nome}}"
const REGIONS_PLACEHOLDER = "{{regioni}}"
const REGIONS_TEXT = REGIONS.map((region) => `\`${region}\``).join(", ")

const readPromptTemplate = Effect.fn("readPromptTemplate")(function* () {
    const fs = yield* FileSystem.FileSystem
    return yield* fs.readFileString(PROMPT_PATH).pipe(
        Effect.mapError((cause) =>
            PromptFileError.make({
                path: PROMPT_PATH,
                message: `prompt non leggibile da ${PROMPT_PATH}: ${cause.message}`,
                cause,
            }),
        ),
    )
})

// AGENT_CMD is split on whitespace only: no quoting, as tech-choices § Effect 4 asks for
// the array form rather than a shell.
const splitCommand = (command: string) => {
    const [executable = "", ...args] = command.split(/\s+/)
    return { executable, args }
}

const collectText = (stream: Stream.Stream<Uint8Array, PlatformError.PlatformError>) =>
    Stream.mkString(Stream.decodeText(stream))

export const layer = Layer.effect(
    Agent,
    Effect.gen(function* () {
        const { command, timeoutSeconds } = yield* agentConfig
        const { executable, args } = splitCommand(command)
        const spawner = yield* ChildProcessSpawner.ChildProcessSpawner
        // The closed region list lives in the Schema; the prompt receives it so the two never drift.
        const promptTemplate = yield* readPromptTemplate()
        const template = promptTemplate.replaceAll(REGIONS_PLACEHOLDER, REGIONS_TEXT)

        const run = Effect.fn("run")(
            function* (name: string) {
                const prompt = template.replaceAll(NAME_PLACEHOLDER, name)
                const handle = yield* spawner.spawn(
                    ChildProcess.make(executable, args, {
                        stdin: Stream.make(prompt).pipe(Stream.encodeText),
                    }),
                )
                const [stdout, stderr] = yield* Effect.all(
                    [collectText(handle.stdout), collectText(handle.stderr)],
                    { concurrency: "unbounded" },
                )
                const exitCode = yield* handle.exitCode
                if (exitCode !== 0) {
                    return yield* AgentProcessError.make({
                        race: name,
                        message: `agente terminato con exit code ${exitCode}: ${stderr.trim()}`,
                    })
                }
                return yield* Effect.fromResult(parseAgentOutput(name, stdout))
            },
            Effect.scoped,
            (effect, name) =>
                effect.pipe(
                    Effect.catchTag("PlatformError", (cause) =>
                        AgentProcessError.make({
                            race: name,
                            message: `agente non eseguibile (${command}): ${cause.message}`,
                            cause,
                        }),
                    ),
                ),
        )

        const search = (name: string) =>
            run(name).pipe(
                Effect.timeoutOrElse({
                    duration: Duration.seconds(timeoutSeconds),
                    orElse: () =>
                        AgentTimeout.make({
                            race: name,
                            seconds: timeoutSeconds,
                            message: `agente senza risposta entro ${timeoutSeconds}s`,
                        }),
                }),
            )

        return Agent.of({ search })
    }),
)

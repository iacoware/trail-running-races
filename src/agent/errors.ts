import { Schema } from "effect"

export class AgentTimeout extends Schema.TaggedError<AgentTimeout>()("AgentTimeout", {
    race: Schema.String,
    seconds: Schema.Int,
    message: Schema.String,
}) {}

export class AgentInvalidOutput extends Schema.TaggedError<AgentInvalidOutput>()(
    "AgentInvalidOutput",
    { race: Schema.String, output: Schema.String, message: Schema.String },
) {}

export class AgentProcessError extends Schema.TaggedError<AgentProcessError>()(
    "AgentProcessError",
    { race: Schema.String, message: Schema.String, cause: Schema.optionalKey(Schema.Defect()) },
) {}

export type AgentError = AgentTimeout | AgentInvalidOutput | AgentProcessError

export class PromptFileError extends Schema.TaggedError<PromptFileError>()("PromptFileError", {
    path: Schema.String,
    message: Schema.String,
    cause: Schema.Defect(),
}) {}

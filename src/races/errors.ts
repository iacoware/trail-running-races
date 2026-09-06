import { Schema } from "effect"

export class RaceListError extends Schema.TaggedError<RaceListError>()("RaceListError", {
  path: Schema.String,
  message: Schema.String,
  cause: Schema.Defect(),
}) {}

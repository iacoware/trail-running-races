import { Schema } from "effect"

export class UnparsableDateError extends Schema.TaggedError<UnparsableDateError>()(
  "UnparsableDateError",
  { race: Schema.String, date: Schema.String, message: Schema.String },
) {}

export type PlanError = UnparsableDateError

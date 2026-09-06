import { Schema } from "effect"

export class SectionMissingError extends Schema.TaggedError<SectionMissingError>()(
  "SectionMissingError",
  { race: Schema.String, section: Schema.String, message: Schema.String },
) {}

export class UnparsableDateError extends Schema.TaggedError<UnparsableDateError>()(
  "UnparsableDateError",
  { race: Schema.String, date: Schema.String, message: Schema.String },
) {}

export type PlanError = SectionMissingError | UnparsableDateError

import { Schema } from "effect"

export class ServiceAccountKeyError extends Schema.TaggedError<ServiceAccountKeyError>()(
  "ServiceAccountKeyError",
  { message: Schema.String, cause: Schema.Defect() },
) {}

export class SheetAuthError extends Schema.TaggedError<SheetAuthError>()("SheetAuthError", {
  spreadsheetId: Schema.String,
  message: Schema.String,
  cause: Schema.Defect(),
}) {}

export class SheetNotFoundError extends Schema.TaggedError<SheetNotFoundError>()(
  "SheetNotFoundError",
  { spreadsheetId: Schema.String, message: Schema.String, cause: Schema.Defect() },
) {}

export class SheetTabNotFoundError extends Schema.TaggedError<SheetTabNotFoundError>()(
  "SheetTabNotFoundError",
  { spreadsheetId: Schema.String, message: Schema.String },
) {}

export class SheetApiError extends Schema.TaggedError<SheetApiError>()("SheetApiError", {
  spreadsheetId: Schema.String,
  message: Schema.String,
  cause: Schema.Defect(),
}) {}

export type SheetReadError =
  | SheetAuthError
  | SheetNotFoundError
  | SheetTabNotFoundError
  | SheetApiError
  | SheetCsvError

export type SheetWriteError =
  SheetAuthError | SheetNotFoundError | SheetTabNotFoundError | SheetApiError

export class SheetColumnMissingError extends Schema.TaggedError<SheetColumnMissingError>()(
  "SheetColumnMissingError",
  { column: Schema.String, message: Schema.String },
) {}

export class SheetCsvError extends Schema.TaggedError<SheetCsvError>()("SheetCsvError", {
  path: Schema.String,
  message: Schema.String,
  cause: Schema.Defect(),
}) {}

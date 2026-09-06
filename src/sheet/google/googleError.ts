import { Predicate } from "effect"
import { SheetApiError, SheetAuthError, SheetNotFoundError } from "../errors.ts"

const statusOf = (cause: unknown) =>
  Predicate.hasProperty(cause, "status") && Predicate.isNumber(cause.status)
    ? cause.status
    : undefined

const codeOf = (cause: unknown) =>
  Predicate.hasProperty(cause, "code") && Predicate.isString(cause.code) ? cause.code : ""

const messageOf = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause))

// Google rejects a wrong service account email with HTTP 400 `invalid_grant`, and a
// corrupted private key fails locally in OpenSSL before any request is sent.
const isAuthFailure = (status: number | undefined, code: string, message: string) =>
  status === 401 ||
  status === 403 ||
  message.startsWith("invalid_grant") ||
  code.startsWith("ERR_OSSL")

export const toSheetError =
  (spreadsheetId: string) =>
  (cause: unknown): SheetAuthError | SheetNotFoundError | SheetApiError => {
    const status = statusOf(cause)
    const message = messageOf(cause)

    if (isAuthFailure(status, codeOf(cause), message)) {
      return new SheetAuthError({
        spreadsheetId,
        message: `accesso al foglio ${spreadsheetId} negato: ${message}`,
        cause,
      })
    }
    if (status === 404) {
      return new SheetNotFoundError({
        spreadsheetId,
        message: `foglio ${spreadsheetId} non trovato: ${message}`,
        cause,
      })
    }
    return new SheetApiError({
      spreadsheetId,
      message: `errore Google Sheets sul foglio ${spreadsheetId}: ${message}`,
      cause,
    })
  }

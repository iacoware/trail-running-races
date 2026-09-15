import { expect, test } from "vitest"

import { toSheetError } from "./googleError.ts"

const gaxiosError = (status: number, message: string) =>
    Object.assign(new Error(message), { status, code: status })

const mapError = toSheetError("sheet-1")

test("maps a 404 to SheetNotFoundError naming the spreadsheet", () => {
    const error = mapError(gaxiosError(404, "Requested entity was not found."))

    expect(error._tag).toBe("SheetNotFoundError")
    expect(error.message).toContain("sheet-1")
})

test.each([401, 403])("maps a %i to SheetAuthError", (status) => {
    const error = mapError(gaxiosError(status, "The caller does not have permission"))

    expect(error._tag).toBe("SheetAuthError")
    expect(error.message).toContain("The caller does not have permission")
})

test("maps an invalid_grant rejection to SheetAuthError", () => {
    const error = mapError(gaxiosError(400, "invalid_grant: Invalid grant: account not found"))

    expect(error._tag).toBe("SheetAuthError")
})

test("maps an OpenSSL decoder failure on the private key to SheetAuthError", () => {
    const error = mapError(
        Object.assign(new Error("error:1E08010C:DECODER routines::unsupported"), {
            code: "ERR_OSSL_UNSUPPORTED",
        }),
    )

    expect(error._tag).toBe("SheetAuthError")
})

test("maps any other rejection to SheetApiError keeping its message", () => {
    const error = mapError(gaxiosError(500, "Backend Error"))

    expect(error._tag).toBe("SheetApiError")
    expect(error.message).toContain("Backend Error")
})

test("maps a non-Error rejection to SheetApiError", () => {
    const error = mapError("boom")

    expect(error._tag).toBe("SheetApiError")
    expect(error.message).toContain("boom")
})

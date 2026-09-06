import { Result } from "effect"
import { raceKey } from "../races/raceKey.ts"
import { SheetColumnMissingError } from "./errors.ts"
import type { Row } from "./SheetReader.ts"

export type ColumnKey = "name" | "date" | "place" | "fromFlorence" | "type" | "distances"

export type Columns = Readonly<Record<ColumnKey, number>>

export type Cells = Readonly<Record<ColumnKey, string>>

// Headers are matched by prefix so that `Data` finds `Data (+ o -)`.
const COLUMN_HEADERS: Readonly<Record<ColumnKey, string>> = {
  name: "Nome",
  date: "Data",
  place: "Luogo",
  fromFlorence: "Da FI",
  type: "Tipo",
  distances: "Distanze",
}

export const COLUMN_KEYS: ReadonlyArray<ColumnKey> = [
  "name",
  "date",
  "place",
  "fromFlorence",
  "type",
  "distances",
]

const findColumn = (header: Row, key: ColumnKey) => {
  const label = COLUMN_HEADERS[key]
  const index = header.findIndex((cell) => raceKey(cell).startsWith(raceKey(label)))
  return index === -1
    ? Result.fail(
        new SheetColumnMissingError({
          column: label,
          message: `colonna ${label} non trovata nell'header del foglio: ${header.join(", ")}`,
        }),
      )
    : Result.succeed(index)
}

export const resolveColumns = (header: Row): Result.Result<Columns, SheetColumnMissingError> =>
  Result.all({
    name: findColumn(header, "name"),
    date: findColumn(header, "date"),
    place: findColumn(header, "place"),
    fromFlorence: findColumn(header, "fromFlorence"),
    type: findColumn(header, "type"),
    distances: findColumn(header, "distances"),
  })

// The API drops trailing empty cells, so a short row is a row with blanks at the end.
export const cellsOf = (columns: Columns, row: Row): Cells => ({
  name: row[columns.name] ?? "",
  date: row[columns.date] ?? "",
  place: row[columns.place] ?? "",
  fromFlorence: row[columns.fromFlorence] ?? "",
  type: row[columns.type] ?? "",
  distances: row[columns.distances] ?? "",
})

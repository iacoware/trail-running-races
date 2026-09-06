import { Effect, Layer, Option } from "effect"
import type { PlannedRow } from "../../plan/planRow.ts"
import { COLUMN_HEADERS, COLUMN_KEYS } from "../columns.ts"
import { SheetWriter } from "../SheetWriter.ts"

// A multi-line cell keeps its lines, indented under the value so the cell reads as one block.
const cellLines = (label: string, value: string) => {
  const [first = "", ...rest] = value.split("\n")
  const indent = " ".repeat(label.length + 2)
  return [`${label}: ${first}`.trimEnd(), ...rest.map((line) => `${indent}${line}`)]
}

const position = (planned: PlannedRow) =>
  Option.match(planned.after, {
    onNone: () => "in testa alla sezione",
    onSome: (name) => `dopo ${name}`,
  })

const sectionCreation = (planned: PlannedRow) =>
  planned.sectionAction._tag === "UseExistingSection"
    ? []
    : [
        `crea ${planned.section}: riga vuota ${planned.sectionAction.separatorRow}, ` +
          `intestazione in grassetto ${planned.sectionAction.headerRow}`,
      ]

export const describePlan = (planned: PlannedRow): ReadonlyArray<string> => [
  `== ${planned.name}`,
  ...sectionCreation(planned),
  `${planned.section}, riga ${planned.row}, ${position(planned)}`,
  ...COLUMN_KEYS.flatMap((key) => cellLines(COLUMN_HEADERS[key], planned.cells[key])),
]

export const layer = Layer.succeed(
  SheetWriter,
  SheetWriter.of({
    insert: (planned) =>
      Effect.sync(() => {
        for (const line of describePlan(planned)) console.log(line)
      }),
  }),
)

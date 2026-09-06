import { Option } from "effect"

export type DayOfYear = {
  readonly day: number
  readonly month: number
}

const MONTHS = [
  "gennaio",
  "febbraio",
  "marzo",
  "aprile",
  "maggio",
  "giugno",
  "luglio",
  "agosto",
  "settembre",
  "ottobre",
  "novembre",
  "dicembre",
]

// Deliberately small Italian grammar, without year, the three forms of tech-choices § Parser:
// "2 maggio", "20-21 febbraio", "28 febbraio-1 marzo".
const DAY = "\\d{1,2}"
const MONTH = "[a-zà-ù]+"
const GRAMMAR = new RegExp(
  `^(?<day>${DAY})(?:-(?<endDay>${DAY}))?\\s+(?<month>${MONTH})` +
    `(?:-(?<crossDay>${DAY})\\s+(?<endMonth>${MONTH}))?$`,
  "i",
)

const isDay = (text: string | undefined) =>
  text === undefined || (Number(text) >= 1 && Number(text) <= 31)

const isMonth = (text: string | undefined) =>
  text === undefined || MONTHS.includes(text.toLowerCase())

export const parseDate = (text: string): Option.Option<DayOfYear> => {
  const groups = GRAMMAR.exec(text.trim())?.groups
  if (groups === undefined) return Option.none()
  const { day = "", endDay, month = "", crossDay, endMonth } = groups
  const valid = [day, endDay, crossDay].every(isDay) && [month, endMonth].every(isMonth)
  return valid
    ? Option.some({ day: Number(day), month: MONTHS.indexOf(month.toLowerCase()) + 1 })
    : Option.none()
}

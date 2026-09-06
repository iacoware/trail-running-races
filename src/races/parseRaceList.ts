import { raceKey, type RaceKey } from "./raceKey.ts"

export type DuplicateName = {
  readonly line: number
  readonly name: string
  readonly firstLine: number
}

export type ParsedRaceList = {
  readonly names: ReadonlyArray<string>
  readonly duplicates: ReadonlyArray<DuplicateName>
}

const isSkipped = (line: string) => line === "" || line.startsWith("#")

export const parseRaceList = (text: string): ParsedRaceList => {
  const names: Array<string> = []
  const duplicates: Array<DuplicateName> = []
  const firstLineByKey = new Map<RaceKey, number>()

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const name = rawLine.trim()
    if (isSkipped(name)) return
    const line = index + 1
    const key = raceKey(name)
    const firstLine = firstLineByKey.get(key)
    if (firstLine !== undefined) {
      duplicates.push({ line, name, firstLine })
      return
    }
    firstLineByKey.set(key, line)
    names.push(name)
  })

  return { names, duplicates }
}

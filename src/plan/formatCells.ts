import type { Distance, FoundRace } from "../agent/RaceCard.ts"
import type { Cells } from "../sheet/columns.ts"

const WALK_MINIMUM_KM = 5

const collapseSpaces = (text: string) => text.trim().replace(/\s+/g, " ")

const fromFlorence = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `~${rest}min`
  return rest === 0 ? `~${hours}h` : `~${hours}h${rest}`
}

// The criterion for which routes reach the sheet lives here, not in the prompt: the agent
// reports everything it finds.
const isListed = (distance: Distance) =>
  !distance.bambini && !(distance.camminata && distance.km < WALK_MINIMUM_KM)

const formatDistance = (distance: Distance) => {
  const climb =
    distance.dislivello === undefined || distance.dislivello === null
      ? ""
      : ` ${distance.dislivello}m+`
  return `${distance.km}km${climb}${distance.camminata ? ", camminata" : ""}`
}

const distances = (list: ReadonlyArray<Distance>) =>
  list
    .filter(isListed)
    .toSorted((left, right) => left.km - right.km)
    .map(formatDistance)
    .join("\n")

export const formatCells = (name: string, race: FoundRace): Cells => ({
  name,
  date: collapseSpaces(race.data),
  place: race.luogo.map(collapseSpaces).filter((place) => place !== "").join(", "),
  fromFlorence: fromFlorence(race.minutiDaFirenze),
  type: race.tipo,
  distances: distances(race.distanze),
})

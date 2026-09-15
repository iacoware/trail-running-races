import { Brand } from "effect"

export type RaceKey = string & Brand.Brand<"RaceKey">

const RaceKey = Brand.nominal<RaceKey>()

// The same normalization applies to the race list and to the visible text of the
// sheet's Nome column: it is the only thing idempotency rests on.
export const raceKey = (name: string): RaceKey =>
    RaceKey(
        name
            .normalize("NFC")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ")
            .replace(/[‘’ʼ]/g, "'"),
    )

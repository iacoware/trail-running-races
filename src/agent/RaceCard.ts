import { Option, Schema } from "effect"

import { parseDate } from "../dates/parseDate.ts"

export const REGIONS = [
    "Abruzzo",
    "Basilicata",
    "Calabria",
    "Campania",
    "Emilia-Romagna",
    "Friuli-Venezia Giulia",
    "Lazio",
    "Liguria",
    "Lombardia",
    "Marche",
    "Molise",
    "Piemonte",
    "Puglia",
    "Sardegna",
    "Sicilia",
    "Toscana",
    "Trentino-Alto Adige",
    "Umbria",
    "Valle d'Aosta",
    "Veneto",
    "Estero",
] as const

export const Region = Schema.Literals(REGIONS)
export type Region = typeof Region.Type

export const RaceType = Schema.Literals(["Trail", "Sky"])
export type RaceType = typeof RaceType.Type

export const Distance = Schema.Struct({
    km: Schema.Finite,
    dislivello: Schema.optionalKey(Schema.NullOr(Schema.Int)),
    camminata: Schema.Boolean,
    bambini: Schema.Boolean,
}).annotate({ identifier: "Distance" })
export type Distance = typeof Distance.Type

// The date must already be orderable by the sheet's grammar, so it is validated here
// and never asked to the agent in structured form.
export const RaceDate = Schema.Trim.pipe(
    Schema.check(
        Schema.makeFilter((text: string) => Option.isSome(parseDate(text)), {
            message:
                'data fuori grammatica: attese "2 maggio", "20-21 febbraio" o "28 febbraio-1 marzo"',
        }),
    ),
)

export const FoundRace = Schema.Struct({
    esito: Schema.Literal("trovata"),
    url: Schema.String.pipe(
        Schema.check(Schema.isPattern(/^https?:\/\//, { message: "url non http(s)" })),
    ),
    data: RaceDate,
    luogo: Schema.Array(Schema.String),
    regione: Region,
    minutiDaFirenze: Schema.Int,
    tipo: RaceType,
    distanze: Schema.Array(Distance),
}).annotate({ identifier: "FoundRace" })
export type FoundRace = typeof FoundRace.Type

export const NotFoundRace = Schema.Struct({
    esito: Schema.Literal("non_trovata"),
}).annotate({ identifier: "NotFoundRace" })

export const AmbiguousRace = Schema.Struct({
    esito: Schema.Literal("ambigua"),
    candidati: Schema.Array(Schema.String),
}).annotate({ identifier: "AmbiguousRace" })

export const RaceCard = Schema.Union([FoundRace, NotFoundRace, AmbiguousRace]).annotate({
    identifier: "RaceCard",
})
export type RaceCard = typeof RaceCard.Type

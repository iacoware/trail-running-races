# S7 — Sezioni speciali create quando mancano

← [Register](../roadmap.md#now)

**Outcome:** Quando la sezione speciale di destinazione manca, `fill` la crea in fondo al foglio nell'ordine canonico insieme alla riga che la richiede.

**Requested by:** `goal.md` § Formato del foglio (sezioni speciali su richiesta); `concepts.md` § Sezione speciale; `arch-choices.md` § Posizionamento (ordine canonico); `tech-choices.md` § Google Sheets (`bold` per le righe sezione).
**Spec:** —
**Tickets:** —
**ADRs:** —

## Audience

L'autore: non prepara `Resto di Italia`, `Estero` né `Da verificare`; la prima gara che ne ha bisogno le fa comparire.

## Includes

- Sezione speciale mancante → riga vuota più riga di intestazione in grassetto, in fondo al foglio, prima della prima sezione speciale che la segue nell'ordine `Resto di Italia`, `Estero`, `Da verificare`.
- La creazione e la riga gara che la richiede stanno nella stessa richiesta atomica di `S5`.
- Il piano del dry run mostra la creazione della sezione.
- Le sezioni regionali non vengono mai create.

## Verification

- Sul foglio reale senza `Estero`, con una gara francese mancante, `fill` crea `Estero` tra `Resto di Italia` e `Da verificare`, con intestazione in grassetto preceduta da una riga vuota, e la gara subito sotto.
- Su un foglio senza alcuna sezione speciale, un nome inventato fa comparire `Da verificare` in fondo con la riga di parcheggio.
- Un run interrotto non lascia mai una sezione speciale vuota.
- Il dry run sul CSV senza `Estero` mostra nel piano la creazione della sezione e la posizione della gara; una gara di una regione senza sezione non crea mai una sezione regionale.

## Learning target

L'inserimento di più righe (vuota, intestazione in grassetto, gara) in un solo `batchUpdate` mantiene l'atomicità di `S5` e l'ordine canonico sul fondo del foglio, qualunque sia il sottoinsieme di sezioni speciali già presenti.

## Excludes

- Sezioni regionali: licenza in `OUT-OF-SCOPE`.
- Riordino delle sezioni speciali già presenti in ordine diverso da quello canonico: non si toccano righe esistenti.

## Open questions

- —

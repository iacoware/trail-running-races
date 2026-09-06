# S6 — Non trovata e ambigua parcheggiate in Da verificare

← [Register](../roadmap.md#now)

**Outcome:** Una gara non trovata o ambigua ottiene una riga con il solo nome e il messaggio in coda a `Da verificare`, e al run successivo viene saltata.

**Requested by:** `goal.md` § Esiti possibili (non trovata, ambigua, righe che contano come presenti); `concepts.md` § Ambiguità; `arch-choices.md` § Posizionamento (righe in coda a `Da verificare`).
**Spec:** —
**Tickets:** —
**ADRs:** —

## Audience

L'autore: trova nel foglio le gare da controllare a mano, con il motivo, e non paga di nuovo l'agente per loro finché non cancella la riga.

## Includes

- `esito` non trovata → riga con Nome in testo semplice, senza link, e `non ho trovato niente` nella colonna Data; `esito` ambigua → `più di un evento con questo nome`; entrambe in coda alla sezione `Da verificare`, con la stessa richiesta atomica di `S5`.
- I candidati di una gara ambigua compaiono nel riepilogo del run, non nel foglio.
- Il piano del dry run mostra anche queste righe.
- Sezione `Da verificare` assente → errore tagged per la gara, nessuna scrittura.

## Verification

- Sul foglio reale, con un nome inventato nel file, `fill` aggiunge in fondo a `Da verificare` una riga con quel nome e `non ho trovato niente`; rilanciato, non invoca l'agente per quel nome.
- Cancellata a mano quella riga, il run successivo la ricerca di nuovo.
- Con un nome che designa più eventi la riga porta `più di un evento con questo nome` e il riepilogo elenca i candidati.
- `fill --dry-run --sheet-csv fixtures/sheet.csv` con lo stesso nome inventato mostra nel piano la riga di parcheggio in coda a `Da verificare`.

## Learning target

Le righe con messaggio contano come presenti attraverso la stessa chiave sul nome: una gara non risolta costa una sola chiamata all'agente finché l'autore non decide di cancellarla.

## Excludes

- Creazione di `Da verificare` quando manca: `S7`.
- Errori agente (timeout, JSON non valido): nessuna riga, restano nel riepilogo e vengono ritentati, come in `S3`.

## Open questions

- —

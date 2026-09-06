# S4 — Piano di inserimento in dry run, anche da CSV

← [Register](../roadmap.md#now)

**Outcome:** `fill --dry-run` stampa per ogni gara trovata la sezione, la riga di destinazione e le sei celle, dal foglio reale o da un CSV esportato senza credenziali.

**Requested by:** `goal.md` § Vincoli (dry run), § Formato del foglio, § Sottocomandi; `arch-choices.md` § Posizionamento della riga, § Modalità dry run; `tech-choices.md` § Parser delle date, § Formattazione celle, § Configurazione via env (riepilogo, exit code).
**Spec:** —
**Tickets:** —
**ADRs:** —

## Audience

L'autore: vede dove finirebbe ogni gara e con quali celle, e lo verifica sul CSV senza chiave Google.

## Includes

- Layer alternativo di `SheetReader` da CSV per `--sheet-csv <path>`, che implica `--dry-run`; stessa griglia e stesso modello di sezioni di `S2`.
- Ordinamento sulle date della colonna `Data` con il parser consegnato in `S3` (tre forme di `tech-choices.md` § Parser, senza anno, mese case insensitive): confronto su (mese, giorno) del giorno di inizio; data della scheda fuori grammatica già respinta dallo Schema.
- Posizione: regione → sezione esistente per nome normalizzato con alias (`Emilia-Romagna`, `Trentino-Alto Adige`, `Friuli-Venezia Giulia`, `Valle d'Aosta`), regione italiana senza sezione → `Resto di Italia`, `Estero` → `Estero`; dopo l'ultima riga con data parsabile minore o uguale e comunque prima della prima riga non parsabile; sezione di destinazione assente → errore tagged, nessun piano.
- Ogni posizione calcolata contro il foglio letto, non contro le righe pianificate prima nello stesso run.
- Formattazione: `Data` ripulita da spazi doppi; `Luogo` unito con `, `; `Da FI` da minuti come `~50min`, `~1h`, `~1h30`; `Distanze` con i percorsi `bambini` e le `camminata` sotto 5km scartati, ordinati per km decrescente, `{km}km {dislivello}m+` con `, camminata` in coda, cella vuota se non resta nulla, decimali con il punto.
- Layer `SheetWriter` che stampa il piano; `--dry-run` con il reader reale usa le credenziali.
- Riepilogo di fine run con inserite (qui: pianificate), non trovate, ambigue con candidati, errori; exit code 1 se almeno un errore. Non trovata e ambigua compaiono solo nel riepilogo.

## Verification

- Senza alcuna variabile Google nell'env, `fill --dry-run --sheet-csv fixtures/sheet.csv` con una gara toscana datata tra Brunello Crossing e Chianti UTMB stampa `Toscana`, la posizione dopo Brunello Crossing e le sei celle.
- Una gara lombarda finisce in `Resto di Italia`, una gara francese in `Estero`; con un CSV senza `Estero` il run riporta un errore tagged per quella gara e nessun piano.
- Con un CSV in cui una sezione contiene una riga con Data `non ho trovato niente` seguita da una riga datata, la gara nuova va prima della riga non parsabile anche se la sua data è successiva.
- Una scheda con un percorso `bambini`, una camminata da 4km e una camminata da 12km produce una cella `Distanze` con la sola camminata da 12km fra i percorsi non competitivi.
- Con un `AGENT_CMD` che restituisce una scheda non trovata, il riepilogo la elenca e il piano non la contiene; l'exit code resta 0.

## Learning target

Le regole di posizionamento e la grammatica delle date reggono sul contenuto reale del foglio: le posizioni stampate sono quelle che l'autore avrebbe scelto a mano.

## Excludes

- Scrittura sul foglio: `S5`.
- Piano e riga per non trovata e ambigua: `S6`.
- Creazione delle sezioni speciali mancanti: `S7`.
- `sort` e `update`: candidati in `LATER`.

## Open questions

- —

# S2 — missing: i nomi mancanti dal foglio reale

← [Register](../roadmap.md#now)

**Outcome:** `missing` stampa i nomi dell'elenco che non hanno una riga nel foglio reale, senza invocare l'agente.

**Requested by:** `goal.md` § Sottocomandi (`missing`), § Cosa fa lo script (passi 1-2); `tech-choices.md` § Elenco gare, § Google Sheets (Lettura); `arch-choices.md` § Chiave di identità, § Posizionamento (riconoscimento sezioni).
**Spec:** —
**Tickets:** —
**ADRs:** —

## Audience

L'autore: dopo aver aggiunto nomi al file sa quali gare verranno cercate, prima di pagare una chiamata all'agente.

## Includes

- Port `RaceList` e Layer su file: percorso da `RACES_FILE` (default `races.txt`), righe vuote e righe che iniziano con `#` ignorate, duplicati con avviso e vince il primo.
- Chiave normalizzata: trim, lowercase, spazi collassati, Unicode NFC, apostrofi tipografici → `'`, accenti conservati; applicata sia ai nomi del file sia al testo visibile della colonna Nome.
- `SheetReader` completo: `values.get` con valori formattati, colonne individuate per header normalizzato e per prefisso (`Data` matcha `Data (+ o -)`), colonna mancante → errore tagged all'avvio.
- Modello del foglio da griglia: sezione = riga con solo Nome valorizzato preceduta dall'header o da una riga vuota, chiusa dalla riga vuota; le righe che seguono una riga vuota senza header restano fuori sezione con un avviso.
- Diff per chiave e stampa dei nomi mancanti, uno per riga, nell'ordine del file; exit code 0.

## Verification

- Con il foglio reale e un file che contiene due gare presenti (una scritta con maiuscole diverse dal foglio) e una assente, `missing` stampa solo quella assente.
- Una gara presente nel foglio come cella con link viene riconosciuta dal testo visibile.
- Un nome ripetuto nel file produce un avviso e una sola riga in output; una riga `# commento` non produce nulla.
- Con l'header `Distanze` rinominato, il comando termina con un errore tagged che nomina la colonna, senza stampare mancanti.

## Learning target

Il match sul testo visibile della colonna Nome, letto con valori formattati, è stabile anche sulle celle con link: è l'unica cosa su cui poggia l'idempotenza di tutta la mappa.

## Excludes

- `--sheet-csv`: è un flag di `fill`, arriva in `S4`.
- Parsing delle date e ordine dentro le sezioni: `S4`.
- Riparazione delle sezioni spezzate: licenza in `OUT-OF-SCOPE`.

## Note di consegna

- Il port `SheetReader` resta a righe grezze (`rows`): colonne e sezioni si ricavano in codice puro (`src/sheet/columns.ts`, `src/sheet/parseSheet.ts`), così il Layer CSV di `S4` deve solo produrre righe. La colonna mancante è quindi un `SheetColumnMissingError` alzato al primo parse del foglio, non alla costruzione del Layer: per `missing` l'effetto è lo stesso (nessun mancante stampato, exit 1).
- Il modello del foglio porta già `columns`, `headerRow`, numero di riga e tutte le sei celle: `S4` e `S5` li consumano per la posizione, `missing` usa solo `cells.name`.
- Gli avvisi sono valori (`SheetWarning`, `DuplicateName`) formattati dal comando o dal Layer; `main` installa un logger che scrive `avviso: …` su stderr senza timestamp, il default di Effect era pensato per servizi.
- `parseRaceList` è una funzione pura, non uno Schema: `tech-choices.md` § Effect 4 aggiornato. Un `#` preceduto da spazi è comunque un commento.
- `raceKey` mappa anche `ʼ` (U+02BC) su `'`, oltre a `‘` e `’`. Gli header sono cercati con la stessa normalizzazione e con il primo prefisso che matcha: con i sei header attuali è univoco, un futuro `Nome breve` prima di `Nome` non lo sarebbe.
- `RACES_FILE` vuoto vale come assente (default `races.txt`), come `SHEET_TAB` vuoto in `S1`.
- Verificato sul foglio reale: `brunello crossing` e `Chianti UTMB` sono celle con link e sono riconosciute dal testo visibile; il caso `Distanze` rinominato è coperto solo dai test unitari.
- `pnpm start` senza sottocomando stampa l'uso ed esce con 1; `fill` arriva con `S4`.

## Open questions

- —

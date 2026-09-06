# S5 — Riga della gara trovata inserita nel foglio

← [Register](../roadmap.md#now)

**Outcome:** `fill` inserisce nel foglio reale la riga di ogni gara trovata, nella posizione del piano, con il nome linkato al sito ufficiale, e rilanciato non fa nulla.

**Requested by:** `goal.md` § Cosa fa lo script (passo 4), § Vincoli (idempotente, non distruttivo); `tech-choices.md` § Google Sheets (Link, Inserimento); `arch-choices.md` § Pipeline, § Non distruttività.
**Spec:** —
**Tickets:** —
**ADRs:** —

## Audience

L'autore: aggiunge un nome al file, lancia `fill`, e la gara compare nel foglio con i suoi dati senza che cerchi nulla.

## Includes

- Layer Google di `SheetWriter`: un solo `batchUpdate` con `insertDimension` più `updateCells`, valori delle sei celle e link ricco su Nome via `textFormatRuns[].format.link`; rejection mappate su errori tagged.
- Prima di ogni inserimento il foglio viene riletto e la posizione ricalcolata.
- `fill` senza flag scrive; l'errore di una gara non interrompe le altre; il riepilogo di `S4` conta le inserite.

## Verification

- Sul foglio reale, con una gara toscana mancante, `fill` aggiunge una riga in `Toscana` nella posizione indicata dal dry run; il Nome è un link cliccabile all'url della scheda, le altre celle coincidono con il piano, nessuna riga esistente è cambiata.
- Rilanciato subito, `fill` non invoca l'agente e non scrive nulla.
- Con due gare mancanti nella stessa sezione la seconda finisce nella posizione giusta rispetto alla prima, non in quella calcolata sul foglio iniziale.
- Un run interrotto dopo il primo inserimento non lascia righe vuote; il run successivo inserisce solo le gare rimanenti.
- Una gara la cui regione non ha sezione, su un foglio senza `Resto di Italia`, produce un errore tagged e nessuna scrittura.

## Learning target

Un solo `batchUpdate` con `insertDimension`, `updateCells` e link in `textFormatRuns` produce una riga indistinguibile da una fatta a mano, e la chiave sul nome tiene l'idempotenza anche dopo un crash a metà run.

## Excludes

- Righe per non trovata e ambigua: `S6`.
- Creazione delle sezioni speciali: `S7`.
- Modifica, cancellazione e riordino di righe: licenza in `OUT-OF-SCOPE`.

## Open questions

- —

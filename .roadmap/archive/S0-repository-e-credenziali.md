# S0 — Repository, toolchain e accesso al foglio

← [Register](../roadmap.md#now)

**Outcome:** Un repository con la toolchain decisa che fa type check e test in locale, più la chiave del service account che il resto della mappa spende.

**Requested by:** `tech-choices.md` § Linguaggio e runtime, § Google Sheets (Auth), § Toolchain.
**Spec:** —
**Tickets:** —
**ADRs:** —

## Audience

L'autore come sviluppatore: può lanciare `pnpm typecheck` e `pnpm test` e ha in mano una chiave che apre il foglio reale.

## Includes

- `git init`, `pnpm` con `engines` Node >= 24, `effect` e `@effect/platform-node` pinnati alla stessa versione esatta `4.0.0-rc.112`, `@googleapis/sheets`, `google-auth-library`, Vitest 4 e `@effect/vitest@rc`, `typescript`.
- Script `typecheck` (`tsc --noEmit`) e `test` (`vitest run`); `tsconfig` compatibile con il type stripping nativo (import con estensione `.ts`, sintassi cancellabile).
- Un test banale co-locato che gira con `it.effect`, a prova della deroga in `tech-choices.md` § Toolchain.
- `.env.example` con le sei variabili di `tech-choices.md` § Configurazione via env; `.gitignore` che esclude `.env` e il file della chiave.
- Lavoro umano: progetto Google Cloud con Sheets API abilitata, service account, chiave JSON scaricata, foglio condiviso con l'email del service account come editor.

## Verification

- `pnpm typecheck` e `pnpm test` sono verdi su un checkout pulito.
- `node` esegue un file `.ts` che importa da `effect` e da `@effect/platform-node` senza build step né `tsx`.
- Il file della chiave esiste in locale, non compare in `git status`, e la condivisione del foglio mostra il service account come editor.

## Learning target

Effect 4 rc.112 e `@effect/platform-node` si installano, si risolvono con import `.ts` espliciti e passano `tsc --noEmit` sotto Node 24 senza build step.

## Excludes

- CI: `tech-choices.md` § Linguaggio la esclude; è una licenza in `OUT-OF-SCOPE`.
- Qualsiasi chiamata al foglio: è lo skeleton, la riga successiva.

## Open questions

- —

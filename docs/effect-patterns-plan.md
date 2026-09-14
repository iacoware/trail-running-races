# Piano: enforcement automatico dei pattern Effect

Documento di lavoro per l'implementazione dell'enforcement descritto in `docs/effect-patterns.md`. Pensato per attraversare più sessioni: ogni sessione parte dal primo item non chiuso e annota l'esito nel Registro in coda.

## Contesto

`docs/effect-patterns.md` cataloga 27 pattern Effect (P01–P27) con la classe di enforcement di ciascuno, ma oggi nel repo **non esiste nulla che li applichi**: niente `.oxlintrc.json`, niente `tools/`, niente hook, niente skill, niente `CLAUDE.md`/`AGENTS.md` di progetto. Gli script sono solo `start`, `typecheck`, `test`. L'unico controllo è la revisione manuale del codice scritto dall'agente — esattamente ciò che si vuole eliminare.

Obiettivo: rendere meccanicamente verificabili i pattern `lint-sintattico` e `lint-tipi`, in modo che l'agente riceva feedback dal linter invece che dall'utente. Skill (passo 5 del catalogo), hook (passo 6) e migrazioni del codice esistente restano fuori da questo piano.

L'ordine dei passi è quello dei "Prossimi passi" 1–3 del catalogo. Il passo 1 riduce l'incertezza sugli altri: solo ciò che il preset ufficiale non copre giustifica regole custom.

## Vincoli e rischi noti

- `docs/tech-choices.md` elenca **"CI e build step" come out-of-scope**. Il lint è un comando separato, non un build step, quindi compatibile; ma lo script `prepare: effect-tsgo patch --oxlint` documentato ufficialmente **sostituisce il binario `tsc` della piattaforma** a ogni install.
- Nessuna combinazione è verificata in locale: `effect@4.0.0-rc.112` (il language service testa contro `beta.107`), `typescript@7.0.2`, contenuto reale del preset `recommended`.

## Decisioni prese

- **Patch `tsc`**: ~~se le diagnostiche type-aware non funzionano senza patch~~ **applicata** (`prepare: effect-tsgo patch --oxlint`): senza patch il preset non carica affatto. Annotata in `docs/tech-choices.md`.
- **Roadmap**: nessuna slice. Il lavoro resta tooling, tracciato solo in questo file; NOW della roadmap resta vuoto.

## Passo 1 — oxlint + tsgo type-aware

- [x] **1a** Installare come devDependencies `oxlint`, `@effect/tsgo`, `oxlint-tsgolint` (versioni note funzionanti: `@effect/tsgo@0.45.0`, `oxlint-tsgolint@7.0.2001`, allineata a TS 7.0.2).
- [x] **1b** Configurato. Il tentativo **senza patch** è fallito: `oxlint` rifiuta il preset con `Unknown plugin: 'effecttsgo'` (il plugin sta nel binario, non è caricabile da configurazione). Applicata quindi `prepare: effect-tsgo patch --oxlint`, annotata in `docs/tech-choices.md`. La patch sostituisce anche il `tsc` della piattaforma, come previsto dai rischi.
- [x] **1c** `pnpm lint` gira: 55 warning, 0 error, exit 0. Il preset attiva 98 regole (85 `warn`, 13 `error`), con nomi **kebab-case** (`effecttsgo/floating-effect`), non i camelCase della documentazione. Le attese erano quasi tutte a rumore zero: nessuna diagnostica per `floating-effect`, `effect-fn-opportunity`, `leaking-requirements`, `catch-unfailable-effect`, `catch-all-to-map-error`, `unnecessary-fail-yieldable-error`, `schema-sync-in-effect`. Rumore reale dominato da regole non previste: `multiple-effect-provide` 26, `async-function` 11, `global-console*` 10, `node-builtin-import` 3, `new-promise` 2, più 3 singole.
- [x] **1d** Alzate a `error` 13 regole a rumore zero corrispondenti a pattern da imporre: `extends-native-error`, `global-error-in-effect-catch`, `global-error-in-effect-failure`, `unnecessary-fail-yieldable-error`, `catch-all-to-map-error`, `catch-unfailable-effect`, `schema-sync`, `schema-sync-in-effect`, `process-env`, `process-env-in-effect`, `effect-fn-opportunity`, `leaking-requirements`, `run-effect-inside-effect`. Lasciate a `warn` quelle con rumore da migrare (P21 `global-console*`) o legittimo (`async-function` e `node-builtin-import` in `test/dryRun.test.ts`, volutamente non-Effect) e `multiple-effect-provide`, fuori catalogo.
- [x] **1e** `docs/effect-patterns.md` aggiornato con la tabella di copertura P01–P27 (coperto / parziale / no, regole e severità effettive) e il rumore per regola.

Le violazioni segnalate vanno **riportate, non corrette** in questo passo: le correzioni stanno nella sezione "Migrazioni da fare" del catalogo, che è ambito separato.

## Passo 2 — vendoring anti-slop

- [ ] **2a** Copiare `src/effect/` di `dmmulroy/anti-slop` (commit `c44ef22`, MIT) in `tools/oxlint/anti-slop-effect/`, conservando la licenza e aggiungendo un `README.md` con origine e commit.
- [ ] **2b** Verificare compatibilità della versione di `oxlint` installata con `@oxlint/plugins` `1.78.0` (anti-slop pinna quella; la minima supportata non è dichiarata).
- [ ] **2c** Attivare `no-manual-effect-error-tag` (P09), `no-manual-tag-comparison` (P14, P16), `prefer-effect-match` (P14).
- [ ] **2d** `no-manual-tagged-construction` (P15): attivarla **escludendo `*.test.ts` e fixture**; se il rumore è alto, tenerla `warn` finché le sei unioni di P15 non sono migrate.

Violazioni attese oggi in `src/` (da grep): `_tag ===` in `src/plan/planRow.ts:44,53`, `src/commands/summary.ts:7,47`, `src/sheet/google/insertRowRequests.ts:97`, `src/sheet/print/PrintSheetWriter.ts:20`, più 3 in `src/commands/fill.test.ts`; `switch (cursor._tag)` in `src/sheet/parseSheet.ts:59`.

## Passo 3 — plugin locale, solo per i gap

`tools/oxlint/effect-local/`, da riverificare **dopo** il passo 1c: molte di queste regole potrebbero risultare già coperte. Ordine di valore dal catalogo; da scrivere una alla volta, fermandosi alle prime che danno valore.

Riverifica fatta dopo 1c (dettaglio in `docs/effect-patterns.md`):

- **ancora da scrivere**: `error-handling-in-effect-fn-handler` (P25), `no-transport-types-in-generator` (P26), `boundary-entrypoint-shape` (P27, `leaking-requirements` non copre il canale errori), `try-object-form` (P08 — verificato: `Effect.tryPromise(() => …)` in forma thunk **non** è segnalato), `redacted-secret-names` (P13, i nomi dei segreti non sono coperti);
- **ridimensionate**: `prefer-effect-fn` (P17) — `effect-fn-opportunity` copre la conversione, resta scoperto solo il nome in `Effect.fn("…")`; `single-style-per-function` (P24) — `async-function` copre la forma più comune; `service-port-shape-only` (P01) — coperta in parte da `non-object-effect-service-type` e `generic-effect-services`; `run-only-at-entry` (P04) — `run-effect-inside-effect` copre il caso pericoloso;
- **non più necessarie**: `no-bare-error-in-effect` (P05, coperta da `global-error-in-effect-failure`/`-catch` + `extends-native-error`), `no-sync-decode-in-effect` (P11, coperta da `schema-sync*`), `no-process-env` (P13, coperta da `process-env*`), `return-yield-error` (P07, coperta da `unnecessary-fail-yieldable-error` + `missing-return-yield-star`), `no-console-in-effect` (P21, coperta da `global-console-in-effect`).

- [ ] `error-handling-in-effect-fn-handler` (P25) + `prefer-effect-fn` (P17), da cui dipende
- [ ] `single-style-per-function` (P24)
- [ ] `no-transport-types-in-generator` (P26), lista dei tipi come opzione
- [ ] `boundary-entrypoint-shape` (P27)
- [ ] `service-port-shape-only` (P01)
- [ ] `no-bare-error-in-effect` (P05)
- [ ] `try-object-form`, con `Effect.promise` come warning (P08)
- [ ] `no-sync-decode-in-effect` (P11)
- [ ] `no-process-env` + `redacted-secret-names` (P13)
- [ ] `run-only-at-entry` (P04, P22), allowlist `src/main.ts`
- [ ] `return-yield-error` (P07)
- [ ] `no-console-in-effect` (P21) — nota: `src/main.ts` e `src/testing/fakeAgent.ts` usano `console.*` legittimamente fuori dai generatori, ma `src/main.ts:34,52,83` sono dentro generatori o callback e verranno segnalati

Ogni regola va scritta con il `RuleTester` di `oxlint/plugins-dev`, con casi valid e invalid, come in anti-slop.

## File toccati

- `package.json` (devDependencies + script `lint`)
- `.oxlintrc.json` (nuovo)
- `tsconfig.json` (blocco `plugins` per l'editor)
- `tools/oxlint/anti-slop-effect/**` (vendoring), `tools/oxlint/effect-local/**` (nuovo)
- `docs/effect-patterns.md` (copertura reale), `docs/tech-choices.md` (solo se si applica la patch)
- questo file (checklist e Registro)

Nessuna modifica a `src/` in questo piano.

## Verifica

1. `pnpm lint` gira senza crash e produce diagnostiche attribuibili a pattern noti.
2. `pnpm typecheck` e `pnpm test` restano verdi (68 file TS, Vitest 4).
3. Prova negativa: in un file temporaneo non committato, un `Effect.tryPromise(() => …)` in forma thunk, un `_tag ===` e un `yield* Effect.fail(new E())` → il linter deve segnalarli tutti e tre; poi rimuovere il file.
4. Elencare le regole effettivamente attive e confrontarle con la tabella aggiornata in `docs/effect-patterns.md`.

## Registro

| Data | Sessione | Verificato | Esito |
|---|---|---|---|
| 2026-09-14 | piano | stato del repo | nessun lint, nessun hook, nessuna skill; `oxlint`/`@effect/tsgo`/`oxlint-tsgolint` non installati |
| 2026-09-14 | passo 1 | install `oxlint@1.82.0`, `@effect/tsgo@0.45.0`, `oxlint-tsgolint@7.0.2001` | ok; il registry npm non è raggiungibile dalla sandbox (certificato del proxy), serve `pnpm install` fuori sandbox |
| 2026-09-14 | passo 1 | preset senza patch | fallito: `Unknown plugin: 'effecttsgo'`. La patch è obbligatoria |
| 2026-09-14 | passo 1 | `effect-tsgo patch --oxlint` | ok su layout pnpm; patcha `tsc`, il binding di `oxlint`, i `.d.ts` di `oxlint` e `oxlint-tsgolint` |
| 2026-09-14 | passo 1 | `pnpm lint` su `src/` + `test/` | 55 warning, 0 error, exit 0; type-aware attivo |
| 2026-09-14 | passo 1 | prova negativa (file temporaneo, poi rimosso) | `floating-effect` e `missing-return-yield-star` error, `unnecessary-fail-yieldable-error`, `global-error-in-effect-failure`, `unnecessary-effect-gen` warning; exit 1 con error, 0 con soli warning. **`Effect.tryPromise` in forma thunk non segnalato** → P08 resta al passo 3 |
| 2026-09-14 | passo 1 | `pnpm typecheck` e `pnpm test` dopo la patch | verdi: tsc 0 errori, 25 file / 177 test passati |
| 2026-09-14 | passo 1 | `oxlint` pinnato a `1.82.0` senza caret | la patch dichiara solo `1.81.0`/`1.82.0`: un minor nuovo la romperebbe |
| 2026-09-14 | passo 1 | `pnpm install` completo | il `prepare` gira da solo ed è idempotente ("skipped because its hash matches the replacement") |
| 2026-09-14 | passo 1 | `.gitignore` | `/*.json` (rete di sicurezza per la chiave del service account) escludeva `.oxlintrc.json`: aggiunta l'eccezione `!/.oxlintrc.json` |

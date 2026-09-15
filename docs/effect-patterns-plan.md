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
- [x] **1d** Alzate a `error` 13 regole a rumore zero corrispondenti a pattern da imporre: `extends-native-error`, `global-error-in-effect-catch`, `global-error-in-effect-failure`, `unnecessary-fail-yieldable-error`, `catch-all-to-map-error`, `catch-unfailable-effect`, `schema-sync`, `schema-sync-in-effect`, `process-env`, `process-env-in-effect`, `effect-fn-opportunity`, `leaking-requirements`, `run-effect-inside-effect`. Lasciate a `warn` quelle con rumore da migrare (P21 `global-console*`) e `multiple-effect-provide`, fuori catalogo. Spente con `overrides` su `test/dryRun.test.ts` e `src/testing/fakeAgent.ts`, che non sono codice Effect, le cinque regole senza contesto Effect (`async-function`, `new-promise`, `node-builtin-import`, `global-console`, `global-timers`): 21 warning su 55 venivano da lì. Restano 34 warning, 0 error.
- [x] **1e** `docs/effect-patterns.md` aggiornato con la tabella di copertura P01–P27 (coperto / parziale / no, regole e severità effettive) e il rumore per regola.

Le violazioni segnalate vanno **riportate, non corrette** in questo passo: le correzioni stanno nella sezione "Migrazioni da fare" del catalogo, che è ambito separato.

## Passo 2 — vendoring anti-slop

- [x] **2a** Copiato `src/effect/` di `dmmulroy/anti-slop` (commit `c44ef22`, HEAD del repo, MIT) in `tools/oxlint/anti-slop-effect/`, file invariati, con `LICENSE` e `README.md` (origine, commit, istruzioni di aggiornamento).
- [x] **2b** Installato `@oxlint/plugins@1.82.0`, allineato a `oxlint` invece del `1.78.0` dell'upstream: i cinque `RuleTester` upstream passano. Il plugin JS si carica anche sull'`oxlint` **patchato** da `effect-tsgo`, via `jsPlugins` in `.oxlintrc.json` — non era scontato, dato che al passo 1 il preset non era caricabile da configurazione.
- [x] **2c** `no-manual-effect-error-tag` (P09) e `prefer-effect-match` (P14) a **error**: rumore zero, entrambe verificate con prova negativa. `no-manual-tag-comparison` (P14, P16) a **warn**: 10 violazioni reali (7 in `src/` non-test, 3 in `fill.test.ts`), che sono migrazioni, fuori da questo piano.
- [x] **2d** `no-manual-tagged-construction` (P15) a **warn**, spenta su `**/*.test.ts` e `src/testing/**` (25 dei 44 punti venivano da lì). Restano 18 punti: `targetSection.ts` 6, `parseSheet.ts` 5, `fill.ts` 5, `config.ts` 2. `warn` finché le sei unioni di P15 non sono migrate, come previsto.
- [x] **2e** (non previsto) Tutte le regole spente su `tools/**`: i casi di test delle regole contengono di proposito le forme vietate. Vitest raccoglieva i `*.test.ts` vendorizzati e falliva con "No test suite found": esclusi in `vitest.config.ts` (nuovo) ed eseguiti da `pnpm test:lint-rules` (`node --test`), a cui `pnpm test` ora incatena. `tsconfig.json` include `tools/**/*.ts`: typecheck verde.

`no-service-constructor-imports` è vendorizzata ma non attivata, come deciso nel catalogo: qui non esistono `make*` esportati.

Violazioni attese oggi in `src/` (da grep): `_tag ===` in `src/plan/planRow.ts:44,53`, `src/commands/summary.ts:7,47`, `src/sheet/google/insertRowRequests.ts:97`, `src/sheet/print/PrintSheetWriter.ts:20`, più 3 in `src/commands/fill.test.ts`; `switch (cursor._tag)` in `src/sheet/parseSheet.ts:59`.

## Passo 3 — plugin locale, solo per i gap

`tools/oxlint/effect-local/`, da riverificare **dopo** il passo 1c: molte di queste regole potrebbero risultare già coperte. Ordine di valore dal catalogo; da scrivere una alla volta, fermandosi alle prime che danno valore.

Riverifica fatta dopo 1c (dettaglio in `docs/effect-patterns.md`):

- **ancora da scrivere**: `error-handling-in-effect-fn-handler` (P25), `no-transport-types-in-generator` (P26), `boundary-entrypoint-shape` (P27, `leaking-requirements` non copre il canale errori), `try-object-form` (P08 — verificato: `Effect.tryPromise(() => …)` in forma thunk **non** è segnalato), `redacted-secret-names` (P13, i nomi dei segreti non sono coperti);
- **ridimensionate**: `prefer-effect-fn` (P17) — `effect-fn-opportunity` copre la conversione, resta scoperto solo il nome in `Effect.fn("…")`; `single-style-per-function` (P24) — `async-function` copre la forma più comune; `service-port-shape-only` (P01) — coperta in parte da `non-object-effect-service-type` e `generic-effect-services`; `run-only-at-entry` (P04) — `run-effect-inside-effect` copre il caso pericoloso;
- **non più necessarie**: `no-sync-decode-in-effect` (P11, coperta da `schema-sync*`), `no-process-env` (P13, coperta da `process-env*`), `return-yield-error` (P07, coperta da `unnecessary-fail-yieldable-error` + `missing-return-yield-star`), `no-console-in-effect` (P21, coperta da `global-console-in-effect`).

Correzione del 2026-09-14, da prova negativa: **`no-bare-error-in-effect` (P05) serve ancora**, ridotta a due casi che il preset non vede — un `throw` dentro un generatore e `Effect.fail("stringa")` (`Effect.fail(new TypeError(…))` invece è segnalato). E **P09 ha un gap**: il catch-all senza parametro che ingoia non è coperto da nessuna regola del preset, quindi va aggiunta `no-parameterless-catch-all`, con allowlist per l'entry point; la discriminazione manuale su `_tag` dentro `Effect.catch` non è coperta dal preset ma è il bersaglio di `no-manual-effect-error-tag`, cioè arriva col passo 2.

Checklist risultante, già potata di ciò che il preset copre:

- [x] `error-handling-in-effect-fn-handler` (P25) + `prefer-effect-fn` (P17), da cui dipende — **warn**: 2 + 7 violazioni
- [x] `single-style-per-function` (P24) — error, rumore zero
- [x] `no-transport-types-in-generator` (P26), lista dei tipi come opzione `transportTypes` (default `Response`, `NextResponse`) — error, rumore zero. Inizialmente saltata perché qui non ci sono tipi di trasporto; scritta perché l'obiettivo è un plugin portabile in altri progetti
- [x] `boundary-entrypoint-shape` (P27) — **warn**: 1 violazione (`src/main.ts:77`)
- [x] `service-port-shape-only` (P01) — error, rumore zero
- [x] `no-bare-error-in-effect` (P05), ridotta a `throw` in generatore e `Effect.fail("stringa")` — error, rumore zero
- [x] `no-parameterless-catch-all` (P09) — error, rumore zero; allowlist non servita (il catch di `main.ts` ha il parametro)
- [x] `try-object-form` (error) + `no-effect-promise` (**warn**) (P08) — due regole, perché la severità è per regola; rumore zero
- [x] `redacted-secret-names` (P13) — **warn**: 1 violazione (`src/config.ts:20`)
- [x] `run-only-at-entry` (P04, P22) — error, spenta su `src/main.ts` con `overrides`

Ogni regola va scritta con il `RuleTester` di `oxlint/plugins-dev`, con casi valid e invalid, come in anti-slop.

Esito (2026-09-14): plugin `tools/oxlint/effect-local/` con 12 regole, caricato da `jsPlugins`. Criterio di severità del passo 1d: `error` a rumore zero, `warn` dove ci sono violazioni (da migrare, non corrette qui) o dove la regola è euristica. `pnpm lint`: **11 warning, 0 error**, tutte deviazioni già elencate nel catalogo.

Violazioni riportate (migrazioni 4, 5 e 3 del catalogo):

- `prefer-effect-fn`: `fill.ts:41,51,69`, `missing.ts:7`, `main.ts:27,46`, `ProcessAgent.ts:48`. `fill.ts:41` è la callback `onSome` di `Option.match`: la regola conta anche i membri di oggetto, perché lì stanno le implementazioni dei servizi (`X.of({ m: (…) => Effect.gen(…) })`);
- `error-handling-in-effect-fn-handler`: `fill.ts:74` (`Effect.result`), `ProcessAgent.ts:70` (`catchTag` dentro il generatore del layer);
- `boundary-entrypoint-shape`: `main.ts:77`;
- `redacted-secret-names`: `config.ts:20`.

`effecttsgo/effect-fn-opportunity`, pur a `error`, non segnala nessuno dei 7 punti di `prefer-effect-fn`: la copertura di P17 stimata dopo 1c era ottimistica.

## File toccati

- `package.json` (devDependencies + script `lint`, `test:lint-rules`)
- `.oxlintrc.json` (nuovo)
- `vitest.config.ts` (nuovo, esclude `tools/**`)
- `tsconfig.json` (blocco `plugins` per l'editor, `include` di `tools/**/*.ts`)
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
| 2026-09-14 | passo 1 | triage dei 55 warning | 21 da 5 regole che ignorano il contesto Effect su due file non-Effect → spente con `overrides`; 25 `multiple-effect-provide` su layer senza dipendenze (hazard inerte); 6 `global-console*` = output di CLI, non logging; **2 sole violazioni reali**: `timeout-catch-tag-to-timeout-or-else` in `ProcessAgent.ts:84` e `schema-number` in `agent/errors.ts:5` |
| 2026-09-14 | passo 1 | `.gitignore` | `/*.json` (rete di sicurezza per la chiave del service account) escludeva `.oxlintrc.json`: aggiunta l'eccezione `!/.oxlintrc.json` |
| 2026-09-14 | fuori passo 1 | `multiple-effect-provide` corretti (26 punti, 4 file) | `Layer.mergeAll` dove i layer sono indipendenti (`main.ts` + i fake dei test); `Layer.provide` in `CsvSheetReader.test.ts`, dove `CsvSheetReader.layer` richiede `FileSystem` e `mergeAll` non compila. Warning da 34 a 8; `tsc` e 177 test verdi. Scartato `ManagedRuntime` condiviso per i test: i fake chiudono su array mutabili per-test |
| 2026-09-14 | fuori passo 1 | helper `startingFrom`/`watching` in `fill.test.ts` | applicati a 11 + 7 siti; 4 siti irregolari lasciati espliciti perché la differenza è informativa. Scartato un `withDeps(...)` generico: accieca `multiple-effect-provide` e `layer-merge-all-with-dependencies` (dentro l'helper i layer sono parametri di tipo), non copre il caso `Layer.provide`, e aliasa un'API standard. Il file passa da 414 a 420 righe: il guadagno è nei nomi, non nella lunghezza |
| 2026-09-14 | fuori passo 1 | ultimi 8 warning chiusi → **0 warning, 0 error** | output di programma su `Console.log`/`Console.error` (verificato: non fa scattare `global-console*`, ed è un `Context.Reference` sostituibile); `Effect.timeoutOrElse`; `Schema.Int`. Il `console.error` dentro `Logger.make` soppresso con `// oxlint-disable-next-line` motivato: è il sink del logger. La sintassi `// @effect-diagnostics-next-line` **non** funziona passando da oxlint |
| 2026-09-14 | fuori passo 1 | regressione colta da `test/dryRun.test.ts` | `Effect.forEach(lines, Console.log)` stampava l'indice in coda a ogni riga: `forEach` passa `(item, index)` e `Console.log` è variadico. Serve la lambda esplicita |
| 2026-09-14 | passo 2 | clone di `anti-slop` | HEAD = `c44ef22`, cioè il commit del piano; `src/effect/` dipende solo da `@oxlint/plugins` e `oxlint/plugins-dev`, nessun file da `src/shared` o `src/vendor` |
| 2026-09-14 | passo 2 | `@oxlint/plugins@1.82.0` + `jsPlugins` su oxlint patchato | funziona; le regole compaiono come `anti-slop-effect/<nome>` |
| 2026-09-14 | passo 2 | RuleTester upstream con `node --test` | 5/5 verdi; verificato che il RuleTester fallisce davvero (caso `valid` rotto ad arte → `AssertionError`), quindi il silenzio è un pass reale |
| 2026-09-14 | passo 2 | primo `pnpm lint` con le 4 regole a error | 54 diagnostiche: `no-manual-tagged-construction` 44 (25 nei test), `no-manual-tag-comparison` 10, le altre due zero |
| 2026-09-14 | passo 2 | severità finali | 28 warning, 0 error, exit 0. Le due regole a rumore zero restano error |
| 2026-09-14 | passo 2 | prova negativa (file temporaneo, poi rimosso) | `no-manual-effect-error-tag`, `prefer-effect-match` e `no-manual-tagged-construction` scattano tutte. `no-manual-tag-comparison` **non** scatta dentro `Effect.catch`: è voluto, lì il bersaglio è `no-manual-effect-error-tag` |
| 2026-09-14 | passo 2 | `pnpm typecheck` (con `tools/` incluso) e `pnpm test` | verdi: tsc 0 errori, 177 test Vitest + 5 RuleTester |
| 2026-09-14 | fuori passo 2 | migrate le sei unioni di P15 a `Data.taggedEnum` | `ServiceAccountSource`, `Cursor`+`SheetWarning`, `SectionAction`+`SectionTarget`, `RaceOutcome`, una alla volta con typecheck e test a ogni passo. Ha chiuso anche tutti i punti di P14/P16: lo `switch` di `parseSheet` e i ternari di `planRow` diventano `$match`, i confronti di `summary`, `insertRowRequests`, `PrintSheetWriter` e `fill.test.ts` diventano `$is`. Da 28 warning a **0 warning, 0 error**; 177 test verdi |
| 2026-09-14 | fuori passo 2 | `no-manual-tag-comparison` e `no-manual-tagged-construction` alzate a `error` | rumore ormai zero, stesso criterio del passo 1d |
| 2026-09-14 | passo 3 | 11 regole in `tools/oxlint/effect-local/`, RuleTester con `node --test` | 16/16 verdi (5 anti-slop + 11 locali); verificato che un caso rotto ad arte fallisce con `AssertionError` |
| 2026-09-14 | passo 3 | primo `pnpm lint` con tutte le regole locali a error | 12 diagnostiche: `prefer-effect-fn` 7, `error-handling-in-effect-fn-handler` 2, `boundary-entrypoint-shape` 1, `redacted-secret-names` 1, `run-only-at-entry` 1 (`main.ts`, allowlist); nessuna nei test né in `tools/`, quindi nessun `overrides` oltre a `main.ts` |
| 2026-09-14 | passo 3 | prova negativa (file temporaneo in `src/`, poi rimosso) | scattano tutte le 7 regole a rumore zero sul codice attuale. Sovrapposizione: su `Effect.catch(() => Effect.void)` scatta anche `effecttsgo/catch-to-ignore` (warn), che però non vede `() => Effect.succeed(fallback)` |
| 2026-09-14 | passo 3 | severità finali, `pnpm typecheck`, `pnpm test` | 11 warning, 0 error, exit 0; tsc 0 errori; 177 test Vitest + 16 RuleTester |
| 2026-09-14 | passo 3 | `no-transport-types-in-generator` (P26) con opzione `transportTypes` | 17/17 RuleTester (anche i casi con opzione); prova negativa su `new Response` in un generatore: error; `pnpm lint` invariato a 11 warning, 0 error; tsc verde. L'opzione passata da `.oxlintrc.json` non è stata provata, solo via RuleTester |
| 2026-09-14 | catalogo | potatura delle voci meccanizzate | collassate in tabella solo P07, P11, P18: copertura verificata e nessuna decisione residua. P21 tenuta come sezione pur essendo coperta, perché il messaggio della regola consiglia `Effect.log`, sbagliato per l'output di una CLI. **P05 e P09 corretti da `coperto` a `parziale`**: prova negativa mostra scoperti `throw` in generatore, `Effect.fail("stringa")`, il catch-all senza parametro e la discriminazione manuale su `_tag` |

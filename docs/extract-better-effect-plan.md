# Piano di estrazione di `better-effect`

Piano implementativo di `docs/extract-better-effect.md`, scritto il 2026-09-23 su `HEAD` = `6168f69`. Il documento di intento resta la fonte delle decisioni; qui c'è solo l'ordine dei passi, i comandi e i criteri di verifica.

**Criterio di uscita**: su `inloco` convertito a Effect 4 gira `oxlint` con il preset `better-effect` e i numeri sono registrati per regola; la skill è installata lì e c'è almeno una lettura del codice prodotto dall'agente con e senza skill. Non serve altro per dire che l'iterazione è chiusa.

Collocazione decisa: **`~/projects/iacoware/better-effect`**. Nel piano è `$BE`.

## Meccanismo di consumo: dipendenza `link:`, non percorso assoluto

Scelta diversa da quella prefigurata nel documento di intento, a parità di scope.

Il documento verifica che `extends` **non** accetta specificatori bare e da lì conclude percorso assoluto nella config del consumer. Ma il giorno della pubblicazione la config del consumer sarà comunque un percorso **relativo dentro `node_modules`** — esattamente come `.oxlintrc.json` fa oggi con `@effect/tsgo`:

```json
{ "extends": ["./node_modules/@iacoware/better-effect/preset.json"] }
```

Se il checkout entra in `node_modules` come link (`pnpm add -D link:$BE`), quella stringa è **già oggi** la sua forma finale: committabile, identica per ogni consumer, e alla pubblicazione cambia solo la riga in `package.json` (`link:…` → `^0.1.0`). Il percorso assoluto invece non è committabile e andrebbe riscritto al momento della pubblicazione in ogni consumer.

Costo: un `pnpm install` per progetto valutato (due). Il fatto abilitante è già verificato nel documento di intento: il realpath del link sta fuori da `node_modules`, quindi Node fa type-stripping dei `.ts` e non serve compilare.

Resta una scorciatoia — `link:` punta a un percorso di **questa** macchina, quindi `package.json` committato con quella riga rompe per un collega — ma è una scorciatoia di un solo punto, non sparsa nella config del linter.

## Passo 0 · Verifica bloccante: skill via symlink

Prima di tutto, perché decide la forma del passo 6.

```bash
mkdir -p "$TMPDIR/probe-src"
cat > "$TMPDIR/probe-src/SKILL.md" <<'EOF'
---
name: probe
description: Sonda per verificare se una skill raggiunta via symlink viene raccolta.
---

Se leggi questo, il symlink funziona.
EOF
mkdir -p .claude/skills
ln -s "$TMPDIR/probe-src" .claude/skills/probe
```

Si controlla in una sessione **nuova** di Claude Code in questo repo se `probe` compare fra le skill disponibili (la lista è costruita all'avvio: una sessione già aperta non la rilegge). Poi `rm .claude/skills/probe`.

- **Se raccolta** → il passo 6 crea symlink.
- **Se non raccolta** → lo script copia, e va scritto nel README del nuovo repo che a ogni modifica della skill lo script va rilanciato.

## Passo 1 · Creare il repo

```bash
mkdir -p $BE && cd $BE && git init
pnpm init                       # name: @iacoware/better-effect, private: true, type: module
pnpm add -D @oxlint/plugins@1.82.0 oxlint@1.82.0 typescript@^7 @types/node
```

`@oxlint/plugins` pinnato senza caret e allineato a `oxlint`, per la stessa ragione per cui è pinnato qui: la compatibilità è dichiarata su versioni puntuali.

`package.json` scripts: `"test": "node --test rules/*.test.ts"` e `"typecheck": "tsc --noEmit"`.

Servono anche, e non sono ceremonia: un `tsconfig.json` che includa `index.ts`, `rules/`, `shared/` — copiabile da qui togliendo il plugin `@effect/language-service` e restringendo `include` — e un `.gitignore` con `node_modules/`. Senza il tsconfig il nuovo repo **perde un controllo che oggi esiste**: qui le regole sono typecheckate perché `tools/**/*.ts` sta nell'`include`, e `pnpm typecheck` le copre. Estratte e basta, non le guarderebbe più nessuno. Copiare anche `.oxfmtrc.json` se si vuole la stessa formattazione.

Scope `@iacoware`: è libero su npm e funge da forma finale se si pubblica lì. Non è una scelta costosa da rivedere — cambiarla significa toccare `name` qui e le due righe (`extends`, `link:`) di ogni consumer, e **non** tocca il prefisso delle regole, che viene da `meta.name` del plugin ed è deciso a parte.

`README.md` con la riga d'origine richiesta dal documento: repo `iacoware/trail-running-races`, commit `6168f69`, storia git non trasportata e perché (16 commit su 17 sono misti con `src/`).

## Passo 2 · Copiare le regole e rinominare il prefisso

```bash
cp -R tools/oxlint/effect-local/{index.ts,rules,shared,README.md} $BE/
```

Layout nel nuovo repo: `index.ts`, `rules/`, `shared/` alla radice (niente `tools/oxlint/…`: lì il plugin *è* il progetto).

Rinomina `effect-local` → `better-effect`, che nel nuovo repo tocca solo `index.ts` (`meta.name`) e `README.md`. In questo repo la rinomina arriva al passo 7.

Verifica: `node --test rules/*.test.ts` passa (20 regole, 20 file di test). Nessun test asserisce il nome del plugin, quindi la rinomina non dovrebbe romperli — se lo facesse, si aggiusta lì.

## Passo 3 · `preset.json`

```json
{
    "jsPlugins": ["./index.ts"],
    "rules": {
        "better-effect/adapter-import-boundary": "warn"
        // …tutte e 20 a warn
    }
}
```

Tutte a `warn` per decisione 3: si misura il rumore, non si blocca. Le severità odierne di `.oxlintrc.json` (10 `error`, 10 `warn`) si appiattiscono, e questo è voluto — vanno però registrate nel README come "severità con cui hanno girato qui", perché sono un dato sulla stabilità delle regole.

Nessun `extends` ai preset `effecttsgo` (decisione: fuori perimetro). Il README spiega come un consumer se li attiva da sé: cinque `extends` con `recommended` per ultimo, più `prepare: effect-tsgo patch --oxlint`.

Verifica: dal checkout, `pnpm exec oxlint --config preset.json rules/` carica il plugin senza `Unknown plugin`.

**Il JSON non basta per `inloco`** (fatto verificato il 2026-09-23, vedi passo 8): lì la config è un `oxlint.config.ts` che compone `defineConfig` di `oxlint`, non un `.oxlintrc.json` con `extends`. Due vie, da verificare in quest'ordine:

1. `defineConfig({ extends: ["…/preset.json"], … })` — se `extends` è supportato nella config TS, il preset JSON resta l'unico artefatto;
2. altrimenti il repo esporta **anche** `preset.ts` (`{ jsPlugins, rules }` come oggetto), dichiarato in `exports` del `package.json`. Questo apre la via bare-specifier, che il documento di intento dà per verificata su `jsPlugins` ma **non** su `extends`, e che qui è raggiungibile perché il consumer importa un modulo invece di risolvere un percorso.

Nel caso 2 i due artefatti condividono la lista delle regole, quindi il JSON va generato dal TS e non mantenuto a mano.

## Passo 4 · Spezzare il catalogo

`docs/effect-patterns.md` (1024 righe) si divide secondo la decisione 6. Va in `$BE/skill/reference/effect-patterns.md` (dentro la directory della skill, decisione 9):

- `Servizi e Layer`, `Errori`, `Confini e Schema`, `Matching e tipi dati`, `Stile degli effetti`, `Stile delle funzioni effettful e dei boundary`, `Euristiche di design` — cioè le sezioni di P01–P34 con sezione discorsiva;
- la tabella della sezione `Plugin locale` come indice delle regole, col prefisso rinominato.

Restano qui: `Fonti e metodo`, `Riepilogo`, `Pattern interamente meccanizzati`, `Regole anti-slop`, `Language service` e sottosezioni, `Prossimi passi`, `Migrazioni da fare`.

Potatura di ciò che si porta via, perché nel nuovo repo sarebbe falso:

- marcatori di stato (`conforme`, `devia`, `n/a`, `1 deviazione`) e colonne `Stato (2026-09-14)`;
- conteggi con file e riga (`src/config.ts:20`, `fill.ts:72`);
- severità `effecttsgo` citate dentro i pattern — P01, P05, P09, P28 — e le frasi «tutte `warn`»;
- verifiche datate in prosa («Verificato il 2026-09-16 che…»).

Da non toccare: la numerazione `P01`–`P34`, referenziata dal `README.md` del plugin e dai rimandi incrociati.

Marcature da aggiungere (decisione 9):

- ogni pattern meccanizzato porta il nome della **regola che lo impone** (`better-effect/…`, oppure «coperto da `effecttsgo`, non da questo preset» dove è quello il caso);
- i sette `solo-skill` — P03, P06, P12, P19, P20, P29, P31 — marcati **non verificati meccanicamente**, con la nota che P19 è metà coperto da `acquire-release-disposable`.

Il `Riepilogo` resta qui perché le sue ultime due colonne sono stato di questa codebase. Il nuovo repo ha come indice la tabella delle regole, che è la vista utile lì.

Verifica: nessun link interno rotto, `grep -n 'P0\|P1\|P2\|P3'` sui due file dà rimandi che risolvono.

## Passo 5 · La skill

`$BE/skill/SKILL.md`, sottile, con `reference/effect-patterns.md` accanto. Contiene **solo ciò che il linter non applica**:

- i sette pattern `solo-skill`, in rimando al file di riferimento, non ricopiati;
- la tabella di migrazione v3 → v4 (già in `docs/effect-patterns.md`, sezione `Prossimi passi` punto 5);
- il rimando a `node_modules/effect/AGENTS.md` e `ai-docs/` del pacchetto installato;
- l'istruzione di lanciare lint e typecheck prima di chiudere.

Niente prosa sulle regole già imposte dal preset.

## Passo 6 · Script di installazione della skill

`$BE/install-skill.sh <progetto>`: symlink (o copia, secondo l'esito del passo 0) da `$BE/skill` a `<progetto>/.claude/skills/better-effect`. Idempotente, rifiuta di sovrascrivere una directory reale non creata da lui.

## Passo 7 · Questo repo consuma il checkout (dogfood)

Decisione 2: `tools/oxlint/effect-local/` **non resta duplicato qui**.

```bash
pnpm add -D link:$BE
git rm -r tools/oxlint/effect-local
```

`.oxlintrc.json`:

- `extends`: aggiungere `"./node_modules/@iacoware/better-effect/preset.json"` — **dopo** i cinque preset `effecttsgo`, perché `recommended` alza le severità e non deve toccare le nostre;
- `jsPlugins`: resta solo `"./tools/oxlint/anti-slop-effect/index.ts"`;
- `rules`: via le 20 chiavi `effect-local/…`, e al loro posto un blocco che **rialza a `error` le dieci** che oggi lo sono: `adapter-import-boundary`, `no-bare-error-in-effect`, `no-parameterless-catch-all`, `no-provide-on-definition`, `no-transport-types-in-generator`, `provide-named-layer`, `run-only-at-entry`, `service-port-shape-only`, `single-style-per-function`, `try-object-form`. `pnpm lint` continua a bloccare come oggi. Il prezzo è che questo repo non è un consumer "puro" del preset: quando si leggono i numeri, i suoi sono severità nostre, non del preset.

Altri punti da toccare in questo repo:

- `package.json`: `test:lint-rules` punta a `tools/oxlint/**/rules/*.test.ts` — dopo la rimozione copre solo anti-slop. Resta valido, verificare che non fallisca con glob vuoto su un solo plugin.
- `overrides` per `tools/**`: la voce serviva anche ai casi di test di `effect-local`; va ricontrollata, non necessariamente rimossa (anti-slop ha gli stessi casi).
- `tsconfig.json` include `tools/**/*.ts`: resta corretto.
- `docs/effect-patterns.md`: rinominare il prefisso nelle parti che restano e sostituire i rimandi a `tools/oxlint/effect-local/README.md` col checkout.
- `docs/tech-choices.md`: annotare la dipendenza `link:` e il suo carattere locale.
- `docs/extract-better-effect.md`: **spostare** nel nuovo repo (tabella "Da dove copiare"). Questo piano lo segue: da lì in poi parla di un progetto che non vive più qui, e i due documenti vanno letti insieme.

Verifica, ed è il vero test dell'estrazione: `pnpm lint` dà lo stesso insieme di diagnostiche di prima della rimozione, modulo severità. Si cattura l'output **prima** di iniziare il passo 7 e si confronta:

```bash
pnpm lint --format json > $TMPDIR/before.json   # prima del passo 7
```

## Passo 8 · Valutazione su `inloco`

`~/projects/doubleloop/inloco`. **Stato verificato il 2026-09-23 su HEAD `2fd96e5`**, molto più avanti di come lo descrive il documento di intento del 2026-09-16:

- **Effect `4.0.0-rc.117`** (catalog pnpm), non `3.22.1`: la conversione a v4 è in corso avanzato (commit «record the outcome of effect-v4 phase 5c2»). Il prerequisito della decisione 4 è di fatto soddisfatto — **da riconfermare** al momento del passo, perché una fase in corso può lasciare pacchetti indietro.
- **`oxlint` 1.82.0**, la stessa versione di qui, con `@effect/tsgo` 0.45.0 e uno script `prepare` che applica la patch. Il rischio «allineamento versioni» è chiuso su questa codebase.
- La config **non è un `.oxlintrc.json`**: è un `oxlint.config.ts` per pacchetto che compone `@inloco/oxlint-config` (`tooling/oxlint-config/index.ts`, 216 righe, `defineConfig` di `oxlint`, una role config per ruolo di pacchetto, `typeAware: true`, preset `effecttsgo` già attivi come `warn`).

Due conseguenze che il documento di intento non poteva prevedere:

- **La forma di consumo va adattata** (vedi passo 3): o `extends` dentro `defineConfig`, o un `preset.ts` importabile. Il primo tentativo su `inloco` è questo, prima di qualunque misura.
- **I preset `effecttsgo` sono attivi lì**, mentre la scorciatoia 4 del documento assumeva il contrario. Le quattro regole ridimensionate (`prefer-effect-fn`, `single-style-per-function`, `service-port-shape-only`, `run-only-at-entry`) misureranno quindi **come qui**, non meno; e `no-provide-on-definition` non misurerà di più, perché `strict-effect-provide` c'è. La nota di lettura dei numeri in fondo a questo passo vale per una codebase senza preset, non per `inloco`.

Un'altra opportunità, non nel perimetro ma da registrare: `@inloco/oxlint-config` è un pacchetto workspace con role config. Se il preset ci entra, si scopre subito se la granularità per ruolo regge — che è esattamente il feedback cercato.

1. Integrare `@iacoware/better-effect` in `tooling/oxlint-config/index.ts` (`pnpm add -D link:$BE` in quel pacchetto), a partire da **un solo ruolo** — un `impl` package — non da tutto il monorepo: il rumore va letto un ruolo alla volta. Poi `install-skill.sh`.
2. Riconfigurare le opzioni, che oggi sono i default di questo repo: `entryFiles` (`**/main.ts`, `**/cli.ts`, `**/bin/**` — su Next.js non esistono), `testFiles`, `transportTypes` (`Response`, `NextResponse` — lì servono davvero). **Il lavoro di riconfigurazione è esso stesso un dato**: va registrato quale regola ha richiesto cosa.
3. Sorvegliare `adapter-import-boundary`, che legge il filesystem per riconoscere le directory che costruiscono un `Layer`: su un layout Next.js il suo comportamento è ignoto. Se spara rumore strutturale, spegnerla e annotarlo, non tararla ora.
4. Registrare, in un file di misura nel nuovo repo: commit hash del checkout per ogni misura (scorciatoia 1 del documento), violazioni per regola, falsi positivi con esempio, regole riconfigurate o spente.
5. Per i sette `solo-skill` la misura non è un conteggio: una lettura del codice prodotto dall'agente su uno stesso task, con e senza skill installata.

Nota di lettura dei numeri (scorciatoia 4), valida per un consumer **senza** preset `effecttsgo` — non per `inloco`, che ce li ha: senza preset attivo, quattro regole (`prefer-effect-fn`, `single-style-per-function`, `service-port-shape-only`, `run-only-at-entry`) misurano meno del catalogo — tranne `service-port-shape-only`, misurato il 2026-09-16 come non duplicato da `effecttsgo/service-not-as-class` — mentre `no-provide-on-definition` misura **di più**, perché lì non c'è `strict-effect-provide` a coprirla in parte.

## Ordine e dipendenze

0 blocca 6. 1 → 2 → 3 sono sequenziali. 4 → 5 sequenziali e indipendenti da 2/3. 7 richiede 3. 8 richiede 6 e 7 (il dogfood scopre gli attriti prima di portarli su una codebase non nostra).

## Dove eseguire ogni passo

La sandbox di Claude Code consente scrittura sulla working directory della sessione: ogni blocco va eseguito da una sessione radicata nel repo che scrive. La lettura è quasi libera, quindi da `$BE` si legge e si copia da qui senza attriti.

| Passo | Working directory | Perché lì |
| --- | --- | --- |
| 0 | questo repo | scrive `.claude/skills/probe`; serve una sessione **nuova**, la lista delle skill si costruisce all'avvio |
| 1–6 | `$BE` | dal passo 1 il progetto *è* `$BE`; legge questo repo solo per copiare regole e catalogo |
| 7 | questo repo | `pnpm add -D link:$BE`, `git rm`, `.oxlintrc.json`, docs |
| 8 | `~/projects/doubleloop/inloco` | modifiche e `pnpm install` in quel repo |

Disabilitare la sandbox serve solo per fare tutto da una sessione sola: creare `$BE` da qui è una scrittura fuori dalla working directory e viene negata.

`pnpm install` in `$BE` e in `inloco` richiede rete verso il registry: se il proxy la nega, l'host va aggiunto ai domini consentiti del comando.

Al passo 7 questo piano si sposta in `$BE` insieme a `docs/extract-better-effect.md` — da lì in poi parla di un progetto che non vive più qui.

## Rischi che il piano non chiude

- **Allineamento versioni**: `@oxlint/plugins` del checkout deve combaciare con l'`oxlint` del consumer. Su `inloco` il rischio è chiuso (entrambi 1.82.0, verificato il 2026-09-23); resta aperto per il terzo consumer, e il primo disallineamento è esso stesso un dato.
- **Effect 4 assunto**: le regole confrontano i nomi alla lettera, `import { Effect as E }` sfugge ovunque. Su codebase v3 il silenzio non è conformità.
- **`RuleTester` solo nel checkout**: una regressione di una regola si vede solo lanciando i test lì, non nei consumer.
- **Omonimia npm**: `better-effect@0.14.0` esiste ed è attivo nello stesso spazio semantico. Non blocca nulla finché non si pubblica; il nome del repo e il prefisso delle regole restano `better-effect`.

## Open questions

- **Forma del preset per `inloco`**: se `defineConfig` non accetta `extends` verso un JSON esterno, il repo deve spedire anche un `preset.ts` e generare il JSON da quello. Il passo 3 lo prevede, ma quale delle due vie regga non è verificato: è la prima cosa da provare, e cambia l'artefatto principale del progetto.
- **Cosa rende una misura azionabile**: il piano dice cosa registrare, non quale soglia fa dire "questa regola va tenuta / tarata / buttata". Finché non c'è un numero non si può fissare seriamente, ma senza criterio la valutazione rischia di chiudersi con dei dati e nessuna decisione.

# Estrazione di `effect-local` in un progetto esterno

Documento di intento e decisioni, scritto il 2026-09-16. L'estrazione **non è stata fatta** in questa sessione: da qui si genera il piano implementativo. I fatti marcati come verificati sono stati provati su questo repo con `oxlint` 1.82.0 patchato da `@effect/tsgo` 0.45.0, e gli artefatti di prova sono stati rimossi.

## Intento

Portare le regole di `tools/oxlint/effect-local/` fuori da questo repo, in un progetto a sé, perché altri progetti — miei e dell'azienda — possano adottarle. Lo scopo immediato **non** è la distribuzione: è **raccogliere feedback sull'utilità delle regole** su codebase reali, per capire quanto aiutino gli agenti a produrre codice Effect più leggibile e più in linea con il nostro modo di scrivere. La pubblicazione vera viene dopo, e solo se la valutazione la giustifica.

L'obiettivo di processo domina il resto: **ridurre lo scope per avere feedback prima**. Le scorciatoie prese consapevolmente sono benvenute, purché scritte.

## Perimetro

Dentro:

- il plugin `effect-local` (20 regole, `rules/` + `shared/` + `index.ts`);
- un preset oxlint spedito col progetto;
- il **catalogo dei pattern** come documentazione delle regole (vedi decisione 6).

Fuori, per ora:

- **`anti-slop-effect`**: resta vendorizzato qui, non viene ridistribuito. Evita anche la questione della licenza MIT di terzi da riportare.
- **preset `effecttsgo`**: se un consumer le vuole, se le attiva da sé (`extends` sui cinque preset di `@effect/tsgo` — `antipattern`, `correctness`, `effect-native`, `style`, e `recommended` per ultimo perché ne alza le severità — più `prepare: effect-tsgo patch --oxlint`). Non le impacchettiamo.
- **hook e `CLAUDE.md` condiviso**: fuori da questa iterazione. La **skill** invece rientra, sottile: vedi decisione 8.
- **pubblicazione su npm**, versionamento, compilazione: fuori. Si consuma da checkout locale.

## Decisioni prese

1. **Consumo da checkout locale**, senza pubblicare e senza installare nulla nei progetti valutati.
2. **Questo repo consuma il checkout**: `tools/oxlint/effect-local/` non resta duplicato qui, il repo punta al progetto esterno come ogni altro consumer. Dogfood immediato: gli attriti si scoprono subito.
3. **Preset unico, tutte le regole a `warn`**. Serve a misurare il rumore, non a bloccare. Niente scaglioni `recommended`/`strict` finché non ci sono numeri.
4. **Prima codebase di valutazione: `inloco`**, su un branch in cui verrà prima convertito a Effect 4. Questo chiude il rischio "regole tarate su Effect 4, codebase in Effect 3" che renderebbe il rumore zero un falso negativo.
5. **Nome: `better-effect`**, che è anche il **prefisso delle regole**: `better-effect/no-inline-yield-star`. Il prefisso compare in ogni messaggio di diagnostica e in ogni config dei consumer, quindi è stato scelto ora e non dopo l'adozione. La rinomina da `effect-local` tocca **61 occorrenze in 5 file**: `tools/oxlint/effect-local/index.ts` (il `meta.name` del plugin), il suo `README.md`, la directory stessa, le 20 chiavi di regola in `.oxlintrc.json`, più `docs/effect-patterns.md` e questo documento.
6. **Il catalogo dei pattern diventa la documentazione del nuovo progetto.** `docs/effect-patterns.md` viene **spezzato**, non copiato: le sezioni di pattern vanno con le regole, le sezioni che descrivono la configurazione di _questo_ repo restano qui. Il razionale dei pattern è l'unica documentazione che le regole abbiano, e qui resterebbe orfano una volta che le regole se ne vanno.

    Vanno nel nuovo repo: `Servizi e Layer`, `Errori`, `Confini e Schema`, `Matching e tipi dati`, `Stile degli effetti`, `Stile delle funzioni effettful e dei boundary`, `Euristiche di design`, più la tabella della sezione `Plugin locale` come indice delle regole.

    Restano qui: `Fonti e metodo`, `Riepilogo`, `Pattern interamente meccanizzati` (le tre indicate), e in più — perché parlano di ciò che **non** viene estratto — `Regole anti-slop`, `Language service` con le sue sottosezioni (`Integrazione ufficiale con oxlint`, `Copertura reale del preset, per pattern`), `Prossimi passi`, `Migrazioni da fare`.

    Da ripulire in ciò che si porta via, **perché nel nuovo repo sarebbe falso**: ogni marcatore di stato riferito a questo repo (`conforme`, `devia`, `n/a`, `1 deviazione`), i conteggi di violazioni con nome di file e riga (`src/config.ts:20`, `fill.ts:72`), le colonne `Stato (2026-09-14)` e le date di verifica, le severità delle regole `effecttsgo` citate dentro i pattern (`(warn)`, `(error)`, «tutte `warn`»: P01, P05, P09, P28) e le verifiche datate in prosa («Verificato il 2026-09-16 che…»). Sono misure di questa codebase e di questa configurazione a una data, non proprietà dei pattern: la severità che il consumer vedrà dipende dai preset che attiva lui.

    Da **non** toccare: la numerazione `P01`–`P34`. È referenziata dalla tabella in `tools/oxlint/effect-local/README.md` e dai rimandi incrociati fra pattern; rinumerare romperebbe entrambi senza guadagno.

    I pattern `solo-skill` (P03, P06, P12, P19, P20, P29, P31) si portano via anche se nessuna regola li impone — P19 in parte sì, con `acquire-release-disposable` sulla sola metà `acquireRelease` —: sono lo stile di casa e il seme della skill futura. Vanno però marcati come non verificati meccanicamente, perché il lettore non li scambi per regole attive.

7. **`docs/effect-patterns-plan.md` è stato cancellato** (2026-09-16): era un documento di lavoro temporaneo, con tutti i passi chiusi. I fatti ancora utili erano già riportati qui e nel catalogo, tranne il pin di `oxlint` senza caret, spostato in `docs/effect-patterns.md` prima di cancellare.
8. **Il nuovo repo contiene anche una skill per i pattern `solo-skill`.** Il preset lint copre solo ciò che è meccanizzabile: senza la skill, metà dell'obiettivo — codice Effect più leggibile e più in linea col nostro modo di scrivere — resta fuori dalla valutazione, perché P03, P06, P12, P19, P20, P29 e P31 nessuna regola li vede, salvo mezzo P19. Il costo marginale è basso: dopo la decisione 6 quei testi sono già nel repo.

    Vincolo di scope, ereditato dal passo 5 del catalogo: la skill è **sottile** e contiene **solo ciò che il linter non applica già**. I sette pattern `solo-skill`, la tabella di migrazione v3 → v4, il rimando a `node_modules/effect/AGENTS.md` e `ai-docs/` del pacchetto installato, e l'istruzione di lanciare lint e typecheck prima di chiudere. Ripetere in prosa le regole già imposte dal preset aggiungerebbe solo una seconda fonte da tenere allineata.

9. **Il catalogo è il file di riferimento della skill, non un documento separato.** Regole e skill vivono nello stesso repo, quindi i sette pattern `solo-skill` rischiavano di esistere in due copie — nel catalogo portato via dalla decisione 6 e dentro la skill — che divergono alla prima modifica. Il catalogo sta perciò **dentro la directory della skill** come suo file di riferimento, e `SKILL.md` resta l'ingresso sottile che ci rimanda. Una fonte sola.

    Ne segue il trattamento dei pattern meccanizzati, che nel catalogo restano: ognuno va marcato con la **regola che lo impone**. Il documento spiega il perché, il linter impone il come; nessuno dei due ripete l'altro.

10. **La skill si installa con uno script che crea un symlink** dal checkout dentro `.claude/skills/` del progetto consumer, coerente con la scelta di non pubblicare nulla. Da verificare come prima cosa che una skill raggiunta per symlink venga effettivamente raccolta: se non lo fosse, il ripiego è che lo stesso script copi invece di collegare, al prezzo di dover rilanciare lo script a ogni modifica della skill.

## Da dove copiare, e dove guardare

Repo di origine: `iacoware/trail-running-races`, commit **`c7f2e9b`** (2026-09-16), che è lo stato su cui tutto qui è stato verificato. La storia git delle regole **non** viene trasportata: dei 17 commit che toccano la directory 16 sono misti con il codice `src/` che le regole hanno costretto a migrare, quindi nel nuovo repo parlerebbero di file inesistenti. Questa riga è la mitigazione: il contesto resta raggiungibile.

Percorsi assoluti sulla macchina di sviluppo, da usare durante l'estrazione:

| Cosa                           | Percorso                                                                               | Azione                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Sorgenti delle regole          | `/Users/iacoware/projects/iacoware/trail-running-races/tools/oxlint/effect-local/`     | **copiare** (`index.ts`, `rules/`, `shared/`, `README.md`)  |
| Catalogo dei pattern           | `/Users/iacoware/projects/iacoware/trail-running-races/docs/effect-patterns.md`        | **copiare e potare** secondo la decisione 6                 |
| Questo documento               | `/Users/iacoware/projects/iacoware/trail-running-races/docs/extract-better-effect.md`  | **spostare** nel nuovo repo                                 |
| Severità e opzioni oggi in uso | `/Users/iacoware/projects/iacoware/trail-running-races/.oxlintrc.json`                 | **consultare**: da qui si ricava il preset (tutto a `warn`) |
| Regole anti-slop vendorizzate  | `/Users/iacoware/projects/iacoware/trail-running-races/tools/oxlint/anti-slop-effect/` | **non copiare**: fuori perimetro, resta qui                 |

Nel nuovo repo va messa una riga di README con origine e commit, così l'omissione della storia è dichiarata invece che subita.

## Meccanismo di consumo (verificato)

Il consumer mette nel proprio `.oxlintrc.json`:

```json
{ "extends": ["/percorso/al/checkout/preset.json"] }
```

e il preset del checkout dichiara da sé i propri plugin:

```json
{
    "jsPlugins": ["./index.ts"],
    "rules": { "effect-local/...": "warn" }
}
```

Requisito scoperto in verifica: **il checkout deve avere il proprio `node_modules/@oxlint/plugins`** (un `pnpm install` lì dentro). Il plugin risolve le sue dipendenze dalla propria posizione reale, non da quella del consumer.

I sorgenti restano `.ts` non compilati: funzionano perché il checkout sta **fuori** da `node_modules`.

## Fatti verificati

- `jsPlugins` accetta specificatori bare e li risolve via `exports`, ma Node **rifiuta il type-stripping dentro `node_modules`** (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`): un pacchetto installato dovrebbe spedire JS compilato.
- Un symlink (quello che crea `pnpm add -D file:...`) **aggira** il divieto, perché il realpath è fuori da `node_modules`. Funziona, ma non serve in questa fase: aggiunge un install per progetto senza dare nulla in più.
- `extends` **non** accetta specificatori bare: risolve relativamente al file di configurazione. Da qui il percorso assoluto al preset.
- Un preset può dichiarare i propri `jsPlugins`, **risolti relativamente al file del preset**. È ciò che rende la config del consumer una riga sola.
- Il plugin caricato da un altro progetto funziona a tutti gli effetti: in prova hanno sparato `no-bare-error-in-effect` e `run-only-at-entry` su una codebase esterna, con la working directory del consumer.
- Per il giorno della pubblicazione: la compilazione va fatta in **ESM** (`tsc --module esnext --rewriteRelativeImportExtensions`). Con `--module nodenext` e nessun `package.json` `type: module` nella root dei sorgenti esce CJS e oxlint fallisce con `exports is not defined`.
- Le regole `effecttsgo` **non si caricano senza** `effect-tsgo patch --oxlint`: senza patch `oxlint` rifiuta il preset con `Unknown plugin: 'effecttsgo'`, perché il plugin sta nel binario e non è caricabile da configurazione. La patch sostituisce anche il `tsc` della piattaforma, conservandone una copia `.original`.
- **Il nome `better-effect` è già occupato su npm**, e non da un pacchetto morto: `better-effect@0.14.0`, pubblicato il 2026-09-09, `github.com/nitoba/better-effect`, descritto come "Effect-inspired application architecture for better-result with typechecked Services and environments". Sono liberi (404 sul registry, 2026-09-16) `@doubleloop/better-effect`, `@iacoware/better-effect` e `oxlint-plugin-better-effect`. La scelta del nome **non blocca nulla adesso**, perché il consumo è da checkout locale: il nome del repo e il prefisso delle regole restano `better-effect` a prescindere.

## Scorciatoie consapevoli e loro costo

1. **Nessun versionamento**: ogni consumer punta a HEAD del checkout. Se una regola cambia mentre si raccolgono i numeri, le misure non sono confrontabili → **annotare il commit hash del checkout** insieme a ogni misura.
2. **Percorso assoluto nella config del consumer**: non committabile, è specifico della macchina. Vale finché la valutazione è locale; appena un collega deve provarlo serve il pacchetto.
3. **Nessuna compilazione**: i `.ts` si caricano solo perché fuori da `node_modules`. Il passaggio a npm richiede il build ESM descritto sopra.
4. **Segnale ridotto**: quattro regole (`prefer-effect-fn`, `single-style-per-function`, `service-port-shape-only`, `run-only-at-entry`) erano state ridimensionate proprio perché il preset `effecttsgo` copriva il resto dei rispettivi pattern. Senza quel preset attivo nel consumer, `effect-local` da sola misura meno di quanto il catalogo lasci intendere. È coerente con l'obiettivo — è il pezzo "nostro" che vogliamo valutare — ma va tenuto presente leggendo i numeri. Due sovrapposizioni sono però state misurate il 2026-09-16: `effecttsgo/service-not-as-class` **non** duplica `service-port-shape-only`, che quindi misura quanto prima anche senza preset; `effecttsgo/strict-effect-provide` duplica invece in parte `no-provide-on-definition`, che non è fra le quattro, quindi lì il consumer senza preset misura di più, non di meno.

## Rischi noti

- **Allineamento versioni**: `@oxlint/plugins` del checkout deve combaciare con l'`oxlint` del consumer (oggi 1.82.0). È il primo attrito atteso su un progetto con oxlint diverso.
- **Effect 4 assunto**: le regole confrontano i nomi **alla lettera** (`Context.Service`, `Effect.catch`, `Result`; `import { Effect as E }` sfugge ovunque). Su codebase Effect 3 il silenzio non è conformità. Mitigato dalla decisione 4.
- **Le opzioni sono i default di questo repo**: `entryFiles` (`**/main.ts`, `**/cli.ts`, `**/bin/**`), `testFiles`, `transportTypes` (`Response`, `NextResponse`). Su `inloco` — Next.js, non una CLI — vanno riconfigurate, e il loro adattamento è esso stesso un dato sull'utilità delle regole.
- **`adapter-import-boundary` legge il filesystem** per riconoscere gli adapter (una directory che costruisce un `Layer`). Su un layout diverso da questo il suo comportamento è ignoto.
- **I `RuleTester`** (`node --test`) restano nel checkout: il consumer non li esegue, quindi una regressione si vede solo lì.
- **Omonimia con un pacchetto attivo**: l'altro `better-effect` sta nello stesso spazio semantico (servizi tipati, DI, risorse con lifetime), quindi la confusione sarebbe reale e non solo di nome. Riguarda la comunicazione esterna, non la valutazione locale; diventa una decisione solo se si pubblica.

## Cosa resta da decidere nel piano

- Come questo repo esprime il percorso del checkout, dato che è assoluto e la config è committata (variabile d'ambiente, config locale non tracciata, o si accetta il percorso assoluto finché la valutazione è locale).
- Collocazione del progetto esterno (il nome è deciso: `better-effect`).
- **Solo se si pubblica**: con quale nome, dato che `better-effect` non è disponibile su npm. Candidati liberi oggi: `@doubleloop/better-effect` (scope aziendale, anche il pacchetto mantiene il nome del progetto) oppure `oxlint-plugin-better-effect` (idiomatico per l'ecosistema lint, ma senza scope resta accanto all'omonimo).
- Cosa si misura su `inloco` e come si registra: violazioni per regola, falsi positivi, regole riconfigurate, commit hash del checkout. Per i pattern `solo-skill` la misura non può essere il conteggio del linter: va deciso cosa si guarda (per esempio una lettura del codice prodotto dall'agente con e senza skill).

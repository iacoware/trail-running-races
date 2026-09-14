# anti-slop-effect (vendorizzato)

Copia di `src/effect/` di [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop), commit `c44ef22`, licenza MIT (vedi `LICENSE`).

I file sono **invariati rispetto all'upstream**: per aggiornarli, ricopiare `src/effect/` da un commit più recente e aggiornare questa nota, non modificarli in loco.

## Uso

Il plugin è caricato da `.oxlintrc.json` (`jsPlugins`); le regole hanno prefisso `anti-slop-effect/`. Severità attive e motivazioni stanno in `docs/effect-patterns.md`.

`no-service-constructor-imports` è vendorizzata ma non attivata: il repo non espone costruttori di servizio da importare.

## Test

`pnpm test:lint-rules` esegue i `RuleTester` upstream con `node --test`. Sono esclusi da Vitest in `vitest.config.ts`: non sono suite Vitest.

## Dipendenze

`@oxlint/plugins` è pinnato a `1.82.0`, la stessa versione di `oxlint` (l'upstream pinna `1.78.0`; i cinque RuleTester passano anche a `1.82.0`).

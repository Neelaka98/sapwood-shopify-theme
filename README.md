# Smallholder

A Shopify Online Store 2.0 theme for small producers who sell what they make. Working name.

## Setup

Needs Node 24 (`nvm use` reads `.nvmrc`) and a Shopify development store.

```bash
nvm use
npm install
export SHOPIFY_FLAG_STORE=<your-store>.myshopify.com
export SHOPIFY_FLAG_STORE_PASSWORD=<storefront password>
npm run dev
```

`npm run dev` watches `src/` and runs `shopify theme dev` at http://127.0.0.1:9292. The first run opens a browser to log in to Shopify.

## Scripts

| Script | What it does |
|---|---|
| `npm run build` | Compiles `src/css/theme.css` to `assets/theme.css` and `src/ts/theme.ts` to `assets/theme.js` |
| `npm run dev` | Build watchers plus `shopify theme dev` |
| `npm run check` | Theme Check, failing on errors |
| `npm test` | Unit tests in `tests/unit` |
| `npm run typecheck` | TypeScript check of `src/ts` |

`assets/theme.css` and `assets/theme.js` are build output, but they are committed: Shopify's GitHub integration uploads the repo as it is. Run `npm run build` before committing changes to `src/`.

## Colour schemes

Sections pick one of three schemes. Each scheme sets `--scheme-*` variables (see `snippets/theme-styles.liquid`), and Tailwind utilities such as `text-ink` and `bg-tint` read them, so markup never changes with the scheme.

| Scheme | Background | Text | Heading | Muted | Button / text | Border |
|---|---|---|---|---|---|---|
| light | #FFFFFF | #590303 | #8C1A0F | #A64D2D | #ADBF24 / #590303 | #598C0D |
| band | #8C1A0F | #FBFAF6 | #FBFAF6 | #D6DF91 | #ADBF24 / #590303 | #D6DF91 |
| dark | #590303 | #FBFAF6 | #ADBF24 | #D6DF91 | #ADBF24 / #590303 | #ADBF24 |

Every text and button pair passes WCAG 2.1 AA (4.5:1). The lowest is muted text on white at 5.64:1. Merchants who change the colours are responsible for contrast; the colour setting's help text says so.

## Fonts

Defaults: heading `jost_n7` and body `jost_n4`, from Shopify's font library. The concept this theme comes from uses Hanken Grotesk for body text, but Shopify's font library does not include it (the font picker rejected `hanken_grotesk_n4`), so Jost is used for both.

## Accessibility notes

- The header's country selector keeps a visible Update button. Submitting on change fails WCAG 2.1 SC 3.2.2 (On Input).
- `snippets/product-card.liquid` takes a `heading_tag` parameter. Pass `h2` on pages that already have an `h1`, and `h3` under an `h2` section heading, so the heading order stays correct.

## Tests

- `npm test` runs the unit tests.
- With `npm run dev` running, each file in `tests/browser/` is an in-page check: open the page it names and run `agent-browser eval --stdin < tests/browser/<file>`. Each prints a line ending in `ok` or throws with the failing assertion.

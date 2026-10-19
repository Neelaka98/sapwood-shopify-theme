# Sapwood

A Shopify Online Store 2.0 theme for small producers who sell what they make.

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
| `npm run build` | Compiles `src/css/theme.css` to `assets/theme.css`, and `src/ts/theme.ts` and `src/ts/motion.ts` to `assets/theme.js` and `assets/motion.js` |
| `npm run dev` | Build watchers plus `shopify theme dev` |
| `npm run check` | Theme Check, failing on errors |
| `npm test` | Unit tests in `tests/unit` |
| `npm run typecheck` | TypeScript check of `src/ts` |
| `node scripts/create-metafields.mjs` | Creates the metafield and metaobject definitions below on the store in `SHOPIFY_FLAG_STORE`, using an Admin API token in `SHOPIFY_ADMIN_TOKEN` with the products and metaobject definitions scopes. Safe to run again. |

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

## Sections

| Section | Notes |
|---|---|
| Hero | The first section on a page renders its heading as the page's `h1`, and loads its image eagerly. A Shopify video replaces the image, plays muted and has a pause button; it stays paused for visitors who ask for reduced motion. |
| Image with text | Image left or right of a heading, rich text and a link. |
| Origin map | Upload a map image and set the pin in percent. Screen readers skip the pin, so describe the place in the image's alt text. The pin label sits right of the pin, and moves to its left when the pin is more than 60 percent across. |
| Process steps | One block per step, up to 6. From 1024 px wide and 700 px tall, with motion on, the section pins and steps through the blocks as the page scrolls, with a progress line and a button per step. Selecting a step block in the editor shows that step. Phones, short screens and reduced motion get the steps stacked. |
| Featured product | Uses the product page's price, variant picker and add to cart. Does not change the page address when a variant is picked. |
| Product grid | Collection, 2 to 6 products, and whether card images show whole or fill the card. |
| Certifications | Logo, name, text and link per block. Logos are decorative because the name is beside them. |
| Trust strip | Up to 6 short text blocks in one row. |
| Video | Shopify video with native controls, or a YouTube or Vimeo link behind a cover image. The player only loads when the visitor presses play, and without JavaScript the cover links to the video's own site. |
| FAQ | Question and answer blocks as `<details>`. With "Use the product's FAQ" on, product pages show the product's `custom.faq` entries instead, and nothing when it has none. The product template has this section with the setting on. |
| Reviews | An app block slot on the product template. Renders nothing until a reviews app block is added. |
| Product | Blocks for title, price, variant picker, quantity and add to cart, description and a link box, plus nutrition, pack details and how to use, which read the metafields under Product data and show nothing when they are empty. Pack details follow the selected variant. |
| Contact form | Name, email, phone and message. With "Ask for business details" on, it asks for business name, email, country, volume and message instead, for wholesale inquiries. Both send to the store's sender email. |

## Motion

With Theme settings > Motion on, `layout/theme.liquid` loads `assets/motion.js` (GSAP 3.15.0 with ScrollTrigger and SplitText) at the end of the page. Visitors who ask for reduced motion never download it, and turning reduced motion on with the page open undoes it. Section headings rise in line by line, product grid cards rise in one after another, and the process section pins on wide screens. Anything already on screen when the script runs is left as it is, so nothing flashes.

Add `data-reveal-group` to a list to have its items rise in the same way.

## Product data

Product blocks and the product FAQ read these metafields. Each block renders nothing when its metafield is empty. `scripts/create-metafields.mjs` creates every definition below.

| Owner | Key | Type | Used by |
|---|---|---|---|
| Product | `custom.shelf_life_months` | integer | Pack details block |
| Product | `custom.nutrition` | metaobject reference (`nutrition_table`) | Nutrition block |
| Product | `custom.faq` | list of metaobject references (`faq_item`) | FAQ section with "Use the product's FAQ" on |
| Product | `custom.how_to_use` | list of metaobject references (`usage_step`) | How to use block |
| Variant | `custom.closure` | single line text | Pack details block |
| Variant | `custom.gross_weight_kg` | decimal | Pack details block |
| Variant | `custom.carton` | metaobject reference (`carton`) | Pack details block |

Metaobjects, all with storefront access so Liquid can read them:

- `nutrition_table`: `basis` (single line text, for example "Per 100 g") and `rows` (list of `nutrition_row` references, required).
- `nutrition_row`: `nutrient` and `amount` (single line text, both required).
- `faq_item`: `question` (single line text) and `answer` (rich text), both required.
- `usage_step`: `title` (single line text, required), `text` (multi-line text) and `image` (image file).
- `carton`: `units` (integer), `gross_kg` and `net_kg` (decimal), `length_mm`, `width_mm` and `height_mm` (integers), all required.

## Tests

- `npm test` runs the unit tests.
- With `npm run dev` running, each file in `tests/browser/` is an in-page check: open the page it names and run `agent-browser eval --stdin < tests/browser/<file>`. Each prints a line ending in `ok` or throws with the failing assertion.

# Smallholder Shopify theme design

Smallholder is a Shopify Online Store 2.0 theme for small producers who sell what they make. It is ported from the RaaLa Kithul design concept (`~/Development/Raala-pitch`), an Astro 7 and Tailwind 4 site. RaaLa declined the concept, so none of RaaLa's brand assets, copy or product data may ship in this theme. The layout, components, motion and interaction logic are Neelaka Ganegoda's own work and carry over.

"Smallholder" is a working name. It appears in `config/settings_schema.json` (`theme_info`), `package.json`, the README and the repo folder, and can be changed in those four places.

## Goals

The first goal is a theme Neelaka can install for food-brand clients and adjust per client. The second is that the theme can grow into a Shopify Theme Store submission without a rewrite. Version 1 therefore follows Theme Store structure and conventions (JSON templates, sections and blocks, locales, colour schemes, Theme Check passing), but does not build every page type the Theme Store requires.

### Out of scope for version 1

- Theme Store-only requirements: collection filtering, customer account templates, gift card template, blog and article templates, multiple style presets, a second demo brand in another product category. Any store that sells gift cards shows Shopify's unstyled fallback gift card page until the theme adds `templates/gift_card.liquid`, planned for a later plan.
- A shipping estimator. Shopify shows real rates at checkout.
- Built-in reviews. The theme has an app block slot for a reviews app.
- B2B pricing, which needs Shopify Plus. Trade buyers use the wholesale inquiry form.

## Repository and build

The theme lives in its own repo at `~/Development/smallholder`. The Astro concept repo is left unchanged as a portfolio piece.

```
assets/        compiled theme.css and theme.js, fonts, icons
config/        settings_schema.json, settings_data.json
layout/        theme.liquid, password.liquid
locales/       en.default.json, en.default.schema.json
sections/      one file per section, plus header and footer section groups
snippets/      price, icon, responsive image, product card
templates/     index, product, collection, cart, search, page, page.contact, 404, password (all JSON)
src/           Tailwind entry and token CSS, TypeScript sources
```

Tailwind CLI compiles `src/` to `assets/theme.css`. esbuild bundles the TypeScript to `assets/theme.js`. `npm run dev` runs both in watch mode alongside `shopify theme dev`. `npm run build` produces the compiled assets once. `npm run check` runs `shopify theme check`. A `.shopifyignore` keeps `src/`, `node_modules`, `docs/` and the build config out of theme uploads.

Compiled assets are committed, because Shopify's GitHub integration and theme uploads use the files in the repo as they are.

## Text

Every string a shopper sees and the theme supplies (button labels, cart messages, form errors, accessibility labels) lives in `locales/en.default.json`. Editor labels for settings live in `locales/en.default.schema.json`. Liquid never hard-codes these strings. Copy the merchant writes (headings, body text, FAQ entries) lives in section settings and blocks.

## Theme settings

### Colour schemes

The theme uses Shopify's `color_scheme_group` setting. Each scheme defines background, text, heading, muted text, button, button text and border colours. Every section has a colour scheme setting.

The demo ships three schemes from the concept palette:

| Scheme | Background | Text | Heading | Muted | Button / button text | Border |
|---|---|---|---|---|---|---|
| Light | #FFFFFF | #590303 | #8C1A0F | #A64D2D | #ADBF24 / #590303 | #598C0D |
| Band | #8C1A0F | #FBFAF6 | #FBFAF6 | #D6DF91 | #ADBF24 / #590303 | #D6DF91 |
| Dark | #590303 | #FBFAF6 | #ADBF24 | #D6DF91 | #ADBF24 / #590303 | #ADBF24 |

These pairs come from the WCAG 2.1 contrast table in the concept's `src/styles/tokens.css`, which is copied into the README with the reasons for each default. A merchant who changes colours is responsible for contrast, and the colour scheme setting's info text says so.

### Mapping to Tailwind

`src/` defines Tailwind theme tokens (`--color-ground`, `--color-ink`, `--color-heading`, `--color-muted`, `--color-accent`, `--color-on-accent`, `--color-line`, plus the derived `--color-tint` and `--color-hairline`) that point to `--scheme-*` CSS variables. These names give readable utilities such as `bg-ground` and `text-ink`, where `--color-text` would give `text-text`. `theme.liquid` writes the `--scheme-*` variables once per scheme under a `.color-<scheme-id>` class, and each section's wrapper carries the class for its chosen scheme. Class names in markup never change when a scheme does.

### Other settings

- Display font and body font, as `font_picker` settings from Shopify's font library. Demo defaults are Jost and Hanken Grotesk when both are in the library. If either is missing, the build uses the closest library font and records the substitution in the README.
- Corner radius: square (default), small, medium.
- Logo image and logo width.
- Motion on or off, on by default. `prefers-reduced-motion: reduce` always turns motion off.
- Favicon and social sharing image.

Heading sizes keep the concept's fluid `clamp()` scale and have no setting.

## Sections

| Section | Ported from | Behaviour |
|---|---|---|
| Header (section group) | Header, menu | Logo, main menu from Shopify navigation, country and currency selector, cart button with count |
| Footer (section group) | Footer | Menus, newsletter signup through Shopify's customer form, payment icons |
| Hero | Hero | Image or video, heading, text, button |
| Image with text | KithulStory, GivingBack | Image left or right, heading, rich text, button |
| Origin map | SriLankaMap | Merchant uploads a map image and sets a pin position as percentages, with a caption |
| Process steps | HomeProcess, ProductProcess | One block per step with image, heading and text. Desktop pins the section and steps through blocks with a progress line as the page scrolls. Step buttons also jump straight to a step. Phones and reduced motion show stacked pairs |
| Featured product | TreacleSelector | Product picker setting. Variant choice, quantity 1 to 20, price, add to cart |
| Product grid | Shop, ProductCard | Collection picker, product count, card style |
| Certifications | Quality | Logo blocks with image, name and optional link |
| Trust strip | TradeStrip | Short text blocks, for example shipping countries |
| Wholesale inquiry | Wholesale, WholesaleForm, WholesaleSheet | Shopify contact form with business name, country, expected volume and message fields |
| Video | VideoSlot | Shopify-hosted or YouTube/Vimeo video with poster image |
| FAQ | New | Question and answer blocks rendered as `<details>`. On product templates, an optional setting reads the product FAQ metafield instead |
| Reviews | Reviews | `@app` block slot only. Renders nothing when no app block is added |
| Main product | product page, Gallery, buy box | Gallery, title, price with sale price, variant picker, quantity, add to cart, plus blocks for nutrition, pack details, how-to-use and sale stamp |
| Main collection, main cart, main search, main page, contact, 404, password | New | Minimal versions in the concept's visual style |
| Cart drawer | CartDrawer | Rendered in `theme.liquid`, refreshed through the Section Rendering API |

Dropped from the concept: `PosterArt`, `ConceptStub`, `Confirm` and `/open-questions`, the `?review=1` and `?stars=1` flags, the saved-selection feature, the Sinhala brand font subset, the sap-drip SVG in the process section, the claims rules in `claims.ts`, and the localStorage cart.

## Behaviour

### Cart

Every add-to-cart control is a real `<form action="/cart/add" method="post">`, so buying works without JavaScript and lands on the cart page. With JavaScript, the form posts to `/cart/add.js`, quantity and remove go to `/cart/change.js`, and the cart sections on the page (the drawer, and the cart page section on `/cart`) are re-rendered through the Section Rendering API, and the header count and label are updated from data attributes on the drawer section. When Shopify returns an error (for example a 422 for stock limits), the drawer shows Shopify's `description` text in a live region and leaves the cart as it was. A network failure shows a generic message from `locales/` and keeps the form usable.

### Currency and country

Shopify Markets converts prices. The header renders Shopify's localization form for country and currency. No currency logic runs in the browser.

### Product page

The main product section prints the product's variant data as JSON in a `<script type="application/json">` tag. Choosing a variant updates the price, sale price, gallery image, stock status, the hidden variant id in the form, and `?variant=` in the URL through `history.replaceState`. An unavailable variant disables add to cart and changes its label to the sold-out text from `locales/`.

### Wholesale form

Shopify's `{% form 'contact' %}` with fields named `contact[business]`, `contact[country]`, `contact[volume]` and `contact[body]`. Success and error states come from `form.posted_successfully?` and `form.errors`.

### Motion

GSAP with ScrollTrigger and SplitText handles heading line reveals, staggered card entrances and the pinned process section. Lenis is dropped, because smooth scrolling conflicts with the theme editor scrolling to the selected section. Motion code runs only when the motion setting is on and the user has not asked for reduced motion.

All scripts initialise per section root and reinitialise on the theme editor's `shopify:section:load`, `shopify:section:unload`, `shopify:block:select` and `shopify:block:deselect` events, so editor previews match the live store. Selecting a process step block in the editor shows that step.

## Product data

Products, prices and photos live in the store. The theme reads these metafields and metaobjects:

| Owner | Key | Type | Used by |
|---|---|---|---|
| Product | `custom.shelf_life_months` | integer | Pack details block |
| Product | `custom.nutrition` | metaobject reference (`nutrition_table`) | Nutrition block |
| Product | `custom.faq` | list of metaobject references (`faq_item`) | FAQ section on product templates |
| Product | `custom.how_to_use` | list of metaobject references (`usage_step`) | How-to-use block |
| Variant | `custom.closure` | single line text | Pack details block |
| Variant | `custom.gross_weight_kg` | decimal | Pack details block |
| Variant | `custom.carton` | metaobject reference (`carton`) | Pack details block |

Metaobject definitions:

- `nutrition_table`: `basis` (single line text, for example "per 100 g") and `rows` (list of `nutrition_row` references).
- `nutrition_row`: `nutrient` (single line text), `amount` (single line text).
- `faq_item`: `question` (single line text), `answer` (rich text).
- `usage_step`: `title` (single line text), `text` (multi-line text), `image` (file).
- `carton`: `units` (integer), `gross_kg` (decimal), `net_kg` (decimal), `length_mm`, `width_mm`, `height_mm` (integers).

Every block or section that reads a metafield renders nothing when the metafield is empty. The README lists all definitions. A `scripts/create-metafields.mjs` script creates them through the Admin GraphQL API for client stores, using a custom app access token from an environment variable.

## Demo content

The demo brand is Natural Treacle, a made-up kithul producer. The theme files hold the brand only as default copy in `templates/*.json` and section presets. Product data lives in the development store:

- `demo/products.csv`: treacle in 250, 375 and 1000 ml, jaggery, flour and a gift box, in Shopify's product CSV format.
- `demo/images/`: Neelaka's own AI-generated process, serving and usage photos from the concept repo, after a manual check that none shows a RaaLa bottle, label or logo. The concept's hero bottle images, product cutouts, logo, certification badges and retailer logos are excluded. Gaps are filled with Shopify's placeholder SVGs until new photos exist.
- Prices in the CSV are illustrative round numbers, not RaaLa's prices.

Demo copy makes no health claims and does not use the words "organic", "sugar free" or "low GI". Before the demo is shown publicly, the brand name gets a search for real sellers using it.

## Testing

- `npm run check` (Theme Check) passes with no errors.
- Browser checks in `tests/`, in the style of the concept's in-page assertion scripts, run with `agent-browser` against `shopify theme dev`:
  - Product page: changing variant updates price, image, URL and stock status. Add to cart opens the drawer with the right line.
  - Cart drawer: quantity change, line removal, and the stock-limit error message.
  - JavaScript disabled: add to cart reaches the cart page with the item.
  - Theme editor: reloading a section re-runs its script.
  - Reduced motion: every process step is visible and nothing is pinned.
- Lighthouse on mobile for the homepage, a product page and a collection page, held to the Theme Store minimums: average performance of at least 60 and average accessibility of at least 90.
- Accessibility: 44px touch targets, visible focus, keyboard-operable gallery and accordion, reduced motion respected, and the three demo colour schemes meet WCAG 2.1 AA for text.

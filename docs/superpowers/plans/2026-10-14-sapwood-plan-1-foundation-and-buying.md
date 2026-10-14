# Sapwood plan 1: foundation and buying path

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A working Shopify theme where a shopper can browse a collection, search, open a product, pick a variant, add it to a cart drawer and reach checkout, styled from the RaaLa concept and driven by theme settings.

**Architecture:** Shopify Online Store 2.0 theme at the repo root (`layout/`, `sections/`, `snippets/`, `templates/`, `config/`, `locales/`, `assets/`). Tailwind 4 compiles `src/css/theme.css` to `assets/theme.css`, and esbuild bundles `src/ts/theme.ts` to `assets/theme.js`. Colours come from Shopify colour schemes written as `--scheme-*` CSS variables. The cart uses Shopify's Ajax Cart API with the Section Rendering API, so every price and total is rendered by Liquid.

**Tech stack:** Shopify CLI 4.9.3, Liquid with LiquidDoc, Tailwind CSS 4.3.3 (CLI), esbuild 0.28.2, TypeScript 6.0.3, Node 24 (`node --test` with built-in type stripping), agent-browser for browser checks, Lighthouse 13.5.0.

**Spec:** `docs/superpowers/specs/2026-10-14-sapwood-theme-design.md`. This plan covers the spec's repository and build, text, theme settings, the cart, product page, collection, search and the basic templates. Later plans cover the homepage sections, FAQ, wholesale form, motion, metafield blocks and the metafield script, and the Natural Treacle demo content.

**Concept source:** `~/Development/Raala-pitch` (Astro). Read-only. Several steps port from it and name the exact file.

## Global constraints

- Node 24 for every command: run `source ~/.nvm/nvm.sh && nvm use` in the repo first (reads `.nvmrc`). The shell defaults to Node 20.
- Exact dev dependency versions: `@shopify/cli@4.9.3`, `@tailwindcss/cli@4.3.3`, `tailwindcss@4.3.3`, `esbuild@0.28.2`, `typescript@6.0.3`. No other dependencies in this plan.
- Every string a shopper sees and the theme supplies goes in `locales/en.default.json`. Every editor label goes in `locales/en.default.schema.json` and is referenced as `t:...`. Liquid never hard-codes these strings.
- No RaaLa assets, names or copy anywhere in the theme. Test products in the development store must not use RaaLa bottle, label or logo images.
- Colour scheme ids are `light`, `band` and `dark`. Every section has a `color_scheme` setting and puts `color-{{ section.settings.color_scheme }}` on its outer element.
- Token rename when porting concept CSS or classes: `oxblood` to `ink`, `brick` to `heading`, `clay` to `muted`, `lime` to `accent`, oxblood-on-lime text to `on-accent`, `olive` and `line` to `line`, `tint` to `tint`, `hairline` to `hairline`, `paper` and `white` grounds to `ground`, `sprout` to `muted`. In plain CSS use the variables: `var(--scheme-ink)` and so on.
- No em dash character (U+2014) in any copy, comment, locale string or commit message.
- Comments explain why, never what. Snippets document their parameters with `{% doc %}`.
- `npm run check` (Theme Check) must report no errors at the end of every task that touches Liquid, JSON or locales.
- The local dev server is `http://127.0.0.1:9292`.
- Commit messages end with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

```
.nvmrc .gitignore .shopifyignore package.json tsconfig.json README.md
src/css/theme.css            Tailwind entry: tokens, base, shared components, imports below
src/css/header.css           header, menu panel, search drop, localization
src/css/cart.css             side sheet dialog, cart count badge
src/css/product.css          product page layout, buy box, option boxes
src/css/gallery.css          product gallery and full-screen viewer
src/css/sale-stamp.css       sale stamp, ported from the concept
src/ts/theme.ts              bundle entry
src/ts/sections.ts           registerSection: init per section root, re-init on theme editor events
src/ts/theme-data.ts         reads routes and strings printed by snippets/theme-data.liquid
src/ts/header.ts             menu panel, disclosures, search
src/ts/cart-errors.ts        cartErrorMessage (pure)
src/ts/cart.ts               Ajax cart, section re-rendering, drawer
src/ts/variants.ts           findVariant, clampQuantity (pure)
src/ts/gallery.ts            gallery and viewer
src/ts/product.ts            variant picker, price, quantity
tests/unit/*.test.ts         node:test unit tests
tests/browser/*.js           in-page assertion scripts run with agent-browser eval
layout/theme.liquid layout/password.liquid
config/settings_schema.json config/settings_data.json
locales/en.default.json locales/en.default.schema.json
sections/header-group.json sections/footer-group.json
sections/header.liquid sections/footer.liquid sections/cart-drawer.liquid sections/main-cart.liquid
sections/main-product.liquid sections/main-collection.liquid sections/main-search.liquid
sections/main-page.liquid sections/main-404.liquid sections/main-password.liquid
snippets/theme-styles.liquid snippets/meta-tags.liquid snippets/theme-data.liquid snippets/icon.liquid
snippets/localization-form.liquid snippets/cart-lines.liquid snippets/product-gallery.liquid
snippets/product-price.liquid snippets/sale-stamp.liquid snippets/variant-picker.liquid
snippets/buy-buttons.liquid snippets/product-variants-json.liquid snippets/product-card.liquid
snippets/pagination.liquid
templates/index.json product.json collection.json search.json cart.json page.json 404.json password.json
```

## Task 0: development store setup (done by Neelaka, not an agent)

This needs a browser login and account decisions, so a person does it once.

- [ ] **Step 1:** Create a Shopify Partner account at partners.shopify.com, then a development store. Note its `*.myshopify.com` domain and the storefront password (Online Store > Preferences).
- [ ] **Step 2:** Create the product **Kithul Treacle**, handle `kithul-treacle`, option name `Size` with values `250 ml`, `375 ml`, `1000 ml`:

  | Variant | Price | Compare-at price | Inventory | Image |
  |---|---|---|---|---|
  | 250 ml | 1200 | 1500 | 50 | image 1 |
  | 375 ml | 1600 | none | 0 | image 2 |
  | 1000 ml | 3600 | none | 2 | image 3 |

  Track inventory on all three and leave "Continue selling when out of stock" off. Upload three images that show no RaaLa bottle, label or logo (`process-tapping.png`, `process-collecting.png` and `serve-baking.jpeg` from the concept repo's `src/assets/raala/` are fine for a private dev store). Assign one image per variant as in the table.
- [ ] **Step 3:** Create **Kithul Jaggery**, handle `kithul-jaggery`, no options, price 900, inventory 50, one image.
- [ ] **Step 4:** Online Store > Navigation > Main menu: `Home` (/), `Shop` with two child links (Kithul Treacle, Kithul Jaggery), `Search` (/search).
- [ ] **Step 5:** Settings > Markets: add a second market (for example United Kingdom, GBP) so the country selector has more than one choice.
- [ ] **Step 6:** In your shell profile, set `export SHOPIFY_FLAG_STORE=<your-store>.myshopify.com` and `export SHOPIFY_FLAG_STORE_PASSWORD=<storefront password>`. Shopify CLI reads both.

## Task 1: repo tooling and build pipeline

**Files:**
- Create: `.nvmrc`, `.gitignore`, `.shopifyignore`, `package.json`, `tsconfig.json`, `README.md`, `src/css/theme.css`, `src/ts/theme.ts`, `src/ts/sections.ts`, `src/ts/theme-data.ts`

**Interfaces:**
- Produces: `registerSection(selector: string, init: (root: HTMLElement, signal: AbortSignal) => void): void` from `src/ts/sections.ts`. Init runs once per matching element now and again for elements inside a section the theme editor reloads. The signal aborts when the editor unloads that section, so every listener an init adds must pass `{ signal }`.
- Produces: `themeData(): ThemeData` from `src/ts/theme-data.ts`, where `ThemeData = { routes: { cartAdd: string; cartChange: string; cart: string }; strings: { networkError: string; added: string; updated: string; addToCart: string; soldOut: string; unavailable: string } }`.
- Produces: `npm run build`, `npm run dev`, `npm run check`, `npm test`, `npm run typecheck`.

- [ ] **Step 1: Write the config files**

`.nvmrc`:
```
24
```

`.gitignore`:
```
node_modules/
.shopify/
.lighthouse/
.env
.DS_Store
```

`.shopifyignore`:
```
src/**
tests/**
docs/**
node_modules/**
package.json
package-lock.json
tsconfig.json
README.md
```

`package.json`:
```json
{
  "name": "sapwood",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "build:css": "tailwindcss -i src/css/theme.css -o assets/theme.css --minify",
    "build:js": "esbuild src/ts/theme.ts --bundle --format=iife --target=es2022 --minify --outfile=assets/theme.js",
    "build": "npm run build:css && npm run build:js",
    "dev": "npm run build:css -- --watch=always & npm run build:js -- --watch=forever & shopify theme dev",
    "check": "shopify theme check --fail-level error",
    "test": "node --test tests/unit/*.test.ts",
    "typecheck": "tsc --noEmit"
  }
}
```

The `--watch=always` and `--watch=forever` flags keep both watchers alive when they run in the background, because each otherwise exits when its stdin closes.

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  },
  "include": ["src/ts"]
}
```

Relative imports in `src/ts` always use the `.ts` extension and type-only imports use `import type` or inline `type`, so the same files run under Node's type stripping in the unit tests.

- [ ] **Step 2: Install dev dependencies**

Run:
```bash
cd ~/Development/sapwood && source ~/.nvm/nvm.sh && nvm use
npm install -D --save-exact @shopify/cli@4.9.3 @tailwindcss/cli@4.3.3 tailwindcss@4.3.3 esbuild@0.28.2 typescript@6.0.3
```
Expected: `package-lock.json` created, no errors.

- [ ] **Step 3: Write the minimal CSS and TypeScript entries**

`src/css/theme.css` (Task 2 replaces this with the full file):
```css
@import 'tailwindcss' source(none);
@source '../../layout';
@source '../../sections';
@source '../../snippets';
@source '../../templates';
@source '../ts';
```

`src/ts/sections.ts`:
```ts
type SectionInit = (root: HTMLElement, signal: AbortSignal) => void;

const controllers = new WeakMap<HTMLElement, AbortController>();

/**
 * Runs `init` for every element matching `selector`, and again for matches inside a section the theme editor
 * reloads. The editor swaps the section's HTML without a page load, so listeners from the old markup must be
 * removed: `init` receives a signal that aborts on `shopify:section:unload`.
 */
export function registerSection(selector: string, init: SectionInit): void {
  const start = (root: HTMLElement) => {
    controllers.get(root)?.abort();
    const controller = new AbortController();
    controllers.set(root, controller);
    init(root, controller.signal);
  };
  const within = (event: Event, fn: (root: HTMLElement) => void) =>
    (event.target as HTMLElement).querySelectorAll<HTMLElement>(selector).forEach(fn);

  document.querySelectorAll<HTMLElement>(selector).forEach(start);
  document.addEventListener('shopify:section:load', (event) => within(event, start));
  document.addEventListener('shopify:section:unload', (event) =>
    within(event, (root) => {
      controllers.get(root)?.abort();
      controllers.delete(root);
    }),
  );
}
```

`src/ts/theme-data.ts`:
```ts
export interface ThemeData {
  routes: { cartAdd: string; cartChange: string; cart: string };
  strings: {
    networkError: string;
    added: string;
    updated: string;
    addToCart: string;
    soldOut: string;
    unavailable: string;
  };
}

let cached: ThemeData | undefined;

/** Routes and translated strings printed by snippets/theme-data.liquid. Routes carry the market's locale prefix. */
export function themeData(): ThemeData {
  cached ??= JSON.parse(document.getElementById('theme-data')?.textContent ?? '{}') as ThemeData;
  return cached;
}
```

`src/ts/theme.ts`:
```ts
import './sections.ts';
```

- [ ] **Step 4: Write the README**

`README.md`:
````markdown
# Sapwood

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
````

- [ ] **Step 5: Run the build and verify the output**

Run: `npm run build && ls -l assets/theme.css assets/theme.js && npm run typecheck`
Expected: both files exist (theme.css holds Tailwind's preflight), typecheck prints nothing and exits 0.

- [ ] **Step 6: Commit**

```bash
git add .nvmrc .gitignore .shopifyignore package.json package-lock.json tsconfig.json README.md src assets
git commit -m "Set up build tooling for the theme

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 2: theme skeleton, settings, colour schemes and base styles

**Files:**
- Create: `layout/theme.liquid`, `layout/password.liquid`, `config/settings_schema.json`, `config/settings_data.json`, `locales/en.default.json`, `locales/en.default.schema.json`, `snippets/theme-styles.liquid`, `snippets/meta-tags.liquid`, `snippets/theme-data.liquid`, `snippets/icon.liquid`, `sections/header-group.json`, `sections/footer-group.json`, `sections/main-page.liquid`, `sections/main-404.liquid`, `sections/main-password.liquid`, `templates/index.json`, `templates/page.json`, `templates/404.json`, `templates/password.json`, `tests/browser/theme-base-check.js`
- Modify: `src/css/theme.css` (full replacement)

**Interfaces:**
- Produces: CSS variables `--scheme-ground`, `--scheme-ground-gradient`, `--scheme-ink`, `--scheme-heading`, `--scheme-muted`, `--scheme-accent`, `--scheme-on-accent`, `--scheme-line`, `--scheme-tint`, `--scheme-hairline` on `:root` and on every `.color-<id>`; `--font-heading-family`, `--font-heading-weight`, `--font-body-family`, `--radius` on `:root`.
- Produces: Tailwind colours `ground`, `ink`, `heading`, `muted`, `accent`, `on-accent`, `line`, `tint`, `hairline`; fonts `font-display`, `font-sans`; text sizes `text-section`, `text-card`; utility `tabular`.
- Produces: component classes `.wrap`, `.skip-link`, `.btn`, `.btn-primary`, `.btn-outline`, `.icon-btn`, `.field`, `.field-error`, `.rte`, `.display-caps`.
- Produces: `{% render 'icon', name: <name>, size: <number>, class: <string> %}` with names `search`, `bag`, `menu`, `close`, `chevron-down`, `chevron-left`, `chevron-right`, `expand`, `minus`, `plus`.
- Produces: `<script type="application/json" id="theme-data">` read by `themeData()`.
- Produces: every locale key used in this plan (later tasks add none).

- [ ] **Step 1: Write the failing browser check**

`tests/browser/theme-base-check.js`:
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const root = getComputedStyle(document.documentElement);
  const value = (name) => root.getPropertyValue(name).trim().toLowerCase();
  assert(value('--scheme-ground') === '#ffffff', 'Light scheme sets the page ground');
  assert(value('--scheme-ink') === '#590303', 'Light scheme sets the ink colour');
  assert(value('--scheme-heading') === '#8c1a0f', 'Light scheme sets the heading colour');
  assert(value('--font-body-family') !== '', 'Body font family is set from settings');
  assert(document.querySelector('link[href*="theme.css"]'), 'theme.css is linked');
  const data = JSON.parse(document.getElementById('theme-data').textContent);
  assert(data.routes.cartAdd.endsWith('/cart/add.js'), 'Theme data carries the cart add route');
  assert(data.strings.addToCart === 'Add to cart', 'Theme data carries translated strings');
  assert(document.querySelector('a.skip-link[href="#MainContent"]'), 'Skip link is first');
  return 'theme base ok';
})();
```

- [ ] **Step 2: Write the locale files**

`locales/en.default.json`:
```json
{
  "general": {
    "skip_to_content": "Skip to content",
    "main_menu": "Main",
    "menu": "Menu",
    "search": "Search",
    "search_label": "Search the store",
    "home": "Home",
    "breadcrumb": "Breadcrumb",
    "error": "Error:",
    "network_error": "Something went wrong. Check your connection and try again.",
    "page_number": "Page {{ page }}",
    "pagination": "Pagination",
    "previous_page": "Previous page",
    "next_page": "Next page"
  },
  "localization": {
    "country": "Country/region",
    "language": "Language",
    "update": "Update"
  },
  "cart": {
    "title": "Your cart",
    "open": {
      "one": "Cart, {{ count }} item",
      "other": "Cart, {{ count }} items"
    },
    "close": "Close cart",
    "empty": "Your cart is empty.",
    "continue_shopping": "Continue shopping",
    "subtotal": "Subtotal",
    "shipping_note": "Shipping is worked out at checkout.",
    "checkout": "Checkout",
    "remove": "Remove",
    "quantity_of": "Quantity of {{ title }}",
    "decrease": "Decrease quantity",
    "increase": "Increase quantity",
    "was": "was",
    "added": "Added to your cart.",
    "updated": "Cart updated."
  },
  "products": {
    "add_to_cart": "Add to cart",
    "sold_out": "Sold out",
    "unavailable": "Unavailable",
    "from": "From {{ price }}",
    "quantity": "Quantity",
    "decrease": "Decrease quantity",
    "increase": "Increase quantity",
    "choose": "Choose an option",
    "was": "was",
    "sale": "Sale",
    "off": "Off",
    "images": "Product images",
    "view_larger": "View larger image",
    "previous_image": "Previous image",
    "next_image": "Next image",
    "close_viewer": "Close",
    "image_count": "Image {{ index }} of {{ count }}",
    "show_image": "Show image {{ index }} of {{ count }}"
  },
  "collections": {
    "empty": "No products in this collection yet."
  },
  "search": {
    "title": "Search",
    "submit": "Search",
    "results_for": {
      "one": "{{ count }} result for \"{{ terms }}\"",
      "other": "{{ count }} results for \"{{ terms }}\""
    },
    "no_results": "No results for \"{{ terms }}\". Try a different word."
  },
  "newsletter": {
    "label": "Email address",
    "submit": "Sign up",
    "success": "Thanks for signing up."
  },
  "footer": {
    "payment_methods": "Payment methods"
  },
  "templates": {
    "404": {
      "title": "Page not found",
      "text": "The page you were looking for doesn't exist.",
      "link": "Back to the shop"
    },
    "password": {
      "title": "Opening soon",
      "password": "Password",
      "submit": "Enter"
    }
  }
}
```

`locales/en.default.schema.json`:
```json
{
  "settings_schema": {
    "colors": {
      "name": "Colours",
      "info": "Each section picks one of these schemes. Keep text and button labels at a contrast ratio of at least 4.5:1 against their background (WCAG 2.1 AA).",
      "background": "Background",
      "background_gradient": "Background gradient",
      "text": "Text",
      "heading": "Headings",
      "muted": "Muted text",
      "button": "Button",
      "button_text": "Button text",
      "border": "Borders"
    },
    "typography": {
      "name": "Typography",
      "heading_font": "Headings",
      "body_font": "Body"
    },
    "shape": {
      "name": "Shape",
      "corner_radius": "Corner radius",
      "square": "Square",
      "small": "Small",
      "medium": "Medium"
    },
    "logo": {
      "name": "Logo",
      "logo": "Logo image",
      "logo_width": "Logo width"
    },
    "motion": {
      "name": "Motion",
      "motion": "Animate sections as they scroll into view",
      "info": "Visitors whose device asks for reduced motion never see these animations."
    },
    "favicon": {
      "name": "Favicon",
      "favicon": "Favicon image",
      "info": "Shown at 32 x 32 px."
    },
    "social": {
      "name": "Social sharing",
      "share_image": "Sharing image",
      "info": "Used when a page has no image of its own. 1200 x 628 px works best."
    }
  },
  "sections": {
    "all": {
      "color_scheme": "Colour scheme"
    },
    "header": {
      "name": "Header",
      "menu": "Menu",
      "show_shop_name": "Show store name next to the logo",
      "sticky": "Keep header visible when scrolling"
    },
    "footer": {
      "name": "Footer",
      "show_newsletter": "Show newsletter signup",
      "newsletter_heading": "Newsletter heading",
      "newsletter_text": "Newsletter text",
      "show_payment_icons": "Show payment icons",
      "credit": "Bottom line text",
      "blocks": {
        "menu": {
          "name": "Menu",
          "heading": "Heading",
          "menu": "Menu"
        },
        "text": {
          "name": "Text",
          "heading": "Heading",
          "text": "Text"
        }
      }
    },
    "cart_drawer": {
      "name": "Cart drawer"
    },
    "main_cart": {
      "name": "Cart"
    },
    "main_product": {
      "name": "Product",
      "blocks": {
        "text": {
          "name": "Text",
          "text": "Text"
        },
        "title": {
          "name": "Title"
        },
        "price": {
          "name": "Price"
        },
        "variant_picker": {
          "name": "Variant picker"
        },
        "buy_buttons": {
          "name": "Quantity and add to cart",
          "max_quantity": "Largest quantity per add"
        },
        "description": {
          "name": "Description"
        },
        "link": {
          "name": "Link box",
          "heading": "Heading",
          "text": "Text",
          "label": "Link label",
          "url": "Link"
        }
      }
    },
    "main_collection": {
      "name": "Collection",
      "products_per_page": "Products per page"
    },
    "main_search": {
      "name": "Search results"
    },
    "main_page": {
      "name": "Page"
    },
    "main_404": {
      "name": "Page not found"
    },
    "main_password": {
      "name": "Password page"
    }
  }
}
```

- [ ] **Step 3: Write the theme settings**

`config/settings_schema.json`:
```json
[
  {
    "name": "theme_info",
    "theme_name": "Sapwood",
    "theme_version": "0.1.0",
    "theme_author": "Neelaka Ganegoda",
    "theme_documentation_url": "https://neelakaganegoda.com",
    "theme_support_url": "https://neelakaganegoda.com"
  },
  {
    "name": "t:settings_schema.colors.name",
    "settings": [
      {
        "type": "color_scheme_group",
        "id": "color_schemes",
        "info": "t:settings_schema.colors.info",
        "definition": [
          { "type": "color", "id": "background", "label": "t:settings_schema.colors.background", "default": "#FFFFFF" },
          { "type": "color_background", "id": "background_gradient", "label": "t:settings_schema.colors.background_gradient" },
          { "type": "color", "id": "text", "label": "t:settings_schema.colors.text", "default": "#590303" },
          { "type": "color", "id": "heading", "label": "t:settings_schema.colors.heading", "default": "#8C1A0F" },
          { "type": "color", "id": "muted", "label": "t:settings_schema.colors.muted", "default": "#A64D2D" },
          { "type": "color", "id": "button", "label": "t:settings_schema.colors.button", "default": "#ADBF24" },
          { "type": "color", "id": "button_text", "label": "t:settings_schema.colors.button_text", "default": "#590303" },
          { "type": "color", "id": "border", "label": "t:settings_schema.colors.border", "default": "#598C0D" }
        ],
        "role": {
          "text": "text",
          "background": { "solid": "background", "gradient": "background_gradient" },
          "links": "heading",
          "icons": "text",
          "primary_button": "button",
          "on_primary_button": "button_text",
          "primary_button_border": "button",
          "secondary_button": "background",
          "on_secondary_button": "text",
          "secondary_button_border": "text"
        }
      }
    ]
  },
  {
    "name": "t:settings_schema.typography.name",
    "settings": [
      { "type": "font_picker", "id": "heading_font", "label": "t:settings_schema.typography.heading_font", "default": "jost_n7" },
      { "type": "font_picker", "id": "body_font", "label": "t:settings_schema.typography.body_font", "default": "hanken_grotesk_n4" }
    ]
  },
  {
    "name": "t:settings_schema.shape.name",
    "settings": [
      {
        "type": "select",
        "id": "corner_radius",
        "label": "t:settings_schema.shape.corner_radius",
        "default": "0",
        "options": [
          { "value": "0", "label": "t:settings_schema.shape.square" },
          { "value": "4", "label": "t:settings_schema.shape.small" },
          { "value": "8", "label": "t:settings_schema.shape.medium" }
        ]
      }
    ]
  },
  {
    "name": "t:settings_schema.logo.name",
    "settings": [
      { "type": "image_picker", "id": "logo", "label": "t:settings_schema.logo.logo" },
      { "type": "range", "id": "logo_width", "label": "t:settings_schema.logo.logo_width", "min": 60, "max": 240, "step": 4, "unit": "px", "default": 120 }
    ]
  },
  {
    "name": "t:settings_schema.motion.name",
    "settings": [
      { "type": "checkbox", "id": "motion", "label": "t:settings_schema.motion.motion", "info": "t:settings_schema.motion.info", "default": true }
    ]
  },
  {
    "name": "t:settings_schema.favicon.name",
    "settings": [
      { "type": "image_picker", "id": "favicon", "label": "t:settings_schema.favicon.favicon", "info": "t:settings_schema.favicon.info" }
    ]
  },
  {
    "name": "t:settings_schema.social.name",
    "settings": [
      { "type": "image_picker", "id": "share_image", "label": "t:settings_schema.social.share_image", "info": "t:settings_schema.social.info" }
    ]
  }
]
```

`config/settings_data.json` (the three demo schemes from the spec):
```json
{
  "current": {
    "color_schemes": {
      "light": {
        "settings": {
          "background": "#FFFFFF",
          "background_gradient": "",
          "text": "#590303",
          "heading": "#8C1A0F",
          "muted": "#A64D2D",
          "button": "#ADBF24",
          "button_text": "#590303",
          "border": "#598C0D"
        }
      },
      "band": {
        "settings": {
          "background": "#8C1A0F",
          "background_gradient": "",
          "text": "#FBFAF6",
          "heading": "#FBFAF6",
          "muted": "#D6DF91",
          "button": "#ADBF24",
          "button_text": "#590303",
          "border": "#D6DF91"
        }
      },
      "dark": {
        "settings": {
          "background": "#590303",
          "background_gradient": "",
          "text": "#FBFAF6",
          "heading": "#ADBF24",
          "muted": "#D6DF91",
          "button": "#ADBF24",
          "button_text": "#590303",
          "border": "#ADBF24"
        }
      }
    }
  }
}
```

- [ ] **Step 4: Write the head snippets**

`snippets/theme-styles.liquid`:
```liquid
{% doc %}
  Font faces and the CSS variables every style reads: fonts, corner radius, and one block of --scheme-* colours
  per colour scheme. Rendered with the style tag so the theme editor updates it live.
{% enddoc %}
{%- liquid
  assign heading_font = settings.heading_font
  assign body_font = settings.body_font
  assign body_font_bold = body_font | font_modify: 'weight', 'bold'
  assign body_font_italic = body_font | font_modify: 'style', 'italic'
-%}
{% style %}
  {{ heading_font | font_face: font_display: 'swap' }}
  {{ body_font | font_face: font_display: 'swap' }}
  {{ body_font_bold | font_face: font_display: 'swap' }}
  {{ body_font_italic | font_face: font_display: 'swap' }}

  :root {
    --font-heading-family: {{ heading_font.family }}, {{ heading_font.fallback_families }};
    --font-heading-weight: {{ heading_font.weight }};
    --font-body-family: {{ body_font.family }}, {{ body_font.fallback_families }};
    --radius: {{ settings.corner_radius }}px;
  }

  {% for scheme in settings.color_schemes %}
    {%- if forloop.first %}:root, {% endif %}.color-{{ scheme.id }} {
      --scheme-ground: {{ scheme.settings.background }};
      --scheme-ground-gradient: {% if scheme.settings.background_gradient != blank %}{{ scheme.settings.background_gradient }}{% else %}none{% endif %};
      --scheme-ink: {{ scheme.settings.text }};
      --scheme-heading: {{ scheme.settings.heading }};
      --scheme-muted: {{ scheme.settings.muted }};
      --scheme-accent: {{ scheme.settings.button }};
      --scheme-on-accent: {{ scheme.settings.button_text }};
      --scheme-line: {{ scheme.settings.border }};
      --scheme-tint: color-mix(in srgb, {{ scheme.settings.button }} 20%, {{ scheme.settings.background }});
      --scheme-hairline: color-mix(in srgb, {{ scheme.settings.border }} 30%, {{ scheme.settings.background }});
      background-color: var(--scheme-ground);
      background-image: var(--scheme-ground-gradient);
      color: var(--scheme-ink);
    }
  {% endfor %}
{% endstyle %}
```

`snippets/meta-tags.liquid`:
```liquid
{% doc %}
  Open Graph and Twitter card tags. Pages without their own image fall back to the theme's sharing image.
{% enddoc %}
{%- liquid
  assign og_type = 'website'
  if request.page_type == 'product'
    assign og_type = 'product'
  endif
  assign og_image = page_image | default: settings.share_image
  assign og_description = page_description | default: shop.description | default: shop.name
-%}
<meta property="og:site_name" content="{{ shop.name | escape }}">
<meta property="og:url" content="{{ canonical_url }}">
<meta property="og:title" content="{{ page_title | escape }}">
<meta property="og:type" content="{{ og_type }}">
<meta property="og:description" content="{{ og_description | escape }}">
{%- if og_image %}
  <meta property="og:image" content="https:{{ og_image | image_url: width: 1200 }}">
  <meta property="og:image:alt" content="{{ og_image.alt | default: shop.name | escape }}">
{%- endif %}
<meta name="twitter:card" content="summary_large_image">
```

`snippets/theme-data.liquid`:
```liquid
{% doc %}
  Routes and translated strings for theme.js. Routes come from the routes object so they keep the market's
  locale prefix, for example /en-gb/cart/add.
{% enddoc %}
<script type="application/json" id="theme-data">
  {
    "routes": {
      "cartAdd": {{ routes.cart_add_url | append: '.js' | json }},
      "cartChange": {{ routes.cart_change_url | append: '.js' | json }},
      "cart": {{ routes.cart_url | json }}
    },
    "strings": {
      "networkError": {{ 'general.network_error' | t | json }},
      "added": {{ 'cart.added' | t | json }},
      "updated": {{ 'cart.updated' | t | json }},
      "addToCart": {{ 'products.add_to_cart' | t | json }},
      "soldOut": {{ 'products.sold_out' | t | json }},
      "unavailable": {{ 'products.unavailable' | t | json }}
    }
  }
</script>
```

`snippets/icon.liquid` (paths ported from the concept's `src/components/Icon.astro`):
```liquid
{% doc %}
  Inline SVG icon. Decorative: the control holding it needs its own accessible name.

  @param {string} name - search, bag, menu, close, chevron-down, chevron-left, chevron-right, expand, minus or plus
  @param {number} [size] - Width and height in px, default 24
  @param {string} [class] - Classes for the svg element
{% enddoc %}
{%- liquid
  assign icon_size = size | default: 24
  case name
    when 'search'
      assign paths = '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'
    when 'bag'
      assign paths = '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'
    when 'menu'
      assign paths = '<path d="M4 7h16M4 12h16M4 17h16"/>'
    when 'close'
      assign paths = '<path d="M6 6l12 12M18 6 6 18"/>'
    when 'chevron-down'
      assign paths = '<path d="m6 9 6 6 6-6"/>'
    when 'chevron-left'
      assign paths = '<path d="m15 5-7 7 7 7"/>'
    when 'chevron-right'
      assign paths = '<path d="m9 5 7 7-7 7"/>'
    when 'expand'
      assign paths = '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>'
    when 'minus'
      assign paths = '<path d="M5 12h14"/>'
    when 'plus'
      assign paths = '<path d="M12 5v14M5 12h14"/>'
  endcase
-%}
<svg class="{{ class }}" width="{{ icon_size }}" height="{{ icon_size }}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{{ paths }}</svg>
```

- [ ] **Step 5: Write the layouts**

`layout/theme.liquid`:
```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="canonical" href="{{ canonical_url }}">
    {%- if settings.favicon != blank %}
      <link rel="icon" type="image/png" href="{{ settings.favicon | image_url: width: 32, height: 32 }}">
    {%- endif %}
    <title>
      {{- page_title -}}
      {%- if current_page != 1 %} &ndash; {{ 'general.page_number' | t: page: current_page }}{% endif -%}
      {%- unless page_title contains shop.name %} &ndash; {{ shop.name }}{% endunless -%}
    </title>
    {%- if page_description %}
      <meta name="description" content="{{ page_description | escape }}">
    {%- endif %}
    {% render 'meta-tags' %}
    {% render 'theme-styles' %}
    {{ 'theme.css' | asset_url | stylesheet_tag: preload: true }}
    <script src="{{ 'theme.js' | asset_url }}" defer></script>
    {{ content_for_header }}
  </head>
  <body>
    <a href="#MainContent" class="skip-link">{{ 'general.skip_to_content' | t }}</a>
    {% sections 'header-group' %}
    <main id="MainContent" tabindex="-1" class="focus:outline-none">
      {{ content_for_layout }}
    </main>
    {% sections 'footer-group' %}
    {% render 'theme-data' %}
  </body>
</html>
```

`layout/password.liquid`:
```liquid
<!doctype html>
<html lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ shop.name }}</title>
    {% render 'theme-styles' %}
    {{ 'theme.css' | asset_url | stylesheet_tag }}
    {{ content_for_header }}
  </head>
  <body>
    <main id="MainContent">
      {{ content_for_layout }}
    </main>
  </body>
</html>
```

- [ ] **Step 6: Write the simple sections, groups and templates**

`sections/header-group.json`:
```json
{
  "type": "header",
  "name": "Header",
  "sections": {},
  "order": []
}
```

`sections/footer-group.json`:
```json
{
  "type": "footer",
  "name": "Footer",
  "sections": {},
  "order": []
}
```

`sections/main-page.liquid`:
```liquid
<div class="color-{{ section.settings.color_scheme }} py-16 lg:py-20">
  <div class="wrap max-w-3xl">
    <h1 class="text-section">{{ page.title | escape }}</h1>
    <div class="rte mt-8">{{ page.content }}</div>
  </div>
</div>

{% schema %}
{
  "name": "t:sections.main_page.name",
  "settings": [
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ]
}
{% endschema %}
```

`sections/main-404.liquid`:
```liquid
<div class="color-{{ section.settings.color_scheme }} py-24">
  <div class="wrap max-w-2xl text-center">
    <h1 class="text-section">{{ 'templates.404.title' | t }}</h1>
    <p class="mt-4 text-lg">{{ 'templates.404.text' | t }}</p>
    <a href="{{ routes.all_products_collection_url }}" class="btn btn-primary mt-8">{{ 'templates.404.link' | t }}</a>
  </div>
</div>

{% schema %}
{
  "name": "t:sections.main_404.name",
  "settings": [
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ]
}
{% endschema %}
```

`sections/main-password.liquid`:
```liquid
{%- assign fallback_message = 'templates.password.title' | t -%}
<div class="color-{{ section.settings.color_scheme }} flex min-h-dvh items-center py-16">
  <div class="wrap max-w-xl">
    <h1 class="text-section">{{ shop.name | escape }}</h1>
    <p class="mt-4 text-lg">{{ shop.password_message | default: fallback_message }}</p>
    {%- form 'storefront_password', class: 'mt-10' -%}
      <div class="field">
        <label for="Password">{{ 'templates.password.password' | t }}</label>
        <input
          id="Password"
          type="password"
          name="password"
          autocomplete="current-password"
          required
          {% if form.errors %}
            aria-invalid="true" aria-describedby="PasswordError"
          {% endif %}
        >
        {%- if form.errors -%}
          <p id="PasswordError" class="field-error">
            <span aria-hidden="true">!</span><span class="sr-only">{{ 'general.error' | t }}</span>
            {{ form.errors.messages['form'] }}
          </p>
        {%- endif -%}
      </div>
      <button type="submit" class="btn btn-primary mt-4">{{ 'templates.password.submit' | t }}</button>
    {%- endform -%}
  </div>
</div>

{% schema %}
{
  "name": "t:sections.main_password.name",
  "settings": [
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ]
}
{% endschema %}
```

`templates/index.json` (the homepage sections come in plan 2):
```json
{
  "sections": {},
  "order": []
}
```

`templates/page.json`:
```json
{
  "sections": {
    "main": { "type": "main-page", "settings": { "color_scheme": "light" } }
  },
  "order": ["main"]
}
```

`templates/404.json`:
```json
{
  "sections": {
    "main": { "type": "main-404", "settings": { "color_scheme": "light" } }
  },
  "order": ["main"]
}
```

`templates/password.json`:
```json
{
  "layout": "password",
  "sections": {
    "main": { "type": "main-password", "settings": { "color_scheme": "light" } }
  },
  "order": ["main"]
}
```

- [ ] **Step 7: Write the full Tailwind entry**

Replace `src/css/theme.css`. Rules are ported from the concept's `src/styles/global.css` with the token rename. Concept-only rules (view transitions, review mode, Sinhala font, hero and map failsafes, poster art, demo form styles) are left out.

```css
@import 'tailwindcss' source(none);
@source '../../layout';
@source '../../sections';
@source '../../snippets';
@source '../../templates';
@source '../ts';

/*
  Every colour reads a --scheme-* variable. snippets/theme-styles.liquid writes those for :root and for each
  .color-<scheme-id> class, so the same utility (text-ink, bg-tint) restyles with whichever scheme a section picks.
  inline makes utilities reference the variables directly instead of copies resolved once on :root.
*/
@theme inline {
  --color-ground: var(--scheme-ground);
  --color-ink: var(--scheme-ink);
  --color-heading: var(--scheme-heading);
  --color-muted: var(--scheme-muted);
  --color-accent: var(--scheme-accent);
  --color-on-accent: var(--scheme-on-accent);
  --color-line: var(--scheme-line);
  --color-tint: var(--scheme-tint);
  --color-hairline: var(--scheme-hairline);

  --font-display: var(--font-heading-family);
  --font-sans: var(--font-body-family);

  /* Section headings (h2, and the page h1 on text pages) use text-section, item titles use text-card. */
  --text-section: clamp(2.25rem, 1.5rem + 2.6vw, 3.75rem);
  --text-section--line-height: 1.05;
  --text-card: clamp(1.375rem, 1.2rem + 0.6vw, 1.75rem);
  --text-card--line-height: 1.1;

  --radius-xs: var(--radius);
  --radius-sm: var(--radius);
  --radius-md: var(--radius);
  --radius-lg: var(--radius);
}

@utility tabular {
  font-variant-numeric: tabular-nums lining-nums;
}

@layer base {
  html {
    font-family: var(--font-sans);
    -webkit-text-size-adjust: 100%;
    scroll-padding-top: 5rem;
  }
  /*
    Everything is rem-based and the column caps at 80rem, so on wide screens the page looked small inside large
    margins. Growing the root from 1440px scales type, spacing and the column together, capped at 20px.
  */
  @media (min-width: 90rem) {
    html {
      font-size: clamp(100%, 0.625rem + 0.4167vw, 125%);
    }
  }
  body {
    font-size: 1.0625rem;
    line-height: 1.6;
  }
  h1,
  h2,
  h3,
  h4 {
    color: var(--scheme-heading);
    font-family: var(--font-display);
    font-weight: var(--font-heading-weight);
    line-height: 1;
    letter-spacing: 0.01em;
    text-transform: uppercase;
    text-wrap: balance;
  }
  h2 {
    font-size: var(--text-section);
  }
  h3 {
    font-size: var(--text-card);
  }
  p {
    text-wrap: pretty;
  }
  a {
    text-decoration-thickness: 2px;
  }
  ::selection {
    background: var(--scheme-accent);
    color: var(--scheme-on-accent);
  }
  input,
  select,
  textarea {
    accent-color: var(--scheme-accent);
  }
  :focus-visible {
    outline: 3px solid var(--scheme-ink);
    outline-offset: 3px;
  }
  @media (prefers-reduced-motion: no-preference) {
    html:focus-within {
      scroll-behavior: smooth;
    }
  }
}

@layer components {
  .wrap {
    margin-inline: auto;
    max-width: 80rem;
    padding-inline: 1rem;
  }
  @media (min-width: 40rem) {
    .wrap {
      padding-inline: 1.5rem;
    }
  }
  @media (min-width: 64rem) {
    .wrap {
      padding-inline: 2rem;
    }
  }

  .skip-link {
    position: fixed;
    left: 1rem;
    top: 1rem;
    z-index: 100;
    padding: 0.75rem 1rem;
    background: var(--scheme-ink);
    color: var(--scheme-ground);
    transform: translateY(-200%);
  }
  .skip-link:focus {
    transform: none;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 3rem;
    padding-inline: 1.5rem;
    border-radius: var(--radius);
    font-weight: 700;
    font-size: 0.9375rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    text-decoration: none;
    transition:
      background-color 150ms ease,
      transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .btn-primary {
    background: var(--scheme-accent);
    color: var(--scheme-on-accent);
  }
  .btn-primary:hover {
    background: var(--scheme-ink);
    color: var(--scheme-ground);
  }
  .btn-outline {
    border: 2px solid var(--scheme-ink);
    color: var(--scheme-ink);
  }
  .btn-outline:hover {
    background: var(--scheme-tint);
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.75rem;
    min-height: 2.75rem;
    border-radius: var(--radius);
    transition: transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  /* Touch screens get no hover state, so the press is the only immediate sign a tap landed. */
  @media (prefers-reduced-motion: no-preference) {
    .btn:active {
      transform: scale(0.97);
    }
    .icon-btn:active {
      transform: scale(0.95);
    }
  }
  /* Guarded like Tailwind's hover: variant. Unguarded, a tap leaves :hover stuck on touch screens. */
  @media (hover: hover) {
    .icon-btn:hover {
      background: var(--scheme-tint);
    }
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  .field > label {
    font-weight: 600;
    font-size: 0.9375rem;
  }
  .field input,
  .field select,
  .field textarea {
    width: 100%;
    min-height: 2.75rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--scheme-line);
    border-radius: var(--radius);
    background-color: var(--scheme-ground);
    color: var(--scheme-ink);
    font-size: 1rem;
  }
  .field [aria-invalid='true'] {
    border: 2px solid var(--scheme-heading);
  }
  /* Errors carry an icon and an "Error:" prefix for screen readers, so the state never relies on colour. */
  .field-error {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    color: var(--scheme-heading);
    font-size: 0.9375rem;
    font-weight: 600;
  }
  .field-error > [aria-hidden] {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.0625rem;
    background: var(--scheme-ink);
    color: var(--scheme-ground);
    font-family: var(--font-display);
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1;
  }

  .display-caps {
    font-family: var(--font-display);
    font-weight: 700;
    text-transform: uppercase;
  }

  .rte > * + * {
    margin-top: 1em;
  }
  .rte a {
    color: var(--scheme-heading);
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
  .rte ul,
  .rte ol {
    padding-left: 1.25em;
  }
  .rte ul {
    list-style: disc;
  }
  .rte ol {
    list-style: decimal;
  }
}
```

- [ ] **Step 8: Run Theme Check and the build**

Run: `npm run build && npm run check`
Expected: build succeeds, Theme Check reports no errors (warnings are allowed).

- [ ] **Step 9: Start the dev server and run the browser check**

Run `npm run dev` in the background. The first run asks Neelaka to log in through the browser. Wait for `http://127.0.0.1:9292` to answer.

If the CLI reports an invalid default font for `hanken_grotesk_n4`, change the `body_font` default in `config/settings_schema.json` to `jost_n4`. If it also rejects `jost_n7` or `jost_n4`, use `assistant_n7` and `assistant_n4` instead. Record the fonts that worked; Task 8 writes them into the README.

Run:
```bash
agent-browser --session theme open http://127.0.0.1:9292/pages/does-not-exist
agent-browser --session theme eval --stdin < tests/browser/theme-base-check.js
```
Expected: `theme base ok`. (The 404 page renders through `layout/theme.liquid`, so it exercises the layout before any product exists in the theme.)

- [ ] **Step 10: Commit**

```bash
git add layout config locales snippets sections templates src assets tests
git commit -m "Add theme skeleton with colour schemes, fonts and base styles

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 3: header with menu, search and localization

**Files:**
- Create: `sections/header.liquid`, `snippets/localization-form.liquid`, `src/css/header.css`, `src/ts/header.ts`, `tests/browser/header-check.js`
- Modify: `sections/header-group.json`, `src/css/theme.css` (add import), `src/ts/theme.ts` (add import)

**Interfaces:**
- Consumes: `registerSection` (Task 1), `icon` snippet and component classes (Task 2).
- Produces: header markup with `[data-header]`, `[data-cart-open]` (a link to the cart page), `[data-cart-count]` and `[data-cart-label]`, which Task 5's cart script updates.

- [ ] **Step 1: Write the failing browser check**

`tests/browser/header-check.js`:
```js
(async () => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
  const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  const header = document.querySelector('[data-header]');
  assert(header, 'Header renders');
  assert(header.querySelector('a[data-cart-open]')?.getAttribute('href').endsWith('/cart'), 'Cart button links to the cart page');

  const searchButton = header.querySelector('[aria-controls="HeaderSearch"]');
  searchButton.click();
  await frame();
  assert(!document.getElementById('HeaderSearch').hidden, 'Search opens');
  assert(document.activeElement?.id === 'HeaderSearchInput', 'Search input takes focus');
  escape();
  assert(document.getElementById('HeaderSearch').hidden, 'Escape closes search');
  assert(document.activeElement === searchButton, 'Focus returns to the search button');

  if (matchMedia('(min-width: 64rem)').matches) {
    const submenuButton = header.querySelector('nav [data-disclosure]');
    assert(submenuButton, 'Menu link with children renders as a disclosure');
    submenuButton.click();
    assert(!document.getElementById(submenuButton.getAttribute('aria-controls')).hidden, 'Submenu opens');
    document.body.click();
    assert(document.getElementById(submenuButton.getAttribute('aria-controls')).hidden, 'Click outside closes submenu');
    return 'header desktop ok';
  }

  const toggle = header.querySelector('[data-menu-toggle]');
  toggle.click();
  await frame();
  assert(header.querySelector('[data-menu]').hasAttribute('data-open'), 'Menu opens');
  assert(header.querySelector('[data-menu]').contains(document.activeElement), 'Focus moves into the menu');
  escape();
  assert(!header.querySelector('[data-menu]').hasAttribute('data-open'), 'Escape closes the menu');
  assert(document.activeElement === toggle, 'Focus returns to the menu button');
  const form = header.querySelector('.localization-form');
  assert(form && form.querySelector('[data-localization-submit]').hidden, 'Localization submits on change, so its button hides');
  return 'header mobile ok';
})();
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
agent-browser --session theme set viewport 390 844
agent-browser --session theme open http://127.0.0.1:9292/
agent-browser --session theme eval --stdin < tests/browser/header-check.js
```
Expected: FAIL with `Header renders`.

- [ ] **Step 3: Write the localization snippet**

`snippets/localization-form.liquid`:
```liquid
{% doc %}
  Country and language selectors. Renders nothing when the store sells to one country in one language.
  Works without JavaScript through its Update button; header.ts hides the button and submits on change.

  @param {string} form_id - Unique id for the form
{% enddoc %}
{%- if localization.available_countries.size > 1 or localization.available_languages.size > 1 -%}
  {%- form 'localization', id: form_id, class: 'localization-form' -%}
    {%- if localization.available_countries.size > 1 -%}
      <div class="field">
        <label for="{{ form_id }}-country">{{ 'localization.country' | t }}</label>
        <select id="{{ form_id }}-country" name="country_code">
          {%- for country in localization.available_countries -%}
            <option
              value="{{ country.iso_code }}"
              {% if country.iso_code == localization.country.iso_code %}
                selected
              {% endif %}
            >
              {{ country.name }} ({{ country.currency.iso_code }} {{ country.currency.symbol }})
            </option>
          {%- endfor -%}
        </select>
      </div>
    {%- endif -%}
    {%- if localization.available_languages.size > 1 -%}
      <div class="field">
        <label for="{{ form_id }}-language">{{ 'localization.language' | t }}</label>
        <select id="{{ form_id }}-language" name="language_code">
          {%- for language in localization.available_languages -%}
            <option
              value="{{ language.iso_code }}"
              lang="{{ language.iso_code }}"
              {% if language.iso_code == localization.language.iso_code %}
                selected
              {% endif %}
            >
              {{ language.endonym_name | capitalize }}
            </option>
          {%- endfor -%}
        </select>
      </div>
    {%- endif -%}
    <button type="submit" class="btn btn-outline" data-localization-submit>{{ 'localization.update' | t }}</button>
  {%- endform -%}
{%- endif -%}
```

- [ ] **Step 4: Write the header section**

`sections/header.liquid`:
```liquid
<header
  class="color-{{ section.settings.color_scheme }} relative border-b border-hairline"
  {% if section.settings.sticky %}
    data-header-sticky
  {% endif %}
  data-header
>
  <div class="wrap flex h-16 items-stretch gap-3 lg:h-[4.75rem] lg:gap-5">
    <a
      href="{{ routes.root_url }}"
      class="flex shrink-0 items-center gap-2.5"
      style="--logo-width: {{ settings.logo_width }}px"
    >
      {%- if settings.logo != blank -%}
        {%- liquid
          assign logo_alt = shop.name
          if section.settings.show_shop_name
            assign logo_alt = ''
          endif
          assign logo_height = settings.logo_width | divided_by: settings.logo.aspect_ratio | round
        -%}
        {{
          settings.logo
          | image_url: width: 480
          | image_tag:
            width: settings.logo_width,
            height: logo_height,
            alt: logo_alt,
            loading: 'eager',
            widths: '120, 240, 360, 480',
            sizes: '240px',
            class: 'header-logo'
        }}
      {%- endif -%}
      {%- if settings.logo == blank or section.settings.show_shop_name -%}
        <span class="font-display text-[1.625rem] font-bold tracking-[-0.045em] whitespace-nowrap lg:text-[2rem]">
          {{- shop.name | escape -}}
        </span>
      {%- endif -%}
    </a>

    <div id="HeaderMenu" class="header-menu" data-menu>
      <nav aria-label="{{ 'general.main_menu' | t }}" class="lg:mx-auto lg:flex">
        <ul class="flex flex-col lg:flex-row lg:gap-2" role="list">
          {%- for link in section.settings.menu.links -%}
            <li class="lg:relative lg:flex">
              {%- if link.links.size > 0 -%}
                <button
                  type="button"
                  class="header-link gap-1.5"
                  aria-expanded="false"
                  aria-controls="HeaderSubmenu-{{ forloop.index }}"
                  data-disclosure
                >
                  {{ link.title | escape }}
                  {% render 'icon', name: 'chevron-down', size: 12, class: 'disclosure-chevron' %}
                </button>
                <ul id="HeaderSubmenu-{{ forloop.index }}" class="header-submenu" role="list" hidden>
                  {%- for child in link.links -%}
                    <li>
                      <a
                        href="{{ child.url }}"
                        class="header-sublink"
                        {% if child.current %}
                          aria-current="page"
                        {% endif %}
                      >
                        {{- child.title | escape -}}
                      </a>
                    </li>
                  {%- endfor -%}
                </ul>
              {%- else -%}
                <a
                  href="{{ link.url }}"
                  class="header-link"
                  {% if link.current %}
                    aria-current="page"
                  {% endif %}
                >
                  {{- link.title | escape -}}
                </a>
              {%- endif -%}
            </li>
          {%- endfor -%}
        </ul>
      </nav>
      {%- render 'localization-form', form_id: 'HeaderLocalization' -%}
    </div>

    <div class="ml-auto flex items-center lg:ml-0">
      <button type="button" class="icon-btn" aria-expanded="false" aria-controls="HeaderSearch" data-disclosure>
        {% render 'icon', name: 'search' %}
        <span class="sr-only">{{ 'general.search_label' | t }}</span>
      </button>
      <a href="{{ routes.cart_url }}" class="icon-btn relative" data-cart-open>
        {% render 'icon', name: 'bag' %}
        <span class="sr-only" data-cart-label>{{ 'cart.open' | t: count: cart.item_count }}</span>
        <span
          class="cart-count"
          aria-hidden="true"
          data-cart-count
          {% if cart.item_count == 0 %}
            hidden
          {% endif %}
        >
          {{- cart.item_count -}}
        </span>
      </a>
      <button
        type="button"
        class="icon-btn -mr-2 lg:hidden"
        aria-expanded="false"
        aria-controls="HeaderMenu"
        data-menu-toggle
      >
        {% render 'icon', name: 'menu', class: 'menu-icon-open' %}
        {% render 'icon', name: 'close', class: 'menu-icon-close' %}
        <span class="sr-only">{{ 'general.menu' | t }}</span>
      </button>
    </div>
  </div>

  <div id="HeaderSearch" class="header-search" hidden>
    <form action="{{ routes.search_url }}" method="get" role="search" class="wrap py-5">
      <label for="HeaderSearchInput" class="sr-only">{{ 'general.search_label' | t }}</label>
      <div class="relative mx-auto max-w-2xl">
        <input
          id="HeaderSearchInput"
          type="search"
          name="q"
          value="{{ search.terms | escape }}"
          placeholder="{{ 'general.search' | t }}"
          autocomplete="off"
          enterkeyhint="search"
          class="h-14 w-full border-2 border-ink bg-ground pl-12 pr-3 text-lg text-ink placeholder:text-muted"
        >
        <input type="hidden" name="type" value="product">
        <input type="hidden" name="options[prefix]" value="last">
        {% render 'icon', name: 'search', class: 'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2' %}
      </div>
    </form>
  </div>
</header>

{% schema %}
{
  "name": "t:sections.header.name",
  "class": "header-section",
  "enabled_on": { "groups": ["header"] },
  "settings": [
    { "type": "link_list", "id": "menu", "label": "t:sections.header.menu", "default": "main-menu" },
    { "type": "checkbox", "id": "show_shop_name", "label": "t:sections.header.show_shop_name", "default": true },
    { "type": "checkbox", "id": "sticky", "label": "t:sections.header.sticky", "default": true },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ]
}
{% endschema %}
```

`sections/header-group.json`:
```json
{
  "type": "header",
  "name": "Header",
  "sections": {
    "header": {
      "type": "header",
      "settings": {
        "menu": "main-menu",
        "show_shop_name": true,
        "sticky": true,
        "color_scheme": "light"
      }
    }
  },
  "order": ["header"]
}
```

- [ ] **Step 5: Write the header styles**

`src/css/header.css` (ported from the `<style>` block of the concept's `src/components/Header.astro`, keeping the white "home header" variant):
```css
@layer components {
  /* The section wrapper is the sticky element: a sticky header inside a wrapper of the same height would never stick. */
  .header-section:has([data-header-sticky]) {
    position: sticky;
    top: 0;
    z-index: 40;
  }
  .header-logo {
    width: var(--logo-width);
    height: auto;
  }

  /* One set of links: a panel under the header below 64rem, an inline row above it. */
  .header-menu {
    display: none;
  }
  .header-menu[data-open] {
    display: block;
    position: absolute;
    inset-inline: 0;
    top: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0.5rem 1rem 2rem;
    background: var(--scheme-ground);
    border-bottom: 1px solid var(--scheme-hairline);
  }
  @media (max-width: 63.99rem) and (prefers-reduced-motion: no-preference) {
    .header-menu[data-open] {
      transition:
        opacity 200ms cubic-bezier(0.16, 1, 0.3, 1),
        transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    @starting-style {
      .header-menu[data-open] {
        opacity: 0;
        transform: translateY(-8px);
      }
    }
  }

  .header-link {
    display: flex;
    width: 100%;
    align-items: center;
    min-height: 3.5rem;
    border-bottom: 1px solid var(--scheme-hairline);
    font-family: var(--font-display);
    font-size: 1.875rem;
    font-weight: 800;
    text-transform: uppercase;
  }
  .header-link[aria-expanded='true'],
  .header-link[aria-current='page'] {
    background: var(--scheme-tint);
  }
  @media (hover: hover) {
    .header-link:hover {
      background: var(--scheme-tint);
    }
  }
  .header-submenu {
    padding-block: 0.5rem;
  }
  .header-sublink {
    display: flex;
    align-items: center;
    min-height: 2.75rem;
    padding-inline: 0.5rem;
  }
  .header-sublink:hover,
  .header-sublink[aria-current='page'] {
    background: var(--scheme-tint);
  }
  .disclosure-chevron {
    transition: transform 150ms ease;
  }
  [aria-expanded='true'] > .disclosure-chevron {
    transform: rotate(180deg);
  }

  [data-menu-toggle] .menu-icon-close,
  [data-menu-toggle][aria-expanded='true'] .menu-icon-open {
    display: none;
  }
  [data-menu-toggle][aria-expanded='true'] .menu-icon-close {
    display: block;
  }

  .header-search {
    position: absolute;
    inset-inline: 0;
    top: 100%;
    background: var(--scheme-ground);
    border-bottom: 2px solid var(--scheme-ink);
  }

  .localization-form {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 0.75rem;
    margin-top: 2rem;
  }

  @media (min-width: 64rem) {
    .header-menu,
    .header-menu[data-open] {
      display: contents;
    }
    .header-link {
      width: auto;
      min-height: 0;
      border: 0;
      padding-inline: 0.875rem;
      font-family: var(--font-sans);
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: none;
    }
    .header-submenu {
      position: absolute;
      left: 0;
      top: 100%;
      z-index: 10;
      min-width: 14rem;
      padding: 0.5rem;
      background: var(--scheme-ground);
      border: 2px solid var(--scheme-ink);
    }
    .localization-form {
      align-self: center;
      margin-top: 0;
    }
    /* Labels stay for screen readers; the selects' own text says what they are at this width. */
    .localization-form label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .disclosure-chevron {
      transition: none;
    }
  }
}
```

Add to `src/css/theme.css`, directly after the `@source` lines:
```css
@import './header.css';
```

- [ ] **Step 6: Write the header script**

`src/ts/header.ts` (ported from the concept's `src/scripts/menu.ts` and the header script in `Header.astro`, without Lenis):
```ts
import { registerSection } from './sections.ts';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The menu panel also holds controls that are display: none at some widths, so only visible ones join the Tab cycle.
const visibleFocusable = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);

registerSection('[data-header]', (header, signal) => {
  const menuToggle = header.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = header.querySelector<HTMLElement>('[data-menu]');
  const disclosures = [...header.querySelectorAll<HTMLButtonElement>('[data-disclosure]')];
  const desktop = matchMedia('(min-width: 64rem)');

  const panelFor = (button: HTMLButtonElement) => document.getElementById(button.getAttribute('aria-controls') ?? '');
  const openDisclosure = () => disclosures.find((button) => button.getAttribute('aria-expanded') === 'true');

  function setDisclosure(button: HTMLButtonElement, open: boolean) {
    button.setAttribute('aria-expanded', String(open));
    const panel = panelFor(button);
    if (!panel) return;
    panel.hidden = !open;
    if (open) panel.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
  }

  for (const button of disclosures) {
    button.addEventListener(
      'click',
      () => {
        const open = button.getAttribute('aria-expanded') !== 'true';
        disclosures.forEach((other) => other !== button && setDisclosure(other, false));
        setDisclosure(button, open);
      },
      { signal },
    );
  }

  const isMenuOpen = () => menuToggle?.getAttribute('aria-expanded') === 'true';

  function setMenu(open: boolean, returnFocus = true) {
    if (!menuToggle || !menu) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menu.toggleAttribute('data-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) {
      // The header may have scrolled partly away, so size the panel to what's left of the viewport below it.
      menu.style.height = `${window.innerHeight - header.getBoundingClientRect().bottom}px`;
      visibleFocusable(menu)[0]?.focus();
    } else {
      menu.style.height = '';
      if (returnFocus) menuToggle.focus();
    }
  }

  menuToggle?.addEventListener('click', () => setMenu(!isMenuOpen()), { signal });

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        const open = openDisclosure();
        if (open) {
          setDisclosure(open, false);
          open.focus();
        } else if (isMenuOpen()) {
          event.preventDefault();
          setMenu(false);
        }
        return;
      }
      if (event.key !== 'Tab' || !isMenuOpen() || !menu || !menuToggle) return;
      // The toggle sits after the panel in the DOM, so the cycle is set here instead of left to the browser.
      const items = [menuToggle, ...visibleFocusable(menu)];
      const index = items.indexOf(document.activeElement as HTMLElement);
      event.preventDefault();
      items[(index + (event.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    },
    { signal },
  );

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as Node;
      const open = openDisclosure();
      if (open && !open.contains(target) && !panelFor(open)?.contains(target)) setDisclosure(open, false);
    },
    { signal },
  );

  // Following a link should close the menu and let the browser move focus to the target.
  menu?.addEventListener(
    'click',
    (event) => {
      if ((event.target as Element).closest('a') && isMenuOpen()) setMenu(false, false);
    },
    { signal },
  );

  desktop.addEventListener(
    'change',
    (event) => {
      if (event.matches && isMenuOpen()) setMenu(false, false);
    },
    { signal },
  );

  for (const form of header.querySelectorAll<HTMLFormElement>('.localization-form')) {
    form.querySelector<HTMLElement>('[data-localization-submit]')?.setAttribute('hidden', '');
    form.addEventListener('change', () => form.submit(), { signal });
  }

  signal.addEventListener('abort', () => {
    document.documentElement.style.overflow = '';
  });
});
```

Change `src/ts/theme.ts` to:
```ts
import './header.ts';
```

- [ ] **Step 7: Build and run the checks at both widths**

Run:
```bash
npm run build && npm run typecheck && npm run check
agent-browser --session theme set viewport 390 844
agent-browser --session theme open http://127.0.0.1:9292/
agent-browser --session theme eval --stdin < tests/browser/header-check.js
agent-browser --session theme set viewport 1440 900
agent-browser --session theme open http://127.0.0.1:9292/
agent-browser --session theme eval --stdin < tests/browser/header-check.js
```
Expected: no Theme Check errors, then `header mobile ok` and `header desktop ok`.

- [ ] **Step 8: Commit**

```bash
git add sections snippets src assets tests
git commit -m "Add header with menu, search and country selector

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 4: footer with menus and newsletter signup

**Files:**
- Create: `sections/footer.liquid`, `tests/browser/footer-check.js`
- Modify: `sections/footer-group.json`

**Interfaces:**
- Consumes: component classes and `icon` snippet (Task 2).

- [ ] **Step 1: Write the failing browser check**

`tests/browser/footer-check.js`:
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const footer = document.querySelector('footer');
  assert(footer, 'Footer renders');
  assert(footer.className.includes('color-dark'), 'Footer uses the dark scheme by default');
  const form = footer.querySelector('form#FooterNewsletter');
  assert(form, 'Newsletter form renders');
  assert(form.getAttribute('action').endsWith('/contact'), 'Newsletter posts to the customer form endpoint');
  assert(form.querySelector('input[name="contact[email]"][type="email"][required]'), 'Email field is named and required');
  assert(form.querySelector('input[name="contact[tags]"][value="newsletter"]'), 'Signups are tagged newsletter');
  assert(form.querySelector('label[for="FooterNewsletterEmail"]'), 'Email field has a label');
  assert(footer.querySelectorAll('nav a, ul a').length > 0, 'Footer menu block renders links');
  return 'footer ok';
})();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/footer-check.js`
Expected: FAIL with `Footer renders`.

- [ ] **Step 3: Write the footer section**

`sections/footer.liquid` (layout ported from the concept's `src/components/Footer.astro`; contact details, certification marks and the RaaLa credit are left out):
```liquid
<footer
  class="color-{{ section.settings.color_scheme }}"
  aria-labelledby="FooterTitle-{{ section.id }}"
>
  <h2 id="FooterTitle-{{ section.id }}" class="sr-only">{{ shop.name | escape }}</h2>
  <div class="wrap grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
    {%- if section.settings.show_newsletter -%}
      <div class="lg:col-span-5">
        <p class="font-display text-section font-extrabold uppercase text-heading">
          {{- section.settings.newsletter_heading | escape -}}
        </p>
        {%- if section.settings.newsletter_text != blank -%}
          <div class="rte mt-2">{{ section.settings.newsletter_text }}</div>
        {%- endif -%}
        {%- form 'customer', id: 'FooterNewsletter', class: 'mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start' -%}
          <input type="hidden" name="contact[tags]" value="newsletter">
          <div class="field flex-1">
            <label for="FooterNewsletterEmail">{{ 'newsletter.label' | t }}</label>
            <input
              id="FooterNewsletterEmail"
              type="email"
              name="contact[email]"
              autocomplete="email"
              required
              {% if form.errors %}
                aria-invalid="true" aria-describedby="FooterNewsletterError"
              {% endif %}
            >
            {%- if form.errors -%}
              <p id="FooterNewsletterError" class="field-error">
                <span aria-hidden="true">!</span><span class="sr-only">{{ 'general.error' | t }}</span>
                {{ form.errors.translated_fields['email'] | capitalize }}
                {{ form.errors.messages['email'] }}
              </p>
            {%- endif -%}
          </div>
          <button type="submit" class="btn btn-primary sm:mt-7">{{ 'newsletter.submit' | t }}</button>
          {%- if form.posted_successfully? -%}
            <p class="font-semibold sm:basis-full" role="status">{{ 'newsletter.success' | t }}</p>
          {%- endif -%}
        {%- endform -%}
      </div>
    {%- endif -%}

    {%- for block in section.blocks -%}
      <div class="lg:col-span-3" {{ block.shopify_attributes }}>
        {%- case block.type -%}
          {%- when 'menu' -%}
            <nav aria-labelledby="FooterMenu-{{ block.id }}">
              <h3 id="FooterMenu-{{ block.id }}" class="font-sans text-sm font-semibold tracking-wide text-muted">
                {{- block.settings.heading | escape -}}
              </h3>
              <ul class="mt-3" role="list">
                {%- for link in block.settings.menu.links -%}
                  <li>
                    <a href="{{ link.url }}" class="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
                      {{- link.title | escape -}}
                    </a>
                  </li>
                {%- endfor -%}
              </ul>
            </nav>
          {%- when 'text' -%}
            <h3 class="font-sans text-sm font-semibold tracking-wide text-muted">{{ block.settings.heading | escape }}</h3>
            <div class="rte mt-3">{{ block.settings.text }}</div>
        {%- endcase -%}
      </div>
    {%- endfor -%}
  </div>

  <div class="border-t border-hairline">
    <div class="wrap flex flex-col gap-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p>
        &copy; {{ 'now' | date: '%Y' }}
        {{ shop.name | escape | link_to: routes.root_url }}
        {%- if section.settings.credit != blank %} · {{ section.settings.credit }}{% endif -%}
      </p>
      {%- if section.settings.show_payment_icons and shop.enabled_payment_types.size > 0 -%}
        <ul class="flex flex-wrap gap-2" role="list" aria-label="{{ 'footer.payment_methods' | t }}">
          {%- for type in shop.enabled_payment_types -%}
            <li>{{ type | payment_type_svg_tag: class: 'h-6 w-auto' }}</li>
          {%- endfor -%}
        </ul>
      {%- endif -%}
    </div>
  </div>
</footer>

{% schema %}
{
  "name": "t:sections.footer.name",
  "enabled_on": { "groups": ["footer"] },
  "max_blocks": 4,
  "settings": [
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "dark" },
    { "type": "checkbox", "id": "show_newsletter", "label": "t:sections.footer.show_newsletter", "default": true },
    { "type": "text", "id": "newsletter_heading", "label": "t:sections.footer.newsletter_heading", "default": "Join the mailing list" },
    { "type": "richtext", "id": "newsletter_text", "label": "t:sections.footer.newsletter_text", "default": "<p>New harvests, recipes and the odd offer.</p>" },
    { "type": "checkbox", "id": "show_payment_icons", "label": "t:sections.footer.show_payment_icons", "default": true },
    { "type": "inline_richtext", "id": "credit", "label": "t:sections.footer.credit" }
  ],
  "blocks": [
    {
      "type": "menu",
      "name": "t:sections.footer.blocks.menu.name",
      "settings": [
        { "type": "text", "id": "heading", "label": "t:sections.footer.blocks.menu.heading", "default": "Shop" },
        { "type": "link_list", "id": "menu", "label": "t:sections.footer.blocks.menu.menu", "default": "footer" }
      ]
    },
    {
      "type": "text",
      "name": "t:sections.footer.blocks.text.name",
      "settings": [
        { "type": "text", "id": "heading", "label": "t:sections.footer.blocks.text.heading", "default": "About" },
        { "type": "richtext", "id": "text", "label": "t:sections.footer.blocks.text.text", "default": "<p>Tell customers who you are and where you make things.</p>" }
      ]
    }
  ]
}
{% endschema %}
```

`sections/footer-group.json`:
```json
{
  "type": "footer",
  "name": "Footer",
  "sections": {
    "footer": {
      "type": "footer",
      "blocks": {
        "menu": { "type": "menu", "settings": { "heading": "Shop", "menu": "footer" } }
      },
      "block_order": ["menu"],
      "settings": { "color_scheme": "dark" }
    }
  },
  "order": ["footer"]
}
```

- [ ] **Step 4: Run the checks**

Run: `npm run build && npm run check && agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/footer-check.js`
Expected: no Theme Check errors, then `footer ok`.

- [ ] **Step 5: Check signup by hand**

Submit a real address you control in the footer form on the dev server. Expected: the page reloads at `#FooterNewsletter` with "Thanks for signing up.", and the address appears under Customers in Shopify admin with the tag `newsletter`. Shopify may show a captcha first; that is expected. Submit `not-an-email` with the browser's validation bypassed (`agent-browser eval "document.getElementById('FooterNewsletter').noValidate = true"`) and confirm the error paragraph appears with the "!" mark.

- [ ] **Step 6: Commit**

```bash
git add sections assets tests
git commit -m "Add footer with menu blocks and newsletter signup

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 5: cart drawer, cart page and Ajax cart

**Files:**
- Create: `src/ts/cart-errors.ts`, `tests/unit/cart-errors.test.ts`, `src/ts/cart.ts`, `snippets/cart-lines.liquid`, `sections/cart-drawer.liquid`, `sections/main-cart.liquid`, `templates/cart.json`, `src/css/cart.css`, `tests/browser/cart-page-check.js`
- Modify: `layout/theme.liquid`, `src/css/theme.css` (add import), `src/ts/theme.ts`

**Interfaces:**
- Consumes: `themeData()` (Task 1); header's `[data-cart-open]`, `[data-cart-count]`, `[data-cart-label]` (Task 3).
- Produces: `cartErrorMessage(body: unknown, fallback: string): string`.
- Produces: `initCart(): void`. It handles, by delegation on `document`: clicks on `[data-cart-open]` (opens the drawer), `[data-cart-close]`, links `a[data-cart-line][data-cart-quantity]` (line changes), and `submit` of any `form[data-product-form]` (adds to cart). Task 6's product form relies on the last one: it needs `data-product-form` on the form and an empty `[data-cart-error]` element inside it.
- Produces: every element with `data-cart-section="<section id>"` is re-rendered after each cart change. The element with `data-item-count` and `data-cart-label-text` inside the drawer section is the source for the header count.

- [ ] **Step 1: Write the failing unit test**

`tests/unit/cart-errors.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cartErrorMessage } from '../../src/ts/cart-errors.ts';

const fallback = 'Something went wrong.';

test('prefers the description, which is the shopper-facing sentence', () => {
  const body = { status: 422, message: 'Cart Error', description: 'You can only add 2 of this item to your cart.' };
  assert.equal(cartErrorMessage(body, fallback), 'You can only add 2 of this item to your cart.');
});

test('falls back to the message when the description is empty or missing', () => {
  assert.equal(cartErrorMessage({ status: 422, message: 'Cart Error', description: '' }, fallback), 'Cart Error');
  assert.equal(cartErrorMessage({ status: 422, message: 'Cart Error' }, fallback), 'Cart Error');
});

test('uses the fallback for anything that is not an error body', () => {
  assert.equal(cartErrorMessage(null, fallback), fallback);
  assert.equal(cartErrorMessage('<html>', fallback), fallback);
  assert.equal(cartErrorMessage({ status: 500 }, fallback), fallback);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL, cannot find module `src/ts/cart-errors.ts`.

- [ ] **Step 3: Implement cartErrorMessage**

`src/ts/cart-errors.ts`:
```ts
/**
 * Shopify's Ajax Cart API answers a refused change with { status, message, description }. The description is the
 * sentence written for shoppers (for example a stock limit), so it wins over the shorter message.
 */
export function cartErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const { description, message } = body as { description?: unknown; message?: unknown };
    if (typeof description === 'string' && description.trim()) return description;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `npm test`
Expected: 3 tests pass.

- [ ] **Step 5: Write the failing browser check for the cart page**

`tests/browser/cart-page-check.js` (run after adding one 250 ml bottle, see Step 12):
```js
(async () => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const waitFor = async (test, message) => {
    const deadline = performance.now() + 8000;
    while (!test()) {
      if (performance.now() > deadline) throw Error(message);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };
  const page = document.querySelector('[data-cart-section]:not([data-item-count][data-cart-label-text])');
  assert(page, 'Cart page section renders');
  const quantity = () => page.querySelector('[role="group"] .tabular')?.textContent.trim();
  assert(quantity() === '1', 'Cart page starts with quantity 1');
  const increase = page.querySelector('a[data-focus-id^="inc-"]');
  assert(increase.getAttribute('href').includes('quantity=2'), 'Increase works as a plain link without JavaScript');
  increase.click();
  await waitFor(() => quantity() === '2', 'Quantity becomes 2 in place');
  assert(location.pathname.endsWith('/cart'), 'The page did not navigate');
  assert(document.activeElement?.dataset.focusId?.startsWith('inc-'), 'Focus stays on the increase control');
  assert(document.querySelector('[data-cart-count]').textContent.trim() === '2', 'Header count follows');
  page.querySelector('a[data-focus-id^="remove-"]').click();
  await waitFor(() => !page.querySelector('[data-cart-line]'), 'Removing the line empties the cart');
  assert(document.querySelector('[data-cart-count]').hidden, 'Header count hides when the cart is empty');
  return 'cart page ok';
})();
```

- [ ] **Step 6: Write the cart line snippet**

`snippets/cart-lines.liquid`:
```liquid
{% doc %}
  Cart lines with quantity and remove controls. The controls are links to /cart/change, so they work without
  JavaScript. cart.ts intercepts them, posts to /cart/change.js and re-renders the cart sections in place.
  data-focus-id lets cart.ts put focus back on the same control after the re-render.
{% enddoc %}
<ul class="divide-y divide-hairline" role="list">
  {%- for item in cart.items -%}
    {%- liquid
      assign item_title = item.title | escape
      assign decrease_quantity = item.quantity | minus: 1
      assign increase_quantity = item.quantity | plus: 1
    -%}
    <li class="flex items-start gap-3 py-4">
      <div class="size-16 shrink-0 border border-hairline bg-white">
        {%- if item.image -%}
          {{
            item.image
            | image_url: width: 128
            | image_tag: width: 64, height: 64, alt: '', loading: 'lazy', class: 'size-full object-contain p-1'
          }}
        {%- endif -%}
      </div>
      <div class="min-w-0 flex-1">
        <a href="{{ item.url }}" class="font-semibold underline-offset-4 hover:underline">
          {{- item.product.title | escape -}}
        </a>
        {%- unless item.product.has_only_default_variant -%}
          <p class="text-sm text-muted">{{ item.variant.title | escape }}</p>
        {%- endunless -%}
        <p class="tabular mt-1 text-sm">
          {{ item.final_line_price | money }}
          {%- if item.original_line_price > item.final_line_price %}
            <s class="text-muted"
              ><span class="sr-only">{{ 'cart.was' | t }} </span>{{ item.original_line_price | money }}</s
            >
          {%- endif %}
        </p>
        <a
          href="{{ item.url_to_remove }}"
          class="-ml-1 inline-flex min-h-11 items-center px-1 text-sm font-semibold text-heading underline underline-offset-4 hover:text-ink"
          data-cart-line="{{ forloop.index }}"
          data-cart-quantity="0"
          data-focus-id="remove-{{ item.key }}"
        >
          {{- 'cart.remove' | t -}}
          <span class="sr-only">: {{ item_title }}</span>
        </a>
      </div>
      <div class="flex items-center gap-1" role="group" aria-label="{{ 'cart.quantity_of' | t: title: item_title }}">
        <a
          href="{{ routes.cart_change_url }}?line={{ forloop.index }}&amp;quantity={{ decrease_quantity }}"
          class="icon-btn border border-line"
          data-cart-line="{{ forloop.index }}"
          data-cart-quantity="{{ decrease_quantity }}"
          data-focus-id="dec-{{ item.key }}"
        >
          {% render 'icon', name: 'minus', size: 18 %}
          <span class="sr-only">{{ 'cart.decrease' | t }}</span>
        </a>
        <span class="tabular w-8 text-center font-semibold">{{ item.quantity }}</span>
        <a
          href="{{ routes.cart_change_url }}?line={{ forloop.index }}&amp;quantity={{ increase_quantity }}"
          class="icon-btn border border-line"
          data-cart-line="{{ forloop.index }}"
          data-cart-quantity="{{ increase_quantity }}"
          data-focus-id="inc-{{ item.key }}"
        >
          {% render 'icon', name: 'plus', size: 18 %}
          <span class="sr-only">{{ 'cart.increase' | t }}</span>
        </a>
      </div>
    </li>
  {%- endfor -%}
</ul>
```

- [ ] **Step 7: Write the cart sections and template**

`sections/cart-drawer.liquid` (layout ported from the concept's `src/components/CartDrawer.astro`; the demo checkout dialog and toast are dropped):
```liquid
<div
  class="flex h-full flex-col"
  data-cart-section="{{ section.id }}"
  data-item-count="{{ cart.item_count }}"
  data-cart-label-text="{{ 'cart.open' | t: count: cart.item_count }}"
>
  <div class="flex items-center justify-between border-b border-hairline px-5 py-3">
    <h2 id="CartDrawerTitle" class="text-card">{{ 'cart.title' | t }}</h2>
    <button type="button" class="icon-btn" data-cart-close data-focus-id="cart-close">
      {% render 'icon', name: 'close' %}
      <span class="sr-only">{{ 'cart.close' | t }}</span>
    </button>
  </div>
  <div class="flex-1 overflow-y-auto px-5 py-4">
    <p class="field-error empty:hidden" role="alert" data-cart-error></p>
    {%- if cart.empty? -%}
      <p class="py-10 text-center text-heading">{{ 'cart.empty' | t }}</p>
    {%- else -%}
      {% render 'cart-lines' %}
    {%- endif -%}
  </div>
  {%- unless cart.empty? -%}
    <div class="border-t border-hairline px-5 py-5">
      <div class="flex items-baseline justify-between text-lg">
        <span class="font-semibold">{{ 'cart.subtotal' | t }}</span>
        <span class="tabular font-semibold">{{ cart.total_price | money }}</span>
      </div>
      <p class="mt-1 text-sm text-muted">{{ 'cart.shipping_note' | t }}</p>
      <form action="{{ routes.cart_url }}" method="post" class="mt-4">
        <button type="submit" name="checkout" class="btn btn-primary w-full">{{ 'cart.checkout' | t }}</button>
      </form>
    </div>
  {%- endunless -%}
</div>

{% schema %}
{
  "name": "t:sections.cart_drawer.name",
  "settings": []
}
{% endschema %}
```

`sections/main-cart.liquid`:
```liquid
<div class="color-{{ section.settings.color_scheme }} py-12 lg:py-16">
  <div class="wrap max-w-3xl" data-cart-section="{{ section.id }}">
    <h1 class="text-section" tabindex="-1">{{ 'cart.title' | t }}</h1>
    <p class="field-error mt-4 empty:hidden" role="alert" data-cart-error></p>
    {%- if cart.empty? -%}
      <p class="mt-8 text-lg">{{ 'cart.empty' | t }}</p>
      <a href="{{ routes.all_products_collection_url }}" class="btn btn-primary mt-6">{{ 'cart.continue_shopping' | t }}</a>
    {%- else -%}
      <div class="mt-8">{% render 'cart-lines' %}</div>
      <div class="mt-6 border-t border-hairline pt-6">
        <div class="flex items-baseline justify-between text-lg">
          <span class="font-semibold">{{ 'cart.subtotal' | t }}</span>
          <span class="tabular font-semibold">{{ cart.total_price | money }}</span>
        </div>
        <p class="mt-1 text-sm text-muted">{{ 'cart.shipping_note' | t }}</p>
        <form action="{{ routes.cart_url }}" method="post" class="mt-4 sm:flex sm:justify-end">
          <button type="submit" name="checkout" class="btn btn-primary w-full sm:w-auto">{{ 'cart.checkout' | t }}</button>
        </form>
      </div>
    {%- endif -%}
  </div>
</div>

{% schema %}
{
  "name": "t:sections.main_cart.name",
  "settings": [
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ]
}
{% endschema %}
```

`templates/cart.json`:
```json
{
  "sections": {
    "main": { "type": "main-cart", "settings": { "color_scheme": "light" } }
  },
  "order": ["main"]
}
```

In `layout/theme.liquid`, replace `{% render 'theme-data' %}` with:
```liquid
    {%- comment -%}
      The dialog stays outside the section so re-rendering the cart replaces only its contents and an open
      drawer stays open. showModal() gives focus trapping, Escape to close and an inert page behind it.
    {%- endcomment -%}
    <dialog id="CartDrawer" class="side-sheet" aria-labelledby="CartDrawerTitle" data-cart-drawer>
      {% section 'cart-drawer' %}
    </dialog>
    <p class="sr-only" aria-live="polite" data-cart-status></p>
    {% render 'theme-data' %}
```

- [ ] **Step 8: Write the cart styles**

`src/css/cart.css` (the `.side-sheet` rules ported from the concept's `src/styles/global.css`, and the count badge from `Header.astro`):
```css
@layer components {
  .cart-count {
    position: absolute;
    right: 0.125rem;
    top: 0.125rem;
    display: flex;
    height: 1.25rem;
    min-width: 1.25rem;
    align-items: center;
    justify-content: center;
    padding-inline: 0.25rem;
    border-radius: 999px;
    background: var(--scheme-heading);
    color: var(--scheme-ground);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .side-sheet {
    margin: 0 0 0 auto;
    width: min(26rem, 100vw);
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    padding: 0;
    border: 0;
    background: var(--scheme-ground);
    color: var(--scheme-ink);
  }
  /* rgb first for browsers where ::backdrop doesn't inherit custom properties from the dialog. */
  .side-sheet::backdrop {
    background: rgb(0 0 0 / 0.5);
    background: color-mix(in srgb, var(--scheme-ink) 55%, transparent);
  }
  /*
    Transitions rather than a keyframe so the drawer also leaves the way it came, on every close path (button,
    Escape, backdrop). overlay and display allow-discrete keep the closed dialog in the top layer until the exit
    finishes. Browsers without allow-discrete (Firefox) close instantly.
  */
  .side-sheet,
  .side-sheet::backdrop {
    transition:
      transform 300ms cubic-bezier(0.32, 0.72, 0, 1),
      opacity 200ms ease,
      overlay 300ms allow-discrete,
      display 300ms allow-discrete;
  }
  .side-sheet:not([open]) {
    transform: translateX(100%);
  }
  .side-sheet:not([open])::backdrop {
    opacity: 0;
  }
  @starting-style {
    .side-sheet[open] {
      transform: translateX(100%);
    }
    .side-sheet[open]::backdrop {
      opacity: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .side-sheet,
    .side-sheet::backdrop {
      transition:
        opacity 150ms ease,
        overlay 150ms allow-discrete,
        display 150ms allow-discrete;
    }
    .side-sheet:not([open]) {
      transform: none;
      opacity: 0;
    }
    @starting-style {
      .side-sheet[open] {
        transform: none;
        opacity: 0;
      }
    }
  }
}
```

Add to `src/css/theme.css` after the header import:
```css
@import './cart.css';
```

- [ ] **Step 9: Write the cart script**

`src/ts/cart.ts`:
```ts
import { cartErrorMessage } from './cart-errors.ts';
import { themeData } from './theme-data.ts';

class CartRequestError extends Error {}

type SectionsResponse = { sections?: Record<string, string | null> };

const cartSectionIds = () =>
  [...document.querySelectorAll<HTMLElement>('[data-cart-section]')].map((el) => el.dataset.cartSection!);

function announce(message: string) {
  const status = document.querySelector('[data-cart-status]');
  if (!status) return;
  // Clearing first makes screen readers repeat an identical message.
  status.textContent = '';
  setTimeout(() => (status.textContent = message), 50);
}

async function post(url: string, body: FormData | Record<string, unknown>): Promise<SectionsResponse> {
  const sections = cartSectionIds().join(',');
  const init: RequestInit =
    body instanceof FormData
      ? (body.append('sections', sections),
        body.append('sections_url', location.pathname),
        { method: 'POST', body, headers: { Accept: 'application/json' } })
      : {
          method: 'POST',
          body: JSON.stringify({ ...body, sections, sections_url: location.pathname }),
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        };
  const response = await fetch(url, init);
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new CartRequestError(cartErrorMessage(json, themeData().strings.networkError));
  return json as SectionsResponse;
}

const messageFor = (error: unknown) =>
  error instanceof CartRequestError ? error.message : themeData().strings.networkError;

function updateHeaderCount() {
  const source = document.querySelector<HTMLElement>('[data-item-count]');
  if (!source) return;
  const count = Number(source.dataset.itemCount ?? 0);
  document.querySelectorAll<HTMLElement>('[data-cart-count]').forEach((el) => {
    el.textContent = String(count);
    el.hidden = count === 0;
  });
  document.querySelectorAll('[data-cart-label]').forEach((el) => (el.textContent = source.dataset.cartLabelText ?? ''));
}

function renderSections(sections: SectionsResponse['sections']) {
  if (!sections) return;
  // Replacing the HTML drops focus, so remember which control had it and find its twin in the new markup.
  const active = document.activeElement as HTMLElement | null;
  const focusId = active?.dataset.focusId;
  const focusScope = active?.closest<HTMLElement>('.shopify-section');

  for (const [id, html] of Object.entries(sections)) {
    const current = document.getElementById(`shopify-section-${id}`);
    if (!current || !html) continue;
    const next = new DOMParser().parseFromString(html, 'text/html').getElementById(`shopify-section-${id}`);
    if (next) current.innerHTML = next.innerHTML;
  }
  updateHeaderCount();

  if (focusId && focusScope) {
    const target =
      focusScope.querySelector<HTMLElement>(`[data-focus-id="${CSS.escape(focusId)}"]`) ??
      focusScope.querySelector<HTMLElement>('[data-cart-close], h1[tabindex="-1"]');
    target?.focus();
  }
}

let opener: HTMLElement | null = null;

function openDrawer(from: HTMLElement | null) {
  const drawer = document.querySelector<HTMLDialogElement>('[data-cart-drawer]');
  if (!drawer || drawer.open) return;
  opener = from;
  drawer.showModal();
}

async function addToCart(form: HTMLFormElement) {
  const error = form.querySelector<HTMLElement>('[data-cart-error]');
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
  if (error) error.textContent = '';
  submit?.setAttribute('aria-busy', 'true');
  try {
    const data = await post(themeData().routes.cartAdd, new FormData(form));
    renderSections(data.sections);
    announce(themeData().strings.added);
    openDrawer(submit);
  } catch (reason) {
    if (error) error.textContent = messageFor(reason);
  } finally {
    submit?.removeAttribute('aria-busy');
  }
}

async function changeLine(link: HTMLAnchorElement) {
  const scope = link.closest('.shopify-section');
  try {
    const data = await post(themeData().routes.cartChange, {
      line: Number(link.dataset.cartLine),
      quantity: Number(link.dataset.cartQuantity),
    });
    renderSections(data.sections);
    announce(themeData().strings.updated);
  } catch (reason) {
    const error = scope?.querySelector<HTMLElement>('[data-cart-error]');
    if (error) error.textContent = messageFor(reason);
  }
}

/** Delegated on document, so it keeps working when the theme editor or a cart update replaces section HTML. */
export function initCart() {
  const drawer = document.querySelector<HTMLDialogElement>('[data-cart-drawer]');

  document.addEventListener('click', (event) => {
    const target = event.target as Element;
    const openButton = target.closest<HTMLElement>('[data-cart-open]');
    if (openButton && drawer) {
      event.preventDefault();
      openDrawer(openButton);
      return;
    }
    if (target.closest('[data-cart-close]')) {
      drawer?.close();
      return;
    }
    const line = target.closest<HTMLAnchorElement>('a[data-cart-line]');
    if (line) {
      event.preventDefault();
      void changeLine(line);
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;
    if (!form.matches('[data-product-form]')) return;
    event.preventDefault();
    void addToCart(form);
  });

  // A click on the backdrop lands on the dialog element itself.
  drawer?.addEventListener('click', (event) => {
    if (event.target === drawer) drawer.close();
  });
  drawer?.addEventListener('close', () => opener?.focus());
}
```

Change `src/ts/theme.ts` to:
```ts
import { initCart } from './cart.ts';
import './header.ts';

initCart();
```

- [ ] **Step 10: Build and run the static checks**

Run: `npm run build && npm run typecheck && npm test && npm run check`
Expected: all pass, no Theme Check errors.

- [ ] **Step 11: Check the empty drawer by hand-run script**

Run:
```bash
agent-browser --session theme set viewport 1440 900
agent-browser --session theme open http://127.0.0.1:9292/
agent-browser --session theme eval "fetch('/cart/clear.js', { method: 'POST' }).then(() => 'cleared')"
agent-browser --session theme reload
agent-browser --session theme click "[data-header] [data-cart-open]"
agent-browser --session theme eval "document.querySelector('[data-cart-drawer]').open && document.activeElement.closest('[data-cart-drawer]') ? 'drawer open' : 'FAIL'"
agent-browser --session theme press Escape
agent-browser --session theme eval "document.activeElement.matches('[data-cart-open]') ? 'focus returned' : 'FAIL'"
```
Expected: `drawer open`, then `focus returned`.

- [ ] **Step 12: Run the cart page check**

Run:
```bash
agent-browser --session theme open http://127.0.0.1:9292/
agent-browser --session theme eval "fetch('/products/kithul-treacle.js').then(r => r.json()).then(p => fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: p.variants.find(v => v.title === '250 ml').id, quantity: 1 }] }) })).then(r => r.status)"
agent-browser --session theme open http://127.0.0.1:9292/cart
agent-browser --session theme eval --stdin < tests/browser/cart-page-check.js
```
Expected: `200`, then `cart page ok`.

- [ ] **Step 13: Commit**

```bash
git add layout sections snippets templates src assets tests
git commit -m "Add Ajax cart drawer and cart page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 6: product page

**Files:**
- Create: `src/ts/variants.ts`, `tests/unit/variants.test.ts`, `src/ts/gallery.ts`, `src/ts/product.ts`, `sections/main-product.liquid`, `snippets/product-gallery.liquid`, `snippets/product-price.liquid`, `snippets/sale-stamp.liquid`, `snippets/variant-picker.liquid`, `snippets/buy-buttons.liquid`, `snippets/product-variants-json.liquid`, `templates/product.json`, `src/css/product.css`, `src/css/gallery.css`, `src/css/sale-stamp.css`, `tests/browser/product-check.js`, `tests/browser/product-cart-check.js`
- Modify: `src/css/theme.css` (imports), `src/ts/theme.ts`

**Interfaces:**
- Consumes: `registerSection`, `themeData()` (Task 1); `initCart`'s handling of `form[data-product-form]` and `[data-cart-error]` (Task 5).
- Produces: `interface VariantData { id: number; options: string[]; available: boolean; mediaId: number | null; priceHtml: string; compareHtml: string | null; percentOff: number | null }`, `findVariant(variants: VariantData[], selected: string[]): VariantData | undefined`, `clampQuantity(value: number, min: number, max: number): number`, `initGallery(root: HTMLElement, signal: AbortSignal): (mediaId: string) => void`.
- Produces: `{% render 'product-price', variant: v %}` and `{% render 'sale-stamp', variant: v %}`, reused by later plans' featured product section.

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/variants.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clampQuantity, findVariant, type VariantData } from '../../src/ts/variants.ts';

const variant = (id: number, options: string[]): VariantData => ({
  id,
  options,
  available: true,
  mediaId: null,
  priceHtml: '',
  compareHtml: null,
  percentOff: null,
});

const variants = [variant(1, ['250 ml', 'Glass']), variant(2, ['375 ml', 'Glass']), variant(3, ['375 ml', 'Tin'])];

test('findVariant matches every selected option', () => {
  assert.equal(findVariant(variants, ['375 ml', 'Tin'])?.id, 3);
  assert.equal(findVariant(variants, ['250 ml', 'Glass'])?.id, 1);
});

test('findVariant returns undefined for a combination the product does not sell', () => {
  assert.equal(findVariant(variants, ['250 ml', 'Tin']), undefined);
});

test('findVariant treats a missing selection as no match', () => {
  assert.equal(findVariant(variants, ['375 ml']), undefined);
});

test('clampQuantity keeps whole numbers inside the range', () => {
  assert.equal(clampQuantity(5, 1, 20), 5);
  assert.equal(clampQuantity(0, 1, 20), 1);
  assert.equal(clampQuantity(25, 1, 20), 20);
  assert.equal(clampQuantity(2.6, 1, 20), 3);
  assert.equal(clampQuantity(Number.NaN, 1, 20), 1);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test`
Expected: FAIL, cannot find module `src/ts/variants.ts`.

- [ ] **Step 3: Implement the variant helpers**

`src/ts/variants.ts`:
```ts
/** One variant as printed by snippets/product-variants-json.liquid. Prices arrive formatted by Liquid's money filter. */
export interface VariantData {
  id: number;
  options: string[];
  available: boolean;
  mediaId: number | null;
  priceHtml: string;
  compareHtml: string | null;
  percentOff: number | null;
}

export function findVariant(variants: VariantData[], selected: string[]): VariantData | undefined {
  return variants.find((variant) => variant.options.every((value, index) => value === selected[index]));
}

export function clampQuantity(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}
```

- [ ] **Step 4: Run the unit tests to verify they pass**

Run: `npm test`
Expected: all tests pass (3 cart, 4 variants).

- [ ] **Step 5: Write the failing browser checks**

`tests/browser/product-check.js`:
```js
(async () => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const root = document.querySelector('[data-product-root]');
  assert(root, 'Product section renders');
  const variants = JSON.parse(root.querySelector('[data-product-variants]').textContent);
  const byName = (name) => variants.find((v) => v.options[0] === name);
  const pick = (name) => [...root.querySelectorAll('[data-variant-picker] input')].find((i) => i.value === name).click();
  const idInput = root.querySelector('[data-variant-id]');
  const button = root.querySelector('[data-add-button]');
  const label = () => root.querySelector('[data-add-label]').textContent.trim();

  assert(!idInput.disabled, 'JavaScript enables the variant id input');

  pick('250 ml');
  const v250 = byName('250 ml');
  assert(idInput.value === String(v250.id), '250 ml sets the variant id');
  assert(new URL(location.href).searchParams.get('variant') === String(v250.id), '250 ml is in the URL');
  assert(!root.querySelector('[data-price-was]').hidden, '250 ml shows its compare-at price');
  assert(!root.querySelector('[data-sale-stamp]').hidden, '250 ml shows the sale stamp');
  assert(root.querySelector('[data-sale-percent]').textContent.trim() === '20', '250 ml stamp shows 20% off');
  assert(root.querySelector(`[data-gallery-slide="${v250.mediaId}"]`).hidden === false, '250 ml shows its image');

  pick('375 ml');
  assert(button.disabled, 'Sold-out 375 ml disables add to cart');
  assert(label() === 'Sold out', 'Sold-out label shows');
  assert(root.querySelector('[data-price-was]').hidden, '375 ml has no compare-at price');
  assert(root.querySelector('[data-sale-stamp]').hidden, '375 ml has no sale stamp');

  pick('1000 ml');
  assert(!button.disabled && label() === 'Add to cart', '1000 ml can be bought');
  assert(root.querySelector('[data-price-current]').innerHTML === byName('1000 ml').priceHtml, '1000 ml price shows');

  const quantity = root.querySelector('[data-quantity-input]');
  root.querySelector('[data-quantity-step="1"]').click();
  assert(quantity.value === '2', 'Plus raises quantity');
  quantity.value = '500';
  quantity.dispatchEvent(new Event('change', { bubbles: true }));
  assert(quantity.value === quantity.max, 'Typed quantity is clamped to the maximum');
  quantity.value = '1';

  const thumbs = [...root.querySelectorAll('[data-gallery-thumb]')];
  thumbs[1].focus();
  thumbs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert(document.activeElement === thumbs[2], 'Arrow keys move along the thumbnails');
  assert(thumbs[2].getAttribute('aria-current') === 'true', 'Arrow keys change the image');

  const section = root.closest('.shopify-section');
  section.dispatchEvent(new CustomEvent('shopify:section:unload', { bubbles: true }));
  section.innerHTML = section.innerHTML;
  section.querySelector('[data-variant-id]').setAttribute('disabled', '');
  section.dispatchEvent(new CustomEvent('shopify:section:load', { bubbles: true }));
  assert(!section.querySelector('[data-variant-id]').disabled, 'A section reloaded by the theme editor runs its script again');
  return 'product ok';
})();
```

`tests/browser/product-cart-check.js` (run on a fresh load of the product page with an empty cart):
```js
(async () => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const waitFor = async (test, message) => {
    const deadline = performance.now() + 8000;
    while (!test()) {
      if (performance.now() > deadline) throw Error(message);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };
  const root = document.querySelector('[data-product-root]');
  const form = root.querySelector('[data-product-form]');
  const drawer = document.querySelector('[data-cart-drawer]');
  const pick = (name) => [...root.querySelectorAll('[data-variant-picker] input')].find((i) => i.value === name).click();

  pick('1000 ml');
  form.querySelector('[data-quantity-input]').value = '3';
  form.requestSubmit();
  const error = form.querySelector('[data-cart-error]');
  await waitFor(() => error.textContent.trim() !== '', 'Stock limit error appears');
  assert(!drawer.open, 'The drawer stays shut when Shopify refuses the add');

  pick('250 ml');
  form.querySelector('[data-quantity-input]').value = '2';
  form.requestSubmit();
  await waitFor(() => drawer.open, 'Adding opens the drawer');
  await waitFor(() => drawer.querySelector('[data-cart-line]'), 'The drawer lists the line');
  assert(error.textContent.trim() === '', 'A successful add clears the old error');
  assert(drawer.textContent.includes('250 ml'), 'The drawer line names the variant');
  assert(drawer.querySelector('[role="group"] .tabular').textContent.trim() === '2', 'The drawer line has quantity 2');
  assert(document.querySelector('[data-cart-count]').textContent.trim() === '2', 'Header count is 2');
  return 'product cart ok';
})();
```

- [ ] **Step 6: Run the product check to verify it fails**

Run: `agent-browser --session theme open http://127.0.0.1:9292/products/kithul-treacle && agent-browser --session theme eval --stdin < tests/browser/product-check.js`
Expected: FAIL with `Product section renders`.

- [ ] **Step 7: Write the product snippets**

`snippets/product-variants-json.liquid`:
```liquid
{% doc %}
  Variant data for product.ts. Prices are formatted here with the money filter, so the browser never formats
  money and the market's currency is always right.

  @param {object} product - The product whose variants to print
{% enddoc %}
<script type="application/json" data-product-variants>
  [
    {%- for variant in product.variants -%}
      {%- liquid
        assign on_sale = false
        if variant.compare_at_price > variant.price
          assign on_sale = true
        endif
      -%}
      {
        "id": {{ variant.id }},
        "options": {{ variant.options | json }},
        "available": {{ variant.available | json }},
        "mediaId": {{ variant.featured_media.id | default: 'null' }},
        "priceHtml": {{ variant.price | money | json }},
        "compareHtml": {% if on_sale %}{{ variant.compare_at_price | money | json }}{% else %}null{% endif %},
        "percentOff": {% if on_sale %}{{ variant.compare_at_price | minus: variant.price | times: 100 | divided_by: variant.compare_at_price }}{% else %}null{% endif %}
      }{% unless forloop.last %},{% endunless %}
    {%- endfor -%}
  ]
</script>
```

`snippets/sale-stamp.liquid` (markup from the concept's `src/components/shared/SaleStamp.astro`):
```liquid
{% doc %}
  A postage stamp showing the percentage off. Hidden from screen readers: the price beside it already reads out
  the old price. The percentage rounds down so the stamp never claims a bigger saving than the prices give.

  @param {object} variant - The variant whose sale to show
{% enddoc %}
{%- liquid
  assign percent_off = 0
  if variant.compare_at_price > variant.price
    assign percent_off = variant.compare_at_price | minus: variant.price | times: 100 | divided_by: variant.compare_at_price
  endif
-%}
<span
  class="sale-stamp"
  aria-hidden="true"
  data-sale-stamp
  {% if percent_off == 0 %}
    hidden
  {% endif %}
>
  <span class="sale-stamp-paper">
    <span class="sale-stamp-frame">
      <span class="sale-stamp-label">{{ 'products.sale' | t }}</span>
      <span class="sale-stamp-value"><span data-sale-percent>{{ percent_off }}</span><small>%</small></span>
      <span class="sale-stamp-label">{{ 'products.off' | t }}</span>
    </span>
  </span>
</span>
```

`snippets/product-price.liquid`:
```liquid
{% doc %}
  Current price, the compare-at price struck out, and a sale stamp. product.ts updates all three from the variant
  data when the shopper changes variant, so they are always rendered and toggled with hidden.

  @param {object} variant - The variant to price
{% enddoc %}
<p class="product-price tabular" data-product-price>
  <span data-price-current>{{ variant.price | money }}</span>
  <s
    class="price-was"
    data-price-was
    {% unless variant.compare_at_price > variant.price %}
      hidden
    {% endunless %}
  >
    <span class="sr-only">{{ 'products.was' | t }} </span><span data-price-compare>{{ variant.compare_at_price | money }}</span>
  </s>
  {% render 'sale-stamp', variant: variant %}
</p>
```

`snippets/variant-picker.liquid`:
```liquid
{% doc %}
  One radio group per product option. Not rendered for products with a single default variant.
  The radios only drive product.ts; the form submits the hidden variant id it keeps in step.

  @param {object} product - The product
  @param {string} form_id - Id of the product form, used to keep radio names unique per section
  @param {object} block - The variant picker block
{% enddoc %}
{%- unless product.has_only_default_variant -%}
  <div class="product-options" data-variant-picker {{ block.shopify_attributes }}>
    {%- for option in product.options_with_values -%}
      {%- assign option_index = forloop.index0 -%}
      <fieldset>
        <legend>{{ option.name | escape }}</legend>
        <div class="option-values">
          {%- for value in option.values -%}
            <label>
              <input
                type="radio"
                class="peer sr-only"
                name="{{ form_id }}-option-{{ option.position }}"
                value="{{ value.name | escape }}"
                data-option-index="{{ option_index }}"
                {% if value.selected %}
                  checked
                {% endif %}
              >
              <span class="size-box">{{ value.name | escape }}</span>
            </label>
          {%- endfor -%}
        </div>
      </fieldset>
    {%- endfor -%}
  </div>
{%- endunless -%}
```

`snippets/buy-buttons.liquid` (layout from the concept's purchase strip in `src/pages/product/kithul-treacle.astro`):
```liquid
{% doc %}
  Quantity and add to cart, as a real form posting to /cart/add so buying works without JavaScript. Without
  JavaScript the noscript select picks the variant; with it, product.ts enables the hidden id input instead.

  @param {object} product - The product
  @param {object} current_variant - The variant selected on load
  @param {string} form_id - Id for the form
  @param {object} block - The buy buttons block
{% enddoc %}
<form
  id="{{ form_id }}"
  action="{{ routes.cart_add_url }}"
  method="post"
  class="purchase-strip"
  data-product-form
  {{ block.shopify_attributes }}
>
  <input
    type="hidden"
    name="id"
    value="{{ current_variant.id }}"
    data-variant-id
    {% unless product.has_only_default_variant %}
      disabled
    {% endunless %}
  >
  {%- unless product.has_only_default_variant -%}
    <noscript>
      <div class="field purchase-noscript">
        <label for="{{ form_id }}-variant">{{ 'products.choose' | t }}</label>
        <select id="{{ form_id }}-variant" name="id">
          {%- for variant in product.variants -%}
            <option
              value="{{ variant.id }}"
              {% if variant.id == current_variant.id %}
                selected
              {% endif %}
              {% unless variant.available %}
                disabled
              {% endunless %}
            >
              {{ variant.title | escape }} - {{ variant.price | money_with_currency }}
            </option>
          {%- endfor -%}
        </select>
      </div>
    </noscript>
  {%- endunless -%}
  <div>
    <label for="{{ form_id }}-quantity" class="purchase-label">{{ 'products.quantity' | t }}</label>
    <div class="quantity-control">
      <button type="button" class="icon-btn" data-quantity-step="-1">
        {% render 'icon', name: 'minus', size: 18 %}
        <span class="sr-only">{{ 'products.decrease' | t }}</span>
      </button>
      <input
        id="{{ form_id }}-quantity"
        type="number"
        name="quantity"
        inputmode="numeric"
        min="1"
        max="{{ block.settings.max_quantity }}"
        value="1"
        data-quantity-input
      >
      <button type="button" class="icon-btn" data-quantity-step="1">
        {% render 'icon', name: 'plus', size: 18 %}
        <span class="sr-only">{{ 'products.increase' | t }}</span>
      </button>
    </div>
  </div>
  <button
    type="submit"
    class="btn product-add"
    data-add-button
    {% unless current_variant.available %}
      disabled
    {% endunless %}
  >
    {% render 'icon', name: 'bag', size: 20 %}
    <span data-add-label>
      {%- if current_variant.available -%}
        {{ 'products.add_to_cart' | t }}
      {%- else -%}
        {{ 'products.sold_out' | t }}
      {%- endif -%}
    </span>
  </button>
  <p class="field-error purchase-error empty:hidden" role="alert" data-cart-error></p>
</form>
```

`snippets/product-gallery.liquid` (ported from the concept's `src/components/product/Gallery.astro`):
```liquid
{% doc %}
  Product images: main image, thumbnail column and a full-screen viewer dialog. Starts on the selected variant's
  image. Products without images show Shopify's placeholder illustration.

  @param {object} product - The product
  @param {object} current_variant - The variant selected on load
{% enddoc %}
{%- liquid
  assign images = product.media | where: 'media_type', 'image'
  assign start = current_variant.featured_media | default: images.first
  assign start_index = 1
  for media in images
    if media.id == start.id
      assign start_index = forloop.index
    endif
  endfor
-%}
{%- if images.size > 0 -%}
  <div class="product-gallery" data-gallery>
    <div class="gallery-main">
      {%- for media in images -%}
        {%- liquid
          assign loading = 'lazy'
          if media.id == start.id
            assign loading = 'eager'
          endif
        -%}
        <div
          data-gallery-slide="{{ media.id }}"
          {% unless media.id == start.id %}
            hidden
          {% endunless %}
        >
          {{
            media
            | image_url: width: 1240
            | image_tag:
              widths: '480, 680, 960, 1240',
              sizes: '(min-width: 64rem) 620px, (min-width: 40rem) 530px, 100vw',
              loading: loading,
              class: 'gallery-image'
          }}
        </div>
      {%- endfor -%}
      <button type="button" class="gallery-control gallery-expand" data-gallery-open>
        {% render 'icon', name: 'expand', size: 20 %}
        <span class="sr-only">{{ 'products.view_larger' | t }}</span>
      </button>
      {%- if images.size > 1 -%}
        <button type="button" class="gallery-control gallery-prev" data-gallery-step="-1">
          {% render 'icon', name: 'chevron-left', size: 22 %}
          <span class="sr-only">{{ 'products.previous_image' | t }}</span>
        </button>
        <button type="button" class="gallery-control gallery-next" data-gallery-step="1">
          {% render 'icon', name: 'chevron-right', size: 22 %}
          <span class="sr-only">{{ 'products.next_image' | t }}</span>
        </button>
        <p class="gallery-count" aria-hidden="true">
          <span data-gallery-index>{{ start_index }}</span> / {{ images.size }}
        </p>
      {%- endif -%}
    </div>
    {%- if images.size > 1 -%}
      <ul class="gallery-thumbnails" role="list" aria-label="{{ 'products.images' | t }}">
        {%- for media in images -%}
          <li>
            <button
              type="button"
              class="gallery-thumb"
              aria-current="{% if media.id == start.id %}true{% else %}false{% endif %}"
              data-gallery-thumb="{{ media.id }}"
            >
              {{ media | image_url: width: 240 | image_tag: widths: '96, 144, 240', sizes: '80px', alt: '', loading: 'lazy' }}
              <span class="sr-only">
                {{- 'products.show_image' | t: index: forloop.index, count: images.size -}}
                {%- if media.alt != blank %}: {{ media.alt | escape }}{% endif -%}
              </span>
            </button>
          </li>
        {%- endfor -%}
      </ul>
    {%- endif -%}

    <dialog class="gallery-viewer" aria-label="{{ 'products.images' | t }}" data-gallery-viewer>
      <div class="viewer-stage">
        {%- for media in images -%}
          <figure
            data-viewer-slide="{{ media.id }}"
            {% unless media.id == start.id %}
              hidden
            {% endunless %}
          >
            {{
              media
              | image_url: width: 1280
              | image_tag: widths: '640, 960, 1280', sizes: '(min-width: 40rem) 80vh, 100vw', loading: 'lazy', class: 'viewer-image'
            }}
          </figure>
        {%- endfor -%}
      </div>
      <button type="button" class="gallery-control viewer-close" data-gallery-close>
        {% render 'icon', name: 'close', size: 22 %}
        <span class="sr-only">{{ 'products.close_viewer' | t }}</span>
      </button>
      {%- if images.size > 1 -%}
        <button type="button" class="gallery-control viewer-prev" data-gallery-step="-1">
          {% render 'icon', name: 'chevron-left', size: 24 %}
          <span class="sr-only">{{ 'products.previous_image' | t }}</span>
        </button>
        <button type="button" class="gallery-control viewer-next" data-gallery-step="1">
          {% render 'icon', name: 'chevron-right', size: 24 %}
          <span class="sr-only">{{ 'products.next_image' | t }}</span>
        </button>
      {%- endif -%}
      <p
        class="viewer-count"
        aria-live="polite"
        data-viewer-count
        data-template="{{ 'products.image_count' | t: index: '[index]', count: images.size | escape }}"
      >
        {{ 'products.image_count' | t: index: start_index, count: images.size }}
      </p>
    </dialog>
  </div>
{%- else -%}
  <div class="gallery-main">{{ 'product-1' | placeholder_svg_tag: 'gallery-placeholder' }}</div>
{%- endif -%}
```

- [ ] **Step 8: Write the product section and template**

`sections/main-product.liquid`:
```liquid
{%- liquid
  assign current_variant = product.selected_or_first_available_variant
  assign form_id = 'ProductForm-' | append: section.id
-%}
<section
  class="color-{{ section.settings.color_scheme }}"
  aria-label="{{ product.title | escape }}"
  data-product-root
>
  <div class="wrap">
    <nav aria-label="{{ 'general.breadcrumb' | t }}" class="product-breadcrumb">
      <ol class="flex flex-wrap items-center gap-2">
        <li><a href="{{ routes.root_url }}">{{ 'general.home' | t }}</a></li>
        <li aria-hidden="true">/</li>
        {%- if collection -%}
          <li><a href="{{ collection.url }}">{{ collection.title | escape }}</a></li>
          <li aria-hidden="true">/</li>
        {%- endif -%}
        <li><span aria-current="page">{{ product.title | escape }}</span></li>
      </ol>
    </nav>

    <div class="product-shopping">
      <div class="min-w-0">
        {% render 'product-gallery', product: product, current_variant: current_variant %}
      </div>
      <div class="product-buying">
        {%- for block in section.blocks -%}
          {%- case block.type -%}
            {%- when '@app' -%}
              {% render block %}
            {%- when 'text' -%}
              <p class="product-origin-line" {{ block.shopify_attributes }}>{{ block.settings.text }}</p>
            {%- when 'title' -%}
              <h1 class="product-title" {{ block.shopify_attributes }}>{{ product.title | escape }}</h1>
            {%- when 'price' -%}
              <div {{ block.shopify_attributes }}>{% render 'product-price', variant: current_variant %}</div>
            {%- when 'variant_picker' -%}
              {% render 'variant-picker', product: product, form_id: form_id, block: block %}
            {%- when 'buy_buttons' -%}
              {% render 'buy-buttons', product: product, current_variant: current_variant, form_id: form_id, block: block %}
            {%- when 'description' -%}
              <div class="rte product-description" {{ block.shopify_attributes }}>{{ product.description }}</div>
            {%- when 'link' -%}
              <div class="product-trade" {{ block.shopify_attributes }}>
                <div>
                  {%- if block.settings.heading != blank -%}
                    <h2>{{ block.settings.heading | escape }}</h2>
                  {%- endif -%}
                  {%- if block.settings.text != blank -%}
                    <p>{{ block.settings.text | escape }}</p>
                  {%- endif -%}
                </div>
                {%- if block.settings.url != blank and block.settings.label != blank -%}
                  <a href="{{ block.settings.url }}">{{ block.settings.label | escape }}</a>
                {%- endif -%}
              </div>
          {%- endcase -%}
        {%- endfor -%}
      </div>
    </div>
  </div>
  {% render 'product-variants-json', product: product %}
</section>

{% schema %}
{
  "name": "t:sections.main_product.name",
  "settings": [
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ],
  "blocks": [
    { "type": "@app" },
    {
      "type": "text",
      "name": "t:sections.main_product.blocks.text.name",
      "settings": [
        { "type": "inline_richtext", "id": "text", "label": "t:sections.main_product.blocks.text.text", "default": "Small batch, made by hand." }
      ]
    },
    { "type": "title", "name": "t:sections.main_product.blocks.title.name", "limit": 1 },
    { "type": "price", "name": "t:sections.main_product.blocks.price.name", "limit": 1 },
    { "type": "variant_picker", "name": "t:sections.main_product.blocks.variant_picker.name", "limit": 1 },
    {
      "type": "buy_buttons",
      "name": "t:sections.main_product.blocks.buy_buttons.name",
      "limit": 1,
      "settings": [
        { "type": "range", "id": "max_quantity", "label": "t:sections.main_product.blocks.buy_buttons.max_quantity", "min": 1, "max": 99, "step": 1, "default": 20 }
      ]
    },
    { "type": "description", "name": "t:sections.main_product.blocks.description.name", "limit": 1 },
    {
      "type": "link",
      "name": "t:sections.main_product.blocks.link.name",
      "settings": [
        { "type": "text", "id": "heading", "label": "t:sections.main_product.blocks.link.heading", "default": "Buying for your business?" },
        { "type": "text", "id": "text", "label": "t:sections.main_product.blocks.link.text", "default": "Ask about pack sizes for cafes, restaurants and shops." },
        { "type": "text", "id": "label", "label": "t:sections.main_product.blocks.link.label", "default": "Request trade prices" },
        { "type": "url", "id": "url", "label": "t:sections.main_product.blocks.link.url" }
      ]
    }
  ]
}
{% endschema %}
```

`templates/product.json`:
```json
{
  "sections": {
    "main": {
      "type": "main-product",
      "blocks": {
        "text": { "type": "text", "settings": { "text": "Small batch, made by hand." } },
        "title": { "type": "title" },
        "price": { "type": "price" },
        "variant_picker": { "type": "variant_picker" },
        "buy_buttons": { "type": "buy_buttons", "settings": { "max_quantity": 20 } },
        "description": { "type": "description" },
        "trade": {
          "type": "link",
          "settings": {
            "heading": "Buying for your business?",
            "text": "Ask about pack sizes for cafes, restaurants and shops.",
            "label": "Request trade prices",
            "url": ""
          }
        }
      },
      "block_order": ["text", "title", "price", "variant_picker", "buy_buttons", "description", "trade"],
      "settings": { "color_scheme": "light" }
    }
  },
  "order": ["main"]
}
```

- [ ] **Step 9: Write the product styles**

`src/css/product.css` (ported from the `<style>` block of the concept's `src/pages/product/kithul-treacle.astro`, lines 459 to 540, with fixed greys replaced by scheme colours and the claims, delivery and sticky-bar rules left out):
```css
@layer components {
  .product-breadcrumb {
    padding-top: 1rem;
    font-size: 0.75rem;
    color: var(--scheme-muted);
  }
  .product-breadcrumb a {
    display: inline-flex;
    align-items: center;
    min-height: 2rem;
  }
  .product-breadcrumb a:hover {
    text-decoration: underline;
  }
  .product-shopping {
    display: grid;
    grid-template-columns: minmax(0, 54%) minmax(0, 1fr);
    gap: 6%;
    padding-block: 1.5rem;
  }
  .product-buying {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 1rem;
    padding-top: 1rem;
  }
  .product-origin-line {
    font-size: 0.8125rem;
    color: var(--scheme-muted);
  }
  .product-title {
    margin: 0;
    font-size: clamp(3.25rem, 4.7vw, 4.375rem);
    line-height: 1.02;
    letter-spacing: -0.055em;
    text-transform: none;
  }
  .product-description {
    max-width: 42ch;
    font-size: 1rem;
    line-height: 1.4;
    color: var(--scheme-muted);
  }
  .product-price {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    font-family: var(--font-display);
    font-size: 2.375rem;
    font-weight: 700;
    line-height: 1.2;
  }
  /* 0.5em of a product price is about 19px; the floor keeps the old price legible on small prices. */
  .price-was {
    font-family: var(--font-sans);
    font-size: max(0.5em, 0.8125rem);
    font-weight: 500;
    color: var(--scheme-muted);
    text-decoration-thickness: 1.5px;
  }

  .product-options {
    display: grid;
    gap: 1rem;
  }
  .product-options legend,
  .purchase-label {
    display: block;
    margin-bottom: 0.375rem;
    font-size: 0.8125rem;
  }
  .option-values {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6rem, 1fr));
    gap: 0.5rem;
  }
  .size-box {
    display: flex;
    min-height: 2.75rem;
    align-items: center;
    justify-content: center;
    padding-inline: 0.25rem;
    border: 1px solid var(--scheme-line);
    border-radius: var(--radius);
    font-family: var(--font-display);
    font-weight: 700;
    cursor: pointer;
  }
  .peer:checked + .size-box {
    border-color: var(--scheme-accent);
    background: var(--scheme-accent);
    color: var(--scheme-on-accent);
  }
  /* The radio itself is visually hidden, so its focus ring is drawn on the box. */
  .peer:focus-visible + .size-box {
    outline: 3px solid var(--scheme-ink);
    outline-offset: 3px;
  }

  .purchase-strip {
    display: grid;
    grid-template-columns: 8.25rem minmax(0, 1fr);
    align-items: end;
    gap: 1rem;
  }
  .purchase-noscript,
  .purchase-error {
    grid-column: 1 / -1;
  }
  .quantity-control {
    display: flex;
    height: 3rem;
    border: 1px solid var(--scheme-line);
    border-radius: var(--radius);
  }
  .quantity-control .icon-btn {
    width: 2.625rem;
    height: 2.875rem;
  }
  .quantity-control input {
    flex: 1;
    width: 2.375rem;
    min-width: 0;
    background: transparent;
    text-align: center;
    font-variant-numeric: tabular-nums;
    appearance: textfield;
  }
  .quantity-control input::-webkit-inner-spin-button {
    appearance: none;
  }
  .product-add {
    width: 100%;
    min-height: 3rem;
    gap: 0.75rem;
    padding-inline: 1rem;
    background: var(--scheme-heading);
    color: var(--scheme-ground);
    letter-spacing: 0;
    text-transform: none;
  }
  .product-add:hover {
    background: var(--scheme-ink);
  }
  .product-add:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .product-add[aria-busy='true'] {
    cursor: progress;
  }

  .product-trade {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--scheme-hairline);
  }
  .product-trade h2 {
    font-size: 1.125rem;
    line-height: 1.2;
    letter-spacing: -0.03em;
    text-transform: none;
  }
  .product-trade p {
    margin-top: 0.375rem;
    max-width: 27ch;
    font-size: 0.75rem;
    line-height: 1.35;
    color: var(--scheme-muted);
  }
  .product-trade a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.75rem;
    padding: 0.625rem 1rem;
    background: var(--scheme-accent);
    color: var(--scheme-on-accent);
    font-size: 0.8125rem;
    font-weight: 600;
    text-align: center;
  }

  @media (max-width: 63.99rem) {
    .product-shopping {
      grid-template-columns: minmax(0, 49%) minmax(0, 1fr);
      gap: 5%;
    }
    .product-title {
      font-size: clamp(2.375rem, 5vw, 3.625rem);
    }
    .product-price {
      font-size: 2rem;
    }
    .product-trade {
      flex-wrap: wrap;
    }
  }
  @media (max-width: 39.99rem) {
    .product-shopping {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-block: 0.5rem 1.5rem;
    }
    .product-title {
      font-size: clamp(2.625rem, 11vw, 3.625rem);
    }
    .product-price {
      font-size: 1.875rem;
    }
  }
  @media (max-width: 350px) {
    .purchase-strip {
      grid-template-columns: 1fr;
    }
  }
}
```

`src/css/gallery.css` (ported from the `<style>` block of the concept's `src/components/product/Gallery.astro`):
```css
@layer components {
  .product-gallery {
    display: grid;
    grid-template-columns: 5rem minmax(0, 1fr);
    gap: 1rem;
  }
  .gallery-main {
    position: relative;
    grid-column: 2;
    grid-row: 1;
    min-width: 0;
    overflow: hidden;
    background: #fff;
    touch-action: pan-y;
  }
  .product-gallery:not(:has(.gallery-thumbnails)) .gallery-main {
    grid-column: 1 / -1;
  }
  .gallery-main [data-gallery-slide] {
    cursor: zoom-in;
  }
  .gallery-image,
  .gallery-placeholder {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 4 / 5;
    object-fit: cover;
  }
  /* contain: size keeps the thumbnails out of the row's height, so the column stretches to exactly the main image's height. */
  .gallery-thumbnails {
    grid-column: 1;
    grid-row: 1;
    display: grid;
    grid-template-columns: 1fr;
    grid-auto-rows: minmax(0, 1fr);
    gap: 0.625rem;
    contain: size;
  }
  .gallery-thumbnails li {
    min-height: 0;
  }
  .gallery-thumb {
    display: block;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border: 1px solid var(--scheme-hairline);
    background: #fff;
  }
  .gallery-thumb[aria-current='true'] {
    border-color: var(--scheme-accent);
    outline: 2px solid var(--scheme-accent);
    outline-offset: 2px;
  }
  .gallery-thumb img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .gallery-control {
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--scheme-ground) 90%, transparent);
    color: var(--scheme-ink);
    box-shadow: 0 1px 3px color-mix(in srgb, var(--scheme-ink) 15%, transparent);
    transition:
      background-color 150ms ease,
      transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .gallery-control:active {
    transform: scale(0.95);
  }
  @media (hover: hover) {
    .gallery-control:hover {
      background: var(--scheme-accent);
    }
  }
  .gallery-expand {
    top: 0.75rem;
    right: 0.75rem;
  }
  .gallery-prev,
  .gallery-next {
    top: 50%;
    translate: 0 -50%;
  }
  .gallery-prev {
    left: 0.75rem;
  }
  .gallery-next {
    right: 0.75rem;
  }
  .gallery-count {
    position: absolute;
    bottom: 0.75rem;
    left: 50%;
    translate: -50% 0;
    padding: 0.125rem 0.625rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--scheme-ground) 90%, transparent);
    color: var(--scheme-ink);
    font-size: 0.8125rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  /* Arrows only show on hover or focus where a pointer can hover; touch screens always see them. */
  @media (hover: hover) {
    .gallery-main .gallery-prev,
    .gallery-main .gallery-next {
      opacity: 0;
      transition:
        opacity 150ms ease,
        background-color 150ms ease;
    }
    .gallery-main:hover .gallery-prev,
    .gallery-main:hover .gallery-next,
    .gallery-main .gallery-prev:focus-visible,
    .gallery-main .gallery-next:focus-visible {
      opacity: 1;
    }
  }

  .gallery-viewer {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    margin: 0;
    padding: 0;
    border: 0;
    background: var(--scheme-ground);
    color: var(--scheme-ink);
    touch-action: pan-y;
  }
  .gallery-viewer::backdrop {
    background: rgb(0 0 0 / 0.55);
  }
  .viewer-stage {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .viewer-stage figure {
    margin: 0;
  }
  /* Sized from the viewport so the 4:5 photo fits between the controls at any window shape. */
  .viewer-image {
    display: block;
    width: min(calc(100vw - 144px), calc((100dvh - 128px) * 0.8));
    height: auto;
    aspect-ratio: 4 / 5;
    object-fit: cover;
  }
  .viewer-close {
    top: 0.75rem;
    right: 0.75rem;
  }
  .viewer-prev,
  .viewer-next {
    top: 50%;
    translate: 0 -50%;
  }
  .viewer-prev {
    left: 1rem;
  }
  .viewer-next {
    right: 1rem;
  }
  .viewer-count {
    position: absolute;
    bottom: 1rem;
    left: 50%;
    translate: -50% 0;
    font-size: 0.875rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  @media (prefers-reduced-motion: reduce) {
    .gallery-control {
      transition: none;
    }
  }

  @media (max-width: 63.99rem) {
    .product-gallery {
      grid-template-columns: 4rem minmax(0, 1fr);
      gap: 0.625rem;
    }
  }
  @media (max-width: 39.99rem) {
    .product-gallery {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    .gallery-main {
      grid-column: 1;
      grid-row: 1;
    }
    .gallery-thumbnails {
      grid-column: 1;
      grid-row: 2;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      grid-auto-rows: auto;
      gap: 0.375rem;
      contain: none;
    }
    .gallery-thumb {
      height: auto;
      aspect-ratio: 4 / 5;
    }
    .viewer-stage {
      padding-bottom: 2.5rem;
    }
    .viewer-image {
      width: min(calc(100vw - 24px), calc((100dvh - 176px) * 0.8));
    }
    .viewer-prev,
    .viewer-next {
      top: auto;
      bottom: 0.75rem;
      translate: none;
    }
    .viewer-count {
      bottom: 1.5rem;
    }
  }
}
```

`src/css/sale-stamp.css`: wrap in `@layer components { ... }` a copy of every rule inside the `<style>` block of the concept's `src/components/shared/SaleStamp.astro` (lines 31 to 117), changing only colours: `var(--color-oxblood)` to `var(--scheme-ink)`, `var(--color-brick)` to `var(--scheme-heading)`, `var(--color-sprout)` to `var(--scheme-muted)`, `var(--color-paper)` to `var(--scheme-ground)`. Then add, inside the same layer:
```css
  .sale-stamp[hidden] {
    display: none;
  }
```
The class names `sale-stamp`, `sale-stamp-paper`, `sale-stamp-frame`, `sale-stamp-label` and `sale-stamp-value` match the snippet from Step 7.

Add to `src/css/theme.css` after the cart import:
```css
@import './product.css';
@import './gallery.css';
@import './sale-stamp.css';
```

- [ ] **Step 10: Write the gallery and product scripts**

`src/ts/gallery.ts` (ported from `initGallery` in the concept's `src/scripts/product.ts`, keyed by media id instead of image name):
```ts
// A horizontal drag past this distance changes image; anything shorter counts as a tap.
const SWIPE_PX = 40;

/** Wires the gallery inside `root` and returns a function that shows the image with the given media id. */
export function initGallery(root: HTMLElement, signal: AbortSignal): (mediaId: string) => void {
  const gallery = root.querySelector<HTMLElement>('[data-gallery]');
  if (!gallery) return () => {};
  const thumbs = [...gallery.querySelectorAll<HTMLButtonElement>('[data-gallery-thumb]')];
  const slides = [...gallery.querySelectorAll<HTMLElement>('[data-gallery-slide]')];
  const viewerSlides = [...gallery.querySelectorAll<HTMLElement>('[data-viewer-slide]')];
  const counters = [...gallery.querySelectorAll<HTMLElement>('[data-gallery-index]')];
  const viewerCount = gallery.querySelector<HTMLElement>('[data-viewer-count]');
  const viewer = gallery.querySelector<HTMLDialogElement>('[data-gallery-viewer]');
  const main = gallery.querySelector<HTMLElement>('.gallery-main');
  const ids = slides.map((slide) => slide.dataset.gallerySlide!);
  let current = Math.max(0, slides.findIndex((slide) => !slide.hidden));

  const show = (id: string) => {
    const index = ids.indexOf(id);
    if (index < 0) return;
    current = index;
    slides.forEach((slide) => (slide.hidden = slide.dataset.gallerySlide !== id));
    viewerSlides.forEach((slide) => (slide.hidden = slide.dataset.viewerSlide !== id));
    thumbs.forEach((thumb) => thumb.setAttribute('aria-current', String(thumb.dataset.galleryThumb === id)));
    counters.forEach((counter) => (counter.textContent = String(index + 1)));
    if (viewerCount) viewerCount.textContent = (viewerCount.dataset.template ?? '').replace('[index]', String(index + 1));
  };
  const step = (by: number) => show(ids[(current + by + ids.length) % ids.length]);

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => show(thumb.dataset.galleryThumb!), { signal });
    thumb.addEventListener(
      'keydown',
      (event) => {
        const by = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
        if (!by) return;
        event.preventDefault();
        const next = thumbs[(i + by + thumbs.length) % thumbs.length];
        next.focus();
        show(next.dataset.galleryThumb!);
      },
      { signal },
    );
  });
  gallery.querySelectorAll<HTMLButtonElement>('[data-gallery-step]').forEach((button) =>
    button.addEventListener('click', () => step(Number(button.dataset.galleryStep)), { signal }),
  );

  const onSwipe = (el: Element | null, onTap?: () => void) => {
    let startX: number | null = null;
    el?.addEventListener(
      'pointerdown',
      (event) => {
        const pointer = event as PointerEvent;
        startX = (pointer.target as Element).closest('button') ? null : pointer.clientX;
      },
      { signal },
    );
    el?.addEventListener(
      'pointerup',
      (event) => {
        if (startX === null) return;
        const dx = (event as PointerEvent).clientX - startX;
        startX = null;
        if (Math.abs(dx) >= SWIPE_PX) step(dx < 0 ? 1 : -1);
        else onTap?.();
      },
      { signal },
    );
  };

  let opener: HTMLElement | null = null;
  const openViewer = () => {
    if (!viewer) return;
    opener = document.activeElement as HTMLElement | null;
    // Chrome's lazy loading doesn't reliably fire inside a modal dialog, so fetch the large images on first open.
    viewer.querySelectorAll('img').forEach((img) => (img.loading = 'eager'));
    viewer.showModal();
  };
  onSwipe(main, openViewer);
  onSwipe(viewer?.querySelector('.viewer-stage') ?? null);
  gallery.querySelector('[data-gallery-open]')?.addEventListener('click', openViewer, { signal });
  gallery.querySelector('[data-gallery-close]')?.addEventListener('click', () => viewer?.close(), { signal });
  viewer?.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
    },
    { signal },
  );
  viewer?.addEventListener('close', () => opener?.focus(), { signal });
  return show;
}
```

`src/ts/product.ts`:
```ts
import { initGallery } from './gallery.ts';
import { registerSection } from './sections.ts';
import { themeData } from './theme-data.ts';
import { clampQuantity, findVariant, type VariantData } from './variants.ts';

function renderPrice(root: HTMLElement, variant: VariantData) {
  const current = root.querySelector('[data-price-current]');
  if (current) current.innerHTML = variant.priceHtml;
  const was = root.querySelector<HTMLElement>('[data-price-was]');
  if (was) was.hidden = variant.compareHtml === null;
  const compare = root.querySelector('[data-price-compare]');
  if (compare && variant.compareHtml) compare.innerHTML = variant.compareHtml;
  const stamp = root.querySelector<HTMLElement>('[data-sale-stamp]');
  if (stamp) stamp.hidden = variant.percentOff === null;
  const percent = root.querySelector('[data-sale-percent]');
  if (percent && variant.percentOff !== null) percent.textContent = String(variant.percentOff);
}

registerSection('[data-product-root]', (root, signal) => {
  const variants = JSON.parse(root.querySelector('[data-product-variants]')?.textContent ?? '[]') as VariantData[];
  const form = root.querySelector<HTMLFormElement>('[data-product-form]');
  const idInput = form?.querySelector<HTMLInputElement>('[data-variant-id]');
  const button = form?.querySelector<HTMLButtonElement>('[data-add-button]');
  const label = form?.querySelector<HTMLElement>('[data-add-label]');
  const radios = [...root.querySelectorAll<HTMLInputElement>('[data-variant-picker] input[type="radio"]')];
  const showMedia = initGallery(root, signal);

  // Disabled in the markup so the noscript select alone sends the variant when JavaScript is off.
  idInput?.removeAttribute('disabled');

  const selectedOptions = () => {
    const selected: string[] = [];
    for (const radio of radios) if (radio.checked) selected[Number(radio.dataset.optionIndex)] = radio.value;
    return selected;
  };

  function update() {
    const { strings } = themeData();
    const variant = findVariant(variants, selectedOptions());
    if (!variant) {
      if (button) button.disabled = true;
      if (label) label.textContent = strings.unavailable;
      return;
    }
    if (idInput) idInput.value = String(variant.id);
    if (button) button.disabled = !variant.available;
    if (label) label.textContent = variant.available ? strings.addToCart : strings.soldOut;
    renderPrice(root, variant);
    if (variant.mediaId !== null) showMedia(String(variant.mediaId));
    const url = new URL(location.href);
    url.searchParams.set('variant', String(variant.id));
    history.replaceState(history.state, '', url);
  }

  radios.forEach((radio) => radio.addEventListener('change', update, { signal }));

  const quantity = form?.querySelector<HTMLInputElement>('[data-quantity-input]');
  const max = Number(quantity?.max) || 99;
  form?.querySelectorAll<HTMLButtonElement>('[data-quantity-step]').forEach((stepButton) =>
    stepButton.addEventListener(
      'click',
      () => {
        if (quantity) quantity.value = String(clampQuantity(Number(quantity.value) + Number(stepButton.dataset.quantityStep), 1, max));
      },
      { signal },
    ),
  );
  quantity?.addEventListener(
    'change',
    () => {
      quantity.value = String(clampQuantity(Number(quantity.value), 1, max));
    },
    { signal },
  );
});
```

Change `src/ts/theme.ts` to:
```ts
import { initCart } from './cart.ts';
import './header.ts';
import './product.ts';

initCart();
```

- [ ] **Step 11: Build and run all checks**

Run:
```bash
npm run build && npm run typecheck && npm test && npm run check
agent-browser --session theme set viewport 1440 900
agent-browser --session theme open http://127.0.0.1:9292/products/kithul-treacle
agent-browser --session theme eval --stdin < tests/browser/product-check.js
agent-browser --session theme eval "fetch('/cart/clear.js', { method: 'POST' }).then(() => 'cleared')"
agent-browser --session theme open http://127.0.0.1:9292/products/kithul-treacle
agent-browser --session theme eval --stdin < tests/browser/product-cart-check.js
agent-browser --session theme set viewport 390 844
agent-browser --session theme open http://127.0.0.1:9292/products/kithul-treacle
agent-browser --session theme eval --stdin < tests/browser/product-check.js
```
Expected: all static checks pass, then `product ok`, `cleared`, `product cart ok`, `product ok`.

- [ ] **Step 12: Check buying without JavaScript**

The form must work as plain HTML. Run:
```bash
curl -s http://127.0.0.1:9292/products/kithul-treacle | grep -o '<form[^>]*data-product-form[^>]*>' | head -1
curl -s http://127.0.0.1:9292/products/kithul-treacle | grep -c '<noscript>'
agent-browser --session theme eval "fetch('/cart/clear.js', { method: 'POST' }).then(() => 'cleared')"
agent-browser --session theme open http://127.0.0.1:9292/products/kithul-treacle
agent-browser --session theme eval "HTMLFormElement.prototype.submit.call(document.querySelector('[data-product-form]')); 'submitted'"
agent-browser --session theme wait 2000
agent-browser --session theme get url
```
Expected: the form tag shows `action="/cart/add"` and `method="post"`; the noscript count is at least 1; the final URL ends in `/cart` and the cart page lists one item. (`submit()` skips the submit event, so cart.ts never sees it, the same path a browser without JavaScript takes.)

- [ ] **Step 13: Check the theme editor by hand**

Open the theme editor for the development theme (the URL `shopify theme dev` prints), go to the product page, and: move the Price block above the Title block, change the section's colour scheme to Band, and edit the Text block. Expected: the preview updates each time, and picking a size still changes price and image after every edit.

- [ ] **Step 14: Commit**

```bash
git add sections snippets templates src assets tests
git commit -m "Add product page with gallery, variant picker and add to cart

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 7: collection and search pages

**Files:**
- Create: `snippets/product-card.liquid`, `snippets/pagination.liquid`, `sections/main-collection.liquid`, `sections/main-search.liquid`, `templates/collection.json`, `templates/search.json`, `tests/browser/browse-check.js`

**Interfaces:**
- Consumes: `icon` snippet, component classes (Task 2).
- Produces: `{% render 'product-card', product: p, sizes: '...' %}`, reused by plan 2's product grid section.

- [ ] **Step 1: Write the failing browser check**

`tests/browser/browse-check.js`:
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const cards = [...document.querySelectorAll('.product-card')];
  assert(cards.length >= 2, 'Cards render for the test products');
  const treacle = cards.find((card) => card.textContent.includes('Kithul Treacle'));
  assert(treacle, 'Treacle card renders');
  assert(treacle.querySelector('a').getAttribute('href').includes('/products/kithul-treacle'), 'Card links to the product');
  assert(treacle.textContent.includes('From'), 'A product with different variant prices shows a From price');
  assert(treacle.querySelector('h3 a'), 'The card title is the link, so the card has one accessible name');
  return 'browse ok';
})();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `agent-browser --session theme open http://127.0.0.1:9292/collections/all && agent-browser --session theme eval --stdin < tests/browser/browse-check.js`
Expected: FAIL with `Cards render for the test products`.

- [ ] **Step 3: Write the snippets**

`snippets/product-card.liquid` (styled after the concept's `src/components/home/ProductCard.astro`):
```liquid
{% doc %}
  Product card for grids. The title link stretches over the whole card, so the card is one tab stop with one name.

  @param {object} product - The product
  @param {string} [sizes] - sizes attribute for the image, default suits a 2-column phone and 4-column desktop grid
{% enddoc %}
{%- liquid
  assign image_sizes = sizes | default: '(min-width: 64rem) 25vw, 50vw'
  assign price_min = product.price_min | money
-%}
<article class="product-card group relative flex flex-col">
  <div class="aspect-square overflow-hidden bg-white">
    {%- if product.featured_media -%}
      {{
        product.featured_media
        | image_url: width: 720
        | image_tag:
          widths: '240, 360, 480, 720',
          sizes: image_sizes,
          loading: 'lazy',
          class: 'size-full object-contain transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none'
      }}
    {%- else -%}
      {{ 'product-1' | placeholder_svg_tag: 'size-full' }}
    {%- endif -%}
  </div>
  <h3 class="mt-3 text-card">
    <a href="{{ product.url }}" class="after:absolute after:inset-0">{{ product.title | escape }}</a>
  </h3>
  <p class="tabular mt-1">
    {%- if product.price_varies -%}
      {{ 'products.from' | t: price: price_min }}
    {%- else -%}
      {{ price_min }}
    {%- endif -%}
    {%- if product.compare_at_price_min > product.price_min %}
      <s class="text-muted"
        ><span class="sr-only">{{ 'products.was' | t }} </span>{{ product.compare_at_price_min | money }}</s
      >
    {%- endif -%}
    {%- unless product.available %}
      <span class="ml-2 text-sm font-semibold text-heading">{{ 'products.sold_out' | t }}</span>
    {%- endunless %}
  </p>
</article>
```

`snippets/pagination.liquid`:
```liquid
{% doc %}
  Page links for a paginated list. Renders nothing for a single page.

  @param {object} paginate - The paginate object from the enclosing paginate tag
{% enddoc %}
{%- if paginate.pages > 1 -%}
  <nav class="mt-12 flex items-center justify-center gap-2" aria-label="{{ 'general.pagination' | t }}">
    {%- if paginate.previous -%}
      <a href="{{ paginate.previous.url }}" class="icon-btn border border-line">
        {% render 'icon', name: 'chevron-left' %}
        <span class="sr-only">{{ 'general.previous_page' | t }}</span>
      </a>
    {%- endif -%}
    {%- for part in paginate.parts -%}
      {%- if part.is_link -%}
        <a href="{{ part.url }}" class="icon-btn">{{ part.title }}</a>
      {%- elsif part.title == paginate.current_page -%}
        <span class="icon-btn bg-tint font-bold" aria-current="page">{{ part.title }}</span>
      {%- else -%}
        <span class="icon-btn">{{ part.title }}</span>
      {%- endif -%}
    {%- endfor -%}
    {%- if paginate.next -%}
      <a href="{{ paginate.next.url }}" class="icon-btn border border-line">
        {% render 'icon', name: 'chevron-right' %}
        <span class="sr-only">{{ 'general.next_page' | t }}</span>
      </a>
    {%- endif -%}
  </nav>
{%- endif -%}
```

- [ ] **Step 4: Write the sections and templates**

`sections/main-collection.liquid`:
```liquid
{%- paginate collection.products by section.settings.products_per_page -%}
  <div class="color-{{ section.settings.color_scheme }} py-12 lg:py-16">
    <div class="wrap">
      <h1 class="text-section">{{ collection.title | escape }}</h1>
      {%- if collection.description != blank -%}
        <div class="rte mt-4 max-w-prose">{{ collection.description }}</div>
      {%- endif -%}
      {%- if collection.products.size > 0 -%}
        <ul class="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6" role="list">
          {%- for product in collection.products -%}
            <li>{% render 'product-card', product: product %}</li>
          {%- endfor -%}
        </ul>
        {% render 'pagination', paginate: paginate %}
      {%- else -%}
        <p class="mt-10">{{ 'collections.empty' | t }}</p>
      {%- endif -%}
    </div>
  </div>
{%- endpaginate -%}

{% schema %}
{
  "name": "t:sections.main_collection.name",
  "settings": [
    { "type": "range", "id": "products_per_page", "label": "t:sections.main_collection.products_per_page", "min": 8, "max": 48, "step": 4, "default": 16 },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ]
}
{% endschema %}
```

`sections/main-search.liquid`:
```liquid
{%- paginate search.results by 24 -%}
  <div class="color-{{ section.settings.color_scheme }} py-12 lg:py-16">
    <div class="wrap">
      <h1 class="text-section">{{ 'search.title' | t }}</h1>
      <form action="{{ routes.search_url }}" method="get" role="search" class="mt-6 flex max-w-2xl gap-3">
        <label for="SearchPageInput" class="sr-only">{{ 'general.search_label' | t }}</label>
        <input
          id="SearchPageInput"
          type="search"
          name="q"
          value="{{ search.terms | escape }}"
          class="h-12 min-w-0 flex-1 border-2 border-ink bg-ground px-3 text-lg text-ink"
        >
        <input type="hidden" name="type" value="product">
        <input type="hidden" name="options[prefix]" value="last">
        <button type="submit" class="btn btn-primary">{{ 'search.submit' | t }}</button>
      </form>
      {%- if search.performed -%}
        {%- assign terms = search.terms | escape -%}
        {%- if search.results_count > 0 -%}
          <p class="mt-6 text-muted" role="status">
            {{ 'search.results_for' | t: count: search.results_count, terms: terms }}
          </p>
          <ul class="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6" role="list">
            {%- for item in search.results -%}
              <li>
                {%- if item.object_type == 'product' -%}
                  {% render 'product-card', product: item %}
                {%- else -%}
                  <a href="{{ item.url }}" class="text-card underline-offset-4 hover:underline">{{ item.title | escape }}</a>
                {%- endif -%}
              </li>
            {%- endfor -%}
          </ul>
          {% render 'pagination', paginate: paginate %}
        {%- else -%}
          <p class="mt-6" role="status">{{ 'search.no_results' | t: terms: terms }}</p>
        {%- endif -%}
      {%- endif -%}
    </div>
  </div>
{%- endpaginate -%}

{% schema %}
{
  "name": "t:sections.main_search.name",
  "settings": [
    { "type": "color_scheme", "id": "color_scheme", "label": "t:sections.all.color_scheme", "default": "light" }
  ]
}
{% endschema %}
```

`templates/collection.json`:
```json
{
  "sections": {
    "main": { "type": "main-collection", "settings": { "products_per_page": 16, "color_scheme": "light" } }
  },
  "order": ["main"]
}
```

`templates/search.json`:
```json
{
  "sections": {
    "main": { "type": "main-search", "settings": { "color_scheme": "light" } }
  },
  "order": ["main"]
}
```

- [ ] **Step 5: Run the checks**

Run:
```bash
npm run build && npm run check
agent-browser --session theme open http://127.0.0.1:9292/collections/all
agent-browser --session theme eval --stdin < tests/browser/browse-check.js
agent-browser --session theme open "http://127.0.0.1:9292/search?q=treacle&type=product"
agent-browser --session theme get text "[role=status]"
agent-browser --session theme open "http://127.0.0.1:9292/search?q=zzzz&type=product"
agent-browser --session theme get text "[role=status]"
```
Expected: no Theme Check errors, then `browse ok`, then `1 result for "treacle"`, then `No results for "zzzz". Try a different word.`

- [ ] **Step 6: Commit**

```bash
git add sections snippets templates assets tests
git commit -m "Add collection and search pages with product cards

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 8: Lighthouse, accessibility pass and README

**Files:**
- Modify: `README.md`
- Modify: any file a failing check below points to

- [ ] **Step 1: Run Lighthouse on mobile for three pages**

The dev server proxies every request through Shopify, so these scores come out lower than the live CDN gives. Passing here leaves margin.

Run:
```bash
export CHROME_PATH="$(find ~/.agent-browser/browsers -type f -path '*MacOS/*' -perm -u+x | head -1)"
mkdir -p .lighthouse
for page in "" "products/kithul-treacle" "collections/all"; do
  name=$(echo "${page:-home}" | tr '/' '-')
  npx -y lighthouse@13.5.0 "http://127.0.0.1:9292/$page" --only-categories=performance,accessibility \
    --form-factor=mobile --chrome-flags="--headless=new" --output=json --output-path=".lighthouse/$name.json" --quiet
done
node -e "for (const f of require('fs').readdirSync('.lighthouse')) { const r = require('./.lighthouse/' + f); console.log(f, Math.round(r.categories.performance.score * 100), Math.round(r.categories.accessibility.score * 100)); }"
```
Expected: the average of the three performance scores is at least 60 and the average accessibility score is at least 90. If accessibility is under 90, open the JSON, list the failing audits (`r.audits[id].score === 0`), fix each in the Liquid or CSS it names, rebuild and rerun. Do not lower the bar.

- [ ] **Step 2: Keyboard pass by hand**

At 1440 px and at 390 px, using only the keyboard on the home, product, cart and collection pages: every control is reachable with Tab, shows a visible focus ring, and opens and closes with Enter, Space and Escape. The cart drawer and gallery viewer trap focus and return it to their opener on close. Note any failure, fix it, rerun the matching browser check from Tasks 3 to 7.

- [ ] **Step 3: Reduced motion pass**

Run: `agent-browser --session theme set media prefers-reduced-motion reduce` (if the CLI lacks that command, use macOS System Settings > Accessibility > Display > Reduce motion), then open the cart drawer and the mobile menu.
Expected: both appear with a short fade and no slide.

- [ ] **Step 4: Check the demo colour scheme contrast**

These pairs come from the concept's `src/styles/tokens.css` and must hold in the theme:

| Scheme | Pair | Ratio |
|---|---|---|
| Light | ink #590303 on #FFFFFF | 14.60 |
| Light | heading #8C1A0F on #FFFFFF | 9.26 |
| Light | muted #A64D2D on #FFFFFF | 5.64 |
| Light | button text #590303 on #ADBF24 | 7.13 |
| Band | text #FBFAF6 on #8C1A0F | 8.86 |
| Band | muted #D6DF91 on #8C1A0F | 6.52 |
| Dark | text #FBFAF6 on #590303 | 13.96 |
| Dark | heading #ADBF24 on #590303 | 7.13 |

Run this to confirm the numbers from the settings file itself:
```bash
node -e "
const s = require('./config/settings_data.json').current.color_schemes;
const lum = (h) => { const c = [1,3,5].map(i => parseInt(h.slice(i, i+2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return ((x + 0.05) / (y + 0.05)).toFixed(2); };
for (const [id, { settings: c }] of Object.entries(s)) for (const k of ['text', 'heading', 'muted']) console.log(id, k, ratio(c[k], c.background));
for (const [id, { settings: c }] of Object.entries(s)) console.log(id, 'button', ratio(c.button_text, c.button));
"
```
Expected: every ratio at least 4.5.

- [ ] **Step 5: Add the design notes to the README**

Append to `README.md`, replacing `<fonts>` with the font handles that Task 2 Step 9 found working (for example `jost_n7` and `hanken_grotesk_n4`) before saving:
````markdown
## Colour schemes

Sections pick one of three schemes. Each scheme sets `--scheme-*` variables (see `snippets/theme-styles.liquid`), and Tailwind utilities such as `text-ink` and `bg-tint` read them, so markup never changes with the scheme.

| Scheme | Background | Text | Heading | Muted | Button / text | Border |
|---|---|---|---|---|---|---|
| light | #FFFFFF | #590303 | #8C1A0F | #A64D2D | #ADBF24 / #590303 | #598C0D |
| band | #8C1A0F | #FBFAF6 | #FBFAF6 | #D6DF91 | #ADBF24 / #590303 | #D6DF91 |
| dark | #590303 | #FBFAF6 | #ADBF24 | #D6DF91 | #ADBF24 / #590303 | #ADBF24 |

Every text and button pair passes WCAG 2.1 AA (4.5:1). The lowest is muted text on white at 5.64:1. Merchants who change the colours are responsible for contrast; the colour setting's help text says so.

## Fonts

Defaults: <fonts>, from Shopify's font library.

## Tests

- `npm test` runs the unit tests.
- With `npm run dev` running, each file in `tests/browser/` is an in-page check: open the page it names and run `agent-browser eval --stdin < tests/browser/<file>`. Each prints a line ending in `ok` or throws with the failing assertion.
````

- [ ] **Step 6: Final verification**

Run: `npm run build && npm run typecheck && npm test && npm run check && git status --short`
Expected: everything passes, and `git status` shows only the files this task changed (plus `assets/` if the build output changed).

- [ ] **Step 7: Commit**

```bash
git add README.md assets layout sections snippets src
git commit -m "Pass Lighthouse and accessibility checks, document schemes and tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

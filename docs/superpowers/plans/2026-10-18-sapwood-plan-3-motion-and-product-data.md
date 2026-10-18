# Sapwood plan 3: motion and product data

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The theme reads the spec's product metafields (nutrition, pack details, how-to-use and product FAQ), ships `scripts/create-metafields.mjs` to create their definitions, and adds GSAP motion: heading line reveals, staggered product card entrances, and a pinned desktop process section with a progress line, step buttons and editor block selection.

**Architecture:** Metafield content renders in Liquid with no new requests: nutrition and how-to-use are inline blocks in `main-product.liquid`, pack details is a snippet that prints one panel per variant for `product.ts` to show and hide, and the FAQ section gains a setting that swaps its blocks for the product's `custom.faq` entries. Motion is a second esbuild entry, `assets/motion.js`, that `layout/theme.liquid` adds at the end of the body only when the motion setting is on and the visitor has not asked for reduced motion. It registers per section root with `registerSection`, scopes all GSAP work in a `gsap.matchMedia` context that reverts on `shopify:section:unload`, and leaves anything already on screen alone so nothing flashes.

**Tech stack:** as plan 2, plus GSAP 3.15.0 (core, ScrollTrigger, SplitText) as the one new dependency. Shopify Admin GraphQL API 2026-07 for the metafield script, called with Node 24's built-in `fetch`.

**Spec:** `docs/superpowers/specs/2026-10-14-sapwood-theme-design.md`, sections "Product data", "Motion", the section table rows Process steps, FAQ and Main product (nutrition, pack details and how-to-use blocks), and the testing bullets "Theme editor: reloading a section re-runs its script" and "Reduced motion: every process step is visible and nothing is pinned".

**Left for later plans:** Natural Treacle copy in `templates/index.json` and presets, `demo/products.csv`, demo images and demo metafield content (plan 4). `templates/gift_card.liquid`. The concept's hero intro animation, parallax, map draw-in and stacked-mode sap line are not ported: the spec names heading reveals, card entrances and the pinned process section only.

**Concept source:** `~/Development/Raala-pitch` (Astro). Read-only. `src/scripts/motion.ts` (heading and group reveals) and `src/scripts/home-process.ts` (the pinned stage) are the motion references. The sap drip, track, drop and bottle are dropped (spec, "Dropped from the concept"). None of its copy, product data or images ship.

## Global constraints

- Node 24 for every command: run `source ~/.nvm/nvm.sh && nvm use` in the repo first (reads `.nvmrc`). The shell defaults to Node 20.
- Exact dev dependency versions stay as plan 1 set them. The only new dependency is `gsap` at exactly `3.15.0`, added in Task 6.
- Every string a shopper sees and the theme supplies goes in `locales/en.default.json`. Every editor label goes in `locales/en.default.schema.json` and is referenced as `t:...`. Liquid never hard-codes these strings. Setting defaults are merchant copy and may be plain English in the schema.
- No RaaLa assets, names or copy anywhere in the theme. Default copy makes no health claims and does not use the words "organic", "sugar free" or "low GI".
- Every block or section that reads a metafield renders nothing when the metafield is empty, including its heading.
- Metafields live in the `custom` namespace with the keys and types in the spec's product data table. Metaobject types are `nutrition_table`, `nutrition_row`, `faq_item`, `usage_step` and `carton`.
- Motion code runs only when `settings.motion` is on and `prefers-reduced-motion: no-preference` matches, and reverts when either stops being true. Lenis is not used.
- All scripts initialise per section root through `registerSection` and clean up on `shopify:section:unload`.
- Use the scheme utilities (`text-ink`, `text-heading`, `text-muted`, `bg-tint`, `border-line`, `border-hairline`, `bg-accent`, `text-on-accent`) or `var(--scheme-*)`. Never a hex colour.
- Touch targets are at least 44px. Focus stays visible.
- No em dash character (U+2014) in any copy, comment, locale string or commit message.
- Comments explain why, never what. Snippets document their parameters with `{% doc %}`.
- `npm run check` (Theme Check) must report no errors at the end of every task.
- The local dev server is `http://127.0.0.1:9292`, run with `npm run dev`. Browser checks run with `agent-browser --session theme open <url> && agent-browser --session theme eval --stdin < tests/browser/<file>`. Set the viewport with `agent-browser --session theme set viewport <w> <h>` and reduced motion with `agent-browser --session theme set media light reduced-motion`. To clear reduced motion, run `agent-browser --session theme close` and open the page again.
- Commit messages end with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

```
scripts/create-metafields.mjs        metaobject and metafield definitions through the Admin GraphQL API
snippets/faq-item.liquid             one question and answer as <details>
snippets/pack-details.liquid         shelf life, plus one panel of details per variant
src/ts/motion.ts                     motion.js entry: heading and card reveals, editor refresh
src/ts/process-stage.ts              the pinned process stage, its buttons and editor block select
src/css/process.css                  stage layout, progress line and step buttons
tests/unit/metafields.test.ts
tests/browser/faq-product-check.js tests/browser/product-blocks-check.js tests/browser/pack-details-check.js
tests/browser/motion-check.js tests/browser/motion-revealed-check.js tests/browser/process-stage-check.js
```

Modified: `sections/faq.liquid`, `sections/main-product.liquid`, `sections/process-steps.liquid`, `sections/product-grid.liquid`, `layout/theme.liquid`, `src/ts/product.ts`, `src/css/theme.css`, `src/css/product.css`, `templates/product.json`, `package.json`, `package-lock.json`, `.shopifyignore`, both locale files, `tests/browser/process-check.js`, `README.md`, and the build output in `assets/`.

## Task 0: Admin API access (done by Neelaka, not an agent)

The metafield script needs an Admin API token for the development store. This needs an account login, so a person does it once.

- [ ] **Step 1:** Create an app for the development store with these Admin API scopes: `read_products`, `write_products`, `read_metaobject_definitions`, `write_metaobject_definitions`, `read_metaobjects`, `write_metaobjects`. If the store's admin still offers Settings > Apps and sales channels > Develop apps, create a custom app there and install it. Otherwise create the app in the Shopify Dev Dashboard and install it on the store.
- [ ] **Step 2:** Copy the app's Admin API access token (it starts with `shpat_`). A Dev Dashboard app shows a client ID and secret instead; exchange them for a token with `curl -s -X POST "https://$SHOPIFY_FLAG_STORE/admin/oauth/access_token" -d grant_type=client_credentials -d client_id=<id> -d client_secret=<secret>` and copy `access_token` from the reply. That token expires after 24 hours, which is long enough for this plan.
- [ ] **Step 3:** In the shell that runs the plan, `export SHOPIFY_ADMIN_TOKEN=<token>`. `SHOPIFY_FLAG_STORE` is already set from plan 1.

## Task 1: metafield definitions script

**Files:**
- Create: `scripts/create-metafields.mjs`, `tests/unit/metafields.test.ts`
- Modify: `.shopifyignore`, `README.md`

**Interfaces:**
- Consumes: env `SHOPIFY_FLAG_STORE` (shop domain, from plan 1) and `SHOPIFY_ADMIN_TOKEN` (Task 0).
- Produces: `METAOBJECTS` and `METAFIELDS` exports; on the store, the five metaobject definitions and seven metafield definitions that Tasks 2 to 5 read.

- [ ] **Step 1: Write the failing unit test**

`tests/unit/metafields.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { METAFIELDS, METAOBJECTS } from '../../scripts/create-metafields.mjs';

test('every metaobject reference points at a definition created before it', () => {
  const created = new Set<string>();
  for (const definition of METAOBJECTS) {
    for (const field of definition.fields) {
      if (field.references) assert.ok(created.has(field.references), `${definition.type}.${field.key} needs ${field.references} first`);
    }
    created.add(definition.type);
  }
  for (const field of METAFIELDS) {
    if (field.references) assert.ok(created.has(field.references), `custom.${field.key} needs ${field.references}`);
  }
});

test('the metafields match the spec product data table', () => {
  assert.deepEqual(
    METAFIELDS.map((field) => `${field.ownerType} custom.${field.key} ${field.type}`),
    [
      'PRODUCT custom.shelf_life_months number_integer',
      'PRODUCT custom.nutrition metaobject_reference',
      'PRODUCT custom.faq list.metaobject_reference',
      'PRODUCT custom.how_to_use list.metaobject_reference',
      'PRODUCTVARIANT custom.closure single_line_text_field',
      'PRODUCTVARIANT custom.gross_weight_kg number_decimal',
      'PRODUCTVARIANT custom.carton metaobject_reference',
    ],
  );
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL with `Cannot find module` for `scripts/create-metafields.mjs`.

- [ ] **Step 3: Write the script**

`scripts/create-metafields.mjs`:
```js
// Creates the metaobject and metafield definitions that Sapwood's product blocks and FAQ section read. Definitions
// that already exist are left as they are, so running it again is safe.
//
//   SHOPIFY_FLAG_STORE=example.myshopify.com SHOPIFY_ADMIN_TOKEN=shpat_... node scripts/create-metafields.mjs

const API_VERSION = '2026-07';

/** Created in this order, because a field can only reference a metaobject type created before it. */
export const METAOBJECTS = [
  {
    type: 'nutrition_row',
    name: 'Nutrition row',
    fields: [
      { key: 'nutrient', name: 'Nutrient', type: 'single_line_text_field', required: true },
      { key: 'amount', name: 'Amount', type: 'single_line_text_field', required: true },
    ],
  },
  {
    type: 'nutrition_table',
    name: 'Nutrition table',
    fields: [
      { key: 'basis', name: 'Basis', type: 'single_line_text_field' },
      { key: 'rows', name: 'Rows', type: 'list.metaobject_reference', required: true, references: 'nutrition_row' },
    ],
  },
  {
    type: 'faq_item',
    name: 'FAQ item',
    fields: [
      { key: 'question', name: 'Question', type: 'single_line_text_field', required: true },
      { key: 'answer', name: 'Answer', type: 'rich_text_field', required: true },
    ],
  },
  {
    type: 'usage_step',
    name: 'Usage step',
    fields: [
      { key: 'title', name: 'Title', type: 'single_line_text_field', required: true },
      { key: 'text', name: 'Text', type: 'multi_line_text_field' },
      { key: 'image', name: 'Image', type: 'file_reference' },
    ],
  },
  {
    type: 'carton',
    name: 'Carton',
    fields: [
      { key: 'units', name: 'Units', type: 'number_integer', required: true },
      { key: 'gross_kg', name: 'Gross weight (kg)', type: 'number_decimal', required: true },
      { key: 'net_kg', name: 'Net weight (kg)', type: 'number_decimal', required: true },
      { key: 'length_mm', name: 'Length (mm)', type: 'number_integer', required: true },
      { key: 'width_mm', name: 'Width (mm)', type: 'number_integer', required: true },
      { key: 'height_mm', name: 'Height (mm)', type: 'number_integer', required: true },
    ],
  },
];

export const METAFIELDS = [
  { ownerType: 'PRODUCT', key: 'shelf_life_months', name: 'Shelf life (months)', type: 'number_integer' },
  { ownerType: 'PRODUCT', key: 'nutrition', name: 'Nutrition', type: 'metaobject_reference', references: 'nutrition_table' },
  { ownerType: 'PRODUCT', key: 'faq', name: 'FAQ', type: 'list.metaobject_reference', references: 'faq_item' },
  { ownerType: 'PRODUCT', key: 'how_to_use', name: 'How to use', type: 'list.metaobject_reference', references: 'usage_step' },
  { ownerType: 'PRODUCTVARIANT', key: 'closure', name: 'Closure', type: 'single_line_text_field' },
  { ownerType: 'PRODUCTVARIANT', key: 'gross_weight_kg', name: 'Gross weight (kg)', type: 'number_decimal' },
  { ownerType: 'PRODUCTVARIANT', key: 'carton', name: 'Carton', type: 'metaobject_reference', references: 'carton' },
];

function client(store, token) {
  return async (query, variables) => {
    const response = await fetch(`https://${store}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query, variables }),
    });
    if (!response.ok) throw Error(`${response.status} ${response.statusText}: ${await response.text()}`);
    const body = await response.json();
    if (body.errors) throw Error(JSON.stringify(body.errors));
    return body.data;
  };
}

function validations(field, ids) {
  if (field.references) return [{ name: 'metaobject_definition_id', value: ids.get(field.references) }];
  if (field.type === 'file_reference') return [{ name: 'file_type_options', value: '["Image"]' }];
  return [];
}

function throwOnUserErrors(result, label) {
  if (result.userErrors.length) throw Error(`${label}: ${result.userErrors.map((error) => error.message).join('; ')}`);
}

async function createMetaobject(admin, definition, ids) {
  const { metaobjectDefinitionByType: existing } = await admin(
    'query ($type: String!) { metaobjectDefinitionByType(type: $type) { id } }',
    { type: definition.type },
  );
  if (existing) {
    console.log(`exists   metaobject ${definition.type}`);
    return existing.id;
  }
  const { metaobjectDefinitionCreate: result } = await admin(
    `mutation ($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) { metaobjectDefinition { id } userErrors { message } }
    }`,
    {
      definition: {
        type: definition.type,
        name: definition.name,
        // Liquid can only read entries whose definition allows storefront access.
        access: { storefront: 'PUBLIC_READ' },
        fieldDefinitions: definition.fields.map((field) => ({
          key: field.key,
          name: field.name,
          type: field.type,
          required: field.required ?? false,
          validations: validations(field, ids),
        })),
      },
    },
  );
  throwOnUserErrors(result, `metaobject ${definition.type}`);
  console.log(`created  metaobject ${definition.type}`);
  return result.metaobjectDefinition.id;
}

async function createMetafield(admin, field, ids) {
  const { metafieldDefinitions } = await admin(
    `query ($ownerType: MetafieldOwnerType!, $key: String!) {
      metafieldDefinitions(first: 1, ownerType: $ownerType, namespace: "custom", key: $key) { nodes { type { name } } }
    }`,
    { ownerType: field.ownerType, key: field.key },
  );
  const existing = metafieldDefinitions.nodes[0];
  if (existing) {
    // The theme reads the value as this type, so a definition of another type would render wrongly or not at all.
    if (existing.type.name !== field.type) {
      throw Error(`custom.${field.key} on ${field.ownerType} exists as ${existing.type.name}, not ${field.type}. Change or delete it in the admin first.`);
    }
    console.log(`exists   ${field.ownerType} custom.${field.key}`);
    return;
  }
  const { metafieldDefinitionCreate: result } = await admin(
    `mutation ($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) { createdDefinition { id } userErrors { message } }
    }`,
    {
      definition: {
        name: field.name,
        namespace: 'custom',
        key: field.key,
        type: field.type,
        ownerType: field.ownerType,
        validations: validations(field, ids),
      },
    },
  );
  throwOnUserErrors(result, `${field.ownerType} custom.${field.key}`);
  console.log(`created  ${field.ownerType} custom.${field.key}`);
}

async function main() {
  const store = process.env.SHOPIFY_FLAG_STORE;
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  if (!store || !token) {
    console.error('Set SHOPIFY_FLAG_STORE (example.myshopify.com) and SHOPIFY_ADMIN_TOKEN (an Admin API access token).');
    process.exit(1);
  }
  const admin = client(store, token);
  const ids = new Map();
  for (const definition of METAOBJECTS) ids.set(definition.type, await createMetaobject(admin, definition, ids));
  for (const field of METAFIELDS) await createMetafield(admin, field, ids);
}

if (import.meta.main) await main();
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `npm test`
Expected: PASS, including both new tests.

- [ ] **Step 5: Keep the script out of theme uploads**

Add a line to `.shopifyignore`:
```
scripts/**
```

- [ ] **Step 6: Run it against the development store, twice**

Run: `node scripts/create-metafields.mjs`
Expected: five `created  metaobject ...` lines, then seven `created  ... custom....` lines, exit code 0.

Run it again.
Expected: twelve `exists ...` lines, exit code 0.

If the first run fails partway, fix the cause and run again: anything already created reports `exists`. If the API rejects the version `2026-07`, set `API_VERSION` to the newest version listed at shopify.dev/docs/api/usage/versioning and say so in the task report.

- [ ] **Step 7: Document the definitions in the README**

In `README.md`, add a row to the Scripts table after `npm run typecheck`:
```markdown
| `node scripts/create-metafields.mjs` | Creates the metafield and metaobject definitions below on the store in `SHOPIFY_FLAG_STORE`, using an Admin API token in `SHOPIFY_ADMIN_TOKEN` with the products and metaobject definitions scopes. Safe to run again. |
```

and add before `## Tests`:
````markdown
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
````

- [ ] **Step 8: Check and commit**

Run: `npm run check`
Expected: no errors.

```bash
git add scripts/create-metafields.mjs tests/unit/metafields.test.ts .shopifyignore README.md
git commit -m "Add a script that creates the product metafield definitions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 2: metafield test content (done by Neelaka, not an agent)

The browser checks in Tasks 3 to 5 read this content. It is test data for the development store, not demo copy, and the nutrition figures are illustrative. Kithul Jaggery stays empty so every check can also test the empty state.

- [ ] **Step 1:** Content > Metaobjects > Nutrition row: add `Energy` / `1170 kJ`, `Carbohydrate` / `70 g`, `of which sugars` / `62 g`. Then Nutrition table: add one entry with basis `Per 100 g` and those three rows in that order.
- [ ] **Step 2:** Content > Metaobjects > FAQ item: add `Does it need to be kept in the fridge?` / `No. Keep it closed in a cool cupboard.` and `Can it crystallise?` / `Sometimes, in the cold. Stand the jar in warm water.`
- [ ] **Step 3:** Content > Metaobjects > Usage step: add `Over yoghurt` / `Pour a spoonful over plain yoghurt.` with one of the product's images, and `In tea` / `Stir a spoonful into black tea.` with no image.
- [ ] **Step 4:** Content > Metaobjects > Carton: add units `24`, gross `11.5`, net `9.6`, length `300`, width `200`, height `180`.
- [ ] **Step 5:** Products > Kithul Treacle, metafields: shelf life `24`, nutrition the table from Step 1, FAQ both items in the order above, how to use both steps in the order above.
- [ ] **Step 6:** Kithul Treacle variants: 250 ml gets closure `Screw cap`, gross weight `0.45` and the carton from Step 4. 1000 ml gets closure `Screw cap` and gross weight `1.6`, no carton. 375 ml gets nothing.

## Task 3: FAQ from the product metafield

**Files:**
- Create: `snippets/faq-item.liquid`, `tests/browser/faq-product-check.js`
- Modify: `sections/faq.liquid`, `templates/product.json`, `locales/en.default.schema.json`

**Interfaces:**
- Consumes: product metafield `custom.faq` (Task 1), test content (Task 2).
- Produces: `{% render 'faq-item', question: <string>, answer: <html>, block: <block or nil> %}`; FAQ setting `use_product_faq`; a `faq` section on the product template.

- [ ] **Step 1: Write the failing browser check**

`tests/browser/faq-product-check.js`:
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const faq = document.querySelector('[data-faq]');
  if (location.pathname.endsWith('/kithul-jaggery')) {
    assert(!faq, 'A product with no FAQ metafield shows no FAQ section');
    return 'faq product empty ok';
  }
  assert(faq, 'The product page shows the FAQ section');
  const items = [...faq.querySelectorAll('details')];
  assert(items.length === 2, 'Each faq_item in the product metafield is one question');
  assert(items[0].querySelector('summary').textContent.trim() === 'Does it need to be kept in the fridge?', 'Questions come from the metafield, in order');
  assert(items[0].querySelector('.rte p')?.textContent.trim() === 'No. Keep it closed in a cool cupboard.', 'The rich text answer renders as HTML');
  return 'faq product ok';
})();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `agent-browser --session theme open http://127.0.0.1:9292/products/kithul-treacle && agent-browser --session theme eval --stdin < tests/browser/faq-product-check.js`
Expected: FAIL with `The product page shows the FAQ section`.

- [ ] **Step 3: Move one question into a snippet**

`snippets/faq-item.liquid`:
```liquid
{% doc %}
  One FAQ question as a details element.

  @param {string} question - The question, as plain text
  @param {string} answer - The answer, as HTML
  @param {object} [block] - The block it came from, for the theme editor's attributes
{% enddoc %}
<details class="group border-b border-line" {{ block.shopify_attributes }}>
  <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
    <span>{{ question | escape }}</span>
    {% render 'icon',
      name: 'plus',
      size: 20,
      class: 'shrink-0 transition-transform group-open:rotate-45 motion-reduce:transition-none'
    %}
  </summary>
  <div class="rte max-w-prose pb-6">{{ answer }}</div>
</details>
```

- [ ] **Step 4: Read the metafield in the FAQ section**

In `sections/faq.liquid`, replace everything above `{% schema %}` with:
```liquid
{%- liquid
  assign heading_id = 'Faq-' | append: section.id
  assign from_product = false
  if section.settings.use_product_faq and product
    assign from_product = true
    assign entries = product.metafields.custom.faq.value
  endif
-%}
{%- unless from_product and entries == blank -%}
  <section
    class="color-{{ section.settings.color_scheme }} py-16 lg:py-24"
    {% if section.settings.heading != blank %}
      aria-labelledby="{{ heading_id }}"
    {% endif %}
    data-faq
  >
    <div class="wrap max-w-3xl">
      {%- if section.settings.heading != blank -%}
        <h2 id="{{ heading_id }}">{{ section.settings.heading | escape }}</h2>
      {%- endif -%}
      {%- if section.settings.text != blank -%}
        <div class="rte mt-4 text-lg">{{ section.settings.text }}</div>
      {%- endif -%}
      <div class="mt-8 border-t border-line">
        {%- if from_product -%}
          {%- for entry in entries -%}
            {%- assign answer = entry.answer | metafield_tag -%}
            {% render 'faq-item', question: entry.question.value, answer: answer %}
          {%- endfor -%}
        {%- else -%}
          {%- for block in section.blocks -%}
            {% render 'faq-item', question: block.settings.question, answer: block.settings.answer, block: block %}
          {%- endfor -%}
        {%- endif -%}
      </div>
    </div>
  </section>
{%- endunless -%}
```

In its schema `settings`, add after the `text` setting:
```json
    { "type": "checkbox", "id": "use_product_faq", "label": "t:sections.faq.use_product_faq", "info": "t:sections.faq.use_product_faq_info", "default": false },
```

- [ ] **Step 5: Add the editor strings**

In `locales/en.default.schema.json`, under `sections.faq`, add after `"text"`:
```json
      "use_product_faq": "Use the product's FAQ",
      "use_product_faq_info": "On product pages, shows the product's FAQ metafield (custom.faq) in place of the questions below, and nothing when the product has none. Other pages always show the questions below.",
```

- [ ] **Step 6: Add the section to the product template**

In `templates/product.json`, add to `"sections"` after `"main"`:
```json
    "faq": {
      "type": "faq",
      "settings": { "heading": "Questions", "use_product_faq": true, "color_scheme": "light" }
    },
```
and change `"order"` to `["main", "faq", "reviews"]`.

- [ ] **Step 7: Run the checks to verify they pass**

Run: `npm run check`, then `faq-product-check.js` on `/products/kithul-treacle` and on `/products/kithul-jaggery`, then the existing `faq-check.js` on `/`.
Expected: no Theme Check errors; `faq product ok`, `faq product empty ok`, `faq ok`.

- [ ] **Step 8: Commit**

```bash
git add snippets/faq-item.liquid sections/faq.liquid templates/product.json locales/en.default.schema.json tests/browser/faq-product-check.js
git commit -m "Let the FAQ section show the product's FAQ metafield on product pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 4: nutrition and how-to-use blocks

**Files:**
- Create: `tests/browser/product-blocks-check.js`
- Modify: `sections/main-product.liquid`, `src/css/product.css`, `templates/product.json`, `locales/en.default.schema.json`

**Interfaces:**
- Consumes: product metafields `custom.nutrition` and `custom.how_to_use` (Task 1), test content (Task 2).
- Produces: main product block types `nutrition` and `how_to_use`; CSS classes `.product-details` (Task 5 reuses it) and `.product-usage`.

- [ ] **Step 1: Write the failing browser check**

`tests/browser/product-blocks-check.js`:
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const nutrition = document.querySelector('[data-nutrition]');
  const usage = document.querySelector('[data-how-to-use]');
  assert([...document.querySelectorAll('h1,h2,h3,h4')].every((h) => h.textContent.trim() !== ''), 'The page has no empty headings');
  if (location.pathname.endsWith('/kithul-jaggery')) {
    assert(!nutrition && !usage, 'A product with no nutrition or usage metafields shows neither block');
    return 'product blocks empty ok';
  }
  assert(nutrition, 'The nutrition block renders');
  const table = nutrition.querySelector('table');
  assert(table.caption?.textContent.trim() === 'Per 100 g', 'The table caption is the basis');
  const name = document.getElementById(table.getAttribute('aria-labelledby'));
  assert(name?.tagName === 'H2' && name.textContent.trim() !== '', 'The table is named by the block heading');
  const rows = [...table.querySelectorAll('tbody tr')];
  assert(rows.length === 3, 'Each nutrition_row is one table row');
  assert(rows[0].querySelector('th[scope="row"]').textContent.trim() === 'Energy', 'Rows keep the metafield order, nutrient as the row header');
  assert(rows[0].querySelector('td').textContent.trim() === '1170 kJ', 'The amount is in the second cell');
  assert(usage, 'The how to use block renders');
  const steps = [...usage.querySelectorAll('ol > li')];
  assert(steps.length === 2, 'Each usage_step is one list item');
  assert(steps.every((step) => step.querySelector('h3')?.textContent.trim()), 'Each step has an h3 title');
  assert(steps[0].querySelector('img') && !steps[1].querySelector('img'), 'Only steps with an image show one');
  return 'product blocks ok';
})();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `agent-browser --session theme open http://127.0.0.1:9292/products/kithul-treacle && agent-browser --session theme eval --stdin < tests/browser/product-blocks-check.js`
Expected: FAIL with `The nutrition block renders`.

- [ ] **Step 3: Render the blocks**

In `sections/main-product.liquid`, add two cases before `{%- when 'link' -%}`:
```liquid
            {%- when 'nutrition' -%}
              {%- assign nutrition = product.metafields.custom.nutrition.value -%}
              {%- if nutrition != blank -%}
                <div class="product-details" data-nutrition {{ block.shopify_attributes }}>
                  <h2 id="Nutrition-{{ block.id }}">{{ block.settings.heading | escape }}</h2>
                  <table aria-labelledby="Nutrition-{{ block.id }}">
                    {%- if nutrition.basis != blank -%}
                      <caption>{{ nutrition.basis.value | escape }}</caption>
                    {%- endif -%}
                    <tbody>
                      {%- for row in nutrition.rows.value -%}
                        <tr>
                          <th scope="row">{{ row.nutrient.value | escape }}</th>
                          <td>{{ row.amount.value | escape }}</td>
                        </tr>
                      {%- endfor -%}
                    </tbody>
                  </table>
                </div>
              {%- endif -%}
            {%- when 'how_to_use' -%}
              {%- assign usage_steps = product.metafields.custom.how_to_use.value -%}
              {%- if usage_steps != blank -%}
                <div class="product-details" data-how-to-use {{ block.shopify_attributes }}>
                  <h2>{{ block.settings.heading | escape }}</h2>
                  <ol class="product-usage" role="list">
                    {%- for usage_step in usage_steps -%}
                      <li>
                        {%- if usage_step.image != blank -%}
                          {{
                            usage_step.image.value
                            | image_url: width: 480
                            | image_tag: widths: '240, 360, 480', sizes: '(min-width: 64rem) 18vw, 45vw', loading: 'lazy'
                          }}
                        {%- endif -%}
                        <h3>{{ usage_step.title.value | escape }}</h3>
                        {%- if usage_step.text != blank -%}
                          <p>{{ usage_step.text.value | escape | newline_to_br }}</p>
                        {%- endif -%}
                      </li>
                    {%- endfor -%}
                  </ol>
                </div>
              {%- endif -%}
```

In the schema `blocks`, add before the `link` block:
```json
    {
      "type": "nutrition",
      "name": "t:sections.main_product.blocks.nutrition.name",
      "limit": 1,
      "settings": [
        { "type": "paragraph", "content": "t:sections.main_product.blocks.nutrition.info" },
        { "type": "text", "id": "heading", "label": "t:sections.main_product.blocks.nutrition.heading", "default": "Nutrition" }
      ]
    },
    {
      "type": "how_to_use",
      "name": "t:sections.main_product.blocks.how_to_use.name",
      "limit": 1,
      "settings": [
        { "type": "paragraph", "content": "t:sections.main_product.blocks.how_to_use.info" },
        { "type": "text", "id": "heading", "label": "t:sections.main_product.blocks.how_to_use.heading", "default": "How to use it" }
      ]
    },
```

- [ ] **Step 4: Add the editor strings**

In `locales/en.default.schema.json`, under `sections.main_product.blocks`, add after `"description"`:
```json
        "nutrition": {
          "name": "Nutrition",
          "info": "Shows the product's nutrition metafield (custom.nutrition) as a table. Shows nothing when it is empty.",
          "heading": "Heading"
        },
        "how_to_use": {
          "name": "How to use",
          "info": "Shows the product's how to use metafield (custom.how_to_use), one step per entry. Shows nothing when it is empty.",
          "heading": "Heading"
        },
```

- [ ] **Step 5: Style the blocks**

In `src/css/product.css`, change the selector `.product-trade h2 {` to `.product-trade h2,\n  .product-details h2 {` so both headings share one size, and add after the `.product-trade a` rule:
```css
  .product-details {
    padding-top: 1.5rem;
    border-top: 1px solid var(--scheme-hairline);
  }
  .product-details table,
  .product-details dl {
    width: 100%;
    margin-top: 0.75rem;
    font-size: 0.875rem;
  }
  .product-details caption {
    padding-bottom: 0.5rem;
    text-align: left;
    color: var(--scheme-muted);
  }
  .product-details tr,
  .product-details dl > div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-block: 0.5rem;
    border-bottom: 1px solid var(--scheme-hairline);
  }
  .product-details th,
  .product-details dt {
    font-weight: 400;
    text-align: left;
    color: var(--scheme-muted);
  }
  .product-details td,
  .product-details dd {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .product-usage {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem 1rem;
    margin-top: 0.75rem;
  }
  .product-usage img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
  }
  .product-usage h3 {
    margin-top: 0.625rem;
    font-size: 1rem;
    line-height: 1.2;
    letter-spacing: -0.02em;
    text-transform: none;
  }
  .product-usage p {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: var(--scheme-muted);
  }
```

- [ ] **Step 6: Add the blocks to the product template**

In `templates/product.json`, add to the main section's `"blocks"`:
```json
        "nutrition": { "type": "nutrition", "settings": { "heading": "Nutrition" } },
        "how_to_use": { "type": "how_to_use", "settings": { "heading": "How to use it" } },
```
and change `"block_order"` to `["text", "title", "price", "variant_picker", "buy_buttons", "description", "nutrition", "how_to_use", "trade"]`.

- [ ] **Step 7: Run the checks to verify they pass**

Run: `npm run build && npm run check`, then `product-blocks-check.js` on `/products/kithul-treacle` and on `/products/kithul-jaggery`, then the existing `product-check.js` on `/products/kithul-treacle`.
Expected: no Theme Check errors; `product blocks ok`, `product blocks empty ok`, and product-check's `ok` line.

- [ ] **Step 8: Commit**

```bash
git add sections/main-product.liquid src/css/product.css assets/theme.css templates/product.json locales/en.default.schema.json tests/browser/product-blocks-check.js
git commit -m "Add nutrition and how to use blocks that read product metafields

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 5: pack details block

**Files:**
- Create: `snippets/pack-details.liquid`, `tests/browser/pack-details-check.js`
- Modify: `sections/main-product.liquid`, `src/ts/product.ts`, `templates/product.json`, both locale files

**Interfaces:**
- Consumes: `.product-details` CSS (Task 4); product metafield `custom.shelf_life_months` and variant metafields `custom.closure`, `custom.gross_weight_kg`, `custom.carton` (Task 1); `update()` in `src/ts/product.ts`.
- Produces: main product block type `pack_details`; `[data-variant-panel="<variant id>"]` elements that `product.ts` shows for the selected variant.

- [ ] **Step 1: Write the failing browser check**

`tests/browser/pack-details-check.js`:
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const pack = document.querySelector('[data-pack-details]');
  if (location.pathname.endsWith('/kithul-jaggery')) {
    assert(!pack, 'A product with no pack metafields shows no pack details');
    return 'pack details empty ok';
  }
  assert(pack, 'Pack details render');
  assert(pack.querySelector('h2').textContent.trim() !== '', 'Pack details have a heading');
  assert(pack.querySelector('dl:not([data-variant-panel])')?.textContent.includes('24 months'), 'Shelf life shows whatever the variant');
  const radios = [...document.querySelectorAll('[data-product-root] [data-variant-picker] input')];
  const choose = (value) => radios.find((radio) => radio.value === value).click();
  const visible = () => [...pack.querySelectorAll('[data-variant-panel]')].filter((panel) => !panel.hidden);
  choose('1000 ml');
  assert(visible().length === 1 && visible()[0].textContent.includes('1.6 kg'), 'The 1000 ml variant shows its own details');
  assert(!visible()[0].textContent.includes('Carton'), 'A variant with no carton shows no carton rows');
  choose('375 ml');
  assert(visible().length === 0, 'A variant with no details shows no panel');
  choose('250 ml');
  assert(visible().length === 1 && visible()[0].textContent.includes('300 × 200 × 180 mm'), 'The 250 ml variant shows its carton size');
  assert(visible()[0].textContent.includes('24 units, 11.5 kg gross, 9.6 kg net'), 'The 250 ml variant shows its carton contents');
  return 'pack details ok';
})();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `agent-browser --session theme open http://127.0.0.1:9292/products/kithul-treacle && agent-browser --session theme eval --stdin < tests/browser/pack-details-check.js`
Expected: FAIL with `Pack details render`.

- [ ] **Step 3: Write the snippet**

`snippets/pack-details.liquid`:
```liquid
{% doc %}
  Pack details from the product's and its variants' custom metafields (see the README). Every variant's details
  are printed once and product.ts shows the selected variant's, so changing variant needs no request. Renders
  nothing when none of the metafields are set.

  @param {object} product - The product
  @param {object} current_variant - The variant whose details show on load
  @param {object} block - The pack details block, for its heading and the theme editor's attributes
{% enddoc %}
{%- liquid
  assign shelf_life = product.metafields.custom.shelf_life_months.value
  assign has_details = false
  if shelf_life != blank
    assign has_details = true
  endif
  for variant in product.variants
    if variant.metafields.custom.closure != blank or variant.metafields.custom.gross_weight_kg != blank or variant.metafields.custom.carton != blank
      assign has_details = true
      break
    endif
  endfor
-%}
{%- if has_details -%}
  <div class="product-details" data-pack-details {{ block.shopify_attributes }}>
    <h2>{{ block.settings.heading | escape }}</h2>
    {%- if shelf_life != blank -%}
      <dl>
        <div>
          <dt>{{ 'products.pack.shelf_life' | t }}</dt>
          <dd>{{ 'products.pack.months' | t: count: shelf_life }}</dd>
        </div>
      </dl>
    {%- endif -%}
    {%- for variant in product.variants -%}
      {%- liquid
        assign closure = variant.metafields.custom.closure.value
        assign gross_weight = variant.metafields.custom.gross_weight_kg.value
        assign carton = variant.metafields.custom.carton.value
      -%}
      {%- if closure != blank or gross_weight != blank or carton != blank -%}
        <dl data-variant-panel="{{ variant.id }}" {% if variant.id != current_variant.id %}hidden{% endif %}>
          {%- if closure != blank -%}
            <div>
              <dt>{{ 'products.pack.closure' | t }}</dt>
              <dd>{{ closure | escape }}</dd>
            </div>
          {%- endif -%}
          {%- if gross_weight != blank -%}
            <div>
              <dt>{{ 'products.pack.gross_weight' | t }}</dt>
              <dd>{{ 'products.pack.kilograms' | t: amount: gross_weight }}</dd>
            </div>
          {%- endif -%}
          {%- if carton != blank -%}
            <div>
              <dt>{{ 'products.pack.carton' | t }}</dt>
              <dd>
                {{-
                  'products.pack.carton_contents'
                  | t: units: carton.units.value, gross: carton.gross_kg.value, net: carton.net_kg.value
                -}}
              </dd>
            </div>
            <div>
              <dt>{{ 'products.pack.carton_size' | t }}</dt>
              <dd>
                {{-
                  'products.pack.millimetres'
                  | t: length: carton.length_mm.value, width: carton.width_mm.value, height: carton.height_mm.value
                -}}
              </dd>
            </div>
          {%- endif -%}
        </dl>
      {%- endif -%}
    {%- endfor -%}
  </div>
{%- endif -%}
```

- [ ] **Step 4: Add the block to the section**

In `sections/main-product.liquid`, add a case before `{%- when 'how_to_use' -%}`:
```liquid
            {%- when 'pack_details' -%}
              {% render 'pack-details', product: product, current_variant: current_variant, block: block %}
```

In the schema `blocks`, add before the `how_to_use` block:
```json
    {
      "type": "pack_details",
      "name": "t:sections.main_product.blocks.pack_details.name",
      "limit": 1,
      "settings": [
        { "type": "paragraph", "content": "t:sections.main_product.blocks.pack_details.info" },
        { "type": "text", "id": "heading", "label": "t:sections.main_product.blocks.pack_details.heading", "default": "Pack details" }
      ]
    },
```

- [ ] **Step 5: Show the selected variant's panel**

In `src/ts/product.ts`, inside `update()`, add after `renderPrice(root, variant);`:
```ts
    root.querySelectorAll<HTMLElement>('[data-variant-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.variantPanel !== String(variant.id);
    });
```

- [ ] **Step 6: Add the strings**

In `locales/en.default.json`, under `"products"`, add after `"details"`:
```json
    "pack": {
      "shelf_life": "Shelf life",
      "months": {
        "one": "{{ count }} month",
        "other": "{{ count }} months"
      },
      "closure": "Closure",
      "gross_weight": "Gross weight",
      "kilograms": "{{ amount }} kg",
      "carton": "Carton",
      "carton_contents": "{{ units }} units, {{ gross }} kg gross, {{ net }} kg net",
      "carton_size": "Carton size",
      "millimetres": "{{ length }} × {{ width }} × {{ height }} mm"
    },
```

In `locales/en.default.schema.json`, under `sections.main_product.blocks`, add after `"nutrition"`:
```json
        "pack_details": {
          "name": "Pack details",
          "info": "Shows shelf life (custom.shelf_life_months) and, for the selected variant, closure, gross weight and carton (custom.closure, custom.gross_weight_kg, custom.carton). Shows nothing when all are empty.",
          "heading": "Heading"
        },
```

- [ ] **Step 7: Add the block to the product template**

In `templates/product.json`, add to the main section's `"blocks"`:
```json
        "pack_details": { "type": "pack_details", "settings": { "heading": "Pack details" } },
```
and change `"block_order"` to `["text", "title", "price", "variant_picker", "buy_buttons", "description", "nutrition", "pack_details", "how_to_use", "trade"]`.

- [ ] **Step 8: Run the checks to verify they pass**

Run: `npm run build && npm run typecheck && npm test && npm run check`, then `pack-details-check.js` on `/products/kithul-treacle` and on `/products/kithul-jaggery`, then `product-check.js` and `product-blocks-check.js` on `/products/kithul-treacle`.
Expected: no errors; `pack details ok`, `pack details empty ok`, and both other checks' `ok` lines.

By hand, with JavaScript turned off in Chrome DevTools: `/products/kithul-treacle?variant=<1000 ml variant id>` shows the 1000 ml panel only, because Liquid hides every panel but the current variant's. If you skip this, say so in the task report.

- [ ] **Step 9: Commit**

```bash
git add snippets/pack-details.liquid sections/main-product.liquid src/ts/product.ts assets/theme.js templates/product.json locales/en.default.json locales/en.default.schema.json tests/browser/pack-details-check.js
git commit -m "Add a pack details block that follows the selected variant

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 6: GSAP, heading reveals and card entrances

**Files:**
- Create: `src/ts/motion.ts`, `tests/browser/motion-check.js`, `tests/browser/motion-revealed-check.js`
- Modify: `package.json`, `package-lock.json`, `layout/theme.liquid`, `sections/product-grid.liquid`

**Interfaces:**
- Consumes: `registerSection(selector, init)` from `src/ts/sections.ts`; `settings.motion` from `config/settings_schema.json`.
- Produces: `assets/motion.js`; `html[data-motion="ready"]` once it has run; the `data-reveal-group` attribute (its children rise in with a stagger); `.split-line` on split heading lines; in `motion.ts`, the per-section `gsap.matchMedia` context `mm` that Task 7 adds the process stage to.

- [ ] **Step 1: Write the failing browser checks**

`tests/browser/motion-check.js` (run at the top of the homepage, 1440 by 900):
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  assert(document.documentElement.dataset.motion === 'ready', 'motion.js has run');
  const belowFold = (el) => el.getBoundingClientRect().top > innerHeight;
  const headings = [...document.querySelectorAll('main h2')].filter(belowFold);
  assert(headings.length >= 3, 'The homepage has section headings below the fold');
  headings.forEach((heading) => {
    assert(heading.querySelector('.split-line'), `"${heading.textContent.trim()}" is split into lines`);
    assert(heading.getAttribute('aria-label')?.trim(), 'A split heading keeps its whole text for screen readers');
  });
  const cards = [...document.querySelectorAll('[data-reveal-group] > *')];
  assert(cards.length > 0 && cards.every(belowFold), 'The product grid starts below the fold');
  assert(cards.every((card) => getComputedStyle(card).opacity === '0'), 'Cards below the fold wait to rise in');
  assert(cards.every((card) => getComputedStyle(card).visibility === 'visible'), 'Waiting cards stay focusable');
  return 'motion ok';
})();
```

`tests/browser/motion-revealed-check.js` (run after scrolling the product grid into view):
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const group = document.querySelector('[data-reveal-group]');
  const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
  const cards = [...group.children].filter(onScreen);
  assert(cards.length > 0, 'Some cards are on screen');
  assert(cards.every((card) => getComputedStyle(card).opacity === '1'), 'Cards on screen have risen in');
  const lines = [...group.closest('section').querySelectorAll('h2 .split-line')];
  assert(lines.length > 0, 'The grid heading was split');
  assert(lines.every((line) => new DOMMatrix(getComputedStyle(line).transform).f === 0), 'The grid heading lines have risen into place');
  return 'motion revealed ok';
})();
```

- [ ] **Step 2: Run them to verify they fail**

Run:
```bash
agent-browser --session theme set viewport 1440 900
agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/motion-check.js
```
Expected: FAIL with `motion.js has run`.

- [ ] **Step 3: Add GSAP and the second bundle**

Run: `npm install --save-dev --save-exact gsap@3.15.0`

In `package.json`, change `build:js` to:
```json
    "build:js": "esbuild src/ts/theme.ts src/ts/motion.ts --bundle --format=iife --target=es2022 --minify --outdir=assets",
```
With two entry points, esbuild writes `assets/theme.js` and `assets/motion.js`. `npm run dev` passes `--watch=forever` through unchanged.

- [ ] **Step 4: Write the motion entry**

`src/ts/motion.ts`:
```ts
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { registerSection } from './sections.ts';

gsap.registerPlugin(ScrollTrigger, SplitText);

// The concept's motion ease, cubic-bezier(0.16, 1, 0.3, 1), is close to expo.out.
const EASE = 'expo.out';
const MOTION = '(prefers-reduced-motion: no-preference)';

// The script loads after first paint, so hiding something already on screen would make it flash.
const startsInView = (el: Element) => el.getBoundingClientRect().top < innerHeight;

function revealHeadings(root: HTMLElement) {
  for (const heading of root.querySelectorAll<HTMLElement>('h2')) {
    if (startsInView(heading)) continue;
    let played = false;
    SplitText.create(heading, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      // Re-splits when a resize rewraps the heading; after the first play it only re-splits.
      autoSplit: true,
      onSplit(self) {
        // Headings have a tight line height, so a bare mask clips descenders. The padding gives them room and the
        // negative margin keeps the layout unchanged.
        gsap.set(self.masks, { paddingBottom: '0.2em', marginBottom: '-0.2em' });
        if (played) return;
        return gsap.from(self.lines, {
          yPercent: 125,
          duration: 0.9,
          ease: EASE,
          stagger: 0.08,
          scrollTrigger: { trigger: heading, start: 'top 88%', once: true, onEnter: () => (played = true) },
        });
      },
    });
  }
}

function revealGroups(root: HTMLElement) {
  for (const group of root.querySelectorAll<HTMLElement>('[data-reveal-group]')) {
    const items = [...group.children].filter((item) => !startsInView(item)) as HTMLElement[];
    if (!items.length) continue;
    // Opacity, not autoAlpha: a hidden card would drop out of the tab order until it was scrolled to.
    gsap.set(items, { opacity: 0, y: 32 });
    ScrollTrigger.batch(items, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: EASE, stagger: 0.06 }),
    });
  }
}

/**
 * Scroll-driven motion. layout/theme.liquid only loads this file when the motion setting is on and the visitor has
 * not asked for reduced motion; the MOTION query also reverts everything if they turn it on with the page open.
 */
registerSection('main .shopify-section > *', (root, signal) => {
  const mm = gsap.matchMedia();
  mm.add(MOTION, () => {
    revealHeadings(root);
    revealGroups(root);
  });
  signal.addEventListener('abort', () => mm.revert());
});

// A section added, removed or moved in the theme editor shifts every trigger below it.
for (const type of ['shopify:section:load', 'shopify:section:unload', 'shopify:section:reorder']) {
  document.addEventListener(type, () => requestAnimationFrame(() => ScrollTrigger.refresh()));
}

document.documentElement.dataset.motion = 'ready';
```

`registerSection` matches with `querySelectorAll` inside the reloaded section's wrapper, which never returns the wrapper itself, so the selector targets each section wrapper's children.

- [ ] **Step 5: Load it from the layout**

In `layout/theme.liquid`, add after `{% render 'theme-data' %}`:
```liquid
    {%- if settings.motion -%}
      {%- comment -%}
        Added at the end of the body so every section exists when it runs. Visitors who ask for reduced motion never
        download GSAP.
      {%- endcomment -%}
      <script>
        if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
          const motion = document.createElement('script');
          motion.src = {{ 'motion.js' | asset_url | json }};
          document.body.append(motion);
        }
      </script>
    {%- endif -%}
```

- [ ] **Step 6: Mark the product grid's cards**

In `sections/product-grid.liquid`, add `data-reveal-group` to the `<ul ... role="list">` on line 27, so it reads:
```liquid
    <ul class="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:mt-12 lg:grid-cols-4 lg:gap-x-8" role="list" data-reveal-group>
```

- [ ] **Step 7: Run the checks to verify they pass**

Run: `npm run build && npm run typecheck && npm test && npm run check`
Expected: no errors. `assets/motion.js` exists.

Then:
```bash
agent-browser --session theme set viewport 1440 900
agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme wait 'html[data-motion]'
agent-browser --session theme eval --stdin < tests/browser/motion-check.js
agent-browser --session theme scrollintoview '[data-reveal-group]' && agent-browser --session theme wait 1500
agent-browser --session theme eval --stdin < tests/browser/motion-revealed-check.js
```
Expected: `motion ok`, then `motion revealed ok`.

Reduced motion:
```bash
agent-browser --session theme set media light reduced-motion
agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme wait 1500
agent-browser --session theme eval "!document.querySelector('script[src*=\"motion.js\"]') && !document.querySelector('.split-line') && !document.documentElement.dataset.motion"
agent-browser --session theme close
```
Expected: `true`.

Motion setting off: in `config/settings_data.json` set `"motion": false` under `current`, reload `/`, and run the same eval. Expected: `true`. Put the setting back to `true`.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/ts/motion.ts assets/motion.js layout/theme.liquid sections/product-grid.liquid tests/browser/motion-check.js tests/browser/motion-revealed-check.js
git commit -m "Add GSAP heading reveals and product card entrances

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 7: pinned process stage

**Files:**
- Create: `src/ts/process-stage.ts`, `src/css/process.css`, `tests/browser/process-stage-check.js`
- Modify: `sections/process-steps.liquid`, `src/ts/motion.ts`, `src/css/theme.css`, `locales/en.default.json`, `tests/browser/process-check.js`

**Interfaces:**
- Consumes: the per-section `mm` context in `src/ts/motion.ts` (Task 6); `[data-header-sticky]` from `sections/header.liquid` (present only when the header is sticky).
- Produces: `PROCESS_STAGE` (media query string) and `runStage(section: HTMLElement): () => void` from `src/ts/process-stage.ts`; markup hooks `data-process-list`, `data-process-step`, `data-process-photo`, `data-process-copy`, `data-process-navigation`, `data-process-progress`, `data-process-go="<index>"`; `data-process-ready` on the section while staged.

From 64rem wide and 700px tall, with motion allowed, the section pins below the sticky header and each step's photo wipes up over the last while the copy crossfades, snapping to whole steps. A progress line and one button per step sit under the stage. Below that size, with reduced motion, or with the motion setting off, the steps stay stacked as plan 2 built them.

- [ ] **Step 1: Write the failing browser check**

`tests/browser/process-stage-check.js` (run on the homepage at 1440 by 900):
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const section = document.querySelector('[data-process]');
  const navigation = section.querySelector('[data-process-navigation]');
  const steps = [...section.querySelectorAll('[data-process-step]')];
  const buttons = [...section.querySelectorAll('[data-process-go]')];
  const bar = section.querySelector('[data-process-progress]');
  const staged = () => section.hasAttribute('data-process-ready');
  const pinned = () => section.parentElement.classList.contains('pin-spacer');
  const current = () => buttons.findIndex((button) => button.getAttribute('aria-current') === 'step');
  const last = steps.length - 1;

  assert(staged() && pinned(), 'The process section is staged and pinned at 1440 by 900');
  assert(!navigation.hidden, 'The step buttons show');
  assert(buttons.length === steps.length, 'There is one button per step');
  buttons.forEach((button, i) => {
    assert(button.textContent.trim() !== '', `Step button ${i + 1} has a name`);
    assert(button.getBoundingClientRect().height >= 44, `Step button ${i + 1} is a 44px touch target`);
  });

  buttons[last].click();
  assert(current() === last, 'The last button makes the last step current');
  assert(steps.every((step, i) => step.inert === (i !== last)), 'Only the current step can be reached');
  assert(bar.style.transform === 'scaleX(1)', 'The progress line is full on the last step');
  buttons[0].click();
  assert(current() === 0 && !steps[0].inert, 'The first button goes back to the first step');
  assert(bar.style.transform === 'scaleX(0)', 'The progress line is empty on the first step');

  const wrapper = section.closest('.shopify-section');
  wrapper.dispatchEvent(new CustomEvent('shopify:section:unload', { bubbles: true }));
  assert(!staged() && !pinned() && navigation.hidden, 'Unloading the section in the editor puts the steps back');
  assert(steps.every((step) => !step.inert), 'Unloading leaves every step reachable');
  wrapper.dispatchEvent(new CustomEvent('shopify:section:load', { bubbles: true }));
  assert(staged() && pinned(), 'Loading the section again restages it');
  return 'process stage ok';
})();
```

- [ ] **Step 2: Run it to verify it fails**

Run:
```bash
agent-browser --session theme set viewport 1440 900
agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme wait 'html[data-motion]'
agent-browser --session theme eval --stdin < tests/browser/process-stage-check.js
```
Expected: FAIL with `The process section is staged and pinned at 1440 by 900`.

- [ ] **Step 3: Extend the static check**

In `tests/browser/process-check.js`, add before `return 'process ok';`:
```js
  assert(!section.hasAttribute('data-process-ready'), 'The steps are stacked, not staged');
  assert(!section.parentElement.classList.contains('pin-spacer'), 'Nothing is pinned');
  const navigation = section.querySelector('[data-process-navigation]');
  assert(!navigation || navigation.hidden, 'Step buttons only show while staged');
```
This check now describes stacked steps: run it at phone width or with reduced motion.

- [ ] **Step 4: Add the hooks and step buttons to the section**

Replace everything in `sections/process-steps.liquid` above `{% schema %}` with:
```liquid
{%- liquid
  assign heading_id = 'Process-' | append: section.id
  assign step_tag = 'h2'
  if section.settings.heading != blank
    assign step_tag = 'h3'
  endif
-%}
<section
  class="color-{{ section.settings.color_scheme }} py-16 lg:py-24"
  {% if section.settings.heading != blank %}
    aria-labelledby="{{ heading_id }}"
  {% endif %}
  data-process
>
  <div class="wrap">
    {%- if section.settings.heading != blank -%}
      <h2 id="{{ heading_id }}">{{ section.settings.heading | escape }}</h2>
    {%- endif -%}
    <ol id="ProcessList-{{ section.id }}" class="mt-10 grid gap-14 lg:gap-20" role="list" data-process-list>
      {%- for block in section.blocks -%}
        {%- capture padded -%}0{{ forloop.index }}{%- endcapture -%}
        <li
          class="grid gap-5 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-center md:gap-10"
          data-process-step
          {{ block.shopify_attributes }}
        >
          <div class="overflow-hidden" data-process-photo>
            {%- if block.settings.image != blank -%}
              {{
                block.settings.image
                | image_url: width: 1280
                | image_tag:
                  widths: '480, 720, 960, 1280',
                  sizes: '(min-width: 64rem) 58vw, (min-width: 48rem) 55vw, 92vw',
                  loading: 'lazy',
                  class: 'aspect-[3/2] w-full object-cover'
              }}
            {%- else -%}
              {{ 'lifestyle-1' | placeholder_svg_tag: 'aspect-[3/2] w-full bg-tint' }}
            {%- endif -%}
          </div>
          <div data-process-copy>
            <p class="flex items-baseline gap-4 text-sm text-muted">
              <span class="font-display text-[1.75rem] text-heading" aria-hidden="true" data-step-number>
                {{- padded | slice: -2, 2 -}}
              </span>
              {{- block.settings.label | escape -}}
            </p>
            {%- if block.settings.heading != blank -%}
              <{{ step_tag }} class="mt-3">{{ block.settings.heading | escape }}</{{ step_tag }}>
            {%- endif -%}
            {%- if block.settings.text != blank -%}
              <p class="mt-4 max-w-[34ch]">{{ block.settings.text | escape | newline_to_br }}</p>
            {%- endif -%}
            {%- if block.settings.link_label != blank and block.settings.link != blank -%}
              <a href="{{ block.settings.link }}" class="mt-3 inline-flex min-h-11 items-center text-muted underline-offset-4 hover:underline">
                {{- block.settings.link_label | escape -}}
              </a>
            {%- endif -%}
          </div>
        </li>
      {%- endfor -%}
    </ol>
    {%- if section.blocks.size > 1 -%}
      {%- comment -%}Shown by process-stage.ts while the section is pinned. Stacked steps need no buttons.{%- endcomment -%}
      <nav class="process-navigation" aria-label="{{ 'process.navigation' | t }}" data-process-navigation hidden>
        <div class="process-progress" aria-hidden="true"><span data-process-progress></span></div>
        <div class="process-stops" style="--steps: {{ section.blocks.size }}">
          {%- for block in section.blocks -%}
            {%- liquid
              assign padded = '0' | append: forloop.index | slice: -2, 2
              assign name = block.settings.heading | default: block.settings.label
              if name == blank
                assign name = 'process.step' | t: number: forloop.index
              endif
            -%}
            <button type="button" data-process-go="{{ forloop.index0 }}" aria-controls="ProcessList-{{ section.id }}">
              <span aria-hidden="true">{{ padded }}</span>
              {{- name | escape -}}
            </button>
          {%- endfor -%}
        </div>
      </nav>
    {%- endif -%}
  </div>
</section>
```

In the schema, add `"max_blocks": 6,` after the `"settings"` array, because the step buttons share one row.

In `locales/en.default.json`, add a top-level key after `"video"`:
```json
  "process": {
    "navigation": "Steps",
    "step": "Step {{ number }}"
  },
```
No editor strings change.

- [ ] **Step 5: Write the stage CSS**

`src/css/process.css`:
```css
/*
  The pinned process stage. process-stage.ts sets data-process-ready only while the stage media query matches, so
  none of this touches stacked steps. These rules are unlayered on purpose: the same elements carry Tailwind grid,
  gap and padding utilities, and the utilities layer beats any layered rule whatever its specificity.
*/
[data-process-ready] {
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* Fills the screen below the sticky header while pinned, so no page shows under a short stage. */
  min-height: calc(100svh - var(--process-header, 0px));
  padding-block: 1.75rem 1.25rem;
}
[data-process-ready] > .wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100svh - var(--process-header, 0px) - 3rem);
  max-height: 57.5rem;
}
[data-process-ready] [data-process-list] {
  position: relative;
  display: block;
  flex: 1;
  min-height: 0;
  margin-top: 1.5rem;
}
[data-process-ready] [data-process-step] {
  position: absolute;
  inset: 0;
  display: block;
}
[data-process-ready] [data-process-copy] {
  position: absolute;
  inset-block: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 34%;
}
[data-process-ready] [data-process-photo] {
  position: absolute;
  inset-block: 0;
  right: 0;
  left: 40%;
}
[data-process-ready] [data-process-photo] > * {
  height: 100%;
  aspect-ratio: auto;
}
.process-progress {
  height: 1px;
  margin-top: 1rem;
  background: var(--scheme-hairline);
}
.process-progress span {
  display: block;
  height: 2px;
  background: var(--scheme-accent);
  transform: scaleX(0);
  transform-origin: left;
}
.process-stops {
  display: grid;
  grid-template-columns: repeat(var(--steps), minmax(0, 1fr));
}
.process-stops button {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-height: 2.75rem;
  padding: 0.75rem 0.5rem;
  font-size: 0.9375rem;
  text-align: left;
  color: var(--scheme-muted);
  cursor: pointer;
}
.process-stops button span {
  font-size: 0.75rem;
}
.process-stops button:hover,
.process-stops button[aria-current='step'] {
  color: var(--scheme-heading);
}
```

In `src/css/theme.css`, add after `@import './sale-stamp.css';`:
```css
@import './process.css';
```

- [ ] **Step 6: Write the stage script**

`src/ts/process-stage.ts`:
```ts
import { gsap } from 'gsap';

/** Wide and tall enough to show one step at a time. Below this, or with reduced motion, the steps stay stacked. */
export const PROCESS_STAGE = '(min-width: 64rem) and (min-height: 700px) and (prefers-reduced-motion: no-preference)';

// Scroll distance per step change, in viewport heights.
const SCROLL_PER_STEP = 0.8;

/**
 * Pins the process section and steps through its blocks as the page scrolls: each photo wipes up over the last and
 * the copy crossfades. Step buttons jump straight to a step, and so does selecting a step block in the theme editor.
 * Returns the cleanup gsap.matchMedia runs when PROCESS_STAGE stops matching or the section unloads.
 */
export function runStage(section: HTMLElement): () => void {
  const steps = [...section.querySelectorAll<HTMLElement>('[data-process-step]')];
  const navigation = section.querySelector<HTMLElement>('[data-process-navigation]');
  if (steps.length < 2 || !navigation) return () => {};
  const copies = steps.map((step) => step.querySelector<HTMLElement>('[data-process-copy]')!);
  const photos = steps.map((step) => step.querySelector<HTMLElement>('[data-process-photo]')!);
  const buttons = [...navigation.querySelectorAll<HTMLButtonElement>('[data-process-go]')];
  const progressBar = navigation.querySelector<HTMLElement>('[data-process-progress]')!;
  const last = steps.length - 1;
  const headerHeight = () => document.querySelector<HTMLElement>('[data-header-sticky]')?.offsetHeight ?? 0;
  const setHeader = () => section.style.setProperty('--process-header', `${headerHeight()}px`);

  // Set before the ScrollTrigger below is created, so it measures the stage layout.
  section.toggleAttribute('data-process-ready', true);
  setHeader();
  navigation.hidden = false;
  // Chrome never lazy-loads a fully clipped image, so a later step's photo would wipe in empty.
  for (const img of section.querySelectorAll<HTMLImageElement>('[data-process-photo] img')) img.loading = 'eager';
  gsap.set(photos.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(copies.slice(1), { autoAlpha: 0, y: 24 });

  let active = -1;
  const select = (index: number) => {
    if (index === active) return;
    active = index;
    steps.forEach((step, i) => (step.inert = i !== index));
    buttons.forEach((button, i) => (i === index ? button.setAttribute('aria-current', 'step') : button.removeAttribute('aria-current')));
  };

  // Step i has a label at time i, so snapping to labels settles on a step and label i sits at progress i / last.
  // Every tween states its start values and skips the immediate render, so scrubbing back returns to the set-up above.
  const run = gsap.timeline({
    defaults: { immediateRender: false, ease: 'power2.inOut' },
    onUpdate: () => {
      select(Math.round(run.time()));
      progressBar.style.transform = `scaleX(${run.progress()})`;
    },
    scrollTrigger: {
      trigger: section,
      start: () => `top top+=${headerHeight()}`,
      end: () => `+=${innerHeight * SCROLL_PER_STEP * last}`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      snap: { snapTo: 'labelsDirectional', inertia: false, duration: { min: 0.2, max: 0.6 }, delay: 0.1, ease: 'power2.inOut' },
      onRefreshInit: setHeader,
    },
  });
  run.addLabel('s0', 0);
  for (let i = 1; i <= last; i++) {
    const at = i - 1;
    run
      .fromTo(copies[at], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -24, duration: 0.35 }, at + 0.05)
      .fromTo(photos[i], { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7 }, at + 0.1)
      .fromTo(copies[i], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4 }, at + 0.5)
      .addLabel(`s${i}`, i);
  }
  // The last tween ends before time `last`; this keeps the timeline that long so the last label is at progress 1.
  run.set({}, {}, last);

  const show = (index: number) => {
    const trigger = run.scrollTrigger!;
    window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * (index / last), behavior: 'instant' });
    // Buttons and the editor jump straight to the step; only scrolling scrubs.
    trigger.getTween()?.progress(1);
    run.progress(index / last);
  };
  const onClick = (event: Event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-process-go]');
    if (button) show(Number(button.dataset.processGo));
  };
  // The editor scrolls the selected block into view itself; waiting a frame lets the stage's scroll win.
  const onBlockSelect = (event: Event) => {
    const index = steps.indexOf(event.target as HTMLElement);
    if (index !== -1) requestAnimationFrame(() => show(index));
  };
  navigation.addEventListener('click', onClick);
  document.addEventListener('shopify:block:select', onBlockSelect);
  select(0);

  return () => {
    navigation.removeEventListener('click', onClick);
    document.removeEventListener('shopify:block:select', onBlockSelect);
    section.removeAttribute('data-process-ready');
    section.style.removeProperty('--process-header');
    navigation.hidden = true;
    steps.forEach((step) => (step.inert = false));
    buttons.forEach((button) => button.removeAttribute('aria-current'));
    progressBar.style.removeProperty('transform');
  };
}
```

- [ ] **Step 7: Run the stage from the motion entry**

In `src/ts/motion.ts`, add the import after the `registerSection` import:
```ts
import { PROCESS_STAGE, runStage } from './process-stage.ts';
```
and inside the `registerSection` callback, add after the `mm.add(MOTION, ...)` call:
```ts
  if (root.matches('[data-process]')) mm.add(PROCESS_STAGE, () => runStage(root));
```
Also add to the doc comment above `registerSection`: `Process steps pin on wide screens (process-stage.ts).`

- [ ] **Step 8: Run the checks to verify they pass**

Run: `npm run build && npm run typecheck && npm test && npm run check`
Expected: no errors.

Staged, at 1440 by 900:
```bash
agent-browser --session theme set viewport 1440 900
agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme wait 'html[data-motion]'
agent-browser --session theme eval --stdin < tests/browser/process-stage-check.js
```
Expected: `process stage ok`.

Stacked at phone width, and at desktop width with reduced motion:
```bash
agent-browser --session theme set viewport 390 844
agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme wait 'html[data-motion]'
agent-browser --session theme eval --stdin < tests/browser/process-check.js
agent-browser --session theme set viewport 1440 900
agent-browser --session theme set media light reduced-motion
agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme wait 1500
agent-browser --session theme eval --stdin < tests/browser/process-check.js
agent-browser --session theme close
```
Expected: `process ok` both times.

By eye at 1440 by 900: scroll through the section. Expected: it pins under the header, each photo wipes up over the last, the copy crossfades, scrolling settles on a whole step, and the section unpins after the last step with the next section following straight on. Take a screenshot mid-way (`agent-browser --session theme screenshot`) and look at it.

- [ ] **Step 9: Commit**

```bash
git add sections/process-steps.liquid src/ts/process-stage.ts src/ts/motion.ts src/css/process.css src/css/theme.css assets/theme.css assets/motion.js locales/en.default.json tests/browser/process-stage-check.js tests/browser/process-check.js
git commit -m "Pin the process section on wide screens and step through it with buttons

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 8: full checks, editor pass and README

**Files:**
- Modify: `README.md`
- Modify: any file a failing check below points to

- [ ] **Step 1: Run every check**

Run: `npm run build && npm run typecheck && npm test && npm run check`
Expected: no errors and all unit tests pass.

At 1440 by 900 on `http://127.0.0.1:9292/`, after `wait 'html[data-motion]'`, run in turn: `theme-base-check.js`, `header-check.js`, `footer-check.js`, `hero-check.js`, `story-check.js`, `motion-check.js`, `process-stage-check.js`, `product-grid-check.js`, `trust-check.js`, `faq-check.js`, `contact-form-check.js`, `featured-product-check.js`, then `video-check.js` last (it replaces the cover). Then at 390 by 844, reload and run `process-check.js`.

On `/products/kithul-treacle` run `product-check.js`, `product-cart-check.js`, `product-blocks-check.js`, `pack-details-check.js`, `faq-product-check.js`, `reviews-check.js`. On `/products/kithul-jaggery` run `product-blocks-check.js`, `pack-details-check.js`, `faq-product-check.js`.

Expected: each prints its `ok` line. Clear the cart afterwards. A check written in plan 1 or 2 that now fails because a heading was split into lines is a real regression: fix `motion.ts`, not the check.

- [ ] **Step 2: Lighthouse on mobile**

Run plan 1 Task 8 Step 1's Lighthouse loop unchanged (home, `products/kithul-treacle`, `collections/all`).
Expected: average performance at least 60 and average accessibility at least 90 across the three. If performance dropped from plan 2's run in `.lighthouse/plan2/`, compare the two `home.json` files' main-thread and total blocking time audits and say how much of the change is `motion.js`. Do not lower the bar.

- [ ] **Step 3: Theme editor pass by hand**

Run `npm run dev`, open the theme editor preview link it prints, and at a desktop window size:

1. Select each process step block in the sidebar. Expected: the stage shows that step and its button is current.
2. Change a process step's heading. Expected: the section reloads still staged, and its button label changes.
3. Move the process section above the product grid, then back. Expected: the stage pins in the right place both times and the page below scrolls normally.
4. Turn Theme settings > Motion off. Expected: the preview reloads with stacked steps and no heading reveals.

Report any step that behaves differently, with what you saw.

- [ ] **Step 4: Keyboard and reduced motion pass by hand**

At 1440 by 900, Tab through the homepage. Expected: focus reaches each product card even before it has risen in, and lands on the current step's link and the step buttons inside the pinned section, never on a hidden step. Enter or Space on a step button changes step. With reduced motion on, every heading reads normally and every process step is visible.

- [ ] **Step 5: Update the README**

In `README.md`:

Change the `npm run build` row of the Scripts table to:
```markdown
| `npm run build` | Compiles `src/css/theme.css` to `assets/theme.css`, and `src/ts/theme.ts` and `src/ts/motion.ts` to `assets/theme.js` and `assets/motion.js` |
```

Change the Process steps and FAQ rows of the Sections table to:
```markdown
| Process steps | One block per step, up to 6. From 1024 px wide and 700 px tall, with motion on, the section pins and steps through the blocks as the page scrolls, with a progress line and a button per step. Selecting a step block in the editor shows that step. Phones, short screens and reduced motion get the steps stacked. |
| FAQ | Question and answer blocks as `<details>`. With "Use the product's FAQ" on, product pages show the product's `custom.faq` entries instead, and nothing when it has none. The product template has this section with the setting on. |
```

Add a row after Reviews:
```markdown
| Product | Blocks for title, price, variant picker, quantity and add to cart, description and a link box, plus nutrition, pack details and how to use, which read the metafields under Product data and show nothing when they are empty. Pack details follow the selected variant. |
```

Add before `## Product data`:
````markdown
## Motion

With Theme settings > Motion on, `layout/theme.liquid` loads `assets/motion.js` (GSAP 3.15.0 with ScrollTrigger and SplitText) at the end of the page. Visitors who ask for reduced motion never download it, and turning reduced motion on with the page open undoes it. Section headings rise in line by line, product grid cards rise in one after another, and the process section pins on wide screens. Anything already on screen when the script runs is left as it is, so nothing flashes.

Add `data-reveal-group` to a list to have its items rise in the same way.
````

- [ ] **Step 6: Commit**

```bash
git add README.md
git add -u
git commit -m "Document motion and the product blocks in the README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

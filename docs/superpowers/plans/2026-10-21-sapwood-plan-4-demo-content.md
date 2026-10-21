# Sapwood plan 4: demo content

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The development store shows Natural Treacle, a made-up kithul producer: the homepage template, footer and section presets carry its copy, `demo/products.csv` holds its six-variant range, and `demo/images/` holds the twelve photos that pass the RaaLa check.

**Architecture:** No theme code changes. Photos are re-encoded into `demo/images/` and pushed, so the product CSV can point Shopify's importer at them through `raw.githubusercontent.com` URLs pinned to that commit. A person imports the CSV, uploads the same photos to Content > Files, and adds images to the existing metafield content. The homepage template then refers to those files as `shopify://shop_images/<name>`. One unit test file guards the photo list, the CSV's variant states and the copy rules, and one browser check confirms the homepage renders the demo.

**Tech stack:** as plan 3. macOS `sips` for the image re-encode. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-14-sapwood-theme-design.md`, section "Demo content", and the testing bullets on Theme Check and Lighthouse.

**Left for later plans:** `templates/gift_card.liquid`. Photos for Kithul Flour, Gift Box and the cooking step, an origin map image and certification logos, which show Shopify's placeholders until they exist. A real demo video: the video section keeps Shopify's sample YouTube video.

**Concept source:** `~/Development/Raala-pitch/src/assets/raala/`. Read-only. Only the twelve photos listed in Task 1 leave it. Every other file there is a RaaLa asset or shows one: `hero-v4-*.png` show RaaLa bottles and boxes, and the rest are RaaLa product shots, logos, badges or screenshots.

## Global constraints

- Node 24 for every command: run `source ~/.nvm/nvm.sh && nvm use` in the repo first (reads `.nvmrc`). The shell defaults to Node 20, where `npm test` and `npm run check` fail.
- No new dependencies.
- No RaaLa assets, names or copy anywhere in the theme or in `demo/`. Demo copy makes no health claims and does not use the words "organic", "sugar free" or "low GI". It also avoids "pure natural", which is how RaaLa's producer describes its treacle.
- The brand name "Natural Treacle" appears only in `templates/*.json`, `sections/*-group.json`, section presets and `demo/`. Schema `default` values, locales, snippets and layout stay generic.
- Prices in the CSV are round illustrative numbers (multiples of 100), not RaaLa's prices.
- The existing browser checks depend on the store's test data and must keep passing unchanged: Kithul Treacle's 250 ml is on sale at 20% off, 375 ml is sold out, 1000 ml has 2 in stock, and each size has its own image. Plan 3's metafield content stays as it is, and Kithul Jaggery keeps no metafield content so the empty states stay testable.
- Every string a shopper sees and the theme supplies stays in `locales/en.default.json`. This plan adds none.
- No em dash character (U+2014) in any copy, comment, CSV cell or commit message.
- Comments explain why, never what.
- `npm run check` (Theme Check) must report no errors at the end of every task.
- The local dev server is `http://127.0.0.1:9292`, run with `npm run dev`. Browser checks run with `agent-browser --session theme open <url> && agent-browser --session theme eval --stdin < tests/browser/<file>`. Set the viewport with `agent-browser --session theme set viewport <w> <h>`.
- Commit messages end with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File map

```
demo/images/*.jpg                    the twelve demo photos
demo/products.csv                    the demo range in Shopify's product CSV format
tests/unit/demo.test.ts              photo list, CSV variant states, copy rules, image references
tests/browser/demo-check.js          the homepage renders the demo copy and photos
```

Modified: `.shopifyignore`, `templates/index.json`, `templates/product.json`, `sections/footer-group.json`, the presets in `sections/faq.liquid`, `sections/process-steps.liquid`, `sections/trust-strip.liquid` and `sections/certifications.liquid`, and `README.md`.

## Task 1: demo photos

**Files:**
- Create: `demo/images/*.jpg`, `tests/unit/demo.test.ts`
- Modify: `.shopifyignore`

**Interfaces:**
- Produces: `IMAGES` (the sorted file names below) and the `root`, `read` helpers in `tests/unit/demo.test.ts`, which Tasks 2 and 4 add tests to. A pushed commit that holds `demo/images/`, whose SHA Task 2 writes into the CSV.

The twelve photos are Neelaka's own AI-generated images. Each was checked at full size for a RaaLa bottle, label or logo before this plan was written; the bottle lids in `process-bottling.png` are plain.

| Source in the concept | Demo file |
|---|---|
| `process-tapping.png` | `process-tapping.jpg` |
| `process-collecting.png` | `process-collecting.jpg` |
| `process-bottling.png` | `process-bottling.jpg` |
| `giving-back.png` | `giving-back.jpg` |
| `pairing-tea-jaggery.png` | `pairing-tea-jaggery.jpg` |
| `pdp-curd-spoon.png` | `curd-spoon.jpg` |
| `serve-baking.jpeg` | `serve-baking.jpg` |
| `serve-hoppers.jpeg` | `serve-hoppers.jpg` |
| `use-baking.png` | `use-baking.jpg` |
| `use-curd.png` | `use-curd.jpg` |
| `use-hoppers.png` | `use-hoppers.jpg` |
| `use-tea.png` | `use-tea.jpg` |

- [ ] **Step 1: Write the failing unit test**

`tests/unit/demo.test.ts`:
```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

/** The photos checked for RaaLa bottles, labels and logos. Add a file here only after checking it the same way. */
const IMAGES = [
  'curd-spoon.jpg',
  'giving-back.jpg',
  'pairing-tea-jaggery.jpg',
  'process-bottling.jpg',
  'process-collecting.jpg',
  'process-tapping.jpg',
  'serve-baking.jpg',
  'serve-hoppers.jpg',
  'use-baking.jpg',
  'use-curd.jpg',
  'use-hoppers.jpg',
  'use-tea.jpg',
];

test('demo/images holds only the checked photos, small enough to commit', () => {
  const files = readdirSync(new URL('demo/images/', root)).filter((name) => !name.startsWith('.')).sort();
  assert.deepEqual(files, IMAGES);
  for (const name of files) {
    const size = statSync(new URL(`demo/images/${name}`, root)).size;
    assert.ok(size < 600_000, `${name} is ${size} bytes`);
  }
});
```

`read` is unused until Task 2. TypeScript's `noUnusedLocals` does not cover `tests/` (`npm run typecheck` checks `src/ts` only), so this is fine.

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL with `ENOENT` for `demo/images/`. The other unit tests still pass.

- [ ] **Step 3: Re-encode the photos**

`sips -Z` would upscale the 1024 px photos, so the photos are re-encoded at their own size. JPEG at quality 80 brings each one under 600 KB (about 4.2 MB in all).

```bash
mkdir -p demo/images
SRC=~/Development/Raala-pitch/src/assets/raala
for name in process-tapping process-collecting process-bottling giving-back pairing-tea-jaggery use-baking use-curd use-hoppers use-tea; do
  sips -s format jpeg -s formatOptions 80 "$SRC/$name.png" --out "demo/images/$name.jpg"
done
for name in serve-baking serve-hoppers; do
  sips -s format jpeg -s formatOptions 80 "$SRC/$name.jpeg" --out "demo/images/$name.jpg"
done
sips -s format jpeg -s formatOptions 80 "$SRC/pdp-curd-spoon.png" --out demo/images/curd-spoon.jpg
```

Open `demo/images/` in Finder and look at each photo once more. If any shows a bottle label, a box or a logo, stop and report it.

- [ ] **Step 4: Keep demo files out of theme uploads**

In `.shopifyignore`, add after `docs/**`:
```
demo/**
```

- [ ] **Step 5: Run the tests**

Run: `npm test && npm run check`
Expected: all unit tests pass, Theme Check reports no offenses.

- [ ] **Step 6: Commit and push**

The CSV in Task 2 points at this commit on GitHub, so the branch has to be on origin before the import in Task 3.

```bash
git add demo/images tests/unit/demo.test.ts .shopifyignore
git commit -m "Add the demo photos that show no RaaLa branding

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin plan-4
```

Check one URL: `curl -s -o /dev/null -w "%{http_code}\n" "https://raw.githubusercontent.com/Neelaka98/sapwood-shopify-theme/$(git log -1 --format=%H -- demo/images)/demo/images/use-tea.jpg"`
Expected: `200`.

## Task 2: product CSV

**Files:**
- Create: `demo/products.csv`
- Modify: `tests/unit/demo.test.ts`

**Interfaces:**
- Consumes: `IMAGES`, `root`, `read` from Task 1; the Task 1 commit SHA.
- Produces: `NOT_ALLOWED` and `assertCopy(text: string, where: string): void` in `tests/unit/demo.test.ts`, which Task 4 uses. Product handles `kithul-treacle`, `kithul-jaggery`, `kithul-flour`, `gift-box`.

The CSV uses Shopify's long-standing column names (`Handle`, `Body (HTML)`, `Variant Inventory Qty` and so on). The importer still accepts them, and they are the names most guides use. Only the columns this demo needs are included. Single-variant products use Shopify's `Title` / `Default Title` option. Rows with only a handle and an image add more images to that product.

- [ ] **Step 1: Write the failing tests**

Add to `tests/unit/demo.test.ts`:
```ts
/** Copy rules from the spec, plus the prompts the generic templates used, which must not survive into the demo. */
const NOT_ALLOWED = [
  /organic/i,
  /sugar[ -]?free/i,
  /\blow[ -]?GI\b/i,
  /pure natural/i,
  /raala/i,
  /\u2014/,
  /\bSay (what|how)\b/,
  /\bTell customers\b/,
  /\bName the place\b/,
  /\byour [a-z ]+ here\b/i,
];

function assertCopy(text: string, where: string) {
  for (const rule of NOT_ALLOWED) assert.ok(!rule.test(text), `${where} matches ${rule}`);
}

// shortcut: handles quoted fields and doubled quotes, which is all products.csv uses; switch to a CSV library if the file ever needs more.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function products() {
  const [header, ...rows] = parseCsv(read('demo/products.csv'));
  for (const row of rows) assert.equal(row.length, header.length, `A ${row[0]} row has ${row.length} cells, not ${header.length}`);
  return rows.map((row) => Object.fromEntries(header.map((name, i) => [name, row[i]])));
}

const treacleSizes = () =>
  Object.fromEntries(products().filter((row) => row.Handle === 'kithul-treacle' && row['Option1 Value']).map((row) => [row['Option1 Value'], row]));

test('the CSV holds the demo range from the spec', () => {
  assert.deepEqual(
    products().filter((row) => row.Title).map((row) => row.Handle),
    ['kithul-treacle', 'kithul-jaggery', 'kithul-flour', 'gift-box'],
  );
  assert.deepEqual(Object.keys(treacleSizes()), ['250 ml', '375 ml', '1000 ml']);
});

test('treacle keeps the variant states the browser checks rely on', () => {
  const sizes = treacleSizes();
  assert.equal(Number(sizes['250 ml']['Variant Price']) / Number(sizes['250 ml']['Variant Compare At Price']), 0.8, '250 ml is 20% off');
  assert.equal(sizes['375 ml']['Variant Inventory Qty'], '0', '375 ml is sold out');
  assert.equal(sizes['1000 ml']['Variant Inventory Qty'], '2', '1000 ml has 2 in stock');
  assert.equal(sizes['1000 ml']['Variant Compare At Price'], '', '1000 ml is not on sale');
  assert.equal(new Set(Object.values(sizes).map((row) => row['Variant Image'])).size, 3, 'Each size has its own image');
});

test('prices are round illustrative numbers', () => {
  for (const row of products().filter((row) => row['Variant Price'])) {
    assert.equal(Number(row['Variant Price']) % 100, 0, `${row.Handle} ${row['Option1 Value']} costs ${row['Variant Price']}`);
  }
});

test('every image URL is a demo photo at a fixed commit', () => {
  const pattern = /^https:\/\/raw\.githubusercontent\.com\/Neelaka98\/sapwood-shopify-theme\/[0-9a-f]{40}\/demo\/images\/(.+)$/;
  for (const row of products()) {
    for (const url of [row['Image Src'], row['Variant Image']].filter(Boolean)) {
      assert.ok(IMAGES.includes(url.match(pattern)?.[1] ?? ''), url);
    }
  }
});

test('demo product copy follows the copy rules', () => {
  assertCopy(read('demo/products.csv'), 'demo/products.csv');
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test`
Expected: the five new tests FAIL with `ENOENT` for `demo/products.csv`. The others pass.

- [ ] **Step 3: Write the CSV**

`demo/products.csv` (each row is one line; `IMAGES_COMMIT` is replaced in Step 4):
```csv
Handle,Title,Body (HTML),Vendor,Type,Tags,Published,Status,Option1 Name,Option1 Value,Variant SKU,Variant Grams,Variant Inventory Tracker,Variant Inventory Qty,Variant Inventory Policy,Variant Fulfillment Service,Variant Price,Variant Compare At Price,Variant Requires Shipping,Variant Taxable,Variant Weight Unit,Variant Image,Image Src,Image Position,Image Alt Text,Gift Card
kithul-treacle,Kithul Treacle,"<p>Kithul sap, cooked down over a wood fire until it is thick and dark. The only ingredient is the sap.</p><p>Pour it over curd or hoppers, stir it into tea, or bake with it in place of golden syrup.</p>",Natural Treacle,Treacle,"kithul, treacle",TRUE,active,Size,250 ml,NT-TR-250,450,shopify,50,deny,manual,1200,1500,TRUE,TRUE,g,https://raw.githubusercontent.com/Neelaka98/sapwood-shopify-theme/IMAGES_COMMIT/demo/images/curd-spoon.jpg,https://raw.githubusercontent.com/Neelaka98/sapwood-shopify-theme/IMAGES_COMMIT/demo/images/curd-spoon.jpg,1,Kithul treacle poured from a spoon over curd in a clay bowl,FALSE
kithul-treacle,,,,,,,,,375 ml,NT-TR-375,650,shopify,0,deny,manual,1600,,TRUE,TRUE,g,https://raw.githubusercontent.com/Neelaka98/sapwood-shopify-theme/IMAGES_COMMIT/demo/images/serve-hoppers.jpg,https://raw.githubusercontent.com/Neelaka98/sapwood-shopify-theme/IMAGES_COMMIT/demo/images/serve-hoppers.jpg,2,Three hoppers on a banana leaf with a small dish of treacle,
kithul-treacle,,,,,,,,,1000 ml,NT-TR-1000,1600,shopify,2,deny,manual,3600,,TRUE,TRUE,g,https://raw.githubusercontent.com/Neelaka98/sapwood-shopify-theme/IMAGES_COMMIT/demo/images/serve-baking.jpg,https://raw.githubusercontent.com/Neelaka98/sapwood-shopify-theme/IMAGES_COMMIT/demo/images/serve-baking.jpg,3,A slice of dark cake with treacle and a small jug of treacle behind it,
kithul-treacle,,,,,,,,,,,,,,,,,,,,,,https://raw.githubusercontent.com/Neelaka98/sapwood-shopify-theme/IMAGES_COMMIT/demo/images/use-curd.jpg,4,Curd in a clay bowl with treacle poured over it,
kithul-treacle,,,,,,,,,,,,,,,,,,,,,,https://raw.githubusercontent.com/Neelaka98/sapwood-shopify-theme/IMAGES_COMMIT/demo/images/use-hoppers.jpg,5,Two hoppers on a plate with a spoonful of treacle in one,
kithul-jaggery,Kithul Jaggery,"<p>Kithul treacle cooked further until it sets, then cut into cubes. Eat a piece with a cup of tea, or grate it into desserts.</p><p>250 g.</p>",Natural Treacle,Jaggery,"jaggery, kithul",TRUE,active,Title,Default Title,NT-JG-250,260,shopify,50,deny,manual,900,,TRUE,TRUE,g,,https://raw.githubusercontent.com/Neelaka98/sapwood-shopify-theme/IMAGES_COMMIT/demo/images/pairing-tea-jaggery.jpg,1,Cubes of kithul jaggery on a plate beside a cup of black tea,FALSE
kithul-jaggery,,,,,,,,,,,,,,,,,,,,,,https://raw.githubusercontent.com/Neelaka98/sapwood-shopify-theme/IMAGES_COMMIT/demo/images/use-tea.jpg,2,A cup of black tea with jaggery cubes on the saucer and the spoon,
kithul-flour,Kithul Flour,"<p>Flour from the pith of the kithul palm, dried and milled. Use it to make porridge, or to thicken sauces and desserts.</p><p>250 g.</p>",Natural Treacle,Flour,"flour, kithul",TRUE,active,Title,Default Title,NT-FL-250,260,shopify,40,deny,manual,800,,TRUE,TRUE,g,,,,,FALSE
gift-box,Gift Box,"<p>A 375 ml bottle of kithul treacle, a 250 g pack of jaggery and a 250 g pack of flour, in a card box.</p>",Natural Treacle,Gift box,"gift, kithul",TRUE,active,Title,Default Title,NT-GB-1,1500,shopify,20,deny,manual,4500,,TRUE,TRUE,g,,,,,FALSE
```

Each row has 26 cells. The unit test fails with the row's handle if one does not.

- [ ] **Step 4: Pin the image URLs to the photo commit**

A URL on a commit SHA keeps working after branches are renamed or deleted, which a branch URL would not.

```bash
sed -i '' "s/IMAGES_COMMIT/$(git log -1 --format=%H -- demo/images)/g" demo/products.csv
grep -c IMAGES_COMMIT demo/products.csv
```
Expected: `0`.

- [ ] **Step 5: Run the tests**

Run: `npm test && npm run check`
Expected: all unit tests pass, Theme Check reports no offenses.

- [ ] **Step 6: Commit**

```bash
git add demo/products.csv tests/unit/demo.test.ts
git commit -m "Add the Natural Treacle range as a product CSV

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 3: store import (done by Neelaka, not an agent)

This needs the store admin, so a person does it. Plans 1 to 3 set up Kithul Treacle, Kithul Jaggery, the Shop collection, the menus and the metafield content. This task replaces their images and copy and adds two products, without touching variant states or metafields.

- [ ] **Step 1:** Products > Kithul Treacle: delete every image. Do the same on Kithul Jaggery. The import adds the demo photos, and old images left behind would sit beside them.
- [ ] **Step 2:** Products > Import: choose `demo/products.csv`, tick "Overwrite products with matching handles", and import. Wait for the email or the banner saying it finished. If Shopify rejects a column name, download the sample CSV from the same dialog, rename the column in `demo/products.csv` to match, run `npm test`, commit, and import again.
- [ ] **Step 3:** Check Kithul Treacle in the admin: 250 ml at 1200 with compare-at 1500 and 50 in stock, 375 ml with 0, 1000 ml with 2, inventory tracked and "Continue selling when out of stock" off on all three, and each size showing its own image. Fix anything that differs by hand. Check that Kithul Flour and Gift Box exist with no images.
- [ ] **Step 4:** Content > Files > Upload files: upload all twelve files in `demo/images/`. Check that each keeps its exact name (for example `serve-hoppers.jpg`, not `serve-hoppers_1.jpg`). If Shopify renamed one because a file of that name already exists, delete the older file and upload again. The homepage template refers to these files by name.
- [ ] **Step 5:** Content > Metaobjects > Usage step: set the image of "Over yoghurt" to `use-curd.jpg`, and the image of "In tea" to nothing. Step 1 may have deleted the image it used before.
- [ ] **Step 6:** Products > Collections > Shop: add Kithul Flour and Gift Box, so it holds all four products.
- [ ] **Step 7:** Online Store > Navigation > Main menu: under Shop, add Kithul Flour and Gift Box after the two links already there.
- [ ] **Step 8:** Run `npm run dev`. On `http://127.0.0.1:9292/products/kithul-treacle` run `product-check.js`, `product-cart-check.js`, `product-blocks-check.js`, `pack-details-check.js` and `faq-product-check.js`. On `/products/kithul-jaggery` run `product-blocks-check.js`, `pack-details-check.js` and `faq-product-check.js`. Expected: each prints its `ok` line. Clear the cart afterwards. If `pack-details-check.js` fails on Kithul Treacle, the import recreated the variants: enter plan 3 Task 2 Step 6 again and rerun it.

## Task 4: homepage, footer and presets

**Files:**
- Create: `tests/browser/demo-check.js`
- Modify: `templates/index.json`, `templates/product.json`, `sections/footer-group.json`, `sections/faq.liquid`, `sections/process-steps.liquid`, `sections/trust-strip.liquid`, `sections/certifications.liquid`, `tests/unit/demo.test.ts`

**Interfaces:**
- Consumes: `IMAGES`, `root`, `read`, `assertCopy` from Tasks 1 and 2; the files in Content > Files and the four products from Task 3.
- Produces: the demo homepage that Task 5's checks and Lighthouse run against.

Schema `default` values stay generic, so a merchant who adds a hero, image with text or origin map section to a client store starts from prompts. The presets that already carry copy (FAQ, process steps, trust strip, certifications) get the demo copy, as the spec asks.

- [ ] **Step 1: Write the failing unit tests**

Add to `tests/unit/demo.test.ts`:
```ts
type Schema = { presets?: unknown[] } & Record<string, unknown>;

const SCHEMA = /{% schema %}([\s\S]*?){% endschema %}/;
const sectionFiles = () => readdirSync(new URL('sections/', root)).filter((name) => name.endsWith('.liquid'));
const schemaOf = (source: string): Schema | undefined => {
  const match = source.match(SCHEMA);
  return match ? JSON.parse(match[1]) : undefined;
};

/** Everything a merchant sees as demo content: the JSON templates, the section groups and the section presets. */
function demoContent(): Map<string, string> {
  const content = new Map<string, string>();
  for (const name of readdirSync(new URL('templates/', root)).filter((name) => name.endsWith('.json'))) {
    content.set(`templates/${name}`, read(`templates/${name}`));
  }
  for (const name of readdirSync(new URL('sections/', root)).filter((name) => name.endsWith('.json'))) {
    content.set(`sections/${name}`, read(`sections/${name}`));
  }
  for (const name of sectionFiles()) {
    const presets = schemaOf(read(`sections/${name}`))?.presets;
    if (presets) content.set(`sections/${name} presets`, JSON.stringify(presets));
  }
  return content;
}

test('templates, section groups and presets follow the copy rules', () => {
  for (const [where, text] of demoContent()) assertCopy(text, where);
});

test('the brand name lives only in templates, section groups and presets', () => {
  for (const dir of ['layout', 'locales', 'snippets', 'config']) {
    for (const name of readdirSync(new URL(`${dir}/`, root))) {
      assert.ok(!read(`${dir}/${name}`).includes('Natural Treacle'), `${dir}/${name} names the demo brand`);
    }
  }
  for (const name of sectionFiles()) {
    const source = read(`sections/${name}`);
    const schema = schemaOf(source);
    const outsidePresets = source.replace(SCHEMA, '') + JSON.stringify({ ...schema, presets: undefined });
    assert.ok(!outsidePresets.includes('Natural Treacle'), `sections/${name} names the demo brand outside its presets`);
  }
});

test('every store file a template uses is a demo photo', () => {
  const used = [...[...demoContent().values()].join('\n').matchAll(/shopify:\/\/shop_images\/([^"]+)/g)].map((match) => match[1]);
  assert.ok(used.length >= 6, 'The homepage uses the demo photos');
  for (const name of used) assert.ok(IMAGES.includes(name), `${name} is not in demo/images`);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test`
Expected: FAIL. The copy rules test names `templates/index.json` matching `/\bSay (what|how)\b/`, and the store file test fails with "The homepage uses the demo photos". The brand name test passes already.

- [ ] **Step 3: Write the browser check**

`tests/browser/demo-check.js`:
```js
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  // SplitText wraps heading lines in elements, which can leave extra whitespace in textContent.
  const text = (el) => el?.textContent.replace(/\s+/g, ' ').trim();
  assert(text(document.querySelector('h1')) === 'Kithul treacle, tapped and cooked by hand', 'The hero heading is the demo copy');
  assert(document.querySelector('[data-hero] img'), 'The hero shows its photo');
  assert(document.querySelector('[data-image-with-text] img'), 'The story section shows its photo');
  const photos = [...document.querySelectorAll('[data-process-photo]')];
  assert(photos.length === 4 && photos.filter((photo) => photo.querySelector('img')).length === 3, 'Three of the four process steps have a photo');
  assert(document.querySelectorAll('[data-product-grid] .product-card').length === 4, 'The grid shows the four demo products');
  assert(text(document.querySelector('footer')).includes('Natural Treacle'), 'The footer names the brand');
  assert(!/\b(Say (what|how)|Tell customers|Name the place)\b/.test(document.body.textContent), 'No template prompt is left on the page');
  return 'demo ok';
})();
```

Run: `agent-browser --session theme open http://127.0.0.1:9292/ && agent-browser --session theme eval --stdin < tests/browser/demo-check.js`
Expected: FAIL with "The hero heading is the demo copy".

- [ ] **Step 4: Write the homepage template**

Replace `templates/index.json` with:
```json
{
  "sections": {
    "hero": {
      "type": "hero",
      "settings": {
        "image": "shopify://shop_images/serve-hoppers.jpg",
        "heading": "Kithul treacle, tapped and cooked by hand",
        "text": "From palms in the hills above Kandy, for hoppers, curd, tea and cake.",
        "button_label_1": "Shop the range",
        "button_link_1": "shopify://collections/shop",
        "button_label_2": "Buy for your business",
        "button_link_2": "shopify://pages/contact",
        "color_scheme": "light"
      }
    },
    "image_with_text": {
      "type": "image-with-text",
      "settings": {
        "image": "shopify://shop_images/giving-back.jpg",
        "image_position": "left",
        "heading": "Who makes it",
        "text": "<p>Natural Treacle is six tappers and cooks from one village. Most of them have climbed kithul palms since they were young. Each tapper is paid for every litre of sap brought in, the same day.</p>",
        "color_scheme": "light"
      }
    },
    "origin_map": {
      "type": "origin-map",
      "settings": {
        "heading": "Where it comes from",
        "text": "<p>The palms grow wild on the edges of tea estates and forest in the hills above Kandy, in central Sri Lanka. Nobody plants them. We tap the ones the landowners let us climb.</p>",
        "pin_x": 40,
        "pin_y": 70,
        "pin_label": "Our palms",
        "color_scheme": "light"
      }
    },
    "process_steps": {
      "type": "process-steps",
      "blocks": {
        "step_1": { "type": "step", "settings": { "image": "shopify://shop_images/process-tapping.jpg", "label": "Every day", "heading": "Tapping", "text": "A tapper climbs the palm, slices the tip of the flower stalk and ties a clay pot under the cut." } },
        "step_2": { "type": "step", "settings": { "image": "shopify://shop_images/process-collecting.jpg", "label": "Within hours", "heading": "Collecting", "text": "The sap drips into the pot. It is brought down and carried to the kitchen before it can turn sour." } },
        "step_3": { "type": "step", "settings": { "label": "Over a wood fire", "heading": "Cooking", "text": "The sap is boiled in a wide open pan for several hours and stirred until it is thick and dark." } },
        "step_4": { "type": "step", "settings": { "image": "shopify://shop_images/process-bottling.jpg", "label": "The same day", "heading": "Bottling", "text": "The treacle is poured through a funnel into glass bottles while it is still warm.", "link_label": "See the range", "link": "shopify://collections/shop" } }
      },
      "block_order": ["step_1", "step_2", "step_3", "step_4"],
      "settings": { "heading": "From palm to bottle", "color_scheme": "dark" }
    },
    "featured_product": {
      "type": "featured-product",
      "settings": { "heading": "Kithul treacle in three sizes", "product": "kithul-treacle", "max_quantity": 20, "color_scheme": "band" }
    },
    "trust_strip": {
      "type": "trust-strip",
      "blocks": {
        "item_1": { "type": "item", "settings": { "text": "Tapped and cooked by hand" } },
        "item_2": { "type": "item", "settings": { "text": "Ships worldwide" } },
        "item_3": { "type": "item", "settings": { "text": "Trade prices on request" } }
      },
      "block_order": ["item_1", "item_2", "item_3"],
      "settings": { "color_scheme": "band" }
    },
    "certifications": {
      "type": "certifications",
      "blocks": {
        "cert_1": { "type": "certification", "settings": { "title": "Food safety inspection", "text": "The district public health office inspects our kitchen every year." } },
        "cert_2": { "type": "certification", "settings": { "title": "Export registration", "text": "We are registered to send food out of Sri Lanka, so trade orders clear customs." } }
      },
      "block_order": ["cert_1", "cert_2"],
      "settings": {
        "heading": "Quality and certifications",
        "text": "<p>The checks our kitchen goes through.</p>",
        "color_scheme": "light"
      }
    },
    "video": {
      "type": "video",
      "settings": {
        "heading": "See how it is made",
        "video_url": "https://www.youtube.com/watch?v=_9VUPq3SxOc",
        "color_scheme": "light"
      }
    },
    "faq": {
      "type": "faq",
      "blocks": {
        "question_1": { "type": "question", "settings": { "question": "How long does delivery take?", "answer": "<p>Orders in Sri Lanka arrive in two to four days. Orders to other countries take one to three weeks.</p>" } },
        "question_2": { "type": "question", "settings": { "question": "How should I store it?", "answer": "<p>Keep the bottle closed in a cool cupboard. It does not need the fridge, before or after opening.</p>" } },
        "question_3": { "type": "question", "settings": { "question": "Do you sell to shops and restaurants?", "answer": "<p>Yes. Use the trade form below and we will reply with prices.</p>" } }
      },
      "block_order": ["question_1", "question_2", "question_3"],
      "settings": { "heading": "Questions", "color_scheme": "light" }
    },
    "wholesale": {
      "type": "contact-form",
      "settings": {
        "heading": "Wholesale and trade",
        "text": "<p>For shops, restaurants and importers. Tell us what you need and we will reply with prices and pack options.</p>",
        "trade_fields": true,
        "color_scheme": "light"
      }
    },
    "product_grid": {
      "type": "product-grid",
      "settings": {
        "heading": "The range",
        "text": "<p>Treacle, jaggery and flour, all from the kithul palm, and a box with one of each.</p>",
        "collection": "shop",
        "products_to_show": 4,
        "image_fit": "cover",
        "color_scheme": "light"
      }
    }
  },
  "order": [
    "hero",
    "trust_strip",
    "featured_product",
    "product_grid",
    "image_with_text",
    "origin_map",
    "process_steps",
    "certifications",
    "video",
    "faq",
    "wholesale"
  ]
}
```

The video section is unchanged: it keeps Shopify's sample video until a real one exists. `image_fit` is `cover` because the demo photos are scenes, not cut-out packs on white.

- [ ] **Step 5: Point the product page trade link at the contact page**

In `templates/product.json`, change the trade block's `"url": ""` to:
```json
            "url": "shopify://pages/contact"
```

- [ ] **Step 6: Add an About column to the footer**

Replace `sections/footer-group.json` with:
```json
{
  "type": "footer",
  "name": "Footer",
  "sections": {
    "footer": {
      "type": "footer",
      "blocks": {
        "menu": { "type": "menu", "settings": { "heading": "Shop", "menu": "footer" } },
        "about": {
          "type": "text",
          "settings": {
            "heading": "About",
            "text": "<p>Natural Treacle makes kithul treacle, jaggery and flour by hand in the hills above Kandy, Sri Lanka.</p>"
          }
        }
      },
      "block_order": ["menu", "about"],
      "settings": { "color_scheme": "dark" }
    }
  },
  "order": ["footer"]
}
```

- [ ] **Step 7: Put the demo copy in the presets**

In `sections/faq.liquid`, replace the two preset blocks:
```json
        { "type": "question", "settings": { "question": "How long does delivery take?", "answer": "<p>Say how long orders take to reach each place you ship to.</p>" } },
        { "type": "question", "settings": { "question": "How should I store it?", "answer": "<p>Say how to store it before and after opening.</p>" } }
```
with:
```json
        { "type": "question", "settings": { "question": "How long does delivery take?", "answer": "<p>Orders in Sri Lanka arrive in two to four days. Orders to other countries take one to three weeks.</p>" } },
        { "type": "question", "settings": { "question": "How should I store it?", "answer": "<p>Keep the bottle closed in a cool cupboard. It does not need the fridge, before or after opening.</p>" } }
```

In `sections/process-steps.liquid`, replace the four preset blocks:
```json
        { "type": "step", "settings": { "label": "By hand", "heading": "Picking" } },
        { "type": "step", "settings": { "label": "The same day", "heading": "Preparing" } },
        { "type": "step", "settings": { "label": "Over a slow fire", "heading": "Cooking" } },
        { "type": "step", "settings": { "label": "Ready for your table", "heading": "Packing" } }
```
with:
```json
        { "type": "step", "settings": { "label": "Every day", "heading": "Tapping", "text": "A tapper climbs the palm, slices the tip of the flower stalk and ties a clay pot under the cut." } },
        { "type": "step", "settings": { "label": "Within hours", "heading": "Collecting", "text": "The sap drips into the pot. It is brought down and carried to the kitchen before it can turn sour." } },
        { "type": "step", "settings": { "label": "Over a wood fire", "heading": "Cooking", "text": "The sap is boiled in a wide open pan for several hours and stirred until it is thick and dark." } },
        { "type": "step", "settings": { "label": "The same day", "heading": "Bottling", "text": "The treacle is poured through a funnel into glass bottles while it is still warm." } }
```

In `sections/trust-strip.liquid`, replace the first preset block:
```json
        { "type": "item", "settings": { "text": "Packed by hand" } },
```
with:
```json
        { "type": "item", "settings": { "text": "Tapped and cooked by hand" } },
```

In `sections/certifications.liquid`, replace:
```json
      "blocks": [{ "type": "certification" }, { "type": "certification" }]
```
with:
```json
      "blocks": [
        { "type": "certification", "settings": { "title": "Food safety inspection", "text": "The district public health office inspects our kitchen every year." } },
        { "type": "certification", "settings": { "title": "Export registration", "text": "We are registered to send food out of Sri Lanka, so trade orders clear customs." } }
      ]
```

- [ ] **Step 8: Run the checks**

Run: `npm test && npm run check`
Expected: all unit tests pass, Theme Check reports no offenses.

At 1440 by 900 on `http://127.0.0.1:9292/`, after `agent-browser --session theme wait 'html[data-motion]'`, run `demo-check.js`.
Expected: `demo ok`. If "The hero shows its photo" fails, the file in Content > Files is missing or was renamed (Task 3 Step 4).

Take a screenshot of the homepage at 1440 by 900 and at 390 by 844 (`agent-browser --session theme screenshot`) and look at them. Expected: the hero, story and three process steps show photos; the cooking step, the origin map, Kithul Flour and Gift Box show Shopify's placeholder drawings.

- [ ] **Step 9: Commit**

```bash
git add templates/index.json templates/product.json sections/footer-group.json sections/faq.liquid sections/process-steps.liquid sections/trust-strip.liquid sections/certifications.liquid tests/unit/demo.test.ts tests/browser/demo-check.js
git commit -m "Fill the homepage, footer and presets with the Natural Treacle demo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

## Task 5: full checks and README

**Files:**
- Modify: `README.md`
- Modify: any file a failing check below points to

- [ ] **Step 1: Run every check**

Run: `npm run build && npm run typecheck && npm test && npm run check && git status --porcelain`
Expected: no errors, all unit tests pass, and `git status` prints nothing (the build output is unchanged, since this plan touches no source).

At 1440 by 900 on `http://127.0.0.1:9292/`, after `wait 'html[data-motion]'`, run in turn: `theme-base-check.js`, `header-check.js`, `footer-check.js`, `hero-check.js`, `story-check.js`, `motion-check.js`, `process-stage-check.js`, `product-grid-check.js`, `trust-check.js`, `faq-check.js`, `contact-form-check.js`, `featured-product-check.js`, `demo-check.js`, then `video-check.js` last (it replaces the cover). Then at 390 by 844, reload and run `process-check.js`.

On `/products/kithul-treacle` run `product-check.js`, `product-cart-check.js`, `product-blocks-check.js`, `pack-details-check.js`, `faq-product-check.js`, `reviews-check.js`. On `/products/kithul-jaggery` run `product-blocks-check.js`, `pack-details-check.js`, `faq-product-check.js`. On `/collections/all` run `browse-check.js`.

Expected: each prints its `ok` line. Clear the cart afterwards. A plan 1 to 3 check that fails here points at the store data or the templates, not at the check: compare against the Global constraints and fix the data.

- [ ] **Step 2: Lighthouse on mobile**

Run plan 1 Task 8 Step 1's Lighthouse loop unchanged (home, `products/kithul-treacle`, `collections/all`), then move the three JSON files it wrote into `.lighthouse/plan4/`, as plans 2 and 3 did.
Expected: average performance at least 60 and average accessibility at least 90 across the three. The homepage now loads real photos where plan 3 had placeholders, so compare `home.json` with `.lighthouse/plan3/home.json` and report the largest contentful paint of each. If the bar is missed, the hero image's `fetchpriority` and `sizes` are the first place to look. Do not lower the bar.

- [ ] **Step 3: Update the README**

In `README.md`, add before `## Tests`:
````markdown
## Demo content

The demo brand is Natural Treacle, a made-up kithul producer. Its copy is in `templates/index.json`, `sections/footer-group.json`, and the presets of the FAQ, process steps, trust strip and certifications sections, so adding one of those sections starts from demo copy. Other sections start from the generic prompts in their schema defaults.

To set up the demo on a development store:

1. Run `node scripts/create-metafields.mjs` (see Scripts).
2. Products > Import `demo/products.csv`. Its image URLs point at `demo/images/` on GitHub at a fixed commit.
3. Content > Files: upload everything in `demo/images/`, keeping the file names. The homepage template refers to them by name.
4. Add a collection with the handle `shop` holding the four products, and a page with the handle `contact` on the `contact` template.
5. Enter the metafield content below on Kithul Treacle. Kithul Jaggery has none on purpose, so the browser checks can test the empty states.

| Where | Content |
|---|---|
| Nutrition table | Basis `Per 100 g`; rows `Energy` / `1170 kJ`, `Carbohydrate` / `70 g`, `of which sugars` / `62 g` |
| FAQ items | `Does it need to be kept in the fridge?` / `No. Keep it closed in a cool cupboard.`; `Can it crystallise?` / `Sometimes, in the cold. Stand the jar in warm water.` |
| Usage steps | `Over yoghurt` / `Pour a spoonful over plain yoghurt.` with `use-curd.jpg`; `In tea` / `Stir a spoonful into black tea.` with no image |
| Carton | 24 units, 11.5 kg gross, 9.6 kg net, 300 × 200 × 180 mm |
| Kithul Treacle | Shelf life 24; the nutrition table, both FAQ items and both usage steps |
| 250 ml | Closure `Screw cap`, gross weight 0.45, the carton |
| 1000 ml | Closure `Screw cap`, gross weight 1.6 |

The photos are Neelaka's own AI-generated images, each checked for a RaaLa bottle, label or logo. `tests/unit/demo.test.ts` fails if any other file lands in `demo/images/`. Kithul Flour, Gift Box, the cooking step, the origin map and the certifications have no photo yet and show Shopify's placeholders. The video section uses Shopify's sample video.

Prices are round illustrative numbers. No real seller used the name Natural Treacle in a web search on 2026-10-21; search again before showing the demo publicly.
````

- [ ] **Step 4: Commit**

```bash
git add README.md
git add -u
git commit -m "Document the demo content and how to set it up

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

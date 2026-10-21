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

/** Copy rules from the spec, plus the prompts the generic templates used, which must not survive into the demo. */
const NOT_ALLOWED = [
  /organic/i,
  /sugar[ -]?free/i,
  /\blow[ -]?GI\b/i,
  /pure natural/i,
  /raala/i,
  /—/,
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

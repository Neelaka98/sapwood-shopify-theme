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

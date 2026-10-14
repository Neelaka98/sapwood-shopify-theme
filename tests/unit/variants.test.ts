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

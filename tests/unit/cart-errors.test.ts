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

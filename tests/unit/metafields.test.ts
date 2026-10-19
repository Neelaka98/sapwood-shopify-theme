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

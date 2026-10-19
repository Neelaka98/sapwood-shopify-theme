// Creates the metaobject and metafield definitions that Sapwood's product blocks and FAQ section read. Definitions
// that already exist are left as they are, so running it again is safe.
//
//   SHOPIFY_FLAG_STORE=example.myshopify.com SHOPIFY_ADMIN_TOKEN=shpat_... node scripts/create-metafields.mjs

import { fileURLToPath } from 'node:url';

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

// import.meta.main only exists from Node 24.2; without it an older Node would exit 0 having created nothing.
if (process.argv[1] === fileURLToPath(import.meta.url)) await main();

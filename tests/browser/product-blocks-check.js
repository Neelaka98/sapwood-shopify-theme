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

(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const grid = document.querySelector('[data-product-grid]');
  assert(grid, 'Product grid renders');
  const heading = grid.querySelector('h2');
  assert(heading, 'The grid has a section heading');
  const cards = [...grid.querySelectorAll('.product-card')];
  const limit = Number(grid.dataset.limit);
  assert(cards.length >= 2 && cards.length <= limit, `The grid shows between 2 and ${limit} cards`);
  assert(cards.every((card) => card.querySelector('h3 a[href*="/products/"]')), 'Each card title is an h3 link under the h2');
  return 'product grid ok';
})();

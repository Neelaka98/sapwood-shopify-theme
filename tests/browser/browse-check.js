(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const cards = [...document.querySelectorAll('.product-card')];
  assert(cards.length >= 2, 'Cards render for the test products');
  const treacle = cards.find((card) => card.textContent.includes('Kithul Treacle'));
  assert(treacle, 'Treacle card renders');
  assert(treacle.querySelector('a').getAttribute('href').includes('/products/kithul-treacle'), 'Card links to the product');
  assert(treacle.textContent.includes('From'), 'A product with different variant prices shows a From price');
  assert(treacle.querySelector('h3 a'), 'The card title is the link, so the card has one accessible name');
  return 'browse ok';
})();

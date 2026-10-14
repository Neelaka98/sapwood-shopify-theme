(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const root = getComputedStyle(document.documentElement);
  const value = (name) => root.getPropertyValue(name).trim().toLowerCase();
  assert(value('--scheme-ground') === '#ffffff', 'Light scheme sets the page ground');
  assert(value('--scheme-ink') === '#590303', 'Light scheme sets the ink colour');
  assert(value('--scheme-heading') === '#8c1a0f', 'Light scheme sets the heading colour');
  assert(value('--font-body-family') !== '', 'Body font family is set from settings');
  assert(document.querySelector('link[href*="theme.css"]'), 'theme.css is linked');
  const data = JSON.parse(document.getElementById('theme-data').textContent);
  assert(data.routes.cartAdd.endsWith('/cart/add.js'), 'Theme data carries the cart add route');
  assert(data.strings.addToCart === 'Add to cart', 'Theme data carries translated strings');
  assert(document.querySelector('a.skip-link[href="#MainContent"]'), 'Skip link is first');
  return 'theme base ok';
})();

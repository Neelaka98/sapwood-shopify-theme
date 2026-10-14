(async () => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
  const escape = () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  const header = document.querySelector('[data-header]');
  assert(header, 'Header renders');
  assert(header.querySelector('a[data-cart-open]')?.getAttribute('href').endsWith('/cart'), 'Cart button links to the cart page');

  const searchButton = header.querySelector('[aria-controls="HeaderSearch"]');
  searchButton.click();
  await frame();
  assert(!document.getElementById('HeaderSearch').hidden, 'Search opens');
  assert(document.activeElement?.id === 'HeaderSearchInput', 'Search input takes focus');
  escape();
  assert(document.getElementById('HeaderSearch').hidden, 'Escape closes search');
  assert(document.activeElement === searchButton, 'Focus returns to the search button');

  if (matchMedia('(min-width: 64rem)').matches) {
    const submenuButton = header.querySelector('nav [data-disclosure]');
    assert(submenuButton, 'Menu link with children renders as a disclosure');
    submenuButton.click();
    assert(!document.getElementById(submenuButton.getAttribute('aria-controls')).hidden, 'Submenu opens');
    document.body.click();
    assert(document.getElementById(submenuButton.getAttribute('aria-controls')).hidden, 'Click outside closes submenu');
    return 'header desktop ok';
  }

  const toggle = header.querySelector('[data-menu-toggle]');
  toggle.click();
  await frame();
  assert(header.querySelector('[data-menu]').hasAttribute('data-open'), 'Menu opens');
  assert(header.querySelector('[data-menu]').contains(document.activeElement), 'Focus moves into the menu');
  escape();
  assert(!header.querySelector('[data-menu]').hasAttribute('data-open'), 'Escape closes the menu');
  assert(document.activeElement === toggle, 'Focus returns to the menu button');
  const form = header.querySelector('.localization-form');
  assert(form && !form.querySelector('[data-localization-submit]').hidden, 'Localization keeps its Update button, so arrow keys never reload the page');
  return 'header mobile ok';
})();

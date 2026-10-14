(async () => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const waitFor = async (test, message) => {
    const deadline = performance.now() + 8000;
    while (!test()) {
      if (performance.now() > deadline) throw Error(message);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };
  // A getter, because a cart update replaces the section's innerHTML and detaches any element held from before it.
  const getPage = () => document.querySelector('[data-cart-section]:not([data-item-count][data-cart-label-text])');
  assert(getPage(), 'Cart page section renders');
  const quantity = () => getPage().querySelector('[role="group"] .tabular')?.textContent.trim();
  assert(quantity() === '1', 'Cart page starts with quantity 1');
  const increase = getPage().querySelector('a[data-focus-id^="inc-"]');
  assert(increase.getAttribute('href').includes('quantity=2'), 'Increase works as a plain link without JavaScript');
  // A scripted click does not move focus the way a real one does, so put it there first.
  increase.focus();
  increase.click();
  await waitFor(() => quantity() === '2', 'Quantity becomes 2 in place');
  assert(location.pathname.endsWith('/cart'), 'The page did not navigate');
  assert(document.activeElement?.dataset.focusId?.startsWith('inc-'), 'Focus stays on the increase control');
  assert(document.querySelector('[data-cart-count]').textContent.trim() === '2', 'Header count follows');
  getPage().querySelector('a[data-focus-id^="remove-"]').click();
  await waitFor(() => !getPage().querySelector('[data-cart-line]'), 'Removing the line empties the cart');
  assert(document.querySelector('[data-cart-count]').hidden, 'Header count hides when the cart is empty');
  return 'cart page ok';
})();

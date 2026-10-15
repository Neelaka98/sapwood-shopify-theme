(async () => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const waitFor = async (test, message) => {
    const deadline = performance.now() + 8000;
    while (!test()) {
      if (performance.now() > deadline) throw Error(message);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };
  const root = document.querySelector('[data-featured-product]');
  assert(root, 'Featured product renders');
  assert(root.matches('[data-product-root]'), 'It reuses the product script');
  assert(!root.hasAttribute('data-updates-url'), 'It does not write ?variant= into the homepage address');
  const form = root.querySelector('form[data-product-form]');
  assert(form.getAttribute('action').endsWith('/cart/add'), 'Add to cart is a real form for no-JS buying');
  assert(form.querySelector('[data-quantity-input]').max === '20', 'Quantity goes up to 20');
  assert(root.querySelector('a[href*="/products/"]'), 'It links to the product page');

  const variants = JSON.parse(root.querySelector('[data-product-variants]').textContent);
  const soldOut = variants.find((v) => !v.available);
  const onSale = variants.find((v) => v.available && v.compareHtml !== null);
  const radios = [...root.querySelectorAll('[data-variant-picker] input')];
  const pick = (v) => {
    const target = radios.find((i) => i.value === v.options[0]);
    if (target.checked) radios.find((i) => i !== target).click();
    target.click();
  };
  const before = location.href;
  pick(soldOut);
  assert(root.querySelector('[data-add-button]').disabled, 'A sold out size disables add to cart');
  assert(location.href === before, 'Choosing a size leaves the address alone');
  pick(onSale);
  assert(!root.querySelector('[data-price-was]').hidden, 'A size on sale shows its old price');

  const drawer = document.querySelector('[data-cart-drawer]');
  form.requestSubmit();
  await waitFor(() => drawer.open, 'Adding opens the cart drawer');
  await waitFor(() => drawer.textContent.includes(onSale.options[0]), 'The drawer lists the chosen size');
  drawer.close();
  return 'featured product ok';
})();

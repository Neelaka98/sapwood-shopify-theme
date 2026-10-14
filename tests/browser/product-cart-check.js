(async () => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const waitFor = async (test, message) => {
    const deadline = performance.now() + 8000;
    while (!test()) {
      if (performance.now() > deadline) throw Error(message);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };
  const root = document.querySelector('[data-product-root]');
  const form = root.querySelector('[data-product-form]');
  const drawer = document.querySelector('[data-cart-drawer]');
  const variants = JSON.parse(root.querySelector('[data-product-variants]').textContent);
  // Picked by property so the check survives renaming the store's sizes.
  const onSale = variants.find((v) => v.compareHtml !== null && v.available);
  const lowStock = variants.find((v) => v.available && v.compareHtml === null);
  const radios = [...root.querySelectorAll('[data-variant-picker] input')];
  // Clicking the radio that is already checked fires no change event, so move off it first.
  const pick = (v) => {
    const target = radios.find((i) => i.value === v.options[0]);
    if (target.checked) radios.find((i) => i !== target).click();
    target.click();
  };

  pick(lowStock);
  form.querySelector('[data-quantity-input]').value = '3';
  form.requestSubmit();
  const error = form.querySelector('[data-cart-error]');
  await waitFor(() => error.textContent.trim() !== '', 'Stock limit error appears');
  assert(!drawer.open, 'The drawer stays shut when Shopify refuses the add');

  pick(onSale);
  form.querySelector('[data-quantity-input]').value = '2';
  form.requestSubmit();
  await waitFor(() => drawer.open, 'Adding opens the drawer');
  await waitFor(() => drawer.querySelector('[data-cart-key]'), 'The drawer lists the line');
  assert(error.textContent.trim() === '', 'A successful add clears the old error');
  assert(drawer.textContent.includes(onSale.options[0]), 'The drawer line names the variant');
  assert(drawer.querySelector('[role="group"] .tabular').textContent.trim() === '2', 'The drawer line has quantity 2');
  assert(document.querySelector('[data-cart-count]').textContent.trim() === '2', 'Header count is 2');
  return 'product cart ok';
})();

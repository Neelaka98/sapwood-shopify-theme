(async () => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const root = document.querySelector('[data-product-root]');
  assert(root, 'Product section renders');
  const variants = JSON.parse(root.querySelector('[data-product-variants]').textContent);
  // Picked by property so the check survives renaming the store's sizes.
  const onSale = variants.find((v) => v.compareHtml !== null && v.available);
  const soldOut = variants.find((v) => !v.available);
  const lowStock = variants.find((v) => v.available && v.compareHtml === null);
  assert(onSale && soldOut && lowStock, 'The product has an on-sale, a sold-out and a regular variant');
  const radios = [...root.querySelectorAll('[data-variant-picker] input')];
  // Clicking the radio that is already checked fires no change event, so move off it first.
  const pick = (v) => {
    const target = radios.find((i) => i.value === v.options[0]);
    if (target.checked) radios.find((i) => i !== target).click();
    target.click();
  };
  const idInput = root.querySelector('[data-variant-id]');
  const button = root.querySelector('[data-add-button]');
  const label = () => root.querySelector('[data-add-label]').textContent.trim();

  assert(!idInput.disabled, 'JavaScript enables the variant id input');

  pick(onSale);
  assert(idInput.value === String(onSale.id), 'On-sale variant sets the variant id');
  assert(new URL(location.href).searchParams.get('variant') === String(onSale.id), 'On-sale variant is in the URL');
  assert(!root.querySelector('[data-price-was]').hidden, 'On-sale variant shows its compare-at price');
  assert(!root.querySelector('[data-sale-stamp]').hidden, 'On-sale variant shows the sale stamp');
  assert(root.querySelector('[data-sale-percent]').textContent.trim() === '20', 'On-sale variant stamp shows 20% off');
  assert(root.querySelector(`[data-gallery-slide="${onSale.mediaId}"]`).hidden === false, 'On-sale variant shows its image');

  pick(soldOut);
  assert(button.disabled, 'Sold-out variant disables add to cart');
  assert(label() === 'Sold out', 'Sold-out label shows');
  assert(root.querySelector('[data-price-was]').hidden, 'Sold-out variant has no compare-at price');
  assert(root.querySelector('[data-sale-stamp]').hidden, 'Sold-out variant has no sale stamp');

  pick(lowStock);
  assert(!button.disabled && label() === 'Add to cart', 'Regular variant can be bought');
  assert(root.querySelector('[data-price-current]').innerHTML === lowStock.priceHtml, 'Regular variant price shows');

  const quantity = root.querySelector('[data-quantity-input]');
  root.querySelector('[data-quantity-step="1"]').click();
  assert(quantity.value === '2', 'Plus raises quantity');
  quantity.value = '500';
  quantity.dispatchEvent(new Event('change', { bubbles: true }));
  assert(quantity.value === quantity.max, 'Typed quantity is clamped to the maximum');
  quantity.value = '1';

  const thumbs = [...root.querySelectorAll('[data-gallery-thumb]')];
  thumbs[1].focus();
  thumbs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert(document.activeElement === thumbs[2], 'Arrow keys move along the thumbnails');
  assert(thumbs[2].getAttribute('aria-current') === 'true', 'Arrow keys change the image');

  const section = root.closest('.shopify-section');
  section.dispatchEvent(new CustomEvent('shopify:section:unload', { bubbles: true }));
  section.innerHTML = section.innerHTML;
  section.querySelector('[data-variant-id]').setAttribute('disabled', '');
  section.dispatchEvent(new CustomEvent('shopify:section:load', { bubbles: true }));
  assert(!section.querySelector('[data-variant-id]').disabled, 'A section reloaded by the theme editor runs its script again');
  return 'product ok';
})();

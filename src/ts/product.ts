import { initGallery } from './gallery.ts';
import { registerSection } from './sections.ts';
import { themeData } from './theme-data.ts';
import { clampQuantity, findVariant, type VariantData } from './variants.ts';

function renderPrice(root: HTMLElement, variant: VariantData) {
  const current = root.querySelector('[data-price-current]');
  if (current) current.innerHTML = variant.priceHtml;
  const was = root.querySelector<HTMLElement>('[data-price-was]');
  if (was) was.hidden = variant.compareHtml === null;
  const compare = root.querySelector('[data-price-compare]');
  if (compare && variant.compareHtml) compare.innerHTML = variant.compareHtml;
  const stamp = root.querySelector<HTMLElement>('[data-sale-stamp]');
  if (stamp) stamp.hidden = variant.percentOff === null;
  const percent = root.querySelector('[data-sale-percent]');
  if (percent && variant.percentOff !== null) percent.textContent = String(variant.percentOff);
}

registerSection('[data-product-root]', (root, signal) => {
  const variants = JSON.parse(root.querySelector('[data-product-variants]')?.textContent ?? '[]') as VariantData[];
  const form = root.querySelector<HTMLFormElement>('[data-product-form]');
  const idInput = form?.querySelector<HTMLInputElement>('[data-variant-id]');
  const button = form?.querySelector<HTMLButtonElement>('[data-add-button]');
  const label = form?.querySelector<HTMLElement>('[data-add-label]');
  const radios = [...root.querySelectorAll<HTMLInputElement>('[data-variant-picker] input[type="radio"]')];
  const showMedia = initGallery(root, signal);

  // Disabled in the markup so the noscript select alone sends the variant when JavaScript is off.
  idInput?.removeAttribute('disabled');

  const selectedOptions = () => {
    const selected: string[] = [];
    for (const radio of radios) if (radio.checked) selected[Number(radio.dataset.optionIndex)] = radio.value;
    return selected;
  };

  function update() {
    const { strings } = themeData();
    const variant = findVariant(variants, selectedOptions());
    if (!variant) {
      if (button) button.disabled = true;
      if (label) label.textContent = strings.unavailable;
      return;
    }
    if (idInput) idInput.value = String(variant.id);
    if (button) button.disabled = !variant.available;
    if (label) label.textContent = variant.available ? strings.addToCart : strings.soldOut;
    renderPrice(root, variant);
    if (variant.mediaId !== null) showMedia(String(variant.mediaId));
    const url = new URL(location.href);
    url.searchParams.set('variant', String(variant.id));
    history.replaceState(history.state, '', url);
  }

  radios.forEach((radio) => radio.addEventListener('change', update, { signal }));

  const quantity = form?.querySelector<HTMLInputElement>('[data-quantity-input]');
  const max = Number(quantity?.max) || 99;
  form?.querySelectorAll<HTMLButtonElement>('[data-quantity-step]').forEach((stepButton) =>
    stepButton.addEventListener(
      'click',
      () => {
        if (quantity) quantity.value = String(clampQuantity(Number(quantity.value) + Number(stepButton.dataset.quantityStep), 1, max));
      },
      { signal },
    ),
  );
  quantity?.addEventListener(
    'change',
    () => {
      quantity.value = String(clampQuantity(Number(quantity.value), 1, max));
    },
    { signal },
  );
});

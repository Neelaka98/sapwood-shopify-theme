(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const pack = document.querySelector('[data-pack-details]');
  if (location.pathname.endsWith('/kithul-jaggery')) {
    assert(!pack, 'A product with no pack metafields shows no pack details');
    return 'pack details empty ok';
  }
  assert(pack, 'Pack details render');
  assert(pack.querySelector('h2').textContent.trim() !== '', 'Pack details have a heading');
  assert(pack.querySelector('dl:not([data-variant-panel])')?.textContent.includes('24 months'), 'Shelf life shows whatever the variant');
  const radios = [...document.querySelectorAll('[data-product-root] [data-variant-picker] input')];
  const choose = (value) => radios.find((radio) => radio.value === value).click();
  const visible = () => [...pack.querySelectorAll('[data-variant-panel]')].filter((panel) => !panel.hidden);
  choose('1000 ml');
  assert(visible().length === 1 && visible()[0].textContent.includes('1.6 kg'), 'The 1000 ml variant shows its own details');
  assert(!visible()[0].textContent.includes('Carton'), 'A variant with no carton shows no carton rows');
  choose('375 ml');
  assert(visible().length === 0, 'A variant with no details shows no panel');
  choose('250 ml');
  assert(visible().length === 1 && visible()[0].textContent.includes('300 × 200 × 180 mm'), 'The 250 ml variant shows its carton size');
  assert(visible()[0].textContent.includes('24 units, 11.5 kg gross, 9.6 kg net'), 'The 250 ml variant shows its carton contents');
  return 'pack details ok';
})();

// Run at a short viewport (400x320) so the cards start below the fold and would be split.
(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  assert(document.documentElement.dataset.motion === 'ready', 'motion.js has run');
  const cardHeadings = [...document.querySelectorAll('main .product-card h2')].filter((h) => h.querySelector('a'));
  assert(cardHeadings.length >= 2, 'Cards with linked h2 titles render');
  assert(cardHeadings.every((h) => !h.querySelector('.split-line')), 'Card titles that contain a link are not split into lines');
  assert(![...document.querySelectorAll('main .product-card a')].some((a) => a.closest('[aria-hidden]')), 'No card link sits inside aria-hidden');
  return 'collection motion ok';
})();

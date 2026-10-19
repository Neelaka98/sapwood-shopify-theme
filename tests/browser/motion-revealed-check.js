(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const group = document.querySelector('[data-reveal-group]');
  const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
  const cards = [...group.children].filter(onScreen);
  assert(cards.length > 0, 'Some cards are on screen');
  assert(cards.every((card) => getComputedStyle(card).opacity === '1'), 'Cards on screen have risen in');
  const lines = [...group.closest('section').querySelectorAll('h2 .split-line')];
  assert(lines.length > 0, 'The grid heading was split');
  assert(lines.every((line) => new DOMMatrix(getComputedStyle(line).transform).f === 0), 'The grid heading lines have risen into place');
  return 'motion revealed ok';
})();

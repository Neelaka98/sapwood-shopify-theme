(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  assert(document.documentElement.dataset.motion === 'ready', 'motion.js has run');
  const belowFold = (el) => el.getBoundingClientRect().top > innerHeight;
  const headings = [...document.querySelectorAll('main h2')].filter(belowFold);
  assert(headings.length >= 3, 'The homepage has section headings below the fold');
  headings.forEach((heading) => {
    assert(heading.querySelector('.split-line'), `"${heading.textContent.trim()}" is split into lines`);
    assert(heading.getAttribute('aria-label')?.trim(), 'A split heading keeps its whole text for screen readers');
  });
  const cards = [...document.querySelectorAll('[data-reveal-group] > *')];
  assert(cards.length > 0 && cards.every(belowFold), 'The product grid starts below the fold');
  assert(cards.every((card) => getComputedStyle(card).opacity === '0'), 'Cards below the fold wait to rise in');
  assert(cards.every((card) => getComputedStyle(card).visibility === 'visible'), 'Waiting cards stay focusable');
  return 'motion ok';
})();

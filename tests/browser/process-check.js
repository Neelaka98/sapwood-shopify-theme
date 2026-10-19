(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const section = document.querySelector('[data-process]');
  assert(section, 'Process steps render');
  assert(section.querySelector('h2'), 'Process steps have a section heading');
  const steps = [...section.querySelectorAll('ol > li')];
  assert(steps.length >= 2, 'Each step block is an item of an ordered list');
  steps.forEach((step, i) => {
    assert(step.querySelector('h3'), `Step ${i + 1} has an h3 title`);
    assert(step.querySelector('img, svg'), `Step ${i + 1} shows an image or a placeholder`);
    const number = step.querySelector('[data-step-number]');
    assert(number.textContent.trim() === String(i + 1).padStart(2, '0'), `Step ${i + 1} shows its number`);
    assert(number.getAttribute('aria-hidden') === 'true', 'The visible number is hidden because the list already announces position');
    assert(step.getBoundingClientRect().height > 0, `Step ${i + 1} is visible`);
  });
  assert([...document.querySelectorAll('h1,h2,h3,h4')].every((h) => h.textContent.trim() !== ''), 'The page has no empty headings');
  assert(!section.hasAttribute('data-process-ready'), 'The steps are stacked, not staged');
  assert(!section.parentElement.classList.contains('pin-spacer'), 'Nothing is pinned');
  const navigation = section.querySelector('[data-process-navigation]');
  assert(!navigation || navigation.hidden, 'Step buttons only show while staged');
  return 'process ok';
})();

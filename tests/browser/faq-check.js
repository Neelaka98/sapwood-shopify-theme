(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const faq = document.querySelector('[data-faq]');
  assert(faq, 'FAQ renders');
  assert(faq.querySelector('h2'), 'FAQ has a section heading');
  const items = [...faq.querySelectorAll('details')];
  assert(items.length >= 2, 'Each question is a details element');
  assert(items.every((item) => !item.open), 'Answers start closed');
  const summary = items[0].querySelector('summary');
  assert(summary.textContent.trim() !== '', 'The question is the summary text');
  assert(summary.getBoundingClientRect().height >= 44, 'The question is a 44px touch target');
  summary.click();
  assert(items[0].open, 'Clicking the question opens the answer');
  assert(items[0].querySelector('.rte').textContent.trim() !== '', 'The answer has text');
  summary.click();
  return 'faq ok';
})();

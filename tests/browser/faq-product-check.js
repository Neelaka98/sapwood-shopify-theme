(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const faq = document.querySelector('[data-faq]');
  if (location.pathname.endsWith('/kithul-jaggery')) {
    assert(!faq, 'A product with no FAQ metafield shows no FAQ section');
    return 'faq product empty ok';
  }
  assert(faq, 'The product page shows the FAQ section');
  const items = [...faq.querySelectorAll('details')];
  assert(items.length === 2, 'Each faq_item in the product metafield is one question');
  assert(items[0].querySelector('summary').textContent.trim() === 'Does it need to be kept in the fridge?', 'Questions come from the metafield, in order');
  assert(items[0].querySelector('.rte p')?.textContent.trim() === 'No. Keep it closed in a cool cupboard.', 'The rich text answer renders as HTML');
  return 'faq product ok';
})();

(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const wrapper = [...document.querySelectorAll('.shopify-section')].find((el) => el.id.endsWith('__reviews'));
  assert(wrapper, 'The product template includes the reviews section');
  assert(wrapper.textContent.trim() === '' && wrapper.children.length === 0, 'With no app block the section renders nothing');
  return 'reviews ok';
})();

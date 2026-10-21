// Run on the homepage at 1440x900 with motion on, before scrolling.
(async () => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const card = document.querySelector('[data-reveal-group] > *');
  assert(getComputedStyle(card).opacity === '0', 'The first card is waiting to rise in');
  // Below the 88% trigger line, where scrolling alone never reveals it.
  scrollTo(0, card.getBoundingClientRect().top + scrollY - innerHeight * 0.95);
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert(getComputedStyle(card).opacity === '0', 'A card under the trigger line stays hidden while not focused');
  // focus() from an eval sends no focus events when the browser window is not focused, so send the one Tab would.
  card.querySelector('a').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 800));
  assert(getComputedStyle(card).opacity === '1', 'Focusing a hidden card shows it');
  return 'motion focus ok';
})();

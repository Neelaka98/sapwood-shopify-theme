(() => {
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const section = document.querySelector('[data-process]');
  const navigation = section.querySelector('[data-process-navigation]');
  const steps = [...section.querySelectorAll('[data-process-step]')];
  const buttons = [...section.querySelectorAll('[data-process-go]')];
  const bar = section.querySelector('[data-process-progress]');
  const staged = () => section.hasAttribute('data-process-ready');
  const pinned = () => section.parentElement.classList.contains('pin-spacer');
  const current = () => buttons.findIndex((button) => button.getAttribute('aria-current') === 'step');
  const last = steps.length - 1;

  assert(staged() && pinned(), 'The process section is staged and pinned at 1440 by 900');
  assert(!navigation.hidden, 'The step buttons show');
  assert(buttons.length === steps.length, 'There is one button per step');
  buttons.forEach((button, i) => {
    assert(button.textContent.trim() !== '', `Step button ${i + 1} has a name`);
    assert(button.getBoundingClientRect().height >= 44, `Step button ${i + 1} is a 44px touch target`);
  });

  buttons[last].click();
  assert(current() === last, 'The last button makes the last step current');
  assert(steps.every((step, i) => step.inert === (i !== last)), 'Only the current step can be reached');
  assert(bar.style.transform === 'scaleX(1)', 'The progress line is full on the last step');
  buttons[0].click();
  assert(current() === 0 && !steps[0].inert, 'The first button goes back to the first step');
  assert(bar.style.transform === 'scaleX(0)', 'The progress line is empty on the first step');

  const wrapper = section.closest('.shopify-section');
  wrapper.dispatchEvent(new CustomEvent('shopify:section:unload', { bubbles: true }));
  assert(!staged() && !pinned() && navigation.hidden, 'Unloading the section in the editor puts the steps back');
  assert(steps.every((step) => !step.inert), 'Unloading leaves every step reachable');
  wrapper.dispatchEvent(new CustomEvent('shopify:section:load', { bubbles: true }));
  assert(staged() && pinned(), 'Loading the section again restages it');
  return 'process stage ok';
})();

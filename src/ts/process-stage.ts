import { gsap } from 'gsap';

/** Wide and tall enough to show one step at a time. Below this, or with reduced motion, the steps stay stacked. */
export const PROCESS_STAGE = '(min-width: 64rem) and (min-height: 700px) and (prefers-reduced-motion: no-preference)';

// Scroll distance per step change, in viewport heights.
const SCROLL_PER_STEP = 0.8;

/**
 * Pins the process section and steps through its blocks as the page scrolls: each photo wipes up over the last and
 * the copy crossfades. Step buttons jump straight to a step, and so does selecting a step block in the theme editor.
 * Returns the cleanup gsap.matchMedia runs when PROCESS_STAGE stops matching or the section unloads.
 */
export function runStage(section: HTMLElement): () => void {
  const steps = [...section.querySelectorAll<HTMLElement>('[data-process-step]')];
  const navigation = section.querySelector<HTMLElement>('[data-process-navigation]');
  if (steps.length < 2 || !navigation) return () => {};
  const copies = steps.map((step) => step.querySelector<HTMLElement>('[data-process-copy]')!);
  const photos = steps.map((step) => step.querySelector<HTMLElement>('[data-process-photo]')!);
  const buttons = [...navigation.querySelectorAll<HTMLButtonElement>('[data-process-go]')];
  const progressBar = navigation.querySelector<HTMLElement>('[data-process-progress]')!;
  const last = steps.length - 1;
  const headerHeight = () => document.querySelector<HTMLElement>('[data-header-sticky]')?.offsetHeight ?? 0;
  const setHeader = () => section.style.setProperty('--process-header', `${headerHeight()}px`);

  // Set before the ScrollTrigger below is created, so it measures the stage layout.
  section.toggleAttribute('data-process-ready', true);
  setHeader();
  navigation.hidden = false;
  // Chrome never lazy-loads a fully clipped image, so a later step's photo would wipe in empty.
  for (const img of section.querySelectorAll<HTMLImageElement>('[data-process-photo] img')) img.loading = 'eager';
  gsap.set(photos.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.set(copies.slice(1), { autoAlpha: 0, y: 24 });

  let active = -1;
  const select = (index: number) => {
    if (index === active) return;
    active = index;
    steps.forEach((step, i) => (step.inert = i !== index));
    buttons.forEach((button, i) => (i === index ? button.setAttribute('aria-current', 'step') : button.removeAttribute('aria-current')));
  };

  // Step i has a label at time i, so snapping to labels settles on a step and label i sits at progress i / last.
  // Every tween states its start values and skips the immediate render, so scrubbing back returns to the set-up above.
  const run = gsap.timeline({
    defaults: { immediateRender: false, ease: 'power2.inOut' },
    onUpdate: () => {
      select(Math.round(run.time()));
      progressBar.style.transform = `scaleX(${run.progress()})`;
    },
    scrollTrigger: {
      trigger: section,
      start: () => `top top+=${headerHeight()}`,
      end: () => `+=${innerHeight * SCROLL_PER_STEP * last}`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      snap: { snapTo: 'labelsDirectional', inertia: false, duration: { min: 0.2, max: 0.6 }, delay: 0.1, ease: 'power2.inOut' },
      onRefreshInit: setHeader,
    },
  });
  run.addLabel('s0', 0);
  for (let i = 1; i <= last; i++) {
    const at = i - 1;
    run
      .fromTo(copies[at], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -24, duration: 0.35 }, at + 0.05)
      .fromTo(photos[i], { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7 }, at + 0.1)
      .fromTo(copies[i], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4 }, at + 0.5)
      .addLabel(`s${i}`, i);
  }
  // The last tween ends before time `last`; this keeps the timeline that long so the last label is at progress 1.
  run.set({}, {}, last);

  const show = (index: number) => {
    const trigger = run.scrollTrigger!;
    window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * (index / last), behavior: 'instant' });
    // Buttons and the editor jump straight to the step; only scrolling scrubs.
    trigger.getTween()?.progress(1);
    run.progress(index / last);
  };
  const onClick = (event: Event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-process-go]');
    if (button) show(Number(button.dataset.processGo));
  };
  // The editor scrolls the selected block into view itself; waiting a frame lets the stage's scroll win.
  let pendingFrame = 0;
  const onBlockSelect = (event: Event) => {
    const index = steps.indexOf(event.target as HTMLElement);
    if (index !== -1) pendingFrame = requestAnimationFrame(() => show(index));
  };
  navigation.addEventListener('click', onClick);
  document.addEventListener('shopify:block:select', onBlockSelect);
  select(0);

  return () => {
    cancelAnimationFrame(pendingFrame);
    navigation.removeEventListener('click', onClick);
    document.removeEventListener('shopify:block:select', onBlockSelect);
    section.removeAttribute('data-process-ready');
    section.style.removeProperty('--process-header');
    navigation.hidden = true;
    steps.forEach((step) => (step.inert = false));
    buttons.forEach((button) => button.removeAttribute('aria-current'));
    progressBar.style.removeProperty('transform');
  };
}

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { registerSection } from './sections.ts';
import { PROCESS_STAGE, runStage } from './process-stage.ts';

gsap.registerPlugin(ScrollTrigger, SplitText);

// The concept's motion ease, cubic-bezier(0.16, 1, 0.3, 1), is close to expo.out.
const EASE = 'expo.out';
const MOTION = '(prefers-reduced-motion: no-preference)';

// The script loads after first paint, so hiding something already on screen would make it flash.
const startsInView = (el: Element) => el.getBoundingClientRect().top < innerHeight;

function revealHeadings(root: HTMLElement) {
  for (const heading of root.querySelectorAll<HTMLElement>('h2')) {
    if (startsInView(heading)) continue;
    let played = false;
    SplitText.create(heading, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      // Re-splits when a resize rewraps the heading; after the first play it only re-splits.
      autoSplit: true,
      onSplit(self) {
        // Headings have a tight line height, so a bare mask clips descenders. The padding gives them room and the
        // negative margin keeps the layout unchanged.
        gsap.set(self.masks, { paddingBottom: '0.2em', marginBottom: '-0.2em' });
        if (played) return;
        return gsap.from(self.lines, {
          yPercent: 125,
          duration: 0.9,
          ease: EASE,
          stagger: 0.08,
          scrollTrigger: { trigger: heading, start: 'top 88%', once: true, onEnter: () => (played = true) },
        });
      },
    });
  }
}

function revealGroups(root: HTMLElement) {
  for (const group of root.querySelectorAll<HTMLElement>('[data-reveal-group]')) {
    const items = [...group.children].filter((item) => !startsInView(item)) as HTMLElement[];
    if (!items.length) continue;
    // Opacity, not autoAlpha: a hidden card would drop out of the tab order until it was scrolled to.
    gsap.set(items, { opacity: 0, y: 32 });
    ScrollTrigger.batch(items, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: EASE, stagger: 0.06 }),
    });
  }
}

/**
 * Scroll-driven motion. layout/theme.liquid only loads this file when the motion setting is on and the visitor has
 * not asked for reduced motion; the MOTION query also reverts everything if they turn it on with the page open.
 * Process steps pin on wide screens (process-stage.ts).
 */
registerSection('main .shopify-section > *', (root, signal) => {
  const mm = gsap.matchMedia();
  mm.add(MOTION, () => {
    revealHeadings(root);
    revealGroups(root);
  });
  if (root.matches('[data-process]')) mm.add(PROCESS_STAGE, () => runStage(root));
  signal.addEventListener('abort', () => mm.revert());
});

// A section added, removed or moved in the theme editor shifts every trigger below it.
for (const type of ['shopify:section:load', 'shopify:section:unload', 'shopify:section:reorder']) {
  document.addEventListener(type, () => requestAnimationFrame(() => ScrollTrigger.refresh()));
}

document.documentElement.dataset.motion = 'ready';

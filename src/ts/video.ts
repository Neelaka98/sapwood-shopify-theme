import { registerSection } from './sections.ts';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

registerSection('[data-hero-video]', (root, signal) => {
  const video = root.querySelector('video');
  const toggle = root.querySelector<HTMLButtonElement>('[data-video-toggle]');
  const label = toggle?.querySelector('[data-video-label]');
  if (!video || !toggle || !label) return;

  const sync = () => {
    root.toggleAttribute('data-playing', !video.paused);
    label.textContent = (video.paused ? toggle.dataset.playLabel : toggle.dataset.pauseLabel) ?? '';
  };
  toggle.hidden = false;
  toggle.addEventListener(
    'click',
    () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    },
    { signal },
  );
  video.addEventListener('play', sync, { signal });
  video.addEventListener('pause', sync, { signal });
  // Moving video longer than 5 seconds needs a pause control (WCAG 2.2.2), and reduced motion means no autoplay at all.
  video.muted = true;
  if (!reducedMotion.matches) video.play().catch(() => {});
  sync();
});

registerSection('[data-video-root]', (root, signal) => {
  const link = root.querySelector<HTMLAnchorElement>('[data-video-embed]');
  const template = root.querySelector<HTMLTemplateElement>('[data-video-frame]');
  if (!link || !template) return;
  link.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      link.replaceWith(template.content.cloneNode(true));
      // The link that had focus is gone; moving focus to the player keeps keyboard users in place.
      root.querySelector('iframe')?.focus();
    },
    { signal },
  );
});

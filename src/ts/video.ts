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

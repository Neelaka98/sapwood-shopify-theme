// A horizontal drag past this distance changes image; anything shorter counts as a tap.
const SWIPE_PX = 40;

/** Wires the gallery inside `root` and returns a function that shows the image with the given media id. */
export function initGallery(root: HTMLElement, signal: AbortSignal): (mediaId: string) => void {
  const gallery = root.querySelector<HTMLElement>('[data-gallery]');
  if (!gallery) return () => {};
  const thumbs = [...gallery.querySelectorAll<HTMLButtonElement>('[data-gallery-thumb]')];
  const slides = [...gallery.querySelectorAll<HTMLElement>('[data-gallery-slide]')];
  const viewerSlides = [...gallery.querySelectorAll<HTMLElement>('[data-viewer-slide]')];
  const counters = [...gallery.querySelectorAll<HTMLElement>('[data-gallery-index]')];
  const viewerCount = gallery.querySelector<HTMLElement>('[data-viewer-count]');
  const viewer = gallery.querySelector<HTMLDialogElement>('[data-gallery-viewer]');
  const main = gallery.querySelector<HTMLElement>('.gallery-main');
  const ids = slides.map((slide) => slide.dataset.gallerySlide!);
  let current = Math.max(0, slides.findIndex((slide) => !slide.hidden));

  const show = (id: string) => {
    const index = ids.indexOf(id);
    if (index < 0) return;
    current = index;
    slides.forEach((slide) => (slide.hidden = slide.dataset.gallerySlide !== id));
    viewerSlides.forEach((slide) => (slide.hidden = slide.dataset.viewerSlide !== id));
    thumbs.forEach((thumb) => thumb.setAttribute('aria-current', String(thumb.dataset.galleryThumb === id)));
    counters.forEach((counter) => (counter.textContent = String(index + 1)));
    if (viewerCount) viewerCount.textContent = (viewerCount.dataset.template ?? '').replace('[index]', String(index + 1));
  };
  const step = (by: number) => show(ids[(current + by + ids.length) % ids.length]);

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => show(thumb.dataset.galleryThumb!), { signal });
    thumb.addEventListener(
      'keydown',
      (event) => {
        const by = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
        if (!by) return;
        event.preventDefault();
        const next = thumbs[(i + by + thumbs.length) % thumbs.length];
        next.focus();
        show(next.dataset.galleryThumb!);
      },
      { signal },
    );
  });
  gallery.querySelectorAll<HTMLButtonElement>('[data-gallery-step]').forEach((button) =>
    button.addEventListener('click', () => step(Number(button.dataset.galleryStep)), { signal }),
  );

  const onSwipe = (el: Element | null, onTap?: () => void) => {
    let startX: number | null = null;
    el?.addEventListener(
      'pointerdown',
      (event) => {
        const pointer = event as PointerEvent;
        startX = (pointer.target as Element).closest('button') ? null : pointer.clientX;
      },
      { signal },
    );
    el?.addEventListener(
      'pointerup',
      (event) => {
        if (startX === null) return;
        const dx = (event as PointerEvent).clientX - startX;
        startX = null;
        if (Math.abs(dx) >= SWIPE_PX) step(dx < 0 ? 1 : -1);
        else onTap?.();
      },
      { signal },
    );
  };

  let opener: HTMLElement | null = null;
  const openViewer = () => {
    if (!viewer) return;
    opener = document.activeElement as HTMLElement | null;
    // Chrome's lazy loading doesn't reliably fire inside a modal dialog, so fetch the large images on first open.
    viewer.querySelectorAll('img').forEach((img) => (img.loading = 'eager'));
    viewer.showModal();
  };
  onSwipe(main, openViewer);
  onSwipe(viewer?.querySelector('.viewer-stage') ?? null);
  gallery.querySelector('[data-gallery-open]')?.addEventListener('click', openViewer, { signal });
  gallery.querySelector('[data-gallery-close]')?.addEventListener('click', () => viewer?.close(), { signal });
  viewer?.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
    },
    { signal },
  );
  viewer?.addEventListener('close', () => opener?.focus(), { signal });
  return show;
}

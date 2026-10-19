type SectionInit = (root: HTMLElement, signal: AbortSignal) => void;

const controllers = new Map<HTMLElement, AbortController>();

/**
 * Runs `init` for every element matching `selector`, and again for matches inside a section the theme editor
 * reloads. The editor swaps the section's HTML without a page load, so listeners from the old markup must be
 * removed: `init` receives a signal that aborts on `shopify:section:unload`.
 */
export function registerSection(selector: string, init: SectionInit): void {
  const start = (root: HTMLElement) => {
    controllers.get(root)?.abort();
    const controller = new AbortController();
    controllers.set(root, controller);
    init(root, controller.signal);
  };
  const within = (event: Event, fn: (root: HTMLElement) => void) =>
    (event.target as HTMLElement).querySelectorAll<HTMLElement>(selector).forEach(fn);

  document.querySelectorAll<HTMLElement>(selector).forEach(start);
  document.addEventListener('shopify:section:load', (event) => within(event, start));
  // Matches by containment, not by selector: a root can be moved by a script (ScrollTrigger pins wrap it in a
  // spacer), after which the selector no longer finds it.
  document.addEventListener('shopify:section:unload', (event) => {
    for (const [root, controller] of controllers) {
      if (!(event.target as HTMLElement).contains(root)) continue;
      controller.abort();
      controllers.delete(root);
    }
  });
}

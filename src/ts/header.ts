import { registerSection } from './sections.ts';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// The menu panel also holds controls that are display: none at some widths, so only visible ones join the Tab cycle.
const visibleFocusable = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);

registerSection('[data-header]', (header, signal) => {
  const menuToggle = header.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = header.querySelector<HTMLElement>('[data-menu]');
  const disclosures = [...header.querySelectorAll<HTMLElement>('[data-disclosure]')];
  const desktop = matchMedia('(min-width: 64rem)');

  const panelFor = (button: HTMLElement) => document.getElementById(button.getAttribute('aria-controls') ?? '');
  const openDisclosure = () => disclosures.find((button) => button.getAttribute('aria-expanded') === 'true');

  function setDisclosure(button: HTMLElement, open: boolean) {
    button.setAttribute('aria-expanded', String(open));
    const panel = panelFor(button);
    if (!panel) return;
    panel.toggleAttribute('data-open', open);
    if (open) panel.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
  }

  for (const button of disclosures) {
    button.addEventListener(
      'click',
      (event) => {
        // The search control is a link to the search page for visitors without JavaScript.
        event.preventDefault();
        const open = button.getAttribute('aria-expanded') !== 'true';
        disclosures.forEach((other) => other !== button && setDisclosure(other, false));
        setDisclosure(button, open);
      },
      { signal },
    );
  }

  const isMenuOpen = () => menuToggle?.getAttribute('aria-expanded') === 'true';

  function setMenu(open: boolean, returnFocus = true) {
    if (!menuToggle || !menu) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menu.toggleAttribute('data-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) {
      // The header may have scrolled partly away, so size the panel to what's left of the viewport below it.
      menu.style.height = `${window.innerHeight - header.getBoundingClientRect().bottom}px`;
      visibleFocusable(menu)[0]?.focus();
    } else {
      menu.style.height = '';
      if (returnFocus) menuToggle.focus();
    }
  }

  menuToggle?.addEventListener('click', () => setMenu(!isMenuOpen()), { signal });

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        const open = openDisclosure();
        if (open) {
          setDisclosure(open, false);
          open.focus();
        } else if (isMenuOpen()) {
          event.preventDefault();
          setMenu(false);
        }
        return;
      }
      if (event.key !== 'Tab' || !isMenuOpen() || !menu || !menuToggle) return;
      // The toggle sits after the panel in the DOM, so the cycle is set here instead of left to the browser.
      const items = [menuToggle, ...visibleFocusable(menu)];
      const index = items.indexOf(document.activeElement as HTMLElement);
      event.preventDefault();
      items[(index + (event.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    },
    { signal },
  );

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as Node;
      const open = openDisclosure();
      if (open && !open.contains(target) && !panelFor(open)?.contains(target)) setDisclosure(open, false);
    },
    { signal },
  );

  // Following a link should close the menu and let the browser move focus to the target.
  menu?.addEventListener(
    'click',
    (event) => {
      if ((event.target as Element).closest('a') && isMenuOpen()) setMenu(false, false);
    },
    { signal },
  );

  desktop.addEventListener(
    'change',
    (event) => {
      if (event.matches && isMenuOpen()) setMenu(false, false);
    },
    { signal },
  );

  signal.addEventListener('abort', () => {
    document.documentElement.style.overflow = '';
  });
});

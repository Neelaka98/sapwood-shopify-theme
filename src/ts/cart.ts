import { cartErrorMessage } from './cart-errors.ts';
import { themeData } from './theme-data.ts';

class CartRequestError extends Error {}

type SectionsResponse = { sections?: Record<string, string | null> };

const cartSectionIds = () =>
  [...document.querySelectorAll<HTMLElement>('[data-cart-section]')].map((el) => el.dataset.cartSection!);

function announce(message: string) {
  const status = document.querySelector('[data-cart-status]');
  if (!status) return;
  // Clearing first makes screen readers repeat an identical message.
  status.textContent = '';
  setTimeout(() => (status.textContent = message), 50);
}

async function post(url: string, body: FormData | Record<string, unknown>): Promise<SectionsResponse> {
  const sections = cartSectionIds().join(',');
  const init: RequestInit =
    body instanceof FormData
      ? (body.append('sections', sections),
        body.append('sections_url', location.pathname),
        { method: 'POST', body, headers: { Accept: 'application/json' } })
      : {
          method: 'POST',
          body: JSON.stringify({ ...body, sections, sections_url: location.pathname }),
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        };
  const response = await fetch(url, init);
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new CartRequestError(cartErrorMessage(json, themeData().strings.networkError));
  return json as SectionsResponse;
}

const messageFor = (error: unknown) =>
  error instanceof CartRequestError ? error.message : themeData().strings.networkError;

function updateHeaderCount() {
  const source = document.querySelector<HTMLElement>('[data-item-count]');
  if (!source) return;
  const count = Number(source.dataset.itemCount ?? 0);
  document.querySelectorAll<HTMLElement>('[data-cart-count]').forEach((el) => {
    el.textContent = String(count);
    el.hidden = count === 0;
  });
  document.querySelectorAll('[data-cart-label]').forEach((el) => (el.textContent = source.dataset.cartLabelText ?? ''));
}

function renderSections(sections: SectionsResponse['sections']) {
  if (!sections) return;
  // Replacing the HTML drops focus, so remember which control had it and find its twin in the new markup.
  const active = document.activeElement as HTMLElement | null;
  const focusId = active?.dataset.focusId;
  const focusScope = active?.closest<HTMLElement>('.shopify-section');

  for (const [id, html] of Object.entries(sections)) {
    const current = document.getElementById(`shopify-section-${id}`);
    if (!current || !html) continue;
    const next = new DOMParser().parseFromString(html, 'text/html').getElementById(`shopify-section-${id}`);
    if (next) current.innerHTML = next.innerHTML;
  }
  updateHeaderCount();

  if (focusId && focusScope) {
    const target =
      focusScope.querySelector<HTMLElement>(`[data-focus-id="${CSS.escape(focusId)}"]`) ??
      focusScope.querySelector<HTMLElement>('[data-cart-close], h1[tabindex="-1"]');
    target?.focus();
  }
}

let opener: HTMLElement | null = null;

function openDrawer(from: HTMLElement | null) {
  const drawer = document.querySelector<HTMLDialogElement>('[data-cart-drawer]');
  if (!drawer || drawer.open) return;
  opener = from;
  drawer.showModal();
}

async function addToCart(form: HTMLFormElement) {
  const error = form.querySelector<HTMLElement>('[data-cart-error]');
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
  if (error) error.textContent = '';
  submit?.setAttribute('aria-busy', 'true');
  try {
    const data = await post(themeData().routes.cartAdd, new FormData(form));
    renderSections(data.sections);
    announce(themeData().strings.added);
    openDrawer(submit);
  } catch (reason) {
    if (error) error.textContent = messageFor(reason);
  } finally {
    submit?.removeAttribute('aria-busy');
  }
}

async function changeLine(link: HTMLAnchorElement) {
  const scope = link.closest('.shopify-section');
  try {
    const data = await post(themeData().routes.cartChange, {
      line: Number(link.dataset.cartLine),
      quantity: Number(link.dataset.cartQuantity),
    });
    renderSections(data.sections);
    announce(themeData().strings.updated);
  } catch (reason) {
    const error = scope?.querySelector<HTMLElement>('[data-cart-error]');
    if (error) error.textContent = messageFor(reason);
  }
}

/** Delegated on document, so it keeps working when the theme editor or a cart update replaces section HTML. */
export function initCart() {
  const drawer = document.querySelector<HTMLDialogElement>('[data-cart-drawer]');

  document.addEventListener('click', (event) => {
    const target = event.target as Element;
    const openButton = target.closest<HTMLElement>('[data-cart-open]');
    if (openButton && drawer) {
      event.preventDefault();
      openDrawer(openButton);
      return;
    }
    if (target.closest('[data-cart-close]')) {
      drawer?.close();
      return;
    }
    const line = target.closest<HTMLAnchorElement>('a[data-cart-line]');
    if (line) {
      event.preventDefault();
      void changeLine(line);
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target as HTMLFormElement;
    if (!form.matches('[data-product-form]')) return;
    event.preventDefault();
    void addToCart(form);
  });

  // A click on the backdrop lands on the dialog element itself.
  drawer?.addEventListener('click', (event) => {
    if (event.target === drawer) drawer.close();
  });
  drawer?.addEventListener('close', () => opener?.focus());
}

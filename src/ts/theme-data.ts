export interface ThemeData {
  routes: { cartAdd: string; cartChange: string; cart: string };
  strings: {
    networkError: string;
    added: string;
    updated: string;
    addToCart: string;
    soldOut: string;
    unavailable: string;
  };
}

let cached: ThemeData | undefined;

/** Routes and translated strings printed by snippets/theme-data.liquid. Routes carry the market's locale prefix. */
export function themeData(): ThemeData {
  cached ??= JSON.parse(document.getElementById('theme-data')?.textContent ?? '{}') as ThemeData;
  return cached;
}

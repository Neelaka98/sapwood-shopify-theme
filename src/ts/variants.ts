/** One variant as printed by snippets/product-variants-json.liquid. Prices arrive formatted by Liquid's money filter. */
export interface VariantData {
  id: number;
  options: string[];
  available: boolean;
  mediaId: number | null;
  priceHtml: string;
  compareHtml: string | null;
  percentOff: number | null;
}

export function findVariant(variants: VariantData[], selected: string[]): VariantData | undefined {
  return variants.find((variant) => variant.options.every((value, index) => value === selected[index]));
}

export function clampQuantity(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

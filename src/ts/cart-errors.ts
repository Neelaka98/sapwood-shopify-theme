/**
 * Shopify's Ajax Cart API answers a refused change with { status, message, description }. The description is the
 * sentence written for shoppers (for example a stock limit), so it wins over the shorter message.
 */
export function cartErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const { description, message } = body as { description?: unknown; message?: unknown };
    if (typeof description === 'string' && description.trim()) return description;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

/**
 * Naira text input -> clean string for the API ("120000.00").
 * The UI never does arithmetic on money; it only validates and forwards the string.
 */
export function parseMoneyInput(raw: string): { value: string | null; error: string | null } {
  const text = raw.trim().replace(/[,\s₦]/g, "");
  if (!text) return { value: null, error: null };
  if (!/^\d{1,13}(\.\d{1,2})?$/.test(text)) {
    return { value: null, error: "Enter an amount with at most 2 decimals, e.g. 120000.00" };
  }
  if (/^0+(\.0+)?$/.test(text)) {
    return { value: null, error: "Amount must be greater than zero" };
  }
  return { value: text, error: null };
}
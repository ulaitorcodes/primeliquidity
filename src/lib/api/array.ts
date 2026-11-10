/** Accepts a plain array or a paginated { results: [] } body, and always returns an array. */
export function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const results = (data as { results?: unknown }).results;
    if (Array.isArray(results)) return results as T[];
  }
  return [];
}
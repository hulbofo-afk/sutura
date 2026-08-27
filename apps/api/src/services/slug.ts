export function uniqueSlug(title: string, existing: string[]): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
  let slug = base || `test-${Date.now()}`;
  let counter = 2;
  while (existing.includes(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }
  return slug;
}

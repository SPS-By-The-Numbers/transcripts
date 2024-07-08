import type { CategoryId } from "common/params";

export function sanitizeCategory(category : CategoryId) {
  if (!category || category.length > 20) {
    return undefined;
  }

  return category;
}


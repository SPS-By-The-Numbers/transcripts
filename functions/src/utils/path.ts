export function sanitizeCategory(category) {
  if (!category || category.length > 20) {
    return undefined;
  }

  return category;
}


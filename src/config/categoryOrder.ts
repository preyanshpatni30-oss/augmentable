/**
 * Per-cafe category ordering configuration.
 *
 * Each key maps a cafeId to an ordered array of category names.
 * The array order matches the exact physical menu of that cafe.
 *
 * When adding a new cafe, add its category order here so the
 * digital menu mirrors the physical one.
 */

const CAFE_CATEGORY_ORDER: Record<string, string[]> = {
  mayanagri: [
    'HOT COFFEE',
    'ICED COFFEE',
    'COLD COFFEE',
    'HOT TEA',
    'ICED TEA',
    'SHAKES',
    'HOT CHOCOLATE',
    'MOCKTAIL',
    'REFRESHERS',
    'HEALTHY BOWL(9 AM TO 7 PM)',
    'SANDWICH & BURGER(9 AM TO 7 PM)',
    'WRAP(9 AM TO 7 PM)',
    'CHAI KE SATH',
    'STREET FOOD',
    'DOSA',
    'UTTAPAM',
    'IDLI & VADA',
    'RICE',
    'SIDE ORDER',
    'SOUP(12 PM TO 11 PM)',
    'SALAD(12 PM TO 11 PM)',
    'APPETIZER(12 PM TO 11 PM)',
    'MINI MEALS(12 PM TO 11 PM)',
    'PIZZA(12 PM TO 11 PM)',
    'PASTA(12 PM TO 11 PM)',
    'RISOTTO(12 PM TO 11 PM)',
    'BAKED(12 PM TO 11 PM)',
    'SUSHI(12 PM TO 11 PM)',
    'DIM SUM(12 PM TO 11 PM)',
    'BAO(12 PM TO 11 PM)',
    'RICE & NOODLES(12 PM TO 11 PM)',
    'COMBO(12 PM TO 11 PM)',
    'CURRY(12 PM TO 11 PM)',
    'DAL(12 PM TO 11 PM)',
    'BREADS(12 PM TO 11 PM)',
    'SIDE ORDER(12 PM TO 11 PM)',
    'DESSERTS',
  ],
};

/**
 * Returns the given categories sorted according to the cafe's
 * configured ordering. Categories not in the config are appended
 * alphabetically at the end.
 *
 * @param cafeId  – the cafe identifier (e.g. 'mayanagri')
 * @param rawCategories – unordered category names from Firestore
 */
export function getOrderedCategories(
  cafeId: string,
  rawCategories: string[],
): string[] {
  const order = CAFE_CATEGORY_ORDER[cafeId];

  if (!order) {
    // No custom order configured → return as-is (appearance order)
    return rawCategories;
  }

  // Normalise to uppercase for case-insensitive matching
  const normalised = rawCategories.map((c) => c.toUpperCase());

  const ordered: string[] = [];
  const remaining = new Set(rawCategories);

  for (const configCat of order) {
    const upperConfig = configCat.toUpperCase();
    // Find the original-case category that matches
    const match = rawCategories.find(
      (c) => c.toUpperCase() === upperConfig,
    );
    if (match && remaining.has(match)) {
      ordered.push(match);
      remaining.delete(match);
    }
  }

  // Append any categories not in the config, sorted alphabetically
  const extras = Array.from(remaining).sort((a, b) =>
    a.localeCompare(b),
  );

  return [...ordered, ...extras];
}

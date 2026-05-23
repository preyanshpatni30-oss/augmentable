/**
 * Centralized mapping for 3D model orientation corrections.
 * Keys can be dish IDs or names (normalized to lowercase).
 * Default orientation is "0deg 0deg 0deg".
 */

export const MODEL_ORIENTATIONS: Record<string, string> = {
  // Mayanagri reference — exported already lying flat, no correction needed
  'mg-asparagus-tempura': '0deg 0deg 0deg',

  // Pitch -90 tilts dish face upward toward the camera (camera is at 65° above horizon)
  'mg-avocado-roll': '0deg -90deg 0deg',
  'mg-california': '0deg -90deg 0deg',
  'mg-spicy-shiitake': '0deg -90deg 0deg',
  'mg-crunchy-paneer-sushi': '0deg -90deg 0deg',
  'mg-crunchy-asparagus': '0deg -90deg 0deg',
  'mg-crunchy-paneer-bao': '0deg -90deg 0deg',

  // Sushi — unmapped rolls, same form factor
  'mg-enoki-mushroom-sushi': '0deg -90deg 0deg',
  'mg-crispy-chives': '0deg -90deg 0deg',

  // Healthy bowls — shallow bowl, face must point up
  'mg-buddha-bowl': '0deg -90deg 0deg',
  'mg-burrito-bowl': '0deg -90deg 0deg',
  'mg-muesli-bowl': '0deg -90deg 0deg',
  'mg-roasted-veggies-quinoa-bowl': '0deg -90deg 0deg',
  'mg-fresh-fruit-bowl': '0deg -90deg 0deg',

  // Risotto — wide shallow bowl, same logic as healthy bowls
  'mg-risotto-zucchini-and-bell-peppers': '0deg -90deg 0deg',
  'mg-risotto-sun-dried-tomato': '0deg -90deg 0deg',
  'mg-risotto-mushroom': '0deg -90deg 0deg',
  'mg-risotto-green': '0deg -90deg 0deg',
  'mg-risotto-three-cheese': '0deg -90deg 0deg',

  // Dim sum — steamed dumplings, upright export assumed
  'mg-truffle-edamame-cheese': '0deg -90deg 0deg',
  'mg-beetroot-bamboo-shoot': '0deg -90deg 0deg',
  'mg-thai-asparagus': '0deg -90deg 0deg',
  'mg-water-chestnut-cream-cheese': '0deg -90deg 0deg',
  'mg-cheese-chilli': '0deg -90deg 0deg',
  'mg-thai-herbs': '0deg -90deg 0deg',
  'mg-shiitake-button-mushroom': '0deg -90deg 0deg',

  // Bao — same form factor as existing bao entries
  'mg-cottage-cheese-sun-dried-tomato': '0deg -90deg 0deg',
  'mg-tempura-crunchy-vegetable': '0deg -90deg 0deg',

  // Street food & combo plates
  'mg-raj-kachori': '0deg -90deg 0deg',
  'mg-khow-suey-rice-noodles': '0deg -90deg 0deg',
  'mg-cottage-cheese-steak-spinach-rice': '0deg -90deg 0deg',
};

/**
 * Gets the proper rotation for a dish, falling back to its 
 * data-defined rotation or the default "0deg 0deg 0deg".
 */
export function getModelRotation(dishId: string, dataRotation?: string): string {
  if (MODEL_ORIENTATIONS[dishId]) {
    return MODEL_ORIENTATIONS[dishId];
  }
  return dataRotation || '0deg 0deg 0deg';
}

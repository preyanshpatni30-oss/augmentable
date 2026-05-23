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
  'mg-crunchy-paneer-bao': '0deg -90deg 0deg',

  // Sushi — unmapped rolls, same form factor
  'mg-enoki-mushroom-sushi': '0deg -90deg 0deg',
  'mg-crispy-chives': '0deg -90deg 0deg',

  // Healthy bowls — X-axis correction: bowls exported with opening facing -Y need -90° pitch
  // If bowl still appears wrong, try '90deg 0deg 0deg' (reverse pitch)
  'mg-buddha-bowl': '-90deg 0deg 0deg',
  'mg-burrito-bowl': '-90deg 0deg 0deg',
  'mg-muesli-bowl': '-90deg 0deg 0deg',
  'mg-roasted-veggies-quinoa-bowl': '-90deg 0deg 0deg',
  'mg-fresh-fruit-bowl': '-90deg 0deg 0deg',

  // Risotto — wide shallow bowl, same X-axis correction as healthy bowls
  'mg-risotto-zucchini-and-bell-peppers': '-90deg 0deg 0deg',
  'mg-risotto-sun-dried-tomato': '-90deg 0deg 0deg',
  'mg-risotto-mushroom': '-90deg 0deg 0deg',
  'mg-risotto-green': '-90deg 0deg 0deg',
  'mg-risotto-three-cheese': '-90deg 0deg 0deg',

  // Dim sum — dumplings, try same -90° X correction; swap to '90deg 0deg 0deg' if inverted
  'mg-truffle-edamame-cheese': '-90deg 0deg 0deg',
  'mg-beetroot-bamboo-shoot': '-90deg 0deg 0deg',
  'mg-thai-asparagus': '-90deg 0deg 0deg',
  'mg-water-chestnut-cream-cheese': '-90deg 0deg 0deg',
  'mg-cheese-chilli': '-90deg 0deg 0deg',
  'mg-thai-herbs': '-90deg 0deg 0deg',
  'mg-shiitake-button-mushroom': '-90deg 0deg 0deg',

  // Bao — X-axis correction (same export axis as dim sum)
  'mg-crunchy-asparagus': '-90deg 0deg 0deg',
  'mg-cottage-cheese-sun-dried-tomato': '0deg -90deg 0deg',
  'mg-tempura-crunchy-vegetable': '0deg -90deg 0deg',

  // Street food & combo plates
  'mg-raj-kachori': '-90deg 0deg 0deg',
  'mg-khow-suey-rice-noodles': '-90deg 0deg 0deg',
  'mg-cottage-cheese-steak-spinach-rice': '-90deg 0deg 0deg',
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

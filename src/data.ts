export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  calories?: number;
  category: 'Main Course' | 'Dessert' | 'Beverage' | 'Appetizer';
}

export interface Cafe {
  id: string;
  name: string;
  tagline: string;
  logo?: string;
  themeColor: string;
  promotedDishes?: { id: string; label: string; }[]; // Multiple manual promotions with custom labels
  /** Ambient crossfading background images for the header area */
  ambientImages?: string[];
  /** Gallery photos to show in "The Space" section */
  spaceGallery?: { src: string; label: string }[];
  menu: Dish[];
}

export const cafes: Record<string, Cafe> = {
  sesame: {
    id: 'sesame',
    name: 'Sesame',
    tagline: 'Cafe by HYAAT',
    themeColor: 'amber',
    promotedDishes: [
      { id: 'paneer2', label: 'Chef Signature' },
      { id: 'matcha-cake', label: 'Best Seller' }
    ],
    menu: [
      {
        id: 'charger',
        name: 'charger',
        description: 'Buttery, flaky, and freshly baked every morning.',
        price: 4.50,
        calories: 280,
        category: 'Dessert'
      },
      {
        id: 'croissant',
        name: 'croissant',
        description: 'Buttery, flaky, and freshly baked every morning.',
        price: 4.50,
        calories: 280,
        category: 'Dessert'
      },
      {
        id: 'pain-au-chocolat',
        name: 'pain-au-chocolat',
        description: 'Buttery, flaky, and freshly baked every morning.',
        price: 4.50,
        calories: 280,
        category: 'Dessert'
      },
      {
        id: 'paneer2',
        name: 'Signature Latte',
        description: 'Rich espresso with velvety steamed milk and latte art.',
        price: 5.25,
        calories: 150,
        category: 'Beverage'
      },
      {
        id: 'nachos',
        name: 'Chessy Nachos',
        description: 'Sourdough bread topped with smashed avocado and poached egg.',
        price: 500,
        calories: 450,
        category: 'Main Course'
      },
      {
        id: 'matcha-cake',
        name: 'Matcha Layer Cake',
        description: 'Delicate layers of matcha sponge and white chocolate cream.',
        price: 6.50,
        calories: 320,
        category: 'Dessert'
      }
    ]
  },
  brewlab: {
    id: 'brewlab',
    name: 'BrewLab',
    tagline: 'Experimental Coffee Roasters',
    themeColor: 'cyan',
    promotedDishes: [
      { id: 'cold-brew', label: 'Nitro Special' },
      { id: 'bagel', label: 'Freshly Baked' }
    ],
    menu: [
      {
        id: 'cold-brew',
        name: 'Nitro Cold Brew',
        description: 'Infused with nitrogen for a creamy texture and smooth taste.',
        price: 6.00,
        calories: 5,
        category: 'Beverage'
      },
      {
        id: 'matcha',
        name: 'Ceremonial Matcha',
        description: 'Premium grade matcha whisked to perfection.',
        price: 7.50,
        calories: 60,
        category: 'Beverage'
      },
      {
        id: 'bagel',
        name: 'Everything Bagel',
        description: 'Toasted bagel with cream cheese, capers, and smoked salmon.',
        price: 8.50,
        calories: 400,
        category: 'Main Course'
      }
    ]
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Bistro',
    tagline: 'Dining with a View',
    themeColor: 'rose',
    promotedDishes: [
      { id: 'steak', label: 'Premium Choice' },
      { id: 'cocktail', label: 'House Special' }
    ],
    menu: [
      {
        id: 'burger',
        name: 'Sunset Burger',
        description: 'Wagyu beef patty with secret sauce and brioche bun.',
        price: 18.00,
        calories: 850,
        category: 'Main Course'
      },
      {
        id: 'steak',
        name: 'Ribeye Steak',
        description: 'Grilled to perfection with herb butter and roasted vegetables.',
        price: 32.00,
        calories: 950,
        category: 'Main Course'
      },
      {
        id: 'cocktail',
        name: 'Golden Hour',
        description: 'A refreshing blend of citrus, vodka, and thyme.',
        price: 14.00,
        calories: 200,
        category: 'Beverage'
      },
      {
        id: 'tiramisu',
        name: 'Classic Tiramisu',
        description: 'Espresso-soaked ladyfingers with mascarpone cream.',
        price: 9.00,
        calories: 450,
        category: 'Dessert'
      }
    ]
  },
  'jacob-brew-house': {
    id: 'jacob-brew-house',
    name: "Jacob's Brew House",
    tagline: 'European-Style Cafe • Est. 2024',
    themeColor: 'emerald',
    promotedDishes: [
      { id: 'jbh-wood-fired-pizza', label: 'Wood-Fired Classic' },
      { id: 'jbh-pour-over', label: 'Barista Pick' }
    ],
    ambientImages: [
      '/images/jacob-brew-house/user-photo-1.jpg',
      '/images/jacob-brew-house/user-photo-2.jpg',
      '/images/jacob-brew-house/user-photo-3.jpg',
      '/images/jacob-brew-house/user-photo-4.jpg',
    ],
    spaceGallery: [
      { src: '/images/jacob-brew-house/user-photo-1.jpg', label: 'The Main Hall' },
      { src: '/images/jacob-brew-house/user-photo-2.jpg', label: 'Cozy Corner' },
      { src: '/images/jacob-brew-house/user-photo-3.jpg', label: 'Garden Terrace' },
      { src: '/images/jacob-brew-house/user-photo-4.jpg', label: 'Swing Lounge' },
      { src: '/images/jacob-brew-house/main-hall.jpg', label: 'Dining Area' },
      { src: '/images/jacob-brew-house/lounge.jpg', label: 'The Lounge' },
    ],
    menu: [
      {
        id: 'jbh-wood-fired-pizza',
        name: 'Wood-Fired Margherita',
        description: 'San Marzano tomatoes, hand-stretched dough, fresh basil, and locally sourced mozzarella.',
        price: 450,
        calories: 680,
        category: 'Main Course'
      },
      {
        id: 'jbh-pepperoni',
        name: 'Classic Pepperoni',
        description: 'Golden crispy-edged pepperoni with spiced salami, rich tomato sauce, and bubbling mozzarella.',
        price: 520,
        calories: 750,
        category: 'Main Course'
      },
      {
        id: 'jbh-gourmet-skewers',
        name: 'Gourmet Herb Skewers',
        description: 'Tender marinated cuts grilled over open flame, finished with signature herb glaze.',
        price: 380,
        calories: 420,
        category: 'Main Course'
      },
      {
        id: 'jbh-herb-rice-bowl',
        name: 'Herb-Crusted Rice Bowl',
        description: 'Fragrant basmati with seasonal vegetables, herb-crusted chicken, and fresh microgreens.',
        price: 350,
        calories: 520,
        category: 'Main Course'
      },
      {
        id: 'jbh-fresh-salad',
        name: 'Garden Fresh Bowl',
        description: 'Seasonal greens, house-made dressings, and vibrant toppings for a lighter indulgence.',
        price: 280,
        calories: 220,
        category: 'Appetizer'
      },
      {
        id: 'jbh-pour-over',
        name: 'Single-Origin Pour Over',
        description: 'Premium single-origin beans, expertly roasted and brewed to bring out delicate, complex notes.',
        price: 220,
        calories: 5,
        category: 'Beverage'
      },
      {
        id: 'jbh-craft-latte',
        name: 'Signature Craft Latte',
        description: 'Velvety steamed milk with house-roasted espresso and intricate latte art.',
        price: 250,
        calories: 150,
        category: 'Beverage'
      },
      {
        id: 'jbh-golden-hour',
        name: 'Golden Hour Cocktail',
        description: 'A refreshing blend of citrus, premium spirits, and thyme — the house signature.',
        price: 420,
        calories: 180,
        category: 'Beverage'
      }
    ]
  }
};

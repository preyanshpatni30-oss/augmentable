import { Cafe } from '../types';

export const data: Cafe = {
  id: 'sesame',
  name: 'Sesame',
  tagline: 'Cafe by HYAAT',
  themeColor: 'amber',
  ambientImages: [
    '/images/sesame/ambient-1.jpg',
    '/images/sesame/ambient-2.jpg'
  ],
  spaceGallery: [
    { src: '/images/sesame/gallery-1.jpg', label: 'The Lounge' },
    { src: '/images/sesame/gallery-2.jpg', label: 'Outdoor Seating' }
  ],
  promotedDishes: [
    { id: 'paneer2', label: 'Chef Signature' },
    { id: 'nachos', label: 'Best Seller' }
  ],
  menu: [
    {
      id: 'paneer2',
      name: 'Signature Latte',
      description: '',
      price: 350,
      category: 'Beverage'
    },
    {
      id: 'nachos',
      name: 'Cheesy Nachos',
      description: '',
      price: 500,
      category: 'Appetizer'
    }
  ]
};

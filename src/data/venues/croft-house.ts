import { Cafe } from '../types';

export const data: Cafe = {
  id: 'croft-house',
  name: 'Croft House',
  tagline: 'Authentic Heritage Kitchen',
  themeColor: 'warm',
  ambientImages: [
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2074&auto=format&fit=crop'
  ],
  spaceGallery: [
    { src: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop', label: 'Main Dining' }
  ],
  menu: [
    {
      id: 'heritage-platter',
      name: 'Heritage Platter',
      description: '',
      price: 850,
      category: 'Appetizer'
    }
  ]
};

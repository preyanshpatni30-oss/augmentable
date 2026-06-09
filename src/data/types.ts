export interface Dish {
  id: string;
  name: string;
  description?: string;
  price: number;
  calories?: number;
  category: string;
  /** URL to the .glb model - will now default to Cloudflare R2 */
  modelUrl?: string;
  /** URL to the .usdz model for iOS Quick Look */
  usdzUrl?: string;
  /** Flag to indicate if AR is enabled for this specific dish */
  arEnabled?: boolean;
  /** Manual rotation fix for the 3D model (e.g. '0deg 90deg 0deg') */
  rotation?: string;
  isSpicy?: boolean;
}

export interface Cafe {
  id: string;
  name: string;
  tagline: string;
  logo?: string;
  themeColor: string;
  promotedDishes?: { id: string; label: string; }[];
  /** Ambient crossfading background images */
  ambientImages?: string[];
  /** Gallery photos */
  spaceGallery?: { src: string; label: string }[];
  vegetarianMenu?: boolean;
  menu: Dish[];
}

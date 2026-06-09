import { Cafe } from './types';

/**
 * Dynamically loads cafe data from the local 'venues' directory.
 * This pattern ensures that only the requested cafe's data is downloaded by the customer.
 */
export async function loadCafeData(cafeId: string): Promise<Cafe | null> {
  try {
    // Normalize ID to lowercase for case-sensitive filesystems
    const normalizedId = cafeId.toLowerCase();
    
    // Dynamic import based on cafeId
    // Vite will automatically code-split these into separate small chunks
    const module = await import(`./venues/${normalizedId}.ts`);
    return module.data as Cafe;
  } catch (error) {
    console.error(`Failed to load data for cafe: ${cafeId}`, error);
    return null;
  }
}

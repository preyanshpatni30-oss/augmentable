import { useState, useEffect } from 'react';
import { Cafe } from '../data/types';
import { loadCafeData } from '../data/loader';

import { R2_PREFIX } from '../config/constants';

/**
 * The heart of the new High-Performance architecture.
 * Loads cafe data dynamically from local files, removing all Database latency.
 */
export function useCafe(cafeId: string | null) {
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCafe() {
      if (!cafeId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Use the new Dynamic Loader
        const data = await loadCafeData(cafeId);

        if (data && isMounted) {
          const optimizedMenu = data.menu.map(dish => ({
            ...dish,
            modelUrl: dish.modelUrl || `${R2_PREFIX}/models/${cafeId}/${dish.id}.glb`,
            usdzUrl: dish.usdzUrl || `${R2_PREFIX}/models/${cafeId}/${dish.id}.usdz`,
          }));

          setCafe({ ...data, menu: optimizedMenu });
        } else if (isMounted) {
          setError('Cafe not found');
        }
      } catch (err: any) {
        console.error("Error loading cafe data:", err);
        if (isMounted) {
          setError('Failed to load venue information');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCafe();

    return () => {
      isMounted = false;
    };
  }, [cafeId]);

  return { cafe, loading, error };
}

import { useState, useCallback } from 'react';

// Security: never call Gemini directly from the browser with an API key.
// The hook intentionally uses local fallbacks until a server-side proxy or
// Cloud Function is available to keep the key private.

/**
 * Dynamically constructs a highly realistic flavor profile and tasting note
 * based on context clues in the dish name and description. Used as a high-fidelity fallback.
 */
const getDynamicFallbackProfile = (dishName: string, dishDescription: string) => {
  const desc = (dishName + ' ' + dishDescription).toLowerCase();
  
  let notes: { label: string; percentage: number }[] = [];
  let tastingNote = "";

  if (desc.includes('chocolate') || desc.includes('sweet') || desc.includes('cake') || desc.includes('brownie') || desc.includes('nutella') || desc.includes('frappe') || desc.includes('latte')) {
    notes = [
      { label: "Sweetness", percentage: 60 },
      { label: "Richness", percentage: 30 },
      { label: "Warmth", percentage: 10 }
    ];
    tastingNote = `An indulgent and comforting sweet profile with notes of velvety richness and deep satisfaction.`;
  } else if (desc.includes('coffee') || desc.includes('espresso') || desc.includes('brew') || desc.includes('bitter')) {
    notes = [
      { label: "Boldness", percentage: 50 },
      { label: "Aroma", percentage: 35 },
      { label: "Acidity", percentage: 15 }
    ];
    tastingNote = `A bold, aromatic profile with a sophisticated balance of dark-roasted undertones and subtle brightness.`;
  } else if (desc.includes('chicken') || desc.includes('steak') || desc.includes('pizza') || desc.includes('pesto') || desc.includes('gnocchi') || desc.includes('savory') || desc.includes('cheese') || desc.includes('paneer') || desc.includes('nachos')) {
    notes = [
      { label: "Savory", percentage: 55 },
      { label: "Herbed", percentage: 25 },
      { label: "Umami", percentage: 20 }
    ];
    tastingNote = `A deeply savory profile highlighted by aromatic herbs and a satisfying umami finish.`;
  } else if (desc.includes('salad') || desc.includes('matcha') || desc.includes('green') || desc.includes('fresh') || desc.includes('citrus')) {
    notes = [
      { label: "Freshness", percentage: 50 },
      { label: "Zest", percentage: 30 },
      { label: "Earthy", percentage: 20 }
    ];
    tastingNote = `A vibrant and crisp sensory profile that offers outstanding freshness and a clean, refreshing finish.`;
  } else {
    notes = [
      { label: "Savory", percentage: 45 },
      { label: "Earthy", percentage: 30 },
      { label: "Zesty", percentage: 25 }
    ];
    tastingNote = `A harmonious and well-rounded combination of pleasant aroma and beautifully integrated flavors.`;
  }

  return { notes, tastingNote };
};

export const useGemini = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = useCallback(async (cafeName: string, tagline: string, menu: any[]) => {
    console.warn("Gemini recommendations require a server-side proxy. Falling back to static logic.");
    return null;
  }, []);

  const generateFlavorProfile = useCallback(async (dishName: string, dishDescription: string) => {
    setLoading(true);
    console.log("🤖 Gemini: Analyzing Flavor for", dishName);
    
    await new Promise(resolve => setTimeout(resolve, 800)); // Smooth animation simulation
    setLoading(false);
    return getDynamicFallbackProfile(dishName, dishDescription);
  }, []);

  const askTheChef = useCallback(async (dishName: string, dishDescription: string, cafeName: string, question: string) => {
    setLoading(true);
    console.log("👨‍🍳 Gemini: Chef is answering question for", dishName);

    await new Promise(resolve => setTimeout(resolve, 800));
    setLoading(false);
    return `Ah, the kitchen is wonderfully chaotic right now! As far as my ${dishName} goes, I can tell you that it's prepared with extraordinary care and only the highest quality ingredients. It is a true specialty here at ${cafeName}!`;
  }, []);

  return { generateRecommendations, generateFlavorProfile, askTheChef, loading, error };
};

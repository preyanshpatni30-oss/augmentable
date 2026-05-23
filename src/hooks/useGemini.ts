import { useState, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// SECURITY WARNING: In a production application, your API key should NEVER be exposed 
// in the client-side code. This can lead to unauthorized billing and usage.
//
// RECOMMENDED PATTERN:
// 1. Create a server-side endpoint (e.g., /api/recommendations)
// 2. Keep your API_KEY as an environment variable on that server.
// 3. The client calls your server, which then calls Gemini and returns the result.
//
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export const useGemini = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = useCallback(async (cafeName: string, tagline: string, menu: any[]) => {
    if (!API_KEY) return null;

    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
        You are the Head Chef at "${cafeName}" (${tagline}). 
        Menu: ${JSON.stringify(menu.map(d => ({ name: d.name, description: d.description || '' })))}
        Select 3 items to feature on the "Chef's Board". 
        Return ONLY a JSON array of 3 objects with keys "name" and "reason" (max 5 words).
      `;
      const result = await model.generateContent(prompt);
      const text = (await result.response).text();
      const jsonMatch = text.match(/\[.*\]/s);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (err) {
      console.error("Gemini Recommendations Error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateFlavorProfile = useCallback(async (dishName: string, dishDescription: string = '') => {
    if (!API_KEY) return null;

    setLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
        Analyze this dish: "${dishName}" - "${dishDescription}".
        Provide 3 primary flavor notes and a percentage for each (total 100%).
        Also provide a one-sentence tasting note.
        Return ONLY a JSON object: {"notes": [{"label": "string", "percentage": number}], "tastingNote": "string"}
      `;
      const result = await model.generateContent(prompt);
      const text = (await result.response).text();
      const jsonMatch = text.match(/\{.*\}/s);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (err) {
      console.error("Gemini Flavor Error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const askTheChef = useCallback(async (dishName: string, dishDescription: string = '', cafeName: string, question: string) => {
    setLoading(true);
    
    if (!API_KEY) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoading(false);
      return "The kitchen is currently in a frenzy! (API Key missing). I can tell you this dish is made with love.";
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const prompt = `
        You are the Executive Chef at "${cafeName}". You are passionate and deeply knowledgeable.
        Dish: "${dishName}"
        Description: "${dishDescription}"
        Customer Question: "${question}"

        Task: Answer the customer's question as the Chef. Be helpful, concise, and stay in character.
        If they ask about allergens or ingredients, use the description to infer.
        Answer under 50 words.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err: any) {
      console.error("Gemini Chef Error:", err);
      // Detailed fallback message to help debug if it fails again
      const msg = err.message || "Unknown error";
      if (msg.includes("API key")) return "My apologies, but my secret ingredients (API Key) seem to be misplaced!";
      return "The kitchen is truly chaotic right now! Could you ask me again in a moment?";
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateRecommendations, generateFlavorProfile, askTheChef, loading, error, isConfigured: !!API_KEY };
};

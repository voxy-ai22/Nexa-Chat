import { GoogleGenAI } from "@google/genai";

/**
 * NEXA AI CORE - POWERED BY GEMINI 3 PRO
 */
export const getAISuggestion = async (prompt: string) => {
  try {
    // Always use the named parameter and process.env.API_KEY as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-pro-preview for complex reasoning and assistant tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    // Access the .text property directly (not a method) as instructed.
    const textOutput = response.text;
    
    if (!textOutput) throw new Error("Respons AI tidak valid.");
    
    return textOutput;
  } catch (error) {
    console.error("NEXA_AI_CORE_FAILURE:", error);
    return "GAGAL MENGHUBUNGKAN KE NEXA AI HUB. PASTIKAN TOKEN AKTIF.";
  }
};

import { GoogleGenAI } from "@google/genai";

// getAISuggestion fetches business advice from NEXA AI.
export const getAISuggestion = async (prompt: string) => {
  try {
    // Guideline: Always use a named parameter and obtain API key directly from process.env.API_KEY.
    // Guideline: Create a new instance right before the call to ensure the latest config.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Guideline: Use ai.models.generateContent with model name and prompt.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are NEXA AI, an expert business consultant. Give concise, elite advice for Indonesian entrepreneurs in monochrome style. Be professional and bold.",
        temperature: 0.7,
      },
    });

    // Guideline: Extract text from GenerateContentResponse using the .text property.
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "NEXA AI encountered an error processing your request.";
  }
};

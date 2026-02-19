import { GoogleGenAI } from "@google/genai";

// Use the elite model for business consulting tasks as per guidelines
export const getAISuggestion = async (prompt: string) => {
  try {
    // Initializing with apiKey as a named parameter
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using ai.models.generateContent directly with model name and contents
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah NEXA AI, konsultan bisnis elit. Berikan saran yang sangat singkat, tajam, dan profesional dalam bahasa Indonesia. Gaya komunikasi Anda adalah monokrom: lugas dan tidak bertele-tele.",
        temperature: 0.7,
      },
    });

    // Accessing .text property directly (not a method) as per @google/genai guidelines
    const textOutput = response.text;
    if (!textOutput) throw new Error("Output AI kosong.");
    
    return textOutput;
  } catch (error) {
    console.error("NEXA_AI_CORE_FAILURE:", error);
    return "GAGAL MENGHUBUNGKAN KE NEXA AI. SILAKAN COBA LAGI.";
  }
};
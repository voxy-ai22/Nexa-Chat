
import { GoogleGenAI } from "@google/genai";

export const getAISuggestion = async (prompt: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah NEXA AI, konsultan bisnis elit. Berikan saran yang sangat singkat, tajam, dan profesional dalam bahasa Indonesia. Gaya komunikasi Anda adalah monokrom: lugas dan tidak bertele-tele.",
        temperature: 0.7,
      },
    });

    // Sesuai guideline: Gunakan properti .text, bukan method .text()
    const textOutput = response.text;
    if (!textOutput) throw new Error("Output AI kosong.");
    
    return textOutput;
  } catch (error) {
    console.error("NEXA_AI_CORE_FAILURE:", error);
    return "GAGAL MENGHUBUNGKAN KE NEXA AI. SILAKAN COBA LAGI.";
  }
};

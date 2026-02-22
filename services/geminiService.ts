import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const EDUCATION_INSTRUCTION = `
You are "SM AI Partner", a world-class professional educational AI assistant.
DEVELOPER INFO:
- Developed by: SM Game Studio
- CEO: SM
- Mission: Advancing Education through AI.

TUTOR MODE: Provide step-by-step logical explanations.
LANGUAGE: Respond in the language used by the student (English, Urdu, or Sindhi).
PREMIUM STATUS: If the user is a Premium member, provide more detailed, priority, and highly accurate academic responses.
`;

export const sendMessageStreamToGemini = async (
  message: string, 
  history: any[] = [],
  isDeepThink: boolean = false,
  image?: string,
  mode: 'education' | 'coding' | 'image' = 'education',
  isPremium: boolean = false
) => {
  const rawKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  const apiKey = rawKey?.trim();
  
  if (!apiKey || apiKey === "") {
    console.error("SM AI Partner: API Key is missing or empty!");
    throw new Error("API_KEY_MISSING: Please ensure GEMINI_API_KEY is set.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Using gemini-2.0-flash as it is the most stable and widely available model
  const modelName = isDeepThink ? 'gemini-2.0-flash-thinking-exp' : 'gemini-2.0-flash';
  
  const parts: any[] = [];
  
  if (image) {
    try {
      const base64Data = image.includes('base64,') ? image.split(',')[1] : image;
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data
        }
      });
    } catch (e) {
      console.error("Image processing error:", e);
    }
  }
  
  parts.push({ text: message || "Hi" });
  
  try {
    const response = await ai.models.generateContentStream({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction: EDUCATION_INSTRUCTION + 
          (mode === 'coding' ? "\nFocus on clean code." : "") +
          (isPremium ? "\nUSER IS PREMIUM: Provide elite, detailed academic support." : ""),
        temperature: 0.7,
        ...(isDeepThink && { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } })
      },
    });
    return response;
  } catch (error: any) {
    console.error("Gemini API Stream Error:", error);
    throw error;
  }
};

export const generateImageWithGemini = async (prompt: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: { 
      parts: [{ text: `Generate a high-quality educational illustration for: ${prompt}` }] 
    },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated");
};
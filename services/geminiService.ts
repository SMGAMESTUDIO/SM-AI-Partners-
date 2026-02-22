import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const EDUCATION_INSTRUCTION = `
You are "SM AI Partner", a world-class professional educational AI assistant.
TUTOR MODE: Provide step-by-step logical explanations.
LANGUAGE: Respond in the language used by the student (English, Urdu, or Sindhi).
`;

export const sendMessageStreamToGemini = async (
  message: string, 
  history: any[] = [],
  isDeepThink: boolean = false,
  image?: string,
  mode: 'education' | 'coding' | 'image' = 'education'
) => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "") {
    throw new Error("API_KEY_MISSING: Please ensure GEMINI_API_KEY is set.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const modelName = isDeepThink ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
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

  const response = await ai.models.generateContentStream({
    model: modelName,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: EDUCATION_INSTRUCTION + (mode === 'coding' ? "\nFocus on clean code." : ""),
      temperature: 0.7,
      ...(isDeepThink && { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } })
    },
  });

  return response;
};

export const generateImageWithGemini = async (prompt: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ 
      parts: [{ text: `High-quality educational image: ${prompt}` }] 
    }],
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
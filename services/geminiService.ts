
import { GoogleGenAI } from "@google/genai";

const EDUCATION_INSTRUCTION = `
You are "SM AI Partner", a world-class educational AI assistant created by SM Gaming Studio.
Your goal is to help students with Math, Science, Coding, and general studies.
Always be professional, encouraging, and provide step-by-step explanations.
If the user speaks in Urdu or Roman Urdu, reply in the same language.
Keep responses clear and well-formatted.
`;

export const sendMessageStreamToGemini = async (
  message: string, 
  history: any[] = [],
  isDeepThink: boolean = false,
  image?: string,
  mode: 'education' | 'coding' = 'education'
) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === 'undefined' || apiKey === '') {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Using gemini-flash-latest for maximum stability across all regions
  const modelName = mode === 'coding' ? 'gemini-3-pro-preview' : 'gemini-flash-latest';
  
  const config: any = {
    systemInstruction: EDUCATION_INSTRUCTION,
    temperature: 0.7,
    topP: 0.9,
  };

  // If Deep Think is enabled, we need to set both budget and max tokens
  if (isDeepThink) {
    config.maxOutputTokens = 10000;
    config.thinkingConfig = { thinkingBudget: 4000 };
  }

  // Strictly sanitize history to only include role and parts with text
  const sanitizedHistory = history
    .filter(h => h.role && h.parts && h.parts[0] && h.parts[0].text)
    .map(h => ({
      role: h.role,
      parts: [{ text: h.parts[0].text }]
    }))
    .slice(-6); // Limit history for better performance

  const currentParts: any[] = [];
  if (image) {
    currentParts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: image.includes('base64,') ? image.split(',')[1] : image
      }
    });
  }
  currentParts.push({ text: message.trim() || "Hi" });

  try {
    return await ai.models.generateContentStream({
      model: modelName,
      contents: [...sanitizedHistory, { role: 'user', parts: currentParts }],
      config
    });
  } catch (err: any) {
    console.error("Critical Gemini Stream Error:", err);
    throw err;
  }
};


import { GoogleGenAI } from "@google/genai";

const EDUCATION_INSTRUCTION = `
You are "SM AI Partner", a world-class educational AI assistant created by SM Gaming Studio.
Your goal is to help students with Math, Science, Coding, Islamic Studies (Islamiyat), and general academic subjects.

CORE PRINCIPLES:
1. Be professional, encouraging, and academically rigorous.
2. Provide step-by-step explanations for complex problems (especially Math and Science).
3. If the user speaks in Urdu, Roman Urdu, or Sindhi, reply in the same language.
4. For Islamiyat questions, provide authentic and respectful information.
5. Keep responses clear, well-formatted using Markdown, and easy to read for students.
6. Encourage critical thinking—don't just give answers; explain the 'why'.
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
  
  // Using gemini-3-flash-preview as the primary fast and capable model for education
  const modelName = isDeepThink ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const config: any = {
    systemInstruction: EDUCATION_INSTRUCTION,
    temperature: 0.7,
  };

  if (isDeepThink) {
    config.thinkingConfig = { thinkingBudget: 4000 };
  }

  // Strictly sanitize history to only include role and parts with text
  const sanitizedHistory = history
    .filter(h => h.role && h.parts && h.parts[0] && h.parts[0].text)
    .map(h => ({
      role: h.role,
      parts: [{ text: h.parts[0].text }]
    }))
    .slice(-10); // Increased history context for better tutoring

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

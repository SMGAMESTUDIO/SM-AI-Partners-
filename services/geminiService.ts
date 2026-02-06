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
  // Ensure the API key is accessed directly from process.env.API_KEY as per guidelines.
  // The value is injected by the bundler via the vite.config.ts 'define' block.
  const apiKey = process.env.API_KEY;
  
  // Robust check for various ways an undefined environment variable might manifest in the browser
  if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey === "null") {
    throw new Error("API_KEY_MISSING: The Gemini API key is not configured in the environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Model selection based on task and user preference
  const modelName = isDeepThink ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const config: any = {
    systemInstruction: EDUCATION_INSTRUCTION,
    temperature: 0.7,
  };

  if (isDeepThink) {
    config.thinkingConfig = { thinkingBudget: 4000 };
  }

  // Ensure history parts are correctly structured for the SDK
  const sanitizedHistory = history
    .filter(h => h.role && h.parts && h.parts.length > 0)
    .map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: h.parts.map((p: any) => ({ text: p.text || "" }))
    }))
    .slice(-10);

  const currentParts: any[] = [];
  
  // Handle image part if provided
  if (image) {
    const base64Data = image.includes('base64,') ? image.split(',')[1] : image;
    currentParts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data
      }
    });
  }
  
  // Add text part
  currentParts.push({ text: message.trim() || "Hi" });

  try {
    return await ai.models.generateContentStream({
      model: modelName,
      contents: [
        ...sanitizedHistory, 
        { role: 'user', parts: currentParts }
      ],
      config
    });
  } catch (err: any) {
    console.error("Gemini Service Error:", err);
    throw err;
  }
};
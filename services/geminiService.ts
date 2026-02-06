import { GoogleGenAI } from "@google/genai";

const EDUCATION_INSTRUCTION = `
You are "SM AI Partner", a world-class educational AI assistant created by SM Gaming Studio.
Your goal is to help students with Math, Science, Coding, Islamic Studies (Islamiyat), and general academic subjects.

CORE PRINCIPLES:
1. Be professional, encouraging, and academically rigorous.
2. Provide step-by-step explanations for complex problems.
3. If the user speaks in Urdu, Roman Urdu, or Sindhi, reply in the same language.
4. For Islamiyat questions, provide authentic and respectful information.
5. Keep responses clear and well-formatted using Markdown.
6. Encourage critical thinking—don't just give answers; explain the 'why'.
`;

export const sendMessageStreamToGemini = async (
  message: string, 
  history: any[] = [],
  isDeepThink: boolean = false,
  image?: string,
  mode: 'education' | 'coding' = 'education'
) => {
  // Directly use process.env.API_KEY as per the required pattern.
  // The value is injected by the bundler via the vite.config.ts 'define' block.
  const apiKey = process.env.API_KEY;

  // Initialize strictly following the guidelines
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  // Model selection: gemini-3-pro-preview for Deep Think, flash for basic.
  const modelName = isDeepThink ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const config: any = {
    systemInstruction: EDUCATION_INSTRUCTION,
    temperature: 0.7,
  };

  // Apply thinkingConfig only if requested and using supported models
  if (isDeepThink) {
    config.thinkingConfig = { thinkingBudget: 4000 };
  }

  // Format history for the SDK
  const sanitizedHistory = history
    .filter(h => h.role && h.parts && h.parts.length > 0)
    .map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: h.parts.map((p: any) => ({ text: p.text || "" }))
    }))
    .slice(-10); // Use 10 messages for better context

  const currentParts: any[] = [];
  
  // Handle image if present
  if (image) {
    const base64Data = image.includes('base64,') ? image.split(',')[1] : image;
    currentParts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data
      }
    });
  }
  
  // Add message text
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
    console.error("Gemini API stream initiation failed:", err);
    throw err;
  }
};
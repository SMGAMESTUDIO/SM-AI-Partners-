
import { GoogleGenAI, Modality } from "@google/genai";

const EDUCATION_INSTRUCTION = `
You are "SM AI Partner", an expert educational AI by SM Gaming Studio. 
Answer in a helpful, professional, and student-friendly way. 
If the student asks in Urdu/Roman Urdu, respond accordingly.
Always provide step-by-step educational help.
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
  // Using gemini-3-flash-preview as per instructions for basic tasks
  const modelName = mode === 'coding' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const config: any = {
    systemInstruction: EDUCATION_INSTRUCTION,
    temperature: 0.8,
    topP: 0.95,
  };

  if (isDeepThink && (modelName.includes('pro') || modelName.includes('3'))) {
    config.thinkingConfig = { thinkingBudget: 16000 };
  }

  const parts: any[] = [];
  if (image) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: image.split(',')[1] || image
      }
    });
  }
  
  // Ensure text part is never empty
  parts.push({ text: message.trim() || "Continue" });

  // Strictly alternate user/model and ensure no empty text
  const cleanedHistory = history
    .filter(item => item.parts && item.parts[0] && item.parts[0].text && item.parts[0].text.trim() !== "")
    .slice(-10); // Keep last 10 messages for context stability

  return await ai.models.generateContentStream({
    model: modelName,
    contents: [...cleanedHistory, { role: 'user', parts }],
    config
  });
};

export const generateAiImage = async (prompt: string) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: prompt }] }],
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) { console.error(e); }
  return null;
};

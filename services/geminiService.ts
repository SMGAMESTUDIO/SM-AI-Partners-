
import { GoogleGenAI, Modality } from "@google/genai";

const EDUCATION_INSTRUCTION = `
You are "SM AI Partner", a professional educational assistant developed by SM Gaming Studio.
Your goal is to help students with Math, Science, IT, History, Islamiyat, and Languages.
Provide step-by-step solutions. Use simple language.
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
  const modelName = mode === 'coding' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const config: any = {
    systemInstruction: EDUCATION_INSTRUCTION,
    temperature: 0.7, 
  };

  if (isDeepThink) {
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
  
  parts.push({ text: message || "Hello" });

  const validatedHistory = history.filter((item, index) => {
    if (index === 0) return item.role === 'user';
    return item.role !== history[index - 1].role;
  });

  return await ai.models.generateContentStream({
    model: modelName,
    contents: [...validatedHistory, { role: 'user', parts }],
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

export const getSpeechAudio = async (text: string) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.substring(0, 500) }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (e) { return null; }
};

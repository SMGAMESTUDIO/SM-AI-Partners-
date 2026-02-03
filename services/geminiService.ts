
import { GoogleGenAI, Modality } from "@google/genai";

const EDUCATION_INSTRUCTION = `
You are "SM AI Partner", a professional educational assistant developed by SM Gaming Studio.
- Your goal is to help students with Math, Science, IT, History, Islamiyat, and Languages.
- Provide step-by-step solutions for Math and Physics problems.
- Use simple, encouraging language.
- Format responses with clear headings, bullet points, and LaTeX-style bolding for formulas.
`;

const CODING_INSTRUCTION = `
You are "SM AI Partner - Coding Expert". 
- Provide high-quality, professional code.
- Focus on logic, optimization, and debugging.
- Explain concepts clearly for students.
`;

export const sendMessageStreamToGemini = async (
  message: string, 
  history: any[] = [],
  isDeepThink: boolean = false,
  image?: string,
  mode: 'education' | 'coding' = 'education'
) => {
  // Directly initializing with the required pattern for automatic injection
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = mode === 'coding' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const config: any = {
    systemInstruction: mode === 'coding' ? CODING_INSTRUCTION : EDUCATION_INSTRUCTION,
    temperature: isDeepThink ? 0.4 : 0.7, 
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
  
  parts.push({ text: message || (image ? "Please explain this image." : "Hello") });

  const validatedHistory = history.filter((item, index) => {
    if (index === 0) return item.role === 'user';
    return item.role !== history[index - 1].role;
  });

  try {
    return await ai.models.generateContentStream({
      model: modelName,
      contents: [
        ...validatedHistory,
        { role: 'user', parts: parts }
      ],
      config: config
    });
  } catch (err: any) {
    console.error("Gemini Connection Error:", err);
    throw new Error(err.message || "Connection error. Please check your API key in Vercel.");
  }
};

export const generateAiImage = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: `Educational high-quality illustration: ${prompt}` }] }],
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) {
    console.error("Image Gen Error:", e);
  }
  return null;
};

export const getSpeechAudio = async (text: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const cleanText = text.replace(/[*_#`~>|\[\]\(\)]/g, '').substring(0, 1500); 
    if (!cleanText) return null;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

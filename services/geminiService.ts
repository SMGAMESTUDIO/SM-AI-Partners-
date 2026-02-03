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
  // Use the API key from environment variables
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.includes("placeholder")) {
    throw new Error("API_KEY is missing. Please add your key to Vercel Environment Variables (Settings > Environment Variables > API_KEY).");
  }

  const ai = new GoogleGenAI({ apiKey });
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

  // Safety check: ensure history alternates correctly
  // Gemini expects: User, Model, User, Model...
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
    if (err.message?.includes("403") || err.message?.includes("401")) {
      throw new Error("Invalid API Key. Please check your Gemini API key.");
    }
    throw new Error(err.message || "Failed to connect to AI. Check your internet connection.");
  }
};

export const generateAiImage = async (prompt: string) => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });
  
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
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  const ai = new GoogleGenAI({ apiKey });

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

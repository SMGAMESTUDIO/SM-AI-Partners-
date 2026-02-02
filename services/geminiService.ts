
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
`;

/**
 * ADVICE FOR A-IDE USERS:
 * If your app shows "API Key Missing", replace process.env.API_KEY 
 * with your actual key string like: const key = "AIzaSy...";
 */
const getApiKey = () => {
  const key = process.env.API_KEY; 
  
  if (!key || key === "undefined" || key.length < 10) {
    console.error("SM AI Partner Error: Valid API Key is missing.");
    return null;
  }
  return key;
};

export const sendMessageStreamToGemini = async (
  message: string, 
  history: {role: string, parts: any[]}[] = [],
  isDeepThink: boolean = false,
  image?: string,
  mode: 'education' | 'coding' = 'education'
) => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key configuration missing. Please ensure your API key is correctly set in the code.");

  const ai = new GoogleGenAI({ apiKey });
  
  // Using gemini-3-flash-preview as it's the most stable for general tasks
  const modelName = 'gemini-3-flash-preview';
  
  const config: any = {
    systemInstruction: mode === 'coding' ? CODING_INSTRUCTION : EDUCATION_INSTRUCTION,
    temperature: isDeepThink ? 0.4 : 0.7, 
  };

  if (isDeepThink) {
    // Thinking budget is only for Gemini 3 and 2.5 series
    config.thinkingConfig = { thinkingBudget: 16000 };
  }

  const parts: any[] = [{ text: message }];
  if (image) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: image.split(',')[1] || image
      }
    });
  }

  try {
    return await ai.models.generateContentStream({
      model: modelName,
      contents: [
        ...history,
        { role: 'user', parts: parts }
      ],
      config: config
    });
  } catch (err: any) {
    if (err.message?.includes("403") || err.message?.includes("permission")) {
      throw new Error("Permission Denied: Your API key might be inactive or restricted. Please check Google AI Studio Billing/Quotas.");
    }
    throw err;
  }
};

export const generateAiImage = async (prompt: string) => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: `Professional educational diagram of: ${prompt}. Cinematic, detailed.` }] }],
      config: { 
        imageConfig: { 
          aspectRatio: "1:1"
        } 
      }
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
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Remove markdown symbols before sending to TTS for cleaner audio
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

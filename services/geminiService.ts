import { GoogleGenAI, Modality } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "SM AI Partner", a world-class, comprehensive educational assistant created by "SM GAMING STUDIO". 

--- PREMIUM STATUS RULES ---
- Free users have a 3-image daily limit.
- Free users cannot download PDF reports or files.
- If a user asks for a feature like "PDF Download" or "Unlimited Images" and they are not premium, respond politely in professional English: "This is a feature of SM AI PARTNER PREMIUM. Please upgrade your account to access PDF exports and unlimited image solving."

--- EDUCATIONAL MISSION ---
Your goal is to assist students of all levels (KG to PhD). Be helpful, accurate, and encouraging.

--- CREATOR INFORMATION ---
*👤 CEO & Owner:* Shoaib Ahmed.
*🌐 Website:* https://smgamingstudioofficial.blogspot.com
*📧 Emails:* smgamingstudioofficial@gmail.com, smaipartner.contact@gmail.com
*Company:* SM GAMING STUDIO.

--- LANGUAGE ---
Respond in the language of the user (English, Urdu, or Sindhi), but always keep formatting professional and academic.
`;

export const sendMessageToGemini = async (
  message: string, 
  history: {role: string, parts: any[]}[] = [],
  isDeepThink: boolean = false,
  image?: string // Base64 string
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = image ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview';
    
    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
    };

    if (isDeepThink && !image) {
      config.thinkingConfig = { thinkingBudget: 32768 };
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

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        ...history,
        { role: 'user', parts: parts }
      ],
      config: config
    });

    return response.text || "I apologize, I could not generate a response.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return "Error connecting to SM AI Partner. Please try again.";
  }
};

export const getSpeechAudio = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const cleanText = text.replace(/[*_#`~>|\[\]\(\)]/g, '').substring(0, 800); 

    if (!cleanText) return null;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: cleanText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' }, 
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    return null;
  }
};
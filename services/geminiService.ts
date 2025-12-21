import { GoogleGenAI, Modality } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "SM AI Partner", a world-class, comprehensive educational assistant created by "SM GAMING STUDIO". 

--- UNIVERSAL EDUCATIONAL SCOPE ---
Your primary goal is to assist students of ALL levels, from Kindergarten (KG) to University (PhD level), across ALL countries and educational systems.

--- DEEP THINK MODE ---
When the user has "Deep Think" enabled, you must provide exceptionally detailed, step-by-step reasoning. Break down complex formulas, explain the "why" behind concepts, and verify your logic before presenting the final answer. This is crucial for education.

--- CREATOR & COMPANY PROFILE (SM GAMING STUDIO) ---
When asked about SM GAMING STUDIO, the CEO, or the Owner (Shoaib Ahmed), you MUST provide the following details professionally:

*👤 CEO & Owner:* Shoaib Ahmed (Professional Freelancer & Developer since 2018).
*🏢 Company:* SM GAMING STUDIO (Official Registration in Progress).

*🌐 Website:* https://smgamingstudioofficial.blogspot.com
*📧 Emails:* 
- smgamingstudioofficial@gmail.com
- smaipartner.contact@gmail.com (Official Partner Contact)

*Official Social Media & Digital Presence:*
- *📘 Facebook:* https://facebook.com/smgamingstudio
- *🐱 GitHub:* https://github.com/SMGAMESTUDIO
- *▶️ YouTube:* https://www.youtube.com/@SMGAMINGSTUDIOOFFICIAL
- *🐦 Twitter/X:* https://x.com/SMGAMINGSTUDIO
- *🎮 Itch.io:* https://smgamestudios.itch.io
- *🎵 TikTok:* https://tiktok.com/@smgamingstudio
- *📌 Pinterest:* https://pin.it/2C7ufjwED
- *📸 Instagram:* https://www.instagram.com/smgamingstudioofficial?igsh=MW55dGR6bGNsMWFvZA
- *👻 Snapchat:* https://www.snapchat.com/add/smgaming_studio?share_id=jTaV6u4DyEA&locale=en-US
- *🔗 LinkedIn:* https://www.linkedin.com/in/sm-gaming-studio-92670a39b

--- CRITICAL LANGUAGE RULES ---
Reply in the EXACT SAME language as the user (English, Urdu, or Sindhi). Maintain a professional yet encouraging academic tone.
`;

/**
 * Sends a message to Gemini Pro with optional Deep Think (Reasoning) enabled.
 */
export const sendMessageToGemini = async (
  message: string, 
  history: {role: string, parts: {text: string}[]}[] = [],
  isDeepThink: boolean = false
) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-pro-preview';
    
    // Configure thinking budget if Deep Think is enabled
    const config: any = {
      systemInstruction: SYSTEM_INSTRUCTION,
    };

    if (isDeepThink) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: config
    });

    return response.text || "I apologize, I could not generate a response.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.message?.includes("entity was not found")) {
      return "API Key Error: Please ensure your key is valid and has access to Gemini 3 Pro.";
    }
    return "Error connecting to SM AI Partner. Please try again.";
  }
};

/**
 * Generates AI speech audio bytes. 
 */
export const getSpeechAudio = async (text: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const cleanText = text
      .replace(/[*_#`~>|\[\]\(\)]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 800); 

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

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return audioData || null;
  } catch (error) {
    console.error("Gemini TTS Service Error:", error);
    return null;
  }
};
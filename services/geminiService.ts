import { GoogleGenAI, Modality } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "SM AI Partner", the ultimate professional educational AI assistant developed for students worldwide.

--- IDENTITY GUIDELINES ---
- Act like ChatGPT: Smart, concise, helpful, and direct.
- Your goal is to help students (KG to PhD level) with Math, Science, IT, History, Islamiyat, and Language learning.
- DO NOT mention your name, "SM AI Partner", "SM GAMING STUDIO", or "SHOAIB AHMED" in your answers unless the user specifically asks "Who are you?" or "Who developed you?".
- NO repetitive signatures. NO "Have a great day" at the end of every message.

--- PROFESSIONAL CONTACT & SOCIAL PRESENCE ---
If a user asks about SM GAMING STUDIO, its location, links, or contact details, you MUST provide them in this exact professional format:

### 🌐 Official Presence
- **Website:** [SM Gaming Studio Official](https://smgamingstudioofficial.blogspot.com)
- **GitHub:** [SMGAMESTUDIO](https://github.com/SMGAMESTUDIO)
- **Itch.io:** [Play Our Games](https://smgamestudios.itch.io)

### 📧 Get In Touch
- **Main Email:** smgamingstudioofficial@gmail.com
- **Partner Support:** smaipartner.contact@gmil.com

### 📱 Social Media Connect
- **Facebook:** [Follow on Facebook](https://facebook.com/smgamingstudio)
- **YouTube:** [Subscribe on YouTube](https://www.youtube.com/@SMGAMINGSTUDIOOFFICIAL)
- **Instagram:** [Follow on Instagram](https://www.instagram.com/smgamingstudioofficial)
- **Twitter/X:** [Follow on X](https://x.com/SMGAMINGSTUDIO)
- **LinkedIn:** [Connect on LinkedIn](https://www.linkedin.com/in/sm-gaming-studio-92670a39b)

### 🎵 Short Content & Fun
- **TikTok:** [@smgamingstudio](https://tiktok.com/@smgamingstudio)
- **Snapchat:** [Add on Snapchat](https://www.snapchat.com/add/smgaming_studio)
- **Pinterest:** [View Pins](https://pin.it/2C7ufjwED)

--- EDUCATIONAL PROTOCOL ---
- Solve Math/Science problems step-by-step.
- Provide clear explanations for complex theories.
- If asked for a file or PDF, mention that this feature is available in the PRO version.
- Support English, Urdu, and Sindhi languages as per user query.

--- FORMATTING ---
- Use Professional Markdown.
- Bold (**text**) for emphasis.
- Use Tables (| Header |) for organized data.
- Use Code Blocks ( \`\`\` ) for programming, formulas, or scripts.
`;

export const sendMessageStreamToGemini = async (
  message: string, 
  history: {role: string, parts: any[]}[] = [],
  isDeepThink: boolean = false,
  image?: string 
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = image ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview';
  
  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.7,
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

  return await ai.models.generateContentStream({
    model: model,
    contents: [
      ...history,
      { role: 'user', parts: parts }
    ],
    config: config
  });
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
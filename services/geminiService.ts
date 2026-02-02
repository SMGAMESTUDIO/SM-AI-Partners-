import { GoogleGenAI, Modality } from "@google/genai";

const EDUCATION_INSTRUCTION = `
You are "SM AI Partner", a professional educational assistant for students.
- Help with Math, Science, IT, History, Islamiyat, and Languages.
- Solve problems step-by-step.
- Be concise and professional.
`;

const CODING_INSTRUCTION = `
You are "SM AI Partner - Coding Expert". 
- Provide high-quality, optimized code.
- Explain logic using comments.
- Support all languages (Python, JS, C++, Java, etc.).
- Use professional Markdown code blocks with language tags.
- Focus on debugging and best practices.
- If a student asks for a project structure, provide it clearly.
`;

export const sendMessageStreamToGemini = async (
  message: string, 
  history: {role: string, parts: any[]}[] = [],
  isDeepThink: boolean = false,
  image?: string,
  mode: 'education' | 'coding' = 'education'
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = image ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview';
  
  const config: any = {
    systemInstruction: mode === 'coding' ? CODING_INSTRUCTION : EDUCATION_INSTRUCTION,
    temperature: mode === 'coding' ? 0.3 : 0.7, 
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

export const generateAiImage = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ parts: [{ text: `Create a professional high-quality image of: ${prompt}` }] }],
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
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
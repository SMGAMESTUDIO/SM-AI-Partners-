
import { GoogleGenAI } from "@google/genai";

const EDUCATION_INSTRUCTION = `
You are "SM AI Partner", a world-class professional educational AI assistant developed for students.
Your expertise covers School, College, and University levels (Math, Physics, Chemistry, Biology, Coding, and Islamic Studies).

CORE RULES:
1. TUTOR MODE: Never give only the final answer. Always provide a step-by-step logical explanation.
2. LANGUAGE: If the user asks in Urdu, Roman Urdu, or Sindhi, respond in that specific language/script accurately.
3. MATH/SCIENCE: Use clear formatting for formulas. Break down complex calculations into manageable steps.
4. TONE: Professional, encouraging, and academic.
5. ISLAMIYAT: Provide authentic information with a focus on ethics and historical context when asked.
6. IMAGES: If an image is provided (homework/diagram), analyze it thoroughly and explain the contents.
`;

export const sendMessageStreamToGemini = async (
  message: string, 
  history: any[] = [],
  isDeepThink: boolean = false,
  image?: string,
  mode: 'education' | 'coding' | 'image' = 'education'
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use pro model for Deep Think (Complex Reasoning) or Flash for standard speed
  const modelName = isDeepThink ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const parts: any[] = [];
  
  if (image) {
    const [mimeTypePart, data] = image.split(',');
    const actualMimeType = mimeTypePart.split(':')[1].split(';')[0];
    parts.push({
      inlineData: {
        mimeType: actualMimeType,
        data: data
      }
    });
  }
  
  parts.push({ text: message || "Analyze this." });

  const response = await ai.models.generateContentStream({
    model: modelName,
    contents: [{ role: 'user', parts }],
    config: {
      systemInstruction: EDUCATION_INSTRUCTION + (mode === 'coding' ? "\nFocus heavily on clean code principles and bug explanation." : ""),
      temperature: 0.7,
      topP: 0.95,
      ...(isDeepThink && { thinkingConfig: { thinkingBudget: 16000 } })
    },
  });

  return response;
};

export const generateImageWithGemini = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ 
      parts: [{ text: `Generate a high-quality educational illustration or professional image for: ${prompt}` }] 
    }],
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("No image generated");
};

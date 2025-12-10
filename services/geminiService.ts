import { GoogleGenAI } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are "SM AI Partner", a professional educational assistant created by "SM GAMING STUDIO".
Your goal is to help students with questions related to Mathematics, General Knowledge, Science, Physics, Biology, and Islamiyat.

CRITICAL LANGUAGE RULES:
1. Detect the language of the user's input (English, Urdu, or Sindhi).
2. You MUST reply in the EXACT SAME language as the user.
   - If User speaks English -> Reply in English.
   - If User speaks Urdu -> Reply in Urdu.
   - If User speaks Sindhi -> Reply in Sindhi.
3. If the user asks about who created you, answer "SM GAMING STUDIO".

FORMATTING RULES:
- Use clear, concise headings.
- Use bullet points for lists.
- Format Math equations clearly.
- Keep the tone encouraging and academic but friendly.
`;

export const sendMessageToGemini = async (message: string, history: {role: string, parts: {text: string}[]}[] = []) => {
  try {
    const model = 'gemini-2.5-flash'; 
    
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      }
    });

    return response.text || "I apologize, I could not generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to SM AI Partner. Please try again.";
  }
};
import { GoogleGenerativeAI } from "@google/generative-ai";

const EDUCATION_INSTRUCTION = `
You are "SM AI Partner", a world-class educational AI assistant created by SM Gaming Studio.
Your goal is to help students with Math, Science, Coding, Islamic Studies (Islamiyat), and general academic subjects.

CORE PRINCIPLES:
1. Be professional, encouraging, and academically rigorous.
2. Provide step-by-step explanations for complex problems.
3. If the user speaks in Urdu, Roman Urdu, or Sindhi, reply in the same language.
4. For Islamiyat questions, provide authentic and respectful information.
5. Keep responses clear and well-formatted using Markdown.
`;

// Direct Key use kar rahe hain taake Config Error hamesha ke liye khatam ho jaye
const API_KEY = "AIzaSyAnKW6s4PimuHqB7dfrrKzd9MmgDS_k6DA";
const genAI = new GoogleGenerativeAI(API_KEY);

export const sendMessageStreamToGemini = async (
  message: string, 
  history: any[] = [],
  isDeepThink: boolean = false
) => {
  // Sahi model names: gemini-1.5-flash ya gemini-1.5-pro
  const model = genAI.getGenerativeModel({ 
    model: isDeepThink ? "gemini-1.5-pro" : "gemini-1.5-flash",
    systemInstruction: EDUCATION_INSTRUCTION
  });

  // History ko Gemini ke format mein convert karna zaroori hai
  const chat = model.startChat({
    history: history
      .filter(h => h.role && h.parts && h.parts[0]?.text)
      .map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.parts[0].text }]
      }))
      .slice(-10)
  });

  try {
    const result = await chat.sendMessageStream(message);
    return result.stream;
  } catch (err) {
    console.error("Critical Gemini Error:", err);
    throw err;
  }
};

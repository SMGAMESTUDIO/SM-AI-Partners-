import { GoogleGenerativeAI } from "@google/generative-ai";

const EDUCATION_INSTRUCTION = `
You are "SM AI Partner", a world-class educational AI assistant created by SM Gaming Studio.
Your goal is to help students with Math, Science, Coding, Islamic Studies (Islamiyat), and general academic subjects.
`;

// Direct Key use kar rahe hain taake Config Error hamesha ke liye khatam ho jaye
const API_KEY = "AIzaSyAnKW6s4PimuHqB7dfrrKzd9MmgDS_k6DA";
const genAI = new GoogleGenerativeAI(API_KEY);

export const sendMessageStreamToGemini = async (
  message: string, 
  history: any[] = [],
  isDeepThink: boolean = false
) => {
  // Sahi model names use kar rahe hain
  const model = genAI.getGenerativeModel({ 
    model: isDeepThink ? "gemini-1.5-pro" : "gemini-1.5-flash",
    systemInstruction: EDUCATION_INSTRUCTION
  });

  const chat = model.startChat({
    history: history
      .filter(h => h.role && h.parts && h.parts[0]?.text)
      .map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.parts[0].text }]
      }))
  });

  try {
    const result = await chat.sendMessageStream(message);
    return result.stream;
  } catch (err) {
    console.error("Gemini Error:", err);
    throw err;
  }
};

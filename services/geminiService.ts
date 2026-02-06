import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAnKW6s4PimuHqB7dfrrKzd9MmgDS_k6DA";
const genAI = new GoogleGenerativeAI(API_KEY);

export const sendMessageStreamToGemini = async (message: string, history: any[] = []) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.parts[0].text }]
    }))
  });
  try {
    const result = await chat.sendMessageStream(message);
    return result.stream;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

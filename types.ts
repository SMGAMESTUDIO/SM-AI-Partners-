export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  image?: string; // Base64 image data
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}

export interface UserUsage {
  imagesSentToday: number;
  imagesGeneratedToday: number;
  lastImageDate: string; // YYYY-MM-DD
  isPremium: boolean;
}

export enum Language {
  ENGLISH = 'en-US',
  URDU = 'ur-PK',
  SINDHI = 'sd-PK' 
}
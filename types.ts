export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
}

export enum Language {
  ENGLISH = 'en-US',
  URDU = 'ur-PK',
  SINDHI = 'sd-PK' 
}
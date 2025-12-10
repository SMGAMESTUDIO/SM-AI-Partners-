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

export enum Language {
  ENGLISH = 'en-US',
  URDU = 'ur-PK',
  // Sindhi is not always standard in Web Speech API, using generic or trying specific locale if available
  SINDHI = 'sd-PK' 
}
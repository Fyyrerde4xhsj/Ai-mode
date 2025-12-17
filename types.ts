export enum ViewState {
  HOME = 'HOME',
  VIDEO_EDITOR = 'VIDEO_EDITOR',
  SUBTITLES = 'SUBTITLES',
  PHOTO_ENHANCER = 'PHOTO_ENHANCER',
  FACE_SWAP = 'FACE_SWAP',
  IMAGE_COMPRESSOR = 'IMAGE_COMPRESSOR',
  SCRIPT_WRITER = 'SCRIPT_WRITER',
  IDEA_GENERATOR = 'IDEA_GENERATOR',
  NOTES = 'NOTES',
  PLANNER = 'PLANNER',
  REMINDERS = 'REMINDERS',
  BLOG = 'BLOG',
  ADMIN = 'ADMIN',
  LOGIN = 'LOGIN'
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  date: string;
}

export interface AdConfig {
  location: 'home' | 'video' | 'sidebar' | 'popup';
  code: string;
  enabled: boolean;
  impressions: number;
  clickInterval?: number; // Number of clicks before showing popup
}

export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

export interface Reminder {
  id: string;
  text: string;
  datetime: string;
  completed: boolean;
}

export interface AIToolResponse {
  text: string;
  images?: string[];
  error?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
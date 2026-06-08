export interface ChatMessage {
  id: string | number;
  sender: 'admin' | 'student';
  text: string;
  timestamp: string;
  senderName?: string;
}

export interface Student {
  id: string | number;
  name: string;
  student_id: string;
  class: string;
  [key: string]: any;
}

export interface Admin {
  id: string | number;
  name: string;
  email: string;
  [key: string]: any;
}

export interface UserSession {
  role: 'student' | 'admin' | null;
  studentId: string | null;
  dbId: string | null;
  email: string | null;
  name: string | null;
  gender: string | null;
  profile: Record<string, any> | null;
}

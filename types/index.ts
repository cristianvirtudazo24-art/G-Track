export interface ChatMessage {
  id: string | number;
  sender: 'admin' | 'student';
  text: string;
  timestamp: string;
  senderName?: string;
  adminId?: string | number; // Track which admin sent this (for proper sender detection)
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

export interface SOSAlertVideo {
  id: string | number;
  studentId: string | number;
  studentName: string;
  videoUrl: string;
  latitude: number;
  longitude: number;
  battery: number;
  signal: string;
  timestamp: string;
  message?: string;
}

export interface BlackoutAlert {
  id: string | number;
  studentId: string | number;
  studentName: string;
  battery: number;
  signal: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  message?: string;
  status: 'new' | 'acknowledged' | 'resolved';
}

export interface BroadcastNotification {
  id: string | number;
  title: string;
  message: string;
  sentBy: string;
  sentByAdminId?: string | number;
  timestamp: string;
  targetClass?: string;
  targetClasses?: string[];
  status?: 'outbound' | 'sent';
  type?: 'broadcast' | 'announcement';
}

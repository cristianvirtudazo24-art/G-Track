import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/Network';

const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

export const login = async (email: string, pass: string, role: 'student' | 'admin', studentId?: string) => {
  try {
    const endpoint = role === 'student' ? '/student/login' : '/login';

    const response = await authClient.post(endpoint, {
      ...(role === 'admin' ? { email } : { student_id: studentId }),
      password: pass,
      role
    });

    if (response.data.message === 'Login successful' || response.data.success || response.data.student || response.data.user) {
      return {
        success: true,
        role: response.data.role || role,
        user: response.data.student || response.data.user,
        message: response.data.message || 'Login successful'
      };
    }

    return { success: false, message: response.data.message || "Invalid credentials" };
  } catch (error: any) {
    console.error("❌ Auth Error: Connection or Logic Failure", error);
    
    const apiMessage = error.response?.data?.message;
    throw new Error(apiMessage || "Server unreachable. Check your Wi-Fi and IP.");
  }
};
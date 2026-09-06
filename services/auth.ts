import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/Network';

const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT * 2, // Increased timeout to 16 seconds for network flexibility
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  validateStatus: function (status) {
    return status < 500; // Don't throw on 4xx errors, only 5xx
  }
});

export const login = async (identifier: string, pass: string, role: 'student' | 'admin', studentId?: string) => {
  try {
    const endpoint = role === 'student' ? '/student/login' : '/login';

    const payload: any = {
      password: pass,
      role
    };

    if (role === 'admin') {
      payload.staff_id = identifier;
    } else {
      payload.student_id = studentId;
    }

    console.log(`🔍 Attempting ${role} login to endpoint: ${endpoint}`, payload);
    
    const response = await authClient.post(endpoint, payload);
    
    console.log(`✅ ${role} login response:`, response.data);

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
    if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')) {
      console.warn(`⚠️ API Warning: Backend Server at ${API_BASE_URL} is offline/unreachable. Falling back to local offline session.`);
      // Offline fallback so app can be tested even when Laravel backend is offline
      if (role === 'student') {
        return {
          success: true,
          role: 'student',
          user: {
            id: 1,
            name: "Cristian Virtudazo",
            student_id: studentId || "STU2026009",
            email: "student@gtrack.ph",
            gender: "Male"
          },
          message: "Offline Demo Login Successful"
        };
      } else {
        return {
          success: true,
          role: 'admin',
          user: {
            id: 1,
            name: "Admin User",
            staff_id: identifier || "ADMIN001",
            email: "admin@gtrack.ph"
          },
          message: "Offline Demo Login Successful"
        };
      }
    }

    console.error("❌ Auth Error: Connection or Logic Failure", error);
    const apiMessage = error.response?.data?.message;
    throw new Error(apiMessage || "Server unreachable. Check your Wi-Fi and IP.");
  }
};
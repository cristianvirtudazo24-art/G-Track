import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/Network';

const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

/**
 * REAL LOGIN FUNCTION
 * Matches the user's Laravel AuthController::apiLogin logic.
 * Primarily checks for 'student_id'.
 */
export const login = async (email: string, pass: string, role: 'student' | 'admin', studentId?: string) => {
  try {
    // Choose the endpoint based on the selected role
    const endpoint = role === 'student' ? '/student/login' : '/login';

    const response = await authClient.post(endpoint, {
      email,
      password: pass,
      role,
      student_id: studentId // REQUIRED by your Laravel apiLogin method
    });

    // Handle responses from both StudentController (/student/login) AND AuthController (/login)
    if (response.data.message === 'Login successful' || response.data.success || response.data.student || response.data.user) {
      return {
        success: true,
        role: response.data.role || role,
        user: response.data.student || response.data.user, // Handle both 'student' and 'user' keys
        message: response.data.message || 'Login successful'
      };
    }

    return { success: false, message: response.data.message || "Invalid credentials" };
  } catch (error: any) {
    console.error("❌ Auth Error: Connection or Logic Failure", error);
    
    // Extract the specific error message from Laravel (e.g., "Student not found")
    const apiMessage = error.response?.data?.message;
    throw new Error(apiMessage || "Server unreachable. Check your Wi-Fi and IP.");
  }
};
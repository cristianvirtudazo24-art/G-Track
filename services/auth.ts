import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT, USE_REAL_API } from '../constants/Network';

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
      if (!USE_REAL_API) {
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

      const backendMessage = `Backend unavailable at ${API_BASE_URL}. Start Laravel with 'php artisan serve --host 0.0.0.0 --port 8007' and confirm the IP matches your device.`;
      console.error(`❌ API Error: ${backendMessage}`);
      throw new Error(backendMessage);
    }

    console.error("❌ Auth Error: Connection or Logic Failure", error);
    const apiMessage = error.response?.data?.message;
    throw new Error(apiMessage || "Server unreachable. Check your Wi-Fi and IP.");
  }
};

// Memory storage for offline demo OTP testing
let activeDemoOtp = '123456';

export const requestPasswordResetOTP = async (
  identifier: string,
  email: string,
  role: 'student' | 'admin'
) => {
  try {
    const endpoint = '/password/send-otp';
    const payload = {
      role,
      email,
      [role === 'student' ? 'student_id' : 'staff_id']: identifier,
    };

    console.log(`✉️ Sending OTP request to ${endpoint}:`, payload);
    const response = await authClient.post(endpoint, payload);

    if (response.data?.success || response.status === 200) {
      return {
        success: true,
        message: response.data.message || 'OTP verification code sent to your email.',
        demoOtp: response.data?.otp || activeDemoOtp,
      };
    }

    return {
      success: false,
      message: response.data?.message || 'Could not send verification code.',
    };
  } catch (error: any) {
    if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')) {
      console.warn('⚠️ Network offline. Simulating OTP generation for testing.');
      activeDemoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      return {
        success: true,
        message: `Offline Demo Mode: OTP verification code generated (${activeDemoOtp}).`,
        demoOtp: activeDemoOtp,
      };
    }
    return {
      success: false,
      message: error.response?.data?.message || 'Error communicating with server.',
    };
  }
};

export const resetPasswordDirect = async (
  identifier: string,
  newPassword: string,
  role: 'student' | 'admin'
) => {
  try {
    const endpoint = role === 'student' ? '/student/reset-password' : '/reset-password';
    const payload = {
      role,
      new_password: newPassword,
      password: newPassword,
      [role === 'student' ? 'student_id' : 'staff_id']: identifier,
    };

    console.log(`🔐 Submitting direct password reset to ${endpoint}:`, payload);
    const response = await authClient.post(endpoint, payload);

    if (response.data?.success || response.status === 200 || response.data?.message?.includes('successful')) {
      return {
        success: true,
        message: response.data?.message || 'Password reset successfully.',
      };
    }

    return {
      success: false,
      message: response.data?.message || 'Failed to reset password. Please check your ID.',
    };
  } catch (error: any) {
    if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')) {
      console.warn('⚠️ Network offline. Simulating direct password reset completion.');
      return {
        success: true,
        message: 'Offline Demo Mode: Password reset successful.',
      };
    }
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to reset password. Server unreachable.',
    };
  }
};
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export interface UserSession {
  role: 'student' | 'admin' | null;
  studentId: string | null;
  email: string | null;
  name: string | null;
  gender: string | null;
}

export const useUser = () => {
  const [session, setSession] = useState<UserSession>({
    role: null,
    studentId: null,
    email: null,
    name: null,
    gender: null,
  });
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole') as 'student' | 'admin' | null;
      const studentId = await AsyncStorage.getItem('studentId');
      const email = await AsyncStorage.getItem('studentEmail');
      const name = await AsyncStorage.getItem('studentName');
      const gender = await AsyncStorage.getItem('studentGender');

      setSession({
        role,
        studentId,
        email,
        name,
        gender,
      });
    } catch (error) {
      console.error("Failed to load session:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const clearSession = async () => {
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('studentId');
    await AsyncStorage.removeItem('studentEmail');
    await AsyncStorage.removeItem('studentName');
    await AsyncStorage.removeItem('studentGender');
    setSession({ role: null, studentId: null, email: null, name: null, gender: null });
  };

  return { session, loading, reloadSession: loadSession, clearSession };
};

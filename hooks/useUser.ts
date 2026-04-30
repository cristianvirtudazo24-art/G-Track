import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export interface UserSession {
  role: 'student' | 'admin' | null;
  studentId: string | null;
  dbId: string | null;
  email: string | null;
  name: string | null;
  gender: string | null;
  profile: Record<string, any> | null;
}

export const useUser = () => {
  const [session, setSession] = useState<UserSession>({
    role: null,
    studentId: null,
    dbId: null,
    email: null,
    name: null,
    gender: null,
    profile: null,
  });
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole') as 'student' | 'admin' | null;
      const studentId = await AsyncStorage.getItem('studentId');
      const dbId = await AsyncStorage.getItem('userDbId');
      const email = await AsyncStorage.getItem('studentEmail');
      const name = await AsyncStorage.getItem('studentName');
      const gender = await AsyncStorage.getItem('studentGender');
      const rawProfile = await AsyncStorage.getItem('studentProfile');
      const profile = rawProfile ? JSON.parse(rawProfile) : null;

      setSession({
        role,
        studentId,
        dbId,
        email,
        name,
        gender,
        profile,
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
    await AsyncStorage.removeItem('userDbId');
    await AsyncStorage.removeItem('studentEmail');
    await AsyncStorage.removeItem('studentName');
    await AsyncStorage.removeItem('studentGender');
    await AsyncStorage.removeItem('studentProfile');
    setSession({ role: null, studentId: null, dbId: null, email: null, name: null, gender: null, profile: null });
  };

  return { session, loading, reloadSession: loadSession, clearSession };
};

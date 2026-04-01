export const mockLogin = async (email: string, pass: string, role: 'student' | 'admin', studentId?: string) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (role === 'student') {
        if (email === "student" && pass === "student" && studentId === "student") {
          resolve({ success: true, role: 'student' });
        } else {
          reject("Unauthorized");
        }
      } else if (role === 'admin') {
        if (email === "admin" && pass === "admin") {
          resolve({ success: true, role: 'admin' });
        } else {
          reject("Unauthorized");
        }
      } else {
        reject("Invalid role");
      }
    }, 500);
  });
};
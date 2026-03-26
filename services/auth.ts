export const mockLogin = async (email: string, pass: string, studentId: string) => {
  const MOCK_EMAIL = "student";
  const MOCK_PASS = "student";
  const MOCK_ID = "student";

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === MOCK_EMAIL && pass === MOCK_PASS && studentId === MOCK_ID) {
        resolve({ success: true });
      } else {
        reject("Unauthorized");
      }
    }, 500);
  });
};
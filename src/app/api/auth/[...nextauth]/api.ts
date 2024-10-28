// utils/api.ts
import axios from "axios";

export const validateEmail = async (email: string): Promise<boolean> => {
  try {
    const response = await axios.post(
      "http://127.0.0.1:8000/api/check-email",
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.exists;
  } catch (error) {
    console.error("Error al verificar el correo:", error);
    throw new Error("Error al verificar el correo");
  }
};

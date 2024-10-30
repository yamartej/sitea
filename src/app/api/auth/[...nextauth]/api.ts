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
    return false;
  }
};

export const login = async (email: string, password: string) => {
  try {
    const response = await axios.post("http://127.0.0.1:8000/api/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw error;
  }
};

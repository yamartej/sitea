import axios from "axios";
const apiUrl = process.env.NEXT_PUBLIC_URL_API;
export const validateEmail = async (email: string): Promise<boolean> => {
  
  try {
    const response = await axios.post(`${apiUrl}/check-email`,
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
    const response = await axios.post(`${apiUrl}/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw error;
  }
};

export const resendVerification = async (
  token: string, 
  email: string
) => {
  try {
    const response = await axios.post(`${apiUrl}/email/verification-notification`, 
      {
        email,
        },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    return response;
  } catch (error) {
    console.error("Error al enenviar correo:", error);
    throw error;
  }
};

export const register = async (
  name: string, 
  email: string, 
  password: string, 
  password_confirmation: string,
) => {
  try {
    const response = await axios.post(`${apiUrl}/register`,
      {
        name,
        email,
        password,
        password_confirmation,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data; // Retornar solo los datos necesarios
  } catch (error: any) {
    console.error("Error en la respuesta de registro:", error);
    if (error.response && error.response.data && error.response.data.errors) {
      throw error.response.data.errors;
    }
    throw error;
  }
};

export const fetchUsersList = async (token: string) => {
  try {
    const response = await axios.get(`${apiUrl}/users`, {
      headers: {
        Authorization: `Bearer ${token}`, // Agrega el token en el header
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching menu items:", error);
    throw error;
  }
};

export const verifyToken = async (token: string) => { 
  try { 
    const response = await axios.get(`${apiUrl}/verify-token`, {
      headers: {
        Authorization: `Bearer ${token}`, // Agrega el token en el header
      },
  }); 
    return response.data.valid; 
  } catch (error) { 
    console.error('Error verifying token:', error); 
    return false; 
  } 
}; 
  
export const refreshToken = async (token: string) => { 
  try { 
    const response = await axios.get(`${apiUrl}/refresh-token`, {
      headers: {
        Authorization: `Bearer ${token}`, // Agrega el token en el header
      },
    }); 
    return response.data; 
  } catch (error) { 
    console.error('Error refreshing token:', error); 
    return null; 
  } 
};

export const loginWithProvider = async (email: string) => {
  try {
    const response = await axios.post(`${apiUrl}/login-provider`, {
      email
    });
    return response.data;
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    throw error;
  }
};



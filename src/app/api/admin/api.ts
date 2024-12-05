import axios from "axios";
import { Permission, User } from "@/types/type";
const apiUrl = process.env.NEXT_PUBLIC_URL_API;

export const fetchUsersList = async (token: string) => {
    try {
        const response = await axios.get(`${apiUrl}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data;
      } catch (error: any) {
        if (error.response) {
          // Error de respuesta del servidor.
          console.error("Error en la API:", error.response.status, error.response.data);
        } else if (error.request) {
          // La solicitud se hizo, pero no se recibió respuesta.
          console.error("Sin respuesta de la API:", error.request);
        } else {
          // Error al configurar la solicitud.
          console.error("Error al configurar Axios:", error.message);
        }
        throw error; // Re-lanza el error si es necesario.
      }      
};

export const fetchRoleList = async (token: string) => {
  try {
      const response = await axios.get(`${apiUrl}/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Error de respuesta del servidor.
        console.error("Error en la API:", error.response.status, error.response.data);
      } else if (error.request) {
        // La solicitud se hizo, pero no se recibió respuesta.
        console.error("Sin respuesta de la API:", error.request);
      } else {
        // Error al configurar la solicitud.
        console.error("Error al configurar Axios:", error.message);
      }
      throw error; // Re-lanza el error si es necesario.
    }      
};

export const fetchPermissions = async (token: string) => {
  try {
      const response = await axios.get(`${apiUrl}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Error de respuesta del servidor.
        console.error("Error en la API:", error.response.status, error.response.data);
      } else if (error.request) {
        // La solicitud se hizo, pero no se recibió respuesta.
        console.error("Sin respuesta de la API:", error.request);
      } else {
        // Error al configurar la solicitud.
        console.error("Error al configurar Axios:", error.message);
      }
      throw error; // Re-lanza el error si es necesario.
    }      
};

export const saveDataPermissions = async (token: string, data: Permission[]) => {
  try {
    const response = await axios.post(`${apiUrl}/permissions`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Error de respuesta del servidor.
      console.error("Error en la API:", error.response.status, error.response.data);
    } else if (error.request) {
      // La solicitud se hizo, pero no se recibió respuesta.
      console.error("Sin respuesta de la API:", error.request);
    } else {
      // Error al configurar la solicitud.
      console.error("Error al configurar Axios:", error.message);
    }
    throw error; // Re-lanza el error si es necesario.
  }
};

export const registerUser = async (token: string, name: string, email: string, company: string, rol: string, companyName: string, password: string) => {
  try {
    const response = await axios.post(`${apiUrl}/users`,
      {
        name,
        email,
        company,
        rol,
        companyName,
        password,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

export const deleteUser = async (token: string, id: number) => {
  try {
    const response = await axios.delete(`${apiUrl}/users/${id}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("response api===" + response.status);
    return response.status; // Retornar solo los datos necesarios
  } catch (error: any) {
    console.error("Error en la respuesta de registro:", error);
    if (error.response && error.response.data && error.response.data.errors) {
      throw error.response.data.errors;
    }
    throw error;
  }
};

export const updateUser = async (
  token: string,
  id: number,
  name: string,
  email: string,
  company: string,
  rol: string,
  companyName: string
) => {
  try {
    const response = await axios.put(
      `${apiUrl}/users/${id}`,
      {
        name,
        email,
        company,
        rol,
        companyName,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log('response api===', response.status);
    return response.status; // Retornar solo los datos necesarios
  } catch (error: any) {
    console.error('Error en la respuesta de registro:', error);
    if (error.response && error.response.data && error.response.data.errors) {
      throw error.response.data.errors;
    }
    throw error;
  }
};




export const fetchCompaniesList = async (token: string) => {
  try {
      const response = await axios.get(`${apiUrl}/companies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        // Error de respuesta del servidor.
        console.error("Error en la API:", error.response.status, error.response.data);
      } else if (error.request) {
        // La solicitud se hizo, pero no se recibió respuesta.
        console.error("Sin respuesta de la API:", error.request);
      } else {
        // Error al configurar la solicitud.
        console.error("Error al configurar Axios:", error.message);
      }
      throw error; // Re-lanza el error si es necesario.
    }      
};


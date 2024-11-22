import axios from "axios";
import { Permission } from "@/types/type";
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

export const fetchMenus = async (token: string) => {
  try {
      const response = await axios.get(`${apiUrl}/menus`, {
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

export const fetchRoles = async (token: string) => {
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

export const saveDataPermissions = async (token: string, data) => {
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



import axios from "axios";
import { Role, MenuItem} from "@/types/type";

const apiUrl = process.env.NEXT_PUBLIC_URL_API;

export const fetchMenuItems = async (token: string, roles: Role[]): Promise<MenuItem[]> => {
  try {
    const response = await axios.post(`${apiUrl}/menu_items`, { role_ids: roles.map(role => role.id) }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
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

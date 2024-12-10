import axios from "axios";
const apiUrl = process.env.NEXT_PUBLIC_URL_API;

export const fetchWarehousesList = async (token: string) => {
    try {
        const response = await axios.get(`${apiUrl}/warehouses`, {
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
  
  export const registerWarehouse = async (
    token: string, 
    name: string,
    description: string,
    address: string,
    ) => {
    try {
      const response = await axios.post(`${apiUrl}/warehouses`,
        {
          name,
          description,
          address,
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
  
  export const updateWarehouse = async (
    token: string,
    id: number,
    name: string,
    description: string,
    address: string,
    phone: number,
  ) => {
    try {
      const response = await axios.put(
        `${apiUrl}/warehouses/${id}`,
        {
          name,
          description,
          address,
          phone,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.status; // Retornar solo los datos necesarios
    } catch (error: any) {
      console.error('Error en la respuesta del Update:', error);
      if (error.response && error.response.data && error.response.data.errors) {
        throw error.response.data.errors;
      }
      throw error;
    }
  };
  
  export const deleteWarehouses = async (token: string, id: number) => {
    try {
      const response = await axios.delete(`${apiUrl}/warehouses/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.status; // Retornar solo los datos necesarios
    } catch (error: any) {
      console.error("Error en la respuesta:", error);
      if (error.response && error.response.data && error.response.data.errors) {
        throw error.response.data.errors;
      }
      throw error;
    }
  };
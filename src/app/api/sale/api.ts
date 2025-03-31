import axios from "axios";
const apiUrl = process.env.NEXT_PUBLIC_URL_API;

export const getClientById = async (client_id: string, token: string) => {
    try {
        const response = await axios.get( `${apiUrl}/customers/${client_id}`, {
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

  export const registerSale = async (
    token: string, 
    client_id: string, 
    seller_id: string, 
    pop_id: string, 
    total: number, 
    carts: any[], 
    type_of_sale: string,
  ) => { 
    try {
      const response = await axios.post(`${apiUrl}/sales`,
        {
          client_id,
          seller_id,
          pop_id,
          total,
          carts,
          type_of_sale,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
        return response.data; 
      }
      catch (error: any) {
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
  }
  
import axios from "axios";
const apiUrl = process.env.NEXT_PUBLIC_URL_API;

export const getClientById = async (
  client_id: string, 
  company_id: string, 
  token: string
) => {
  try {
    const response = await axios.get(
      `${apiUrl}/customers/${client_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          company_id,
        },
      }
    );
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
  export const fetchSaleslist = async (token: string) => {
  try {
      const response = await axios.get(`${apiUrl}/sales`, {
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

  export const fetchSaleslistByCompany = async (token: string, company_id: string) => {
  try {
      const response = await axios.get(`${apiUrl}/sales-by-company/${company_id}`, {
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
  
  export const updateSaleDetails = async (
    token: string,
    id: number,
    sale_id: number,
    quantity: number,
    total_amount: number,
    new_total_amount: number,
  ) => {
    try {
      const response = await axios.put(
        `${apiUrl}/sales/detail/${id}`,
        {
          sale_id,
          quantity,
          total_amount,
          new_total_amount
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

  export const removeSaleDetail = async (token: string, id: number) => {
    try {
      const response = await axios.delete(`${apiUrl}/sales/detail/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response; // Retornar solo los datos necesarios
    } catch (error: any) {
      console.error("Error en la respuesta:", error);
      if (error.response && error.response.data && error.response.data.errors) {
        throw error.response.data.errors;
      }
      throw error;
    }
  }

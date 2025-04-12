import axios from "axios";
const apiUrl = process.env.NEXT_PUBLIC_URL_API;

export const fetchBatchesList = async (token: string) => {
    try {
        const response = await axios.get(`${apiUrl}/batches`, {
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
  
  export const registerBatch = async (
    token: string, 
    name: string, 
    description: string,
    quantity: number,
    order_creation_date: string,
    ) => {
    try {
      const response = await axios.post(`${apiUrl}/batches`,
        {
          name,
          description,
          quantity,
          order_creation_date,
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
  
  export const deleteBatch = async (token: string, id: number) => {
    try {
      const response = await axios.delete(`${apiUrl}/batches/${id}`,
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
  
  export const updateBatch = async (
    token: string,
    id: number,
    name: string,
    description: string,
    quantity: number,
    order_creation_date: string,
  ) => {
    try {
      const response = await axios.put(
        `${apiUrl}/batches/${id}`,
        {
          name,
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

export const fetchCostsList = async (token: string) => {
    try {
        const response = await axios.get( `${apiUrl}/costs`, {
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

  export const registerCost = async (
        token: string,
        amount: number,
        batch_id: number,
        description: string,
    ) => {
    try {
      const response = await axios.post(`${apiUrl}/costs`,
        {
            amount,
            batch_id,
            description
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
  } 

  export const removeCost = async (token: string, id: number) => {
    try {
      const response = await axios.delete(`${apiUrl}/costs/${id}`,
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
  }

export const updateCost = async (
        token: string,
        id: number,
        amount: number,
        batch_id: number,
        description: string,
    ) => {
        try {
        const response = await axios.put(
            `${apiUrl}/costs/${id}`,
            {
            amount,
            batch_id,
            description
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
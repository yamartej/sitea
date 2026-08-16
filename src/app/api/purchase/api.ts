import axios from "axios";
const apiUrl = process.env.NEXT_PUBLIC_URL_API;

const handleApiError = (
  error: unknown,
  context: string
): never => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      console.error(
        `${context}:`,
        error.response.status,
        error.response.data
      );

      if (error.response.data?.errors) {
        throw error.response.data.errors;
      }
    } else if (error.request) {
      console.error(
        `${context} - Sin respuesta de la API:`,
        error.request
      );
    } else {
      console.error(
        `${context} - Error al configurar Axios:`,
        error.message
      );
    }
  } else {
    console.error(`${context} - Error inesperado:`, error);
  }

  throw error;
};

export const fetchBatchesList = async (token: string) => {
    try {
        const response = await axios.get(`${apiUrl}/batches`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data;
      } catch (error: unknown) {
        handleApiError(error, "Error al consultar lotes");
      }
  };

  export const registerBatch = async (
    token: string,
    name: string,
    description: string,
    quantity: number,
    status: string,
    order_creation_date: string,
    ) => {
    try {
      const response = await axios.post(`${apiUrl}/batches`,
        {
          name,
          description,
          quantity,
          status,
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
    } catch (error: unknown) {
        handleApiError(error, "Error al registrar lote");
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
    } catch (error: unknown) {
        handleApiError(error, "Error al eliminar lote");
      }
  };

  export const updateBatch = async (
    token: string,
    id: number,
    name: string,
    description: string,
    quantity: number,
    status: string,
    order_creation_date: string,
  ) => {
    try {
      const response = await axios.put(
        `${apiUrl}/batches/${id}`,
        {
          name,
          description,
          quantity,
          status,
          order_creation_date,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.status; // Retornar solo los datos necesarios
    } catch (error: unknown) {
        handleApiError(error, "Error al actualizar lote");
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
      } catch (error: unknown) {
        handleApiError(error, "Error al consultar costos");
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
    } catch (error: unknown) {
        handleApiError(error, "Error al registrar costo");
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
    } catch (error: unknown) {
        handleApiError(error, "Error al eliminar costo");
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
        } catch (error: unknown) {
          handleApiError(error, "Error al actualizar costo");
        }
    };

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

export const fetchWarehousesList = async (token: string) => {
    try {
        const response = await axios.get(`${apiUrl}/warehouses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data;
      } catch (error: unknown) {
        handleApiError(error, "Error al consultar almacenes");
      }
  };

  export const fetchWarehousesListByCompany = async (company_id: string, token: string) => {
    try {
        const response = await axios.get(`${apiUrl}/warehouses/get-by-company/${company_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data;
      } catch (error: unknown) {
        handleApiError(error, "Error al consultar almacenes por empresa");
      }
  };

  export const registerWarehouse = async (
    token: string,
    name: string,
    description: string,
    address: string,
    company_id: number | string,
    ) => {
    try {
      const response = await axios.post(`${apiUrl}/warehouses`,
        {
          name,
          description,
          address,
          company_id
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
        handleApiError(error, "Error al registrar almacén");
      }
  };

  export const updateWarehouse = async (
    token: string,
    id: number,
    name: string,
    description: string,
    address: string,
    phone: number,
    company_id: string,
  ) => {
    try {
      const response = await axios.put(
        `${apiUrl}/warehouses/${id}`,
        {
          name,
          description,
          address,
          phone,
          company_id,
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
        handleApiError(error, "Error al actualizar almacén");
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
    } catch (error: unknown) {
        handleApiError(error, "Error al eliminar almacén");
      }
  };

  export const fetchInventoriesList = async (token: string) => {
    try {
        const response = await axios.get(`${apiUrl}/inventory`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data;
      }catch (error: unknown) {
        handleApiError(error, "Error al consultar inventario");
      }
  };

  export const saveInventory = async (
    token: string,
    warehouse_id: string,
    new_product_ids: {
      id: number,
      quantity: number,
    }[],
    product_ids: {
      id: number,
      quantity: number,
    }[],

    ) => {
    try {
      const response = await axios.post(`${apiUrl}/inventory/saveInventoryProducts`,
        {
          new_product_ids,
          product_ids,
          warehouse_id,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response; // Retornar solo los datos necesarios
    } catch (error: unknown) {
        handleApiError(error, "Error al guardar inventario");
      }
  };

  export const removeAssignedInventory = async (
    token: string,
    product_ids: {
      id: number
    }[],
    ) => {
    try {
      const response = await axios.post(`${apiUrl}/inventory/removeAssignedInventory`,
        {
          product_ids,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response; // Retornar solo los datos necesarios
    }catch (error: unknown) {
        handleApiError(error, "Error al remover inventario asignado");
      }
  };

  export const updateInventory = async (
    token: string,
    id: number,
    product_id: number,
    quantity: string,
    warehouse_id: number,
  ) => {
    try {
      const response = await axios.put(
        `${apiUrl}/inventory/${id}`,
        {
          product_id,
          quantity,
          warehouse_id,
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
        handleApiError(error, "Error al actualizar inventario");
      }
  };

  export const deleteInventory = async (token: string, id: number) => {
    try {
      const response = await axios.delete(`${apiUrl}/inventory/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.status; // Retornar solo los datos necesarios
    } catch (error: unknown) {
        handleApiError(error, "Error al eliminar inventario");
      }
  };

  export const fetchProductsAvailable = async (token: string) => {
    try {
        const response = await axios.get(`${apiUrl}/products/with-costs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data;
      } catch (error: unknown) {
        handleApiError(error, "Error al consultar productos disponibles");
      }
  };

  export const fetchBatchesListReceived = async (token: string) => {
    try {
        const response = await axios.get(`${apiUrl}/batches/getBatchesReceived`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        return response.data;
      } catch (error: unknown) {
        handleApiError(error, "Error al consultar lotes recibidos");
      }
  };

  export const updateFinalCost = async (
    token: string,
    id: number,
    final_cost: number,
    wholesale_final_cost: number,

  ) => {
    try {
      const response = await axios.put(
        `${apiUrl}/products/update-final-cost`,
        {
          id,
          final_cost,
          wholesale_final_cost,
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
        handleApiError(error, "Error al actualizar costo final");
      }
  };
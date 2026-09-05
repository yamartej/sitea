import axios from "axios";
import { CartItem } from "@/types/type";
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
  } catch (error: unknown) {
      handleApiError(error, "Error al consultar cliente");
    }
};

  export const registerSale = async (
    token: string,
    client_id: string,
    seller_id: string,
    pop_id: string,
    carts: CartItem[],
    type_of_sale: string,
  ) => {
    try {
      const response = await axios.post(`${apiUrl}/sales`,
        {
          client_id,
          seller_id,
          pop_id,
          carts: carts.map((item) => ({
            productId: item.productId,
            warehouse_id: item.warehouse_id,
            quantity: item.quantity,
          })),
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
      catch (error: unknown) {
        handleApiError(error, "Error al registrar venta");
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
    } catch (error: unknown) {
      handleApiError(error, "Error al consultar ventas");
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
    } catch (error: unknown) {
      handleApiError(error, "Error al consultar ventas por empresa");
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
    } catch (error: unknown) {
      handleApiError(error, "Error al actualizar detalle de venta");
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
    } catch (error: unknown) {
      handleApiError(error, "Error al eliminar detalle de venta");
    }
  }

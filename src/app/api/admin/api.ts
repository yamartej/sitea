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
    return response.status; // Retornar solo los datos necesarios
  } catch (error: any) {
    console.error("Error en la respuesta de registro:", error);
    if (error.response && error.response.data && error.response.data.errors) {
      return error.response.data.errors;
    }
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

export const fetchCategoriesList = async (token: string) => {
  try {
      const response = await axios.get(`${apiUrl}/categories`, {
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

export const registerCategory = async (token: string, name: string) => {
  try {
    const response = await axios.post(`${apiUrl}/categories`,
      {
        name,
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

export const updateCategory = async (
  token: string,
  id: number,
  name: string,
) => {
  try {
    const response = await axios.put(
      `${apiUrl}/categories/${id}`,
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

export const deleteCategory = async (token: string, id: number) => {
  try {
    const response = await axios.delete(`${apiUrl}/categories/${id}`,
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

export const fetchProductsList = async (token: string) => {
  try {
      const response = await axios.get(`${apiUrl}/products`, {
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

export const registerProduct = async (
  token: string, 
  name: string, 
  description: string, 
  price: number, 
  category_id: number, 
  quantity: number, 
  batch_id: number,
  ) => {
  try {
    const response = await axios.post(`${apiUrl}/products`,
      {
        name,
        description,
        price,
        category_id,
        quantity,
        batch_id,
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

export const updateProduct = async (
  token: string,
  id: number,
  name: string,
  description: string,
  price: number,
  category_id: number,
  quantity: number,
  batch_id: number,
) => {
  try {
    const response = await axios.put(
      `${apiUrl}/products/${id}`,
      {
        name,
        description,
        price,
        category_id,
        quantity,
        batch_id
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

export const deleteProduct = async (token: string, id: number) => {
  try {
    const response = await axios.delete(`${apiUrl}/products/${id}`,
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

export const fetchCustomersList = async (token: string) => {
  try {
      const response = await axios.get(`${apiUrl}/customers`, {
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

export const registerCustomer = async (
  token: string, 
  client_id: number,
  name: string,
  address: string,
  phone: number,
  ) => {
  try {
    const response = await axios.post(`${apiUrl}/customers`,
      {
        client_id,
        name,
        address,
        phone,
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

export const updateCustomer = async (
  token: string,
  id: number,
  client_id: number,
  name: string,
  address: string,
  phone: number,
) => {
  try {
    const response = await axios.put(
      `${apiUrl}/customers/${id}`,
      {
        client_id,
        name,
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

export const deleteCustomer = async (token: string, id: number) => {
  try {
    const response = await axios.delete(`${apiUrl}/customers/${id}`,
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

export const registerPop = async (
  token: string, 
  identifier: string, 
  ubication: string, 
  status: string, 
  seller: string) => {
  try {
    const response = await axios.post(`${apiUrl}/pops`,
      {
        identifier,
        ubication,
        status,
        seller,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data; 
  } catch (error: any) {
    console.error("Error en la respuesta de registro:", error);
    if (error.response && error.response.data && error.response.data.errors) {
      throw error.response.data.errors;
    }
    throw error;
  }
};

export const fetchPopsList = async (token: string) => {
  try {
      const response = await axios.get(`${apiUrl}/pops`, {
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

export const updatePop = async (
  token: string,
  id: number,
  identifier: string,
  ubication: string,
  status: string,
  seller_id: string,
) => {
  try {
    const response = await axios.put(
      `${apiUrl}/pops/${id}`,
      {
        identifier,
        ubication,
        status,
        seller_id,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response; // Retornar solo los datos necesarios
  } catch (error: any) {
    console.error('Error en la respuesta del Update:', error);
    if (error.response && error.response.data && error.response.data.errors) {
      throw error.response.data.errors;
    }
    throw error;
  }
};

export const deletePop = async (token: string, id: number) => {
  try {
    const response = await axios.delete(`${apiUrl}/pops/${id}`,
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

export const getUsersByRole = async (token: string) => {
  try {
      const response = await axios.get(`${apiUrl}/users/by-role`, {
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

export const fetchPopStatus = async (token: string) => {
  try {
      const response = await axios.get(`${apiUrl}/pops-status/list`, {
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

export const registerPopStatus = async (token: string, popMachine: string, popSeller: string) => {
  try {
    const response = await axios.post(`${apiUrl}/pops-status`,
      {
        popMachine,
        popSeller,
        popStatus:'open',
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data; 
  } catch (error: any) {
    console.error("Error en la respuesta de registro:", error);
    if (error.response && error.response.data && error.response.data.errors) {
      throw error.response.data.errors;
    }
    throw error;
  }
};

export const deletePopStatus = async (token: string, id: number) => {
  try {
    const response = await axios.delete(`${apiUrl}/pops-status/${id}`,
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

export const getPopByUserId = async (
  token: string,
  id: number,
) => {
  try {
    const response = await axios.get(
      `${apiUrl}/pops/seller/${id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response
  } catch (error: any) {
    console.error('Error en la respuesta del get:', error);
    if (error.response && error.response.data && error.response.data.errors) {
      throw error.response.data.errors;
    }
    throw error;
  }
};

export const closePopStatus = async (
  token: string,
  id: number,
) => {
  try {
    const response = await axios.put(
      `${apiUrl}/pops-status/${id}`,
      {
        popStatus: 'close',
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
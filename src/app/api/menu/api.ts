import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_URL_API;

export const fetchMenuItems = async (token: string) => {
  try {
    const response = await axios.get(`${apiUrl}/menus`, {
      headers: {
        Authorization: `Bearer ${token}`, // Agrega el token en el header
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching menu items:", error);
    throw error;
  }
};

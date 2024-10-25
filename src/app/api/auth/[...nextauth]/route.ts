import NextAuth, { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import axios from "axios";

interface User {
  email?: string | null;
  // Puedes añadir más propiedades según tu esquema de usuario
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
      authorization: {
        params: {
          redirect_uri: "http://localhost:3000/api/auth/callback/google",
        },
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }: { user: User }) {
      try {
        if (!user.email) throw new Error("No email provided");

        const response = await axios.post(
          "http://127.0.0.1:8000/api/check-email",
          { email: user.email },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.data.exists) {
          console.warn("Correo no registrado:", user.email);
          return false; // Rechaza el inicio de sesión si el correo no existe
        }

        return true; // Permite el inicio de sesión si el correo existe
      } catch (error) {
        console.error("Error al verificar el correo en la API:", error);
        return false; // Rechaza el inicio de sesión en caso de error
      }
    },
  },
  pages: {
    signIn: "/", // Define la ruta para el inicio de sesión
    error: "/error", // Opcional: ruta para manejar errores de acceso
    newUser: "/dashboard", // Redirige al Dashboard después del registro
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


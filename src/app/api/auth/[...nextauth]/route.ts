import NextAuth, { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { validateEmail } from "./api";

interface User {
  email?: string | null;
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
        const emailExists = await validateEmail(user.email);
        if (emailExists) {
          return true; 
        } else {
          console.warn("Correo no registrado:", user.email);
          return `/?message=Correo no registrado o incorrecto`; 
        }
      } catch (error) {
        console.error("Correo no registrado o incorrecto:", error);
        return `/?message=Correo no registrado o incorrecto`; 
      }
    }
  },
  pages: {
    signIn: "/", // Define la ruta para el inicio de sesión
    error: "/", // Define la ruta para cuando exista un error
    newUser: "/dashboard", // Redirige al Dashboard después del registro
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


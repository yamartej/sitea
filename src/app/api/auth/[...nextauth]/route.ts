import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { validateEmail } from "./api";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const emailExists = await validateEmail(credentials?.email || "");
        if (!emailExists) throw new Error("Correo no registrado o incorrecto");
        
        // Aquí agregarías la lógica para verificar la contraseña
        // Ejemplo: const passwordMatches = await validatePassword(credentials.email, credentials.password);

        return { id: "user-id", email: credentials?.email };
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID ?? "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/",  // Página de inicio de sesión
    error: "/",   // Página de error en caso de fallos
    newUser: "/dashboard",  // Redirección tras registro exitoso
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

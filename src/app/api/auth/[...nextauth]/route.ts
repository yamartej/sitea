import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import {
  validateEmail,
  login,
  loginWithProvider,
  refreshToken
} from "./api"; // Asegúrate que estos estén bien implementados

import { JWT } from "next-auth/jwt";

interface CustomUser {
  id: string;
  email: string;
  token: string;
  roles: string[];
  company_id: string;
  name?: string | null;
  expires?: string | number;
  email_verified_at?: string | null;
}

// 🔧 Extensión de tipos para NextAuth
declare module "next-auth" {
  interface Session {
    user: CustomUser;
  }

  interface User extends CustomUser {}
}

declare module "next-auth/jwt" {
  interface JWT extends CustomUser {
    error?: string;
  }
}
// 📦 Configuración principal de NextAuth
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Correo y contraseña son requeridos");
        }

        const emailExists = await validateEmail(credentials.email);
        if (!emailExists) {
          throw new Error("Correo no registrado o incorrecto");
        }

        const result = await login(credentials.email, credentials.password);
        if (!result || !result.user) return null;

        const user = result.user;

        return {
          id: user.id.toString(),
          email: user.email,
          token: result.token,
          roles: result.roles,
          company_id: user.company_id,
          name: user.name,
          expires: result.expiration,
          email_verified_at: user.email_verified_at,
        };
      },
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

  callbacks: {
    async signIn({ user }) {
      if (!user.roles) {
        const emailExists = await validateEmail(user.email || "");
        if (!emailExists) {
          return "/?message=Correo no registrado o incorrecto";
        }

        const loginResult = await loginWithProvider(user.email || "");
        console.log("loginResult=", loginResult);
        if (!loginResult?.user.email_verified_at) {
          return "/verify-pending";
        }

        Object.assign(user, {
          id: loginResult.user.id.toString(),
          token: loginResult.token,
          roles: loginResult.roles,
          company_id: loginResult.user.company_id,
          name: loginResult.user.name,
          expires: loginResult.expiration,
          email_verified_at: loginResult.user.email_verified_at,
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          token: user.token,
          roles: user.roles,
          company_id: user.company_id,
          name: user.name,
          expires: new Date(user.expires || Date.now() + 60 * 60 * 1000).getTime(),
          email_verified_at: user.email_verified_at,
        };
      }
      // Refrescar proactivamente el token si faltan menos de 5 minutos para expirar
      const FIVE_MINUTES = 5 * 60 * 1000;
      const expiresAt = Number(token.expires);
      const now = Date.now();
      const timeLeft = expiresAt - now;
      const shouldRefresh = timeLeft < FIVE_MINUTES;
      if (shouldRefresh) {
        const newToken = await refreshToken(token.token);
        if (newToken) {
          token.token = newToken.token;
          token.expires = new Date(newToken.expiration).getTime();
        } else {
          throw new Error("Unable to refresh token");
        }
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email!,
        token: token.token,
        roles: token.roles,
        company_id: token.company_id,
        name: token.name,
        expires: token.expires,
        email_verified_at: token.email_verified_at,
      };
      return session;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hora
  },

  pages: {
    signIn: "/",
    error: "/auth/error", // Puedes personalizar esto
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import {
  validateEmail,
  login,
} from "./api";
import { loginWithProvider } from "./providerBridge";
import {
  refreshAccessToken,
  revokeBackendSession,
} from "./tokenLifecycle";

interface SessionUser {
  id: string;
  email: string;
  token: string;
  roles: string[];
  company_id: string;
  name?: string | null;
  image?: string | null;
  expires?: string | number;
  email_verified_at?: string | null;
}

declare module "next-auth" {
  interface Session {
    user: SessionUser;
    authError?: string;
  }

  interface User extends SessionUser {
    refreshToken?: string;
    refreshExpires?: string | number;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends SessionUser {
    refreshToken?: string;
    refreshExpires?: number;
    error?: string;
  }
}

const toTimestamp = (
  value: string | number | undefined,
  fallback: number
): number => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

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
          throw new Error(
            "Correo y contraseña son requeridos"
          );
        }

        const emailExists = await validateEmail(
          credentials.email
        );

        if (!emailExists) {
          throw new Error(
            "Correo no registrado o incorrecto"
          );
        }

        const result = await login(
          credentials.email,
          credentials.password
        );

        if (!result || !result.user) {
          return null;
        }

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
          refreshToken: result.refresh_token,
          refreshExpires: result.refresh_expiration,
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
      clientId:
        process.env.FACEBOOK_CLIENT_ID ?? "",
      clientSecret:
        process.env.FACEBOOK_CLIENT_SECRET ?? "",
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!user.roles) {
        if (!user.email || !account?.provider) {
          return false;
        }

        try {
          const loginResult =
            await loginWithProvider(
              user.email,
              account.provider
            );

          if (
            !loginResult?.user?.email_verified_at
          ) {
            return "/verify-pending";
          }

          Object.assign(user, {
            id: loginResult.user.id.toString(),
            token: loginResult.token,
            roles: loginResult.roles,
            company_id:
              loginResult.user.company_id,
            name: loginResult.user.name,
            expires: loginResult.expiration,
            email_verified_at:
              loginResult.user.email_verified_at,
            refreshToken:
              loginResult.refresh_token,
            refreshExpires:
              loginResult.refresh_expiration,
          });
        } catch (error) {
          console.error(
            "Provider bridge authentication failed:",
            error
          );

          return (
            "/?message=" +
            encodeURIComponent(
              "No se pudo autenticar con el proveedor"
            )
          );
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const now = Date.now();

        return {
          ...token,
          id: user.id,
          email: user.email,
          token: user.token,
          roles: user.roles,
          company_id: user.company_id,
          name: user.name,
          image: user.image,
          expires: toTimestamp(
            user.expires,
            now + 15 * 60 * 1000
          ),
          email_verified_at:
            user.email_verified_at,
          refreshToken: user.refreshToken,
          refreshExpires: toTimestamp(
            user.refreshExpires,
            now + 7 * 24 * 60 * 60 * 1000
          ),
          error: undefined,
        };
      }

      const now = Date.now();
      const accessExpiresAt = Number(
        token.expires
      );
      const REFRESH_WINDOW_MS = 60 * 1000;

      if (
        Number.isFinite(accessExpiresAt) &&
        accessExpiresAt - now >
          REFRESH_WINDOW_MS
      ) {
        return token;
      }

      if (
        !token.refreshToken ||
        !token.refreshExpires ||
        token.refreshExpires <= now
      ) {
        token.error = "RefreshTokenExpired";
        token.token = "";
        return token;
      }

      try {
        const pair = await refreshAccessToken(
          token.refreshToken
        );

        token.token = pair.token;
        token.expires = new Date(
          pair.expiration
        ).getTime();
        token.refreshToken =
          pair.refresh_token;
        token.refreshExpires = new Date(
          pair.refresh_expiration
        ).getTime();
        token.error = undefined;

        return token;
      } catch (error) {
        console.error(
          "Unable to rotate Laravel token pair:",
          error
        );

        token.error =
          "RefreshAccessTokenError";
        token.token = "";

        return token;
      }
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email!,
        token: token.token,
        roles: token.roles,
        company_id: token.company_id,
        name: token.name,
        image: token.image,
        expires: token.expires,
        email_verified_at:
          token.email_verified_at,
      };

      if (token.error) {
        session.authError = token.error;
      }

      return session;
    },
  },

  events: {
    async signOut(message) {
      if (
        "token" in message &&
        message.token?.refreshToken
      ) {
        try {
          await revokeBackendSession(
            message.token.token,
            message.token.refreshToken
          );
        } catch (error) {
          console.error(
            "Backend session revocation failed:",
            error
          );
        }
      }
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

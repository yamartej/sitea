import NextAuth, { NextAuthOptions, DefaultSession, DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { validateEmail, login, verifyToken, refreshToken, loginWithProvider} from "./api";
import { JWT } from "next-auth/jwt";
import { redirect } from "next/navigation";

interface User {
  email?: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      token: string;
      roles: string[];
      company_id: string;
      name?: string;
      expires?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    token: string;
    roles: string[];
    company_id: string;
    name?: string;
    expires?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    token: string;
    roles: string[];
    company_id: string;
    name?: string;
  }
}

interface CustomToken extends JWT {
  id: string;
  token: string;
  roles: string[];
  company_id: string;
  name: string;
  expires: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email || !credentials.password) {
          throw new Error("Correo y contraseña son requeridos");
        }

        const emailExists = await validateEmail(credentials?.email || "");
        if (!emailExists) throw new Error("Correo no registrado o incorrecto");

        const result = await login(credentials.email , credentials.password);

        if (result) {
          return {
            id: result.user.id.toString(),
            email: result.user.email,
            token: result.token,
            roles: result.roles,
            company_id: result.user.company_id,
            name: result.user.name,
            expires: result.expiration,
          };
        }
        return null;
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
    },
    async session({ session, token }) {
      const customToken = token as CustomToken;
      session.user = { ...session.user, 
        id: customToken.id, 
        token: customToken.token, 
        roles: customToken.roles, 
        company_id: customToken.company_id, 
        name: customToken.name, 
        expires: customToken.expires};
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        //aquí validamos si el rol viene vacío es pq el usuario uso el provider github, google o facebook
        if(!user.roles){
          const result = await loginWithProvider(user.email as any);
          token.id = result.user.id;
          token.token = result.token;
          token.roles = result.roles;
          token.company_id = result.user.company_id;
          token.expires = result.expiration;
        }
        else{
          token.id = user.id;
          token.token = user.token;
          token.roles = user.roles;
          token.company_id = user.company_id;
          token.expires = user.expires;
        }
      } 
      const isValid = await verifyToken(token.token);
      if (isValid) {
        const expirationTimestamp = new Date(token.expires as string).getTime() / 1000; 
        const currentTime = Math.floor(Date.now() / 1000); 
        if (expirationTimestamp - currentTime < 120) { 
          const newToken = await refreshToken(token.token);
          if (newToken) { 
            token.token = newToken.token;
            token.expires = newToken.expiration; 
          } 
          else { 
            throw new Error("Unable to refresh token"); 
          } 
        }
      }
      else{
        redirect("/");
      }

      return token;
    },
  },
  pages: {
    signIn: "/",  // Página de inicio de sesión
    error: "/",   // Página de error en caso de fallos
    newUser: "/dashboard",  // Redirección tras registro exitoso
  },
  session: { 
    maxAge: 15 * 60, // 15 minutos en segundos 
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

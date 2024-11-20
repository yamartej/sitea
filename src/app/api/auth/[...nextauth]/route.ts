import NextAuth, { NextAuthOptions, DefaultSession, DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { validateEmail, login, verifyToken, refreshToken} from "./api";
import { JWT } from "next-auth/jwt";

interface User {
  email?: string | null;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      token: string;
      roles: string[];  // Agrega el tipo de roles que necesites
      name?: string;
      expires?: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    token: string;
    roles: string[]; // Define los roles en el usuario
    name?: string;
    expires?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    token: string;
    roles: string[]; // Asegúrate de definir roles aquí también
    name?: string;
  }
}

interface CustomToken extends JWT {
  id: string;
  token: string;
  roles: string[];
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
          // Retorna el token y otros datos que quieras incluir en la sesión
          return {
            id: result.user.id.toString(),
            email: result.user.email,
            token: result.token,
            roles: result.roles,
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
      // Convertir token a CustomToken usando "as"
      const customToken = token as CustomToken;
      session.user = { ...session.user, 
        id: customToken.id, 
        token: customToken.token, 
        roles: customToken.roles, 
        name: customToken.name, 
        expires: customToken.expires};
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.token = user.token;
        token.roles = user.roles;
        token.name = user.name;
        token.expires = user.expires;
      }
      console.log("token==" + token.token)
      const isValid = await verifyToken(token.token);
      console.log("isValid==" + isValid)
      if (isValid) {
        const expirationTimestamp = new Date(token.expires as string).getTime() / 1000; 
        const currentTime = Math.floor(Date.now() / 1000); 
        console.log("REsta=" + (expirationTimestamp - currentTime))
        if (expirationTimestamp - currentTime < 120) { 
          const newToken = await refreshToken(token.token);
          console.log("newToken==" + newToken)
          if (newToken) { 
            token.token = newToken.token;
            token.expires = newToken.expiration; 
          } 
          else { 
            throw new Error("Unable to refresh token"); 
          } 
        }
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

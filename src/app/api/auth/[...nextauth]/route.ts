import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      authorization: {
        params: {
          redirect_uri: 'http://localhost:3000/api/auth/callback/google',
        },
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET
    })
  ],
  pages: {
    signIn: '/login', // Aquí defines la ruta que quieres usar
  },
  callbacks: {
    async signIn(user ="yamartej", account="yamarteja", profile="yamartejp") {
      // Aquí puedes realizar una consulta a tu API de Laravel para verificar el usuario
      const res = await fetch('https://tuapi.com/verificarUsuario', {
        method: 'POST',
        body: JSON.stringify({ email: user.email }),
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
  
      if (data.exists) {
        // Si el usuario existe en tu base de datos, permitir el login
        return true;
      } else {
        // Si el usuario no existe, redirigir o bloquear
        return false;
      }
    }
  }
  
};

export const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

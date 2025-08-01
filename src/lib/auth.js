// import GitHubProvider from "next-auth/providers/github";
// import GoogleProvider from "next-auth/providers/google";
// import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { dbConnect } from "./connectb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
export const authOptions = {
  providers: [
    //   GitHubProvider({
    //     clientId: process.env.GITHUB_ID,
    //     clientSecret: process.env.GITHUB_SECRET
    //   }),
    //   GoogleProvider({
    //     clientId: process.env.GOOGLE_CLIENT_ID,
    //     clientSecret: process.env.GOOGLE_CLIENT_SECRET
    //   })
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials.email || !credentials.password) {
          throw new Error("Email and password are required");
        }
        try {
          await dbConnect();
        
          const user = await User.findOne({ email: credentials.email });
        

          if (!user) {
            throw new Error("Invalid email or password");
          }

         const isvalid = await user.comparePassword(credentials.password);
         if (!isvalid) {
            throw new Error("Invalid email or password");
          }
          return {
            id: user._id,
            // name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error("db connection failed: ", error);
          throw new Error("Authorization failed");
        }
      },
    }),
  ],
  callback:{
   async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
   },
   async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
      }
      return session;
   },
   async redirect({ url, baseUrl }) {
    return `${baseUrl}/userdashboard`; // redirect to dashboard after login
  },
   //   this will work when i sign in with providers like google or github  
   //   async signIn({ user, account, profile, email, credentials }) {
   //    return true
   //  },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string as ?error=
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

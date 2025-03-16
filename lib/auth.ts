import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import { compare } from "bcrypt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

import { db } from "@/lib/db";
import { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/error",
  },
  debug: process.env.NODE_ENV === "development",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        emailOrUsername: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.emailOrUsername || !credentials?.password) {
          console.log("Missing credentials");
          throw new Error("Missing credentials");
        }

        // Check if input is email or username
        const isEmail = credentials.emailOrUsername.includes('@');
        
        console.log(`Attempting to find user by ${isEmail ? 'email' : 'username'}: ${credentials.emailOrUsername}`);
        
        // Find user by email or name (username)
        const user = await db.user.findFirst({
          where: isEmail 
            ? { email: credentials.emailOrUsername }
            : { name: credentials.emailOrUsername },
        });

        if (!user) {
          console.log("User not found");
          throw new Error("User not found");
        }

        if (!user.password) {
          console.log("User has no password (OAuth account)");
          throw new Error("This account doesn't have a password (try using social login)");
        }

        // Check if user is banned
        if ((user as any).status === 'BANNED' || user.isBanned) {
          console.log("User is banned");
          throw new Error('Your account has been banned');
        }

        console.log("Comparing passwords");
        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          console.log("Invalid password");
          throw new Error("Invalid password");
        }

        console.log("Authentication successful");
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
          role: user.role || "USER",
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
        },
      };
    },
    async signIn({ user, account, profile }) {
      // Allow OAuth providers to sign in
      if (account?.provider === "google" || account?.provider === "facebook") {
        return true;
      }

      // For credentials, we already checked in authorize
      if (account?.provider === "credentials") {
        return true;
      }

      return true;
    },
  },
}; 
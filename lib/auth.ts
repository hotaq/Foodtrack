import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import { compare } from "bcrypt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";

import { db } from "@/lib/db";
import { Adapter } from "next-auth/adapters";

// Prepare providers array
const providers = [];

// Only add Google provider if environment variables are set
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Only add Facebook provider if environment variables are set
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    })
  );
}

// Always add Credentials provider
providers.push(
  CredentialsProvider({
    name: "credentials",
    credentials: {
      emailOrUsername: { label: "Email or Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      try {
        if (!credentials?.emailOrUsername || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        // Check if input is email or username
        const isEmail = credentials.emailOrUsername.includes('@');
        
        // Find user by email or name (username)
        const user = await db.user.findFirst({
          where: isEmail 
            ? { email: credentials.emailOrUsername }
            : { name: credentials.emailOrUsername },
        });

        if (!user) {
          throw new Error("User not found");
        }

        if (!user.password) {
          throw new Error("This account doesn't have a password (try using social login)");
        }

        // Check if user is banned
        if ((user as any).status === 'BANNED' || user.isBanned) {
          throw new Error('Your account has been banned');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      } catch (error) {
        console.error("Auth error:", error);
        throw error;
      }
    },
  })
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as Adapter,
  secret: process.env.NEXTAUTH_SECRET || "supersecretkeyforfoodtrackapp",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/error",
  },
  debug: process.env.NODE_ENV === "development",
  providers,
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
      // Allow all sign-ins
      return true;
    },
  },
}; 
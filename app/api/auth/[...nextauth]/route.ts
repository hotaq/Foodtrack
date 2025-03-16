import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import { compare } from "bcrypt";
import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { authOptions } from "@/lib/auth";

import { db } from "@/lib/db";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 
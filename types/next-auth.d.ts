import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";
import "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: string;
    status?: "ACTIVE" | "BANNED";
    isBanned?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
} 
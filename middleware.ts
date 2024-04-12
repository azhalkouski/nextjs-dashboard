import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Initialize NextAuth with authConfig object and export the auth property.
export default NextAuth(authConfig).auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
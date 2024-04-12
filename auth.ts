import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from '@auth/core/providers/credentials';
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';

async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

/**
 * You need to create a separeate file (called auth.ts) for the bcrypt package.
 * This is because bcrypt relies on Node.js APIs not available in Next.js Middleware.
 * https://nextjs.org/learn/dashboard-app/adding-authentication#password-hashing
 */


/**
 * For this course we focuse on using the Credentials provider only.
 * The Credentials provider allows users to log in with a username and a password.
 * 
 * GOOD TO KNOW:
 * Although we're useing the Credential provider, it's generally recommended to use
 * alternative providers such as OAuth or email providers.
 */
export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
        
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }

        console.log('Invalid credentials');
        return null;
      },
    }),
  ],
});

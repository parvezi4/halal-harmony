import NextAuth from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { JWT } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

type SessionWithUser = {
  user?: {
    id?: string;
    role?: string;
    gender?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  expires: string;
};

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: { id: string; role?: string } | null }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: SessionWithUser; token: JWT }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role;

        // Fetch gender from profile
        const userProfile = await prisma.profile.findUnique({
          where: { userId: token.id as string },
          select: { gender: true },
        });

        if (userProfile) {
          session.user.gender = userProfile.gender;
        }
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);

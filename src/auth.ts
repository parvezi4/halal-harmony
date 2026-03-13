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
    accountType?: 'admin' | 'member';
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
        portal: { label: 'Portal', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        const portal = credentials?.portal as 'admin' | 'member' | undefined;

        if (!email || !password || !portal) {
          return null;
        }

        if (portal === 'admin') {
          const account = await prisma.adminAccount.findUnique({
            where: { email },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                },
              },
            },
          });

          if (!account) {
            return null;
          }

          const valid = await bcrypt.compare(password, account.passwordHash);
          if (!valid) {
            return null;
          }

          if (
            account.user.role !== 'SUPERADMIN' &&
            account.user.role !== 'ADMIN' &&
            account.user.role !== 'MODERATOR'
          ) {
            return null;
          }

          return {
            id: account.user.id,
            email: account.user.email,
            role: account.user.role,
            accountType: 'admin' as const,
          };
        }

        const account = await prisma.memberAccount.findUnique({
          where: { email },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        });

        if (!account) {
          return null;
        }

        const valid = await bcrypt.compare(password, account.passwordHash);
        if (!valid) {
          return null;
        }

        if (account.user.role !== 'MEMBER') {
          return null;
        }

        return {
          id: account.user.id,
          email: account.user.email,
          role: account.user.role,
          accountType: 'member' as const,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: { id: string; role?: string; accountType?: 'admin' | 'member' } | null;
    }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountType = user.accountType;
      }
      return token;
    },
    async session({ session, token }: { session: SessionWithUser; token: JWT }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.accountType = token.accountType as 'admin' | 'member' | undefined;

        if (token.accountType === 'member') {
          // Gender is only relevant in member flows.
          const userProfile = await prisma.profile.findUnique({
            where: { userId: token.id as string },
            select: { gender: true },
          });

          if (userProfile) {
            session.user.gender = userProfile.gender;
          }
        }
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);

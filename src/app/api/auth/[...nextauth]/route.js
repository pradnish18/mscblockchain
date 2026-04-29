import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error('Email is required');
        }

        // Find or create user
        let user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          // Create new user
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              role: 'USER'
            }
          });
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

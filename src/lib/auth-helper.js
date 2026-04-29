import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function getSession(req) {
  try {
    // In Next.js 14 App Router, we need to pass headers
    const session = await getServerSession(authOptions);
    return session;
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

export async function requireAuth(req) {
  const session = await getSession(req);
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function requireAdmin(req) {
  const user = await requireAuth(req);
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}

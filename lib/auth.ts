import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'allotwise-secret-key-change-in-production'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
}

export async function signToken(user: AuthUser): Promise<string> {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' })
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    return null
  }
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('allotwise-token')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function validateCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return null
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.role !== 'ADMIN') {
    throw new Error('Forbidden')
  }
  return session
}

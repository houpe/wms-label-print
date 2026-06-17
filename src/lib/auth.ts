import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode('wms-label-print-jwt-secret-2026')
const COOKIE_NAME = 'wms_token'
const EXPIRES_IN = '7d'

export interface User {
  username: string
  password: string
}

const USERS: User[] = [
  { username: 'yhwd', password: 'yhwd123' },
]

export function findUser(username: string, password: string): User | null {
  const u = USERS.find(item => item.username === username && item.password === password)
  return u ?? null
}

export async function signToken(username: string): Promise<string> {
  const token = await new SignJWT({ username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(JWT_SECRET)
  return token
}

export async function verifyToken(token: string): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (typeof payload.username === 'string') {
      return { username: payload.username }
    }
    return null
  } catch {
    return null
  }
}

export { COOKIE_NAME }

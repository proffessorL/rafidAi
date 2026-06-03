import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function resolveUserId(request?: NextRequest): Promise<string | null> {
  if (request) {
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const session = await db.authSession.findUnique({
        where: { token },
        select: { userId: true, expiresAt: true },
      })
      if (session && session.expiresAt > new Date()) {
        return session.userId
      }
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (studentId) return studentId
  }

  const anyUser = await db.user.findFirst({ select: { id: true } })
  return anyUser?.id ?? null
}

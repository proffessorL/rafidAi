import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Find session
    const session = await db.authSession.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    // Extend session expiry
    const newExpiry = new Date()
    newExpiry.setDate(newExpiry.getDate() + 30)
    await db.authSession.update({
      where: { id: session.id },
      data: { expiresAt: newExpiry },
    })

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        avatar: session.user.avatar,
        studentId: session.user.studentId,
        institution: session.user.institution,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ error: 'Session check failed' }, { status: 500 })
  }
}

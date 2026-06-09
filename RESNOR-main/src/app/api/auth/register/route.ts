import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createHash, randomBytes } from 'crypto'
import { createNotification } from '@/lib/services/notification-service'

function hashPassword(password: string): string {
  return createHash('sha256').update(password + '_resnor_salt_2024').digest('hex')
}

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role, studentId, institution } = body

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Create user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        role: role || 'student',
        passwordHash: hashPassword(password),
        studentId: studentId?.trim() || null,
        institution: institution?.trim() || null,
        avatar: null,
      },
    })

    // Create auth session
    const token = generateToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

    await db.authSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    // Create streak record for new students
    if (user.role === 'student') {
      await db.streak.create({
        data: {
          studentId: user.id,
          currentStreak: 0,
          longestStreak: 0,
          totalActiveDays: 0,
        },
      })
    }

    // Create engagement score record
    await db.engagementScore.create({
      data: {
        studentId: user.id,
        overallScore: 0,
        studyConsistencyRate: 0,
        avgSessionDuration: 0,
        weeklyActiveHours: 0,
        interactionDensity: 0,
      },
    })

    createNotification({
      studentId: user.id,
      title: '🎉 Welcome to Resnor!',
      message: `Hi ${user.name || 'there'}! Start your learning journey — take a quiz, study materials, or explore the app.`,
      type: 'info',
      actionUrl: '/dashboard',
    }).catch(() => {})

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        studentId: user.studentId,
        institution: user.institution,
      },
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}

import { db } from '@/lib/db'
import { sendEmail } from './email-service'
import { calculateDeliveryDelay } from './timing-engine-service'

export type NotificationType = 'info' | 'warning' | 'achievement' | 'reminder'

export interface CreateNotificationParams {
  studentId: string
  title: string
  message: string
  type: NotificationType
  actionUrl?: string
  sendEmail?: boolean
  scheduleOptimally?: boolean
  priorityScore?: number
}

export async function createNotification(params: CreateNotificationParams) {
  const { studentId, title, message, type, actionUrl, sendEmail: shouldEmail, scheduleOptimally, priorityScore } = params

  let scheduledFor: Date | null = null

  if (scheduleOptimally) {
    const delayMs = await calculateDeliveryDelay(studentId, type)
    if (delayMs > 3600000) {
      scheduledFor = new Date(Date.now() + delayMs)
    }
  }

  const notification = await db.notification.create({
    data: {
      studentId,
      title,
      message,
      type,
      actionUrl,
      scheduledFor,
      priorityScore: priorityScore ?? 5,
    },
  })

  if (shouldEmail !== false) {
    try {
      const user = await db.user.findUnique({
        where: { id: studentId },
        select: { email: true, name: true },
      })

      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: `📢 ${title}`,
          text: `${message}\n\n---\nResnor App`,
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#333;margin-bottom:8px">${title}</h2>
            <p style="color:#555;line-height:1.6">${message}</p>
            <hr style="margin:24px 0;border:none;border-top:1px solid #eee" />
            <p style="color:#999;font-size:12px">Sent by Resnor — Your AI Learning Companion</p>
          </div>`,
        })
      }
    } catch (err) {
      console.error('[notification-service] Email send failed:', err)
    }
  }

  return notification
}

export async function notifyQuizCompleted(params: {
  studentId: string
  score: number
  correctCount: number
  totalQuestions: number
  quizTitle: string
}) {
  const { studentId, score, correctCount, totalQuestions, quizTitle } = params

  const isPerfect = score === 100
  const isGreat = score >= 80

  let title: string
  let message: string
  let type: NotificationType
  let actionUrl = '/quiz'

  if (isPerfect) {
    title = '🎯 Perfect Score!'
    message = `You scored 100% on "${quizTitle}" — ${correctCount}/${totalQuestions} correct. Outstanding!`
    type = 'achievement'
  } else if (isGreat) {
    title = '🌟 Great Quiz Result!'
    message = `You scored ${score}% on "${quizTitle}" — ${correctCount}/${totalQuestions} correct. Keep it up!`
    type = 'achievement'
  } else {
    title = '📝 Quiz Completed'
    message = `You scored ${score}% on "${quizTitle}" — ${correctCount}/${totalQuestions} correct. Review your mistakes to improve!`
    type = 'info'
  }

  return createNotification({ studentId, title, message, type, actionUrl })
}

export async function notifyBadgeEarned(params: {
  studentId: string
  badgeName: string
  badgeIcon: string
  description: string
}) {
  const { studentId, badgeName, badgeIcon, description } = params

  return createNotification({
    studentId,
    title: `🏆 New Badge: ${badgeName}`,
    message: `${badgeIcon} You earned the "${badgeName}" badge! ${description}`,
    type: 'achievement',
    actionUrl: '/gamification',
  })
}

export async function notifyLevelUp(params: {
  studentId: string
  newLevel: number
}) {
  const { studentId, newLevel } = params

  return createNotification({
    studentId,
    title: `⬆ Level Up!`,
    message: `Congratulations! You've reached Level ${newLevel}. Keep studying to climb higher!`,
    type: 'achievement',
    actionUrl: '/gamification',
  })
}

export async function notifyStreakMilestone(params: {
  studentId: string
  currentStreak: number
}) {
  const { studentId, currentStreak } = params

  const milestone = [3, 7, 14, 21, 30, 60, 90, 365].find(m => currentStreak === m)
  if (!milestone) return null

  const messages: Record<number, string> = {
    3: '3-day streak! You\'re building a great habit!',
    7: '7-day streak! You\'ve earned the "Week Warrior" badge potential!',
    14: '14-day streak! Incredible dedication — consistency is key!',
    21: '21-day streak! They say it takes 21 days to form a habit — you\'ve done it!',
    30: '30-day streak! One full month of learning — phenomenal!',
    60: '60-day streak! Two months of non-stop learning — you\'re unstoppable!',
    90: '90-day streak! Three months of excellence — true mastery in the making!',
    365: '365-day streak! A FULL YEAR of learning! You are a legend!',
  }

  const message = messages[milestone]

  return createNotification({
    studentId,
    title: `🔥 ${milestone}-Day Streak!`,
    message,
    type: 'achievement',
    actionUrl: '/gamification',
  })
}

export async function notifyEngagementDrop(params: {
  studentId: string
  engagementScore: number
}) {
  const { studentId, engagementScore } = params

  if (engagementScore >= 40) return null

  return createNotification({
    studentId,
    title: '⚠️ Engagement Dropping',
    message: `Your engagement score is ${engagementScore}. Try to study a bit more to stay on track.`,
    type: 'warning',
    actionUrl: '/wellbeing',
  })
}

export async function notifyBurnoutRisk(params: {
  studentId: string
  riskLevel: string
  riskPercentage: number
}) {
  const { studentId, riskLevel, riskPercentage } = params

  if (riskLevel === 'low') return null

  const messages: Record<string, string> = {
    moderate: `Your burnout risk is ${riskPercentage}% (moderate). Consider taking breaks and balancing your study schedule.`,
    high: `⚠️ Your burnout risk is ${riskPercentage}% (high). Please take a rest day and practice self-care.`,
    severe: `🚨 Your burnout risk is ${riskPercentage}% (severe). We strongly recommend talking to a counselor or taking time off.`,
  }

  return createNotification({
    studentId,
    title: `🧠 Burnout Risk: ${riskLevel}`,
    message: messages[riskLevel] || '',
    type: 'warning',
    actionUrl: '/wellbeing',
  })
}

export async function notifyStudyReminder(params: {
  studentId: string
  pendingItems: number
}) {
  const { studentId, pendingItems } = params

  return createNotification({
    studentId,
    title: '📚 Study Reminder',
    message: `You have ${pendingItems} pending materials to review. Even 10 minutes helps!`,
    type: 'reminder',
    actionUrl: '/planner',
  })
}

export async function notifyMaterialCompleted(params: {
  studentId: string
  materialTitle: string
}) {
  const { studentId, materialTitle } = params

  return createNotification({
    studentId,
    title: '✅ Material Completed',
    message: `You completed "${materialTitle}". Great progress!`,
    type: 'achievement',
    actionUrl: '/dashboard',
  })
}

export async function notifyNewQuizAvailable(params: {
  studentId: string
  quizTitle: string
}) {
  const { studentId, quizTitle } = params

  return createNotification({
    studentId,
    title: '📝 New Quiz Available',
    message: `"${quizTitle}" is now ready for you to take. Test your knowledge!`,
    type: 'info',
    actionUrl: '/quiz',
  })
}

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    if (!studentId) return NextResponse.json({ error: 'student_id is required' }, { status: 400 })

    const explanations = await db.mistakeExplanation.findMany({
      where: { studentId },
      select: {
        errorCategory: true,
        conceptLabel: true,
        mistakeType: true,
        createdAt: true,
        mistakeSummary: true,
        questionId: true,
        attemptId: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const latestAttempt = await db.quizAttempt.findFirst({
      where: { studentId },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    })
    const latestAttemptDate = latestAttempt?.completedAt || null

    interface QuestionEntry {
      conceptLabel: string
      date: string
      questionId: string | null
      attemptId: string | null
    }

    interface CategoryGroup {
      key: string
      count: number
      latestDate: Date | null
      questions: QuestionEntry[]
      mistakeType: string
    }

    const categoryGroups: Record<string, CategoryGroup> = {}

    for (const exp of explanations) {
      const groupKey = exp.errorCategory && exp.errorCategory.trim()
        ? exp.errorCategory.trim()
        : exp.mistakeType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

      if (!categoryGroups[groupKey]) {
        categoryGroups[groupKey] = {
          key: groupKey,
          count: 0,
          latestDate: null,
          questions: [],
          mistakeType: exp.mistakeType,
        }
      }
      const g = categoryGroups[groupKey]
      g.count++
      if (!g.latestDate || exp.createdAt > g.latestDate) {
        g.latestDate = exp.createdAt
      }

      // Use AI-generated conceptLabel per question (specific subtopic like "Newton's First Law — Inertia")
      // Falls back to errorCategory, then first sentence of mistakeSummary, then mistakeType label
      const summaryLabel = exp.mistakeSummary
        ? exp.mistakeSummary.split(/[.?!]\s/)[0].trim()
        : ''
      const label = exp.conceptLabel && exp.conceptLabel.trim()
        ? exp.conceptLabel.trim()
        : (exp.errorCategory && exp.errorCategory.trim()
            ? exp.errorCategory.trim()
            : (summaryLabel.length > 15
                ? summaryLabel
                : exp.mistakeType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())))

      const dateKey = exp.createdAt.toISOString().split('T')[0]
      if (!g.questions.some((q) => q.conceptLabel === label && q.date === dateKey)) {
        g.questions.push({
          conceptLabel: label,
          date: dateKey,
          questionId: exp.questionId,
          attemptId: exp.attemptId,
        })
      }
    }

    const misconceptions = Object.values(categoryGroups)
      .map((g) => {
        let recoveryStatus: string
        if (g.latestDate && latestAttemptDate) {
          const daysSinceLastError = Math.floor(
            (latestAttemptDate.getTime() - g.latestDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          recoveryStatus = daysSinceLastError > 7 ? 'PRACTICING' : 'IN_PROGRESS'
        } else {
          recoveryStatus = 'IN_PROGRESS'
        }

        return {
          id: `miscon-${g.key.replace(/\s+/g, '-').toLowerCase().substring(0, 30)}`,
          conceptNodeId: g.key,
          conceptLabel: g.key,
          frequencyCounter: g.count,
          lastTriggeredAt: g.latestDate ? g.latestDate.toISOString().split('T')[0] : '',
          recoveryStatus,
          mistakeType: g.mistakeType || 'KNOWLEDGE_GAP',
          patternDescription: `This error pattern appeared ${g.count} time(s) across your quizzes.`,
          relatedQuestions: g.questions,
        }
      })

    misconceptions.sort((a, b) => b.frequencyCounter - a.frequencyCounter)

    return NextResponse.json({
      misconceptions,
      message:
        misconceptions.length === 0
          ? 'Analyzing Your Study Habits... Misconception clusters will appear here once the system detects a recurring conceptual pattern across your quiz evaluations.'
          : null,
    })
  } catch (error) {
    console.error('Misconceptions error:', error)
    return NextResponse.json({ error: 'Failed to fetch misconceptions' }, { status: 500 })
  }
}

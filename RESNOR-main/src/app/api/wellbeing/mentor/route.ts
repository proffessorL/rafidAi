import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

export async function POST(request: Request) {
  try {
    const { student_id, message } = await request.json()
    const sid = student_id || 'stu_001'

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    await db.mentorMessage.create({
      data: { studentId: sid, role: 'user', content: message },
    })

    const recentMoods = await db.moodEntry.findMany({
      where: { studentId: sid },
      orderBy: { createdAt: 'desc' },
      take: 7,
    })

    const engagement = await db.engagementScore.findUnique({ where: { studentId: sid } })
    const streak = await db.streak.findUnique({ where: { studentId: sid } })
    const quizAttempts = await db.quizAttempt.findMany({
      where: { studentId: sid },
      orderBy: { completedAt: 'desc' },
      take: 5,
    })
    const focusSessions = await db.focusSession.findMany({
      where: { studentId: sid, completed: true },
      orderBy: { completedAt: 'desc' },
      take: 10,
    })
    const analytics = await db.wellbeingAnalytics.findUnique({ where: { studentId: sid } })

    const moodSummary = recentMoods.length
      ? recentMoods.map(m => `${m.mood}(${m.score}/10)`).join(', ')
      : 'none reported'

    const quizSummary = quizAttempts.length
      ? quizAttempts.map(q => `${Math.round(q.score)}%`).join(' → ')
      : 'none'

    const focusMinutes = focusSessions.reduce((s, e) => s + Math.round(e.actualSeconds / 60), 0)

    let response: string
    let category = 'advice'

    if (groq.apiKey) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `Two modes — detect which one the student is in:

MODE 1 — VENTING (they say how they feel without asking what to do):
- Be cutting and direct. Don't validate excuses.
- Call out the gap between their feelings and their actions.
- End with a sharp question that forces them to confront reality.
- NO feature suggestions, NO plans

MODE 2 — ASKING FOR HELP (they say "what should I do?", "give me a plan", "help me", "what to improve", "how do I...", or mention a specific problem like an exam):
- Still be direct, but then GIVE 2-3 concrete steps
- Each step must name a RESNOR feature AND what to do inside it
- Example: "Open Study Planner, add a 2-hour session for data structures, mark high priority. Then open AI Tutor and ask it to explain sorting algorithms."
- End with a question

Rules for both modes:
- Vary phrasing every response, never repeat yourself
- Under 120 words
- No templated phrases

Features they can use:
- AI Tutor (pick a topic + teaching mode, ask about specific concepts)
- Quiz Generator (pick topics + difficulty, do a set of questions)
- Explain My Mistake (review past quiz errors)
- Study Planner (add sessions with topic, duration, priority)
- Pomodoro Timer (focus blocks with configurable length)
- Focus Mode in Wellbeing (distraction-free session timer)
- Growth Dashboard (goals + weak topic detection)
- CGPA Predictor (subject readiness overview)`,
            },
            {
              role: 'user',
              content: `Student's data:
Moods: ${moodSummary}
Engagement: ${engagement?.overallScore ?? 'N/A'}%
Weekly hours: ${engagement?.weeklyActiveHours ?? 0}h
Streak: ${streak?.currentStreak ?? 0} days
Quiz trend: ${quizSummary}
Focus sessions: ${focusSessions.length} (${focusMinutes}min)
Wellbeing score: ${analytics?.wellbeingScore ?? 'N/A'}
Stress score: ${analytics?.stressScore ?? 'N/A'}

Student just said: "${message}"

Respond to them naturally.`,
            },
          ],
          temperature: 0.9,
          max_tokens: 300,
        })

        const content = completion.choices[0]?.message?.content || ''
        if (content && content.length > 10) {
          response = content.trim()

          const low = content.toLowerCase()
          if (low.includes('overwork') || low.includes('burnout') || low.includes('rest') || low.includes('break')) {
            category = 'warning'
          } else if (low.includes('stress') || low.includes('anxious') || low.includes('worried') || low.includes('tired')) {
            category = 'support'
          } else if (low.includes('great') || low.includes('amazing') || low.includes('proud') || low.includes('streak') || low.includes('impressive')) {
            category = 'motivation'
          }
        } else {
          throw new Error('Empty response')
        }
      } catch (err) {
        const moodAvg = recentMoods.length ? Math.round(recentMoods.reduce((s, e) => s + e.score, 0) / recentMoods.length) : null
        if (moodAvg !== null && moodAvg <= 4) {
          response = `That sounds really tough. Your mood logs show you've been struggling — that matters more than any quiz score. What's the one thing weighing on you most right now?`
          category = 'support'
        } else if (streak && streak.currentStreak >= 3) {
          response = `You've been showing up for ${streak.currentStreak} days straight — that takes real discipline. What's one thing you want to focus on today?`
          category = 'motivation'
        } else if (engagement && engagement.overallScore < 40) {
          response = `Your engagement has been low lately. That's okay — we all go through slumps. What's been getting in the way of studying?`
          category = 'support'
        } else {
          response = `Thanks for sharing that. Based on what I can see, your biggest area to work on is building consistency. What does your ideal study day look like?`
          category = 'advice'
        }
      }
    } else {
      response = `Tell me more about how you're feeling — I want to give you the best advice I can.`
      category = 'advice'
    }

    await db.mentorMessage.create({
      data: { studentId: sid, role: 'mentor', content: response, category },
    })

    return NextResponse.json({ response, category })
  } catch (error) {
    console.error('Mentor error:', error)
    return NextResponse.json({ error: 'Failed to process mentor message' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id') || 'stu_001'

    const messages = await db.mentorMessage.findMany({
      where: { studentId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Mentor fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

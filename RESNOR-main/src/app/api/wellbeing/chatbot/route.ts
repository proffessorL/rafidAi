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

    const recentMoods = await db.moodEntry.findMany({
      where: { studentId: sid },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })

    let response: string
    let isEmergency = false

    if (groq.apiKey) {
      try {
        const moodContext = recentMoods.length
          ? `Their recent moods: ${recentMoods.map(m => `${m.mood}(${m.score}/10)`).join(', ')}`
          : 'No recent mood data'

        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a warm, emotionally intelligent wellbeing companion for a student. You talk like a real, caring human — not a therapist, not a scripted chatbot.

Your conversation style:
- Respond naturally based on what they say. Sometimes validate, sometimes offer a gentle perspective, sometimes share a relatable thought. Don't always end with a question — let the conversation breathe.
- Mirror their emotional state. If they're down, be soft and kind. If they're excited, match their energy. If they're neutral, keep it light.
- Keep responses under 130 words.
- Never sound clinical, scripted, or repetitive.
- If they mention wanting to hurt themselves or others, set isEmergency to true.

Be genuinely human. Talk like a real friend would — sometimes asking, sometimes just being present.`,
            },
            {
              role: 'user',
              content: `${moodContext}

Student says: "${message}"`,
            },
          ],
          temperature: 0.85,
          max_tokens: 350,
        })

        const content = completion.choices[0]?.message?.content || ''
        if (content && content.length > 10) {
          response = content.trim()
          const low = content.toLowerCase()
          isEmergency = low.includes('hurt myself') || low.includes('suicide') || low.includes('kill myself') || low.includes('want to die')
        } else {
          throw new Error('Empty response')
        }
      } catch {
        const msg = message.toLowerCase()
        if (msg.includes('stress') || msg.includes('overwhelm') || msg.includes('anxious') || msg.includes('sad')) {
          response = `I hear you, and that's completely valid. You're carrying a lot right now. Sometimes the bravest thing is just acknowledging it. I'm right here whenever you need to talk or vent.`
        } else if (msg.includes('tired') || msg.includes('exhausted') || msg.includes('burnout')) {
          response = `You sound really drained. Please don't push through it — rest isn't a reward, it's a necessity. Your well-being matters more than any deadline. Take a moment for yourself.`
        } else {
          response = `Thanks for sharing that with me. I'm glad you felt you could talk. Whatever it is, you don't have to figure it all out alone.`
        }
      }
    } else {
      response = `I'm here for you. Tell me what's going on — I'm listening.`
    }

    if (isEmergency) {
      await db.companionInteraction.create({
        data: {
          studentId: sid,
          interactionType: 'emotional_support',
          message: `User expressed distress: "${message.substring(0, 100)}"`,
          isRead: false,
        },
      })
    }

    return NextResponse.json({ response, isEmergency })
  } catch (error) {
    console.error('Chatbot error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}

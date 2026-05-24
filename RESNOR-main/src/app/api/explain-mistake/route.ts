import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

export async function POST(request: Request) {
  try {
    const { question, studentAnswer, correctAnswer, mistakeType } = await request.json()
    if (!question || !studentAnswer || !correctAnswer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const fallback: any = {
      rootCause: `You answered "${studentAnswer}" but the correct answer is "${correctAnswer}".`,
      conceptBreakdown: `Review the concept behind this question to understand why "${correctAnswer}" is correct.`,
      correctiveExplanation: `The correct answer is "${correctAnswer}". Practice similar questions to reinforce this concept.`,
      relatedTopics: [],
    }

    if (!groq.apiKey) {
      return NextResponse.json(fallback)
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are an academic tutor. Explain why a student got a question wrong.

Return ONLY valid JSON (no markdown):
{
  "rootCause": "1-2 sentences explaining WHY the student chose that wrong answer",
  "conceptBreakdown": "1-2 sentences explaining the core concept clearly",
  "correctiveExplanation": "1-2 sentences with a tip to avoid this mistake next time",
  "relatedTopics": ["array of 2-3 related topic names this question touches on"]
}`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            question,
            studentAnswer,
            correctAnswer,
            mistakeType: mistakeType || null,
          }),
        },
      ],
      temperature: 0.7,
      max_tokens: 512,
    })

    const content = completion.choices[0]?.message?.content || ''
    const match = content.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      if (parsed.rootCause) {
        return NextResponse.json({ ...fallback, ...parsed })
      }
    }

    return NextResponse.json(fallback)
  } catch (error) {
    console.error('AI explain mistake error:', error)
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 })
  }
}

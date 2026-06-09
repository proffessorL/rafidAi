import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

export async function POST(req: Request) {
  try {
    const { topic, questionCount, studentId } = await req.json()
    if (!topic || !questionCount || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Single AI call generating all questions in easy → medium → hard order
    const easyCount = Math.ceil(questionCount / 3)
    const mediumCount = Math.ceil(questionCount / 3)
    const hardCount = questionCount - easyCount - mediumCount

    const prompt = `You are a quiz generator. Generate ${questionCount} multiple-choice questions about "${topic}".

The questions must be in this EXACT order:
- First ${easyCount} questions: EASY difficulty (basic, fundamental concepts)
- Next ${mediumCount} questions: MEDIUM difficulty (deeper understanding, application)
- Last ${hardCount} questions: HARD difficulty (challenging, multi-step, advanced)

Rules:
- Each question must have exactly 4 options (A, B, C, D) and one correct key
- Questions should test understanding, not memorization
- Output ONLY valid JSON in this exact format (no markdown, no code blocks):
{ "questions": [ { "question": "...", "optionA": "...", "optionB": "...", "optionC": "...", "optionD": "...", "correctKey": "A|B|C|D", "explanation": "...", "difficulty": "easy|medium|hard" } ] }`

    let allQuestions: Array<{
      question: string; optionA: string; optionB: string; optionC: string; optionD: string; correctKey: string; explanation: string; difficulty: string
    }> | null = null

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4096,
        })
        const text = completion.choices[0]?.message?.content || ''
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (Array.isArray(parsed.questions) && parsed.questions.length >= questionCount) {
            allQuestions = parsed.questions.map((q: any) => ({
              question: q.question || '',
              optionA: q.optionA || '',
              optionB: q.optionB || '',
              optionC: q.optionC || '',
              optionD: q.optionD || '',
              correctKey: q.correctKey || 'A',
              explanation: q.explanation || '',
              difficulty: q.difficulty || 'medium',
            }))
            break
          }
        }
      } catch {
        await new Promise((r) => setTimeout(r, 1000))
      }
    }

    if (!allQuestions?.length) {
      return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
    }

    // Create session in DB
    const session = await db.enhanceKnowledgeSession.create({
      data: {
        studentId,
        topic,
        totalQuestions: Math.min(allQuestions.length, questionCount),
        questions: {
          create: allQuestions!.slice(0, questionCount).map((q, i) => ({
            questionText: q.question,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctKey: q.correctKey,
            explanation: q.explanation,
            difficulty: q.difficulty,
            questionOrder: i + 1,
            isRemedial: false,
            answeredCorrectly: null,
          })),
        },
      },
      include: { questions: { orderBy: { questionOrder: 'asc' } } },
    })

    const questions = session.questions.map((q) => ({
      id: q.id,
      questionNumber: q.questionOrder,
      question: q.questionText,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correctIndex: ['A', 'B', 'C', 'D'].indexOf(q.correctKey),
      difficulty: q.difficulty,
      isRemedial: q.isRemedial,
      parentQuestionId: q.parentQuestionId,
    }))

    return NextResponse.json({ sessionId: session.id, topic, questions })
  } catch (error) {
    console.error('EnhanceKnowledge generate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

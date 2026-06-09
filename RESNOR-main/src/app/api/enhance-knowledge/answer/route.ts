import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

function parseAIQuestions(text: string): Array<{ question: string; optionA: string; optionB: string; optionC: string; optionD: string; correctKey: string; explanation: string }> | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed.questions)) return null
    return parsed.questions.map((q: any) => ({
      question: q.question || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      correctKey: q.correctKey || 'A',
      explanation: q.explanation || '',
    }))
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { sessionId, questionId, selectedKey, studentId } = await req.json()
    if (!sessionId || !questionId || !selectedKey || !studentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the question
    const question = await db.enhanceKnowledgeQuestion.findUnique({
      where: { id: questionId },
      include: { session: true },
    })
    if (!question || question.session.studentId !== studentId) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const correctKey = question.correctKey
    const isCorrect = selectedKey === correctKey

    // Mark as answered
    await db.enhanceKnowledgeQuestion.update({
      where: { id: questionId },
      data: { answeredCorrectly: isCorrect },
    })

    if (isCorrect) {
      // Update session total correct only if it's not already counted
      await db.enhanceKnowledgeSession.update({
        where: { id: sessionId },
        data: { totalCorrect: { increment: 1 } },
      })
      return NextResponse.json({ correct: true })
    }

    // Wrong answer — generate 2 remedial questions
    const prompt = `You are a tutor helping a student who got this question wrong.

Original question: "${question.questionText}"
Correct answer: ${correctKey}
Options: A) ${question.optionA}  B) ${question.optionB}  C) ${question.optionC}  D) ${question.optionD}

Generate 2 remedial multiple-choice questions that test the SAME CONCEPT but with different phrasing and approach. These should help the student understand the concept they missed.

Rules:
- Both questions must be about the same core concept as the original question
- Difficulty should be slightly easier than the original to build confidence
- Each question must have exactly 4 options (A, B, C, D) and one correct key
- Include a brief explanation for each
- Output ONLY valid JSON in this exact format:
{ "questions": [ { "question": "...", "optionA": "...", "optionB": "...", "optionC": "...", "optionD": "...", "correctKey": "A|B|C|D", "explanation": "..." } ] }`

      let remedialQuestions: Array<{ question: string; optionA: string; optionB: string; optionC: string; optionD: string; correctKey: string; explanation: string }> | null = null

      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 2048,
          })
          const text = completion.choices[0]?.message?.content || ''
          remedialQuestions = parseAIQuestions(text)
          if (remedialQuestions && remedialQuestions.length > 0) break
        } catch {
          await new Promise((r) => setTimeout(r, 1000))
        }
      }

      if (!remedialQuestions || remedialQuestions.length === 0) {
        // Fallback remedial questions
        remedialQuestions = [
          {
            question: `Revisiting: ${question.questionText}`,
            optionA: 'Review the concept again',
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,
            correctKey,
            explanation: `The correct answer was ${correctKey}. Review this concept thoroughly.`,
          },
          {
            question: `Think about why "${correctKey}" is the correct answer for: ${question.questionText}`,
            optionA: 'Because it directly answers the question',
            optionB: "Because it's the only logical choice",
            optionC: question.optionC,
            optionD: question.optionD,
            correctKey: 'A',
            explanation: 'Understanding why the correct answer is right is key to mastering the concept.',
          },
        ]
      }

    // Get max order for inserting after current question
    const maxOrder = await db.enhanceKnowledgeQuestion.findFirst({
      where: { sessionId },
      orderBy: { questionOrder: 'desc' },
      select: { questionOrder: true },
    })
    const nextOrder = (maxOrder?.questionOrder || question.questionOrder) + 1

    // Create remedial questions
    const created = await Promise.all(
      remedialQuestions.map((rq, i) =>
        db.enhanceKnowledgeQuestion.create({
          data: {
            sessionId,
            questionText: rq.question,
            optionA: rq.optionA,
            optionB: rq.optionB,
            optionC: rq.optionC,
            optionD: rq.optionD,
            correctKey: rq.correctKey,
            explanation: rq.explanation,
            difficulty: question.difficulty === 'hard' ? 'medium' : 'easy',
            questionOrder: nextOrder + i,
            isRemedial: true,
            parentQuestionId: questionId,
            answeredCorrectly: null,
          },
        })
      )
    )

    await db.enhanceKnowledgeSession.update({
      where: { id: sessionId },
      data: { totalRemedial: { increment: 2 } },
    })

    const remedial = created.map((q) => ({
      id: q.id,
      questionNumber: q.questionOrder,
      question: q.questionText,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correctIndex: ['A', 'B', 'C', 'D'].indexOf(q.correctKey),
      difficulty: q.difficulty,
      isRemedial: true,
      parentQuestionId: q.parentQuestionId,
    }))

    return NextResponse.json({ correct: false, remedialQuestions: remedial })
  } catch (error) {
    console.error('EnhanceKnowledge answer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

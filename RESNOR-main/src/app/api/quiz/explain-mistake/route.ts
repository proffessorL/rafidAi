import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const attemptId = searchParams.get('attempt_id')

    if (!attemptId) {
      return NextResponse.json({ error: 'attempt_id is required' }, { status: 400 })
    }

    const attempt = await db.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: { include: { question: true } },
        quiz: { select: { id: true, title: true } },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    const wrongAnswers = attempt.answers.filter(a => !a.isCorrect)

    // Generate AI explanations for wrong answers
    const explanations = []
    for (const answer of wrongAnswers) {
      try {
        const zai = await ZAI.create()
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are a master teacher who makes concepts stick. The student chose "${answer.selectedKey}" but the right answer is "${answer.question.correctKey}".

Question: ${answer.question.question}
Options: A) ${answer.question.optionA}, B) ${answer.question.optionB}, C) ${answer.question.optionC}, D) ${answer.question.optionD}

Explain so they NEVER forget. Rules:
- Use a simple analogy or real-world comparison
- Keep language conversational and easy (like a friend explaining)
- Include one short memory trick / "never forget" tip
- Be concise — each section 2-4 sentences max

Return JSON: {"rootCause":"Why they likely chose wrong (1-2 sentences)","conceptBreakdown":"The right concept explained with an analogy","correctiveExplanation":"How to think about this next time + a never-forget tip","relatedTopics":["topic1","topic2"]}`,
            },
            { role: 'user', content: 'Explain this mistake simply so the student never makes it again.' },
          ],
          thinking: { type: 'disabled' },
        })

        const content = completion.choices[0]?.message?.content || ''
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        explanations.push({
          questionId: answer.questionId,
          selectedKey: answer.selectedKey,
          correctKey: answer.question.correctKey,
          ...(jsonMatch ? JSON.parse(jsonMatch[0]) : {
            rootCause: 'Review this concept carefully.',
            conceptBreakdown: answer.question.explanation || 'See the correct answer explanation.',
            correctiveExplanation: answer.question.explanation || '',
            relatedTopics: [],
          }),
        })
      } catch {
        explanations.push({
          questionId: answer.questionId,
          selectedKey: answer.selectedKey,
          correctKey: answer.question.correctKey,
          rootCause: 'Review this concept carefully.',
          conceptBreakdown: answer.question.explanation || 'See the correct answer explanation.',
          correctiveExplanation: answer.question.explanation || '',
          relatedTopics: [],
        })
      }
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        correctCount: attempt.correctCount,
        completedAt: attempt.completedAt,
        quizTitle: attempt.quiz?.title,
      },
      questions: attempt.answers.map(a => ({
        questionId: a.questionId,
        question: a.question.question,
        optionA: a.question.optionA,
        optionB: a.question.optionB,
        optionC: a.question.optionC,
        optionD: a.question.optionD,
        correctKey: a.question.correctKey,
        selectedKey: a.selectedKey,
        isCorrect: a.isCorrect,
      })),
      explanations,
    })
  } catch (error) {
    console.error('Explain mistake error:', error)
    return NextResponse.json({ error: 'Failed to analyze mistakes' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getAIProvider, checkAllProviders } from '@/ai/providers/index'
import { responseCache } from '@/ai/cache/cache-service'

export async function POST(request: Request) {
  try {
    const { topic, difficulty, count } = await request.json()
    if (!topic) return NextResponse.json({ error: 'Topic is required' }, { status: 400 })

    const prompt = `Generate ${count || 3} multiple choice questions about "${topic}" at ${difficulty || 'medium'} difficulty.
    
Return ONLY a valid JSON array (no other text). Each object must have:
- "question": the question text
- "options": array of 4 strings
- "correctIndex": 0-3 indicating the correct answer
- "explanation": brief explanation of the correct answer
- "difficulty": "easy", "medium", or "hard"

Example:
[
  {
    "question": "What is the time complexity of binary search?",
    "options": ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    "correctIndex": 1,
    "explanation": "Binary search halves the search space each iteration, giving logarithmic time complexity.",
    "difficulty": "easy"
  }
]`

    const messages = [
      { role: 'system' as const, content: 'You are a quiz generator. Output ONLY valid JSON.' },
      { role: 'user' as const, content: prompt },
    ]

    const cacheKey = `${topic}:${difficulty}:${count}`
    const cached = responseCache.get(
      [{ role: 'user', content: cacheKey }],
      'quiz-generator'
    )
    if (cached) {
      try {
        return NextResponse.json({ questions: JSON.parse(cached) })
      } catch {
      }
    }

    const { healthy } = await checkAllProviders()
    if (!healthy) {
      return NextResponse.json({
        questions: generateFallbackQuiz(topic, count || 3),
      })
    }

    const provider = getAIProvider()
    let content: string

    try {
      content = await provider.complete({
        messages,
        temperature: 0.7,
        maxTokens: 2048,
      })
    } catch {
      content = JSON.stringify(generateFallbackQuiz(topic, count || 3))
    }

    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim()
    let questions
    try {
      questions = JSON.parse(cleaned)
    } catch {
      questions = generateFallbackQuiz(topic, count || 3)
    }

    responseCache.set(
      [{ role: 'user', content: cacheKey }],
      'quiz-generator',
      JSON.stringify(questions),
      300_000
    )

    return NextResponse.json({ questions })
  } catch {
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}

function generateFallbackQuiz(topic: string, count: number): Array<{
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  difficulty: string
}> {
  const quizzes = [
    {
      question: `What is the primary purpose of ${topic}?`,
      options: ['To complicate things', 'To solve problems efficiently', 'To use more memory', 'To slow down execution'],
      correctIndex: 1,
      explanation: `${topic} is designed to solve specific problems more efficiently than naive approaches.`,
      difficulty: 'easy',
    },
    {
      question: `Which of the following best describes ${topic}?`,
      options: ['A programming language', 'A fundamental concept in computing', 'A hardware component', 'A database system'],
      correctIndex: 1,
      explanation: `${topic} is a fundamental concept that helps organize and process information systematically.`,
      difficulty: 'easy',
    },
    {
      question: `Why is understanding ${topic} important?`,
      options: ['It is only useful for exams', 'It helps build efficient and scalable solutions', 'It is outdated', 'It only applies to theoretical CS'],
      correctIndex: 1,
      explanation: `Understanding ${topic} is crucial for building efficient, maintainable, and scalable software systems.`,
      difficulty: 'medium',
    },
  ]

  return quizzes.slice(0, count)
}

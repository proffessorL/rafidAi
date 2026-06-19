import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { notifyQuizCompleted } from '@/lib/services/notification-service'
import { ragService } from '@/ai/rag/rag-service'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' })

const TOPIC_MAP: Record<string, string> = {
  arrays: 'Arrays & Linked Lists',
  trees: 'Trees & BST',
  sorting: 'Sorting Algorithms',
  graph: 'Graphs & Traversal',
  dp: 'Dynamic Programming',
  hashing: 'Hash Tables',
  recursion: 'Recursion',
  complexity: 'Big-O Complexity',
}

const TOPIC_TEMPLATES: Record<string, Array<{ q: string; a: string; b: string; c: string; d: string; k: string; e: string }>> = {
  'Arrays & Linked Lists': [
    { q: 'What is the time complexity of accessing an element by index in an array?', a: 'O(1)', b: 'O(n)', c: 'O(log n)', d: 'O(n²)', k: 'A', e: 'Access by index is O(1) due to contiguous memory.' },
    { q: 'What does each node in a singly linked list contain?', a: 'Data and a pointer to the next node', b: 'Data and pointers to both next and previous', c: 'Only data', d: 'Only a pointer', k: 'A', e: 'A singly linked list node contains data and one pointer to the next node.' },
    { q: 'Inserting at the head of a singly linked list is:', a: 'O(1)', b: 'O(n)', c: 'O(log n)', d: 'O(n²)', k: 'A', e: 'Inserting at head only requires creating a new node and updating the head pointer.' },
    { q: 'What is a dynamic array?', a: 'An array that can resize automatically', b: 'An array with variable data types', c: 'A linked list implementation', d: 'An array that only grows', k: 'A', e: 'A dynamic array resizes itself automatically when full.' },
    { q: 'Which is more cache-friendly?', a: 'Array', b: 'Linked List', c: 'Both are equal', d: 'Neither', k: 'A', e: 'Arrays are more cache-friendly due to contiguous memory.' },
    { q: 'How do you detect a cycle in a linked list?', a: "Floyd's Cycle Detection", b: 'Binary search', c: 'Sort the list', d: 'Use a stack', k: 'A', e: "Floyd's algorithm uses slow/fast pointers — if they meet, a cycle exists." },
  ],
  'Trees & BST': [
    { q: 'What is the maximum nodes at level L of a binary tree?', a: '2^L', b: '2^L - 1', c: 'L²', d: 'L + 1', k: 'A', e: 'At level L, the maximum nodes is 2^L.' },
    { q: 'In a BST, values less than the root go to the:', a: 'Left subtree', b: 'Right subtree', c: 'Both subtrees', d: 'Nowhere', k: 'A', e: 'BST property: left subtree contains values less than the root.' },
    { q: 'Which traversal visits the root first?', a: 'Pre-order', b: 'In-order', c: 'Post-order', d: 'Level-order', k: 'A', e: 'Pre-order visits: Root → Left → Right.' },
    { q: 'What is the height of a tree with only a root?', a: '0', b: '1', c: '-1', d: 'Undefined', k: 'A', e: 'Height is edges on longest path — a single node has height 0.' },
    { q: 'Worst-case height of a BST with n nodes:', a: 'O(n)', b: 'O(log n)', c: 'O(1)', d: 'O(√n)', k: 'A', e: 'A skewed BST has O(n) height.' },
    { q: 'In-order traversal of a BST produces:', a: 'Sorted order', b: 'Reverse order', c: 'Random order', d: 'Level order', k: 'A', e: 'In-order visits left → root → right, producing sorted output.' },
  ],
  'Sorting Algorithms': [
    { q: 'Which sort repeatedly swaps adjacent elements?', a: 'Bubble Sort', b: 'Merge Sort', c: 'Quick Sort', d: 'Heap Sort', k: 'A', e: 'Bubble Sort swaps adjacent elements that are out of order.' },
    { q: 'Best-case time of Bubble Sort (optimized):', a: 'O(n)', b: 'O(n²)', c: 'O(n log n)', d: 'O(1)', k: 'A', e: 'Optimized bubble sort stops early if no swaps — O(n) best case.' },
    { q: 'Average time complexity of Quick Sort:', a: 'O(n log n)', b: 'O(n²)', c: 'O(n)', d: 'O(n log² n)', k: 'A', e: 'Quick Sort averages O(n log n) with random pivot selection.' },
    { q: 'Space complexity of Merge Sort:', a: 'O(n)', b: 'O(1)', c: 'O(log n)', d: 'O(n²)', k: 'A', e: 'Merge Sort needs O(n) auxiliary space for merging.' },
    { q: 'Which sort is stable?', a: 'Merge Sort', b: 'Quick Sort', c: 'Heap Sort', d: 'Selection Sort', k: 'A', e: 'Merge Sort preserves relative order of equal elements.' },
    { q: 'Lower bound for comparison-based sorting:', a: 'Ω(n log n)', b: 'Ω(n)', c: 'Ω(n²)', d: 'Ω(log n)', k: 'A', e: 'Comparison sorts require at least Ω(n log n) comparisons.' },
  ],
  'Graphs & Traversal': [
    { q: 'Which data structure is used for BFS?', a: 'Queue', b: 'Stack', c: 'Heap', d: 'Tree', k: 'A', e: 'BFS uses a queue to track nodes at the current level.' },
    { q: 'What does DFS stand for?', a: 'Depth-First Search', b: 'Data-First Search', c: 'Dynamic-First Search', d: 'Deep-First Search', k: 'A', e: 'DFS explores depth before breadth.' },
    { q: 'Time complexity of DFS on V vertices and E edges:', a: 'O(V + E)', b: 'O(V × E)', c: 'O(V²)', d: 'O(E²)', k: 'A', e: 'DFS visits each vertex and edge once — O(V + E).' },
    { q: 'Dijkstra\'s algorithm finds:', a: 'Shortest paths from a source', b: 'Minimum spanning tree', c: 'All pairs shortest paths', d: 'Graph cycles', k: 'A', e: 'Dijkstra finds shortest paths from a single source.' },
    { q: 'A topological sort requires a:', a: 'DAG (Directed Acyclic Graph)', b: 'Undirected graph', c: 'Weighted graph', d: 'Complete graph', k: 'A', e: 'Only DAGs can be topologically sorted.' },
  ],
  'Dynamic Programming': [
    { q: 'DP is mainly used for problems with:', a: 'Optimal substructure and overlapping subproblems', b: 'Random inputs', c: 'Small data', d: 'No recursion', k: 'A', e: 'DP relies on optimal substructure and overlapping subproblems.' },
    { q: 'Memoization is a:', a: 'Top-down approach', b: 'Bottom-up approach', c: 'Greedy approach', d: 'Divide-and-conquer', k: 'A', e: 'Memoization caches results in a top-down recursive approach.' },
    { q: 'Tabulation is a:', a: 'Bottom-up approach', b: 'Top-down approach', c: 'Recursive approach', d: 'Brute force', k: 'A', e: 'Tabulation iteratively fills a table from base cases upward.' },
    { q: 'The Fibonacci sequence computed with DP has time:', a: 'O(n)', b: 'O(2ⁿ)', c: 'O(n²)', d: 'O(log n)', k: 'A', e: 'DP reduces Fibonacci from exponential to O(n).' },
    { q: 'The 0/1 Knapsack problem is solved with:', a: 'DP table', b: 'Greedy algorithm', c: 'Binary search', d: 'Sorting', k: 'A', e: '0/1 Knapsack uses a DP table comparing include/exclude options.' },
  ],
  'Hash Tables': [
    { q: 'Average time complexity of hash table lookup:', a: 'O(1)', b: 'O(n)', c: 'O(log n)', d: 'O(n²)', k: 'A', e: 'Hash tables average O(1) for lookup with a good hash function.' },
    { q: 'A good hash function minimizes:', a: 'Collisions', b: 'Memory', c: 'Speed', d: 'Complexity', k: 'A', e: 'A good hash function spreads keys uniformly to minimize collisions.' },
    { q: 'Separate chaining handles collisions by:', a: 'Linked list at each bucket', b: 'Linear probing', c: 'Double hashing', d: 'Rehashing', k: 'A', e: 'Separate chaining stores colliding keys in a linked list per bucket.' },
    { q: 'Load factor is:', a: 'n / k (items / buckets)', b: 'k / n (buckets / items)', c: 'n × k', d: 'n - k', k: 'A', e: 'Load factor = number of items / number of buckets.' },
  ],
  'Recursion': [
    { q: 'A recursive function must have:', a: 'A base case and a recursive case', b: 'Only a base case', c: 'Only loops', d: 'No return value', k: 'A', e: 'Recursion needs a base case to stop and a recursive case to progress.' },
    { q: 'The stack overflow error occurs when:', a: 'Recursion depth exceeds call stack limit', b: 'Too many parameters', c: 'Infinite loops', d: 'Memory leaks', k: 'A', e: 'Stack overflow happens when recursion goes too deep.' },
    { q: 'Tower of Hanoi with n disks takes:', a: '2ⁿ - 1 moves', b: 'n² moves', c: 'n! moves', d: '2ⁿ moves', k: 'A', e: 'Tower of Hanoi requires 2ⁿ - 1 moves for n disks.' },
    { q: 'Tail recursion is optimized by:', a: 'Compilers replacing with iteration', b: 'Using global variables', c: 'Dynamic programming', d: 'Memoization', k: 'A', e: 'Tail-call optimization replaces recursion with a jump, avoiding stack growth.' },
  ],
  'Big-O Complexity': [
    { q: 'O(1) describes:', a: 'Constant time', b: 'Logarithmic time', c: 'Linear time', d: 'Quadratic time', k: 'A', e: 'O(1) means execution time is constant regardless of input size.' },
    { q: 'Which is faster asymptotically?', a: 'O(log n)', b: 'O(n)', c: 'O(n log n)', d: 'O(n²)', k: 'A', e: 'O(log n) grows slowest — logarithmic time is very efficient.' },
    { q: 'O(n²) typically comes from:', a: 'Nested loops', b: 'Single loop', c: 'Binary search', d: 'Constant operations', k: 'A', e: 'Nested loops over n elements produce O(n²) time.' },
    { q: 'Amortized analysis considers:', a: 'Average cost over a sequence of operations', b: 'Worst case only', c: 'Best case only', d: 'Memory usage', k: 'A', e: 'Amortized analysis averages the cost over many operations.' },
  ],
}

function getTemplatesForTopic(topicName: string) {
  const matched = Object.keys(TOPIC_TEMPLATES).find(
    (key) => key.toLowerCase() === topicName.toLowerCase()
      || topicName.toLowerCase().includes(key.toLowerCase())
      || key.toLowerCase().includes(topicName.toLowerCase())
  )
  return matched ? TOPIC_TEMPLATES[matched] : null
}

function generateTemplateQuestions(topics: string[], difficulty: string, count: number) {
  const questions: any[] = []
  // Collect all matching templates across all requested topics
  let pool: Array<{ q: string; a: string; b: string; c: string; d: string; k: string; e: string; topic: string }> = []
  for (const topic of topics) {
    const templates = getTemplatesForTopic(topic)
    if (templates) {
      for (const t of templates) {
        pool.push({ ...t, topic })
      }
    }
  }
  // If no topic-matched templates, use a default generic set
  if (pool.length === 0) {
    pool = [
      { q: 'What is the time complexity of accessing an element by index?', a: 'O(1)', b: 'O(n)', c: 'O(log n)', d: 'O(n²)', k: 'A', e: 'Access by index is O(1) due to contiguous memory.', topic: topics[0] || 'General' },
      { q: 'Which data structure uses LIFO?', a: 'Stack', b: 'Queue', c: 'Deque', d: 'Heap', k: 'A', e: 'Stack follows Last-In-First-Out.', topic: topics[0] || 'General' },
      { q: 'What is the worst-case of binary search?', a: 'O(log n)', b: 'O(n)', c: 'O(n log n)', d: 'O(n²)', k: 'A', e: 'Binary search halves the search space.', topic: topics[0] || 'General' },
    ]
  }
  for (let i = 0; i < count; i++) {
    const t = pool[i % pool.length]
    questions.push({
      id: `gen-${i}`,
      topic: t.topic || topics[i % topics.length] || topics[0],
      difficulty,
      question: t.q,
      options: [t.a, t.b, t.c, t.d],
      correctIndex: ['A', 'B', 'C', 'D'].indexOf(t.k),
      explanation: t.e,
    })
  }
  return questions
}

function toDbFormat(questions: any[]) {
  return questions.map((q: any) => ({
    question: q.question,
    optionA: q.options[0] || '',
    optionB: q.options[1] || '',
    optionC: q.options[2] || '',
    optionD: q.options[3] || '',
    correctKey: ['A', 'B', 'C', 'D'][q.correctIndex] || 'A',
    explanation: q.explanation || '',
  }))
}

function toFrontendFormat(dbQuestions: any[], topicName: string, difficulty: string) {
  return dbQuestions.map((q: any, i: number) => ({
    id: q.id,
    topic: topicName,
    difficulty,
    question: q.question,
    options: [q.optionA, q.optionB, q.optionC, q.optionD],
    correctIndex: ['A', 'B', 'C', 'D'].indexOf(q.correctKey),
    explanation: q.explanation || '',
  }))
}

export async function POST(request: Request) {
  try {
    const { topics, course_ids, difficulty, num_questions } = await request.json()
    if (!topics || topics.length === 0) {
      return NextResponse.json({ error: 'At least one topic is required' }, { status: 400 })
    }

    const topicNames = topics.map((t: string) => TOPIC_MAP[t] || t)
    const count = Math.min(num_questions || 5, 10)
    const title = `${topicNames.join(', ')} Quiz`
    let rawQuestions: any[] = []
    let usedFallback = false

    // Build RAG context from course material
    let ragContextStr = ''
    try {
      const topicQueries = [...new Set(topicNames)]
      for (const query of topicQueries) {
        const chunks = await ragService.retrieveRelevantChunks(query, 3)
        if (chunks.length > 0) {
          ragContextStr += ragService.buildRAGContext(chunks) + '\n\n'
        }
      }
      ragContextStr = ragContextStr.trim()
    } catch {
      // RAG unavailable — proceed without context
    }

    const ragInjection = ragContextStr
      ? `\n\nUse the following course material to generate questions that are grounded in the actual content:\n${ragContextStr}\n\nBase your questions on this material where possible. If the material lacks sufficient detail, supplement with your general knowledge.`
      : ''

    if (groq.apiKey) {
      const maxRetries = 3
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const completion = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              {
                role: 'system',
                content: `You are a quiz generator. Generate exactly ${count} multiple-choice questions covering these topics: ${topicNames.join(', ')}. Difficulty: ${difficulty || 'medium'}.${ragInjection}

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{"questions":[{"question":"What is the time complexity of binary search?","options":["O(n)","O(log n)","O(n log n)","O(nÂ²)"],"correctIndex":1,"explanation":"Binary search halves the search space each step, giving O(log n) time."}]}

Rules:
- "options" must be an array of exactly 4 strings â€” each is the option TEXT ONLY, NO letter prefixes like "A)" or "B)"
- correctIndex must be 0, 1, 2, or 3 (the index of the correct option in the array)
- explanations should be concise and educational
- Mix questions across all provided topics
- Make sure questions are appropriate for ${difficulty || 'medium'} difficulty level
- Vary the correct answer position across questions`,
              },
              { role: 'user', content: `Generate a ${difficulty || 'medium'} quiz covering: ${topicNames.join(', ')}` },
            ],
            temperature: 0.7,
            max_tokens: 2048,
          })

          const content = completion.choices[0]?.message?.content || ''
          // Strip markdown code fences if present
          let clean = content.replace(/```(?:json)?\s*/gi, '').replace(/\s*```/g, '').trim()
          // Try to find a JSON object wrapping "questions"
          const outerMatch = clean.match(/\{[\s\S]*"questions"\s*:\s*\[[\s\S]*\]\s*\}/)
          if (outerMatch) {
            try {
              let raw = outerMatch[0]
                .replace(/[\x00-\x1F\x7F]/g, '')
                .replace(/,\s*([\]}])/g, '$1')
              const parsed = JSON.parse(raw)
              if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
                rawQuestions = parsed.questions
                break // success — exit retry loop
              }
            } catch { /* fall through to individual extraction */ }
          }
          // Fallback: try to extract individual question objects
          if (rawQuestions.length === 0) {
            const individualMatches = clean.match(/\{[^{}]*"question"\s*:\s*"[^"]*"[^{}]*\}/g)
            if (individualMatches) {
              for (const match of individualMatches) {
                try {
                  const parsed = JSON.parse(match)
                  if (parsed.question) rawQuestions.push(parsed)
                } catch { /* skip */ }
              }
            }
            if (rawQuestions.length > 0) break // success
          }
        } catch (aiError: any) {
          const isRateLimit = aiError?.status === 429 || (aiError?.error?.error?.code === 'rate_limit_exceeded')
          if (isRateLimit && attempt < maxRetries) {
            const waitMs = attempt * 5000
            console.error(`Rate limited (attempt ${attempt}/${maxRetries}), retrying in ${waitMs}ms...`)
            await new Promise(r => setTimeout(r, waitMs))
            continue
          }
          console.error('Groq AI error:', aiError)
        }
      }
    }

    if (rawQuestions.length === 0) {
      usedFallback = true
      rawQuestions = generateTemplateQuestions(topicNames, difficulty || 'medium', count).map((q) => ({
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }))
    }

    // Find or create the topic by name with a valid course
    const topicName = topicNames[0]
    let topic = await db.topic.findFirst({ where: { name: topicName } })
    if (!topic) {
      let course = await db.course.findFirst()
      if (!course) {
        course = await db.course.create({ data: { name: 'General', code: 'GEN', teacherId: 'default' } })
      }
      topic = await db.topic.create({ data: { name: topicName, courseId: course.id } })
    }

    const dbQuestions = toDbFormat(rawQuestions)
    const quiz = await db.quiz.create({
      data: { topicId: topic.id, title, difficulty: difficulty || 'medium', timeLimit: 600 },
    })
    const created: any[] = []
    for (const q of dbQuestions) {
      const saved = await db.quizQuestion.create({ data: { quizId: quiz.id, ...q } })
      created.push(saved)
    }

    const questions = toFrontendFormat(created, topicNames[0], difficulty || 'medium')
    return NextResponse.json({ quiz_id: quiz.id, questions, title, usedFallback })
  } catch (error) {
    console.error('Quiz generate error:', error)
    return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { quiz_id, answers, student_id, time_spent } = await request.json()
    const sid = student_id || 'stu_001'
    const questions = await db.quizQuestion.findMany({ where: { quizId: quiz_id } })
    let correctCount = 0

    const attempt = await db.quizAttempt.create({
      data: { studentId: sid, quizId: quiz_id, totalQuestions: questions.length, correctCount: 0, score: 0, timeSpent: time_spent || 0 },
    })

    for (const q of questions) {
      const selectedKey = answers[q.id]
      const isCorrect = selectedKey === q.correctKey
      if (isCorrect) correctCount++
      await db.quizAnswer.create({
        data: { attemptId: attempt.id, questionId: q.id, selectedKey: selectedKey || '', isCorrect },
      })
    }

    const score = questions.length > 0 ? (correctCount / questions.length) * 100 : 0
    await db.quizAttempt.update({ where: { id: attempt.id }, data: { score, correctCount } })

    const quiz = await db.quiz.findUnique({ where: { id: quiz_id }, select: { title: true } })
    if (quiz) {
      notifyQuizCompleted({
        studentId: sid,
        score,
        correctCount,
        totalQuestions: questions.length,
        quizTitle: quiz.title,
      }).catch(() => {})
    }

    return NextResponse.json({
      attempt_id: attempt.id, score: Math.round(score * 10) / 10,
      correct: correctCount, total: questions.length,
    })
  } catch (error) {
    console.error('Quiz submit error:', error)
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 })
  }
}

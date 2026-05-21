// Seed script for RESNOR platform mock data
// Run with: bun run src/seed/index.ts

import { db } from '@/lib/db'

async function main() {
  console.log('🌱 Seeding database...')

  // Create students
  const student1 = await db.user.create({
    data: { email: 'rafiq@diu.edu.bd', name: 'Rafiq Ahmed', role: 'student' },
  })
  const student2 = await db.user.create({
    data: { email: 'nusrat@diu.edu.bd', name: 'Nusrat Jahan', role: 'student' },
  })
  const student3 = await db.user.create({
    data: { email: 'karim@diu.edu.bd', name: 'Karim Hossain', role: 'student' },
  })
  const student4 = await db.user.create({
    data: { email: 'fatima@diu.edu.bd', name: 'Fatima Akter', role: 'student' },
  })
  const student5 = await db.user.create({
    data: { email: 'tanvir@diu.edu.bd', name: 'Tanvir Alam', role: 'student' },
  })

  // Create teacher
  const teacher = await db.user.create({
    data: { email: 'dr.islam@diu.edu.bd', name: 'Dr. Mohammad Islam', role: 'teacher' },
  })

  // Create courses
  const course1 = await db.course.create({
    data: { name: 'Data Structures & Algorithms', code: 'CSE-331', description: 'Advanced data structures and algorithm design', teacherId: teacher.id },
  })
  const course2 = await db.course.create({
    data: { name: 'Database Management Systems', code: 'CSE-332', description: 'Relational databases, SQL, and normalization', teacherId: teacher.id },
  })

  // Create topics
  const cse331Topics = [
    'Arrays & Linked Lists', 'Stacks & Queues', 'Trees & BST', 'Graph Algorithms',
    'Sorting Algorithms', 'Dynamic Programming', 'Hash Tables', 'Heap & Priority Queue'
  ]
  const topicIds: string[] = []
  for (const name of cse331Topics) {
    const topic = await db.topic.create({ data: { name, courseId: course1.id } })
    topicIds.push(topic.id)
    // Create 2-3 materials per topic
    const materialTypes = ['document', 'video', 'slide']
    for (let i = 0; i < 3; i++) {
      await db.material.create({
        data: {
          title: `${name} - ${['Lecture Notes', 'Video Tutorial', 'Slide Deck'][i]}`,
          topicId: topic.id,
          contentType: materialTypes[i],
          estimatedTime: [30, 45, 20][i],
        },
      })
    }
  }

  // Create quizzes
  const quizDifficulties = ['easy', 'medium', 'hard']
  for (let t = 0; t < 4; t++) {
    const quiz = await db.quiz.create({
      data: {
        topicId: topicIds[t],
        title: `${cse331Topics[t]} Quiz`,
        difficulty: quizDifficulties[t % 3],
        timeLimit: 600,
      },
    })
    // Create 5 questions per quiz
    const questions = [
      { q: `What is the time complexity of accessing an element in an array?`, a: 'O(1)', b: 'O(n)', c: 'O(log n)', d: 'O(n²)', key: 'A' },
      { q: `Which data structure uses FIFO principle?`, a: 'Stack', b: 'Queue', c: 'Tree', d: 'Graph', key: 'B' },
      { q: `What is the worst-case time complexity of binary search?`, a: 'O(n)', b: 'O(n²)', c: 'O(log n)', d: 'O(1)', key: 'C' },
      { q: `Which sorting algorithm has the best average time complexity?`, a: 'Bubble Sort', b: 'Selection Sort', c: 'Merge Sort', d: 'Insertion Sort', key: 'C' },
      { q: `What property must a BST satisfy?`, a: 'Left child < Parent > Right child', b: 'All nodes equal', c: 'No ordering', d: 'Right child < Parent', key: 'A' },
    ]
    for (const qData of questions) {
      await db.quizQuestion.create({
        data: {
          quizId: quiz.id,
          question: qData.q,
          optionA: qData.a,
          optionB: qData.b,
          optionC: qData.c,
          optionD: qData.d,
          correctKey: qData.key,
          explanation: `The correct answer is ${qData.key}: ${[qData.a, qData.b, qData.c, qData.d][qData.key.charCodeAt(0) - 65]}.`,
        },
      })
    }
  }

  // Create material progress for student1
  const materials = await db.material.findMany()
  for (let i = 0; i < materials.length; i++) {
    const status = i < materials.length * 0.6 ? 'done' : i < materials.length * 0.8 ? 'in_progress' : 'pending'
    await db.materialProgress.create({
      data: {
        studentId: student1.id,
        materialId: materials[i].id,
        completionStatus: status,
        timeSpent: status === 'done' ? Math.floor(Math.random() * 1800) + 600 : status === 'in_progress' ? Math.floor(Math.random() * 900) : 0,
        lastAccessedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    })
  }

  // Create quiz attempts for student1
  const quizzes = await db.quiz.findMany()
  for (let i = 0; i < quizzes.length; i++) {
    const questions = await db.quizQuestion.findMany({ where: { quizId: quizzes[i].id } })
    const correctCount = Math.floor(Math.random() * 3) + 2
    const attempt = await db.quizAttempt.create({
      data: {
        studentId: student1.id,
        quizId: quizzes[i].id,
        score: (correctCount / questions.length) * 100,
        totalQuestions: questions.length,
        correctCount,
        timeSpent: Math.floor(Math.random() * 300) + 120,
        completedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
      },
    })
    // Create answers
    for (let q = 0; q < questions.length; q++) {
      const isCorrect = q < correctCount
      const selectedKey = isCorrect ? questions[q].correctKey : ['A', 'B', 'C', 'D'].filter(k => k !== questions[q].correctKey)[Math.floor(Math.random() * 3)]
      await db.quizAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: questions[q].id,
          selectedKey,
          isCorrect,
        },
      })
    }
  }

  // Create streak for student1
  await db.streak.create({
    data: {
      studentId: student1.id,
      currentStreak: 12,
      longestStreak: 21,
      lastActiveDate: new Date(),
      totalActiveDays: 45,
    },
  })

  // Create badges
  const badges = [
    { name: 'First Quiz', description: 'Complete your first quiz', icon: '🎯', category: 'quiz', thresholdType: 'quiz_count', thresholdValue: 1 },
    { name: 'Quiz Master', description: 'Score 100% on a quiz', icon: '🏆', category: 'quiz', thresholdType: 'quiz_score', thresholdValue: 100 },
    { name: 'Week Warrior', description: '7-day study streak', icon: '🔥', category: 'streak', thresholdType: 'streak_days', thresholdValue: 7 },
    { name: 'Study Marathon', description: '21-day study streak', icon: '⭐', category: 'streak', thresholdType: 'streak_days', thresholdValue: 21 },
    { name: 'Material Explorer', description: 'Complete 10 materials', icon: '📚', category: 'study', thresholdType: 'materials_done', thresholdValue: 10 },
    { name: 'Engagement Pro', description: 'Reach 80% engagement score', icon: '💎', category: 'engagement', thresholdType: 'engagement_score', thresholdValue: 80 },
    { name: 'Quick Learner', description: 'Complete 5 quizzes', icon: '⚡', category: 'quiz', thresholdType: 'quiz_count', thresholdValue: 5 },
    { name: 'Consistency King', description: '30-day streak', icon: '👑', category: 'streak', thresholdType: 'streak_days', thresholdValue: 30 },
  ]
  const createdBadges = []
  for (const b of badges) {
    createdBadges.push(await db.badge.create({ data: b }))
  }
  // Earn some badges for student1
  await db.earnedBadge.create({ data: { studentId: student1.id, badgeId: createdBadges[0].id } })
  await db.earnedBadge.create({ data: { studentId: student1.id, badgeId: createdBadges[2].id } })
  await db.earnedBadge.create({ data: { studentId: student1.id, badgeId: createdBadges[4].id } })
  await db.earnedBadge.create({ data: { studentId: student1.id, badgeId: createdBadges[5].id } })

  // Create engagement score
  await db.engagementScore.create({
    data: {
      studentId: student1.id,
      overallScore: 78,
      studyConsistencyRate: 85,
      avgSessionDuration: 23.5,
      weeklyActiveHours: 14.2,
      interactionDensity: 72,
    },
  })

  // Create notifications
  const notifications = [
    { title: 'Great Progress!', message: 'You completed 3 materials this week. Keep it up!', type: 'achievement' },
    { title: 'Quiz Available', message: 'New quiz on Graph Algorithms is now available.', type: 'info' },
    { title: 'Streak Warning', message: 'Don\'t forget to study today to maintain your 12-day streak!', type: 'warning' },
    { title: 'New Badge Earned', message: 'You earned the "Material Explorer" badge!', type: 'achievement' },
    { title: 'Study Reminder', message: 'You have 4 pending materials in Trees & BST topic.', type: 'reminder' },
    { title: 'Weekly Report', message: 'Your study time increased by 15% this week compared to last week.', type: 'info' },
  ]
  for (const n of notifications) {
    await db.notification.create({
      data: { ...n, studentId: student1.id },
    })
  }

  // Create wellbeing checkin
  await db.wellbeingCheckin.create({
    data: {
      studentId: student1.id,
      checkinType: 'motivational',
      title: 'You\'re doing amazing! 🌟',
      content: 'You\'ve been consistently studying for 12 days straight. Research shows that consistent effort leads to better long-term retention. Take a moment to celebrate your progress!',
    },
  })

  // Create chat sessions
  const session = await db.chatSession.create({
    data: { studentId: student1.id, courseId: course1.id, title: 'DSA Study Help' },
  })
  await db.chatMessage.create({ data: { sessionId: session.id, role: 'user', content: 'Can you explain how Quick Sort works?' } })
  await db.chatMessage.create({ data: { sessionId: session.id, role: 'assistant', content: 'Quick Sort is a divide-and-conquer algorithm that works by:\n\n1. **Choosing a pivot** element from the array\n2. **Partitioning** the array around the pivot (elements smaller go left, larger go right)\n3. **Recursively** applying the same to the sub-arrays\n\n**Time Complexity:** O(n log n) average, O(n²) worst case\n**Space Complexity:** O(log n) for the recursion stack\n\nWould you like me to walk through an example?' } })
  await db.chatMessage.create({ data: { sessionId: session.id, role: 'user', content: 'What about its space complexity in detail?' } })
  await db.chatMessage.create({ data: { sessionId: session.id, role: 'assistant', content: 'Great question! Quick Sort\'s space complexity depends on the implementation:\n\n**In-place Quick Sort:** O(log n) auxiliary space for the recursion stack\n- Each recursive call adds a frame to the stack\n- With balanced partitions, the depth is O(log n)\n- Worst case (already sorted): O(n) stack depth\n\n**Not in-place:** O(n) additional space for creating sub-arrays\n\nThe in-place version is preferred because it uses minimal extra memory.' } })

  // Create some telemetry records
  for (let i = 0; i < 20; i++) {
    await db.telemetryRecord.create({
      data: {
        studentId: student1.id,
        pageId: `material_${Math.floor(Math.random() * 10) + 1}`,
        activeSeconds: Math.floor(Math.random() * 1800) + 300,
        scrollPercentage: Math.random() * 100,
        interactionCount: Math.floor(Math.random() * 30) + 5,
        tabFocused: Math.random() > 0.15,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      },
    })
  }

  // Create progress for other students too
  for (const student of [student2, student3, student4, student5]) {
    for (let i = 0; i < 5; i++) {
      const status = i < 2 ? 'done' : i < 4 ? 'in_progress' : 'pending'
      await db.materialProgress.create({
        data: {
          studentId: student.id,
          materialId: materials[i]?.id || materials[0].id,
          completionStatus: status,
          timeSpent: Math.floor(Math.random() * 1200),
          lastAccessedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      })
    }
    await db.streak.create({
      data: {
        studentId: student.id,
        currentStreak: Math.floor(Math.random() * 10),
        longestStreak: Math.floor(Math.random() * 15) + 5,
        lastActiveDate: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
        totalActiveDays: Math.floor(Math.random() * 30) + 10,
      },
    })
    await db.engagementScore.create({
      data: {
        studentId: student.id,
        overallScore: Math.random() * 60 + 30,
        studyConsistencyRate: Math.random() * 50 + 30,
        avgSessionDuration: Math.random() * 20 + 5,
        weeklyActiveHours: Math.random() * 10 + 2,
        interactionDensity: Math.random() * 50 + 20,
      },
    })
    // Quiz attempts for other students
    for (let q = 0; q < 2; q++) {
      const quizQuestions = await db.quizQuestion.findMany({ where: { quizId: quizzes[q]?.id } })
      if (quizQuestions.length > 0) {
        const correctCount = Math.floor(Math.random() * 3) + 1
        const att = await db.quizAttempt.create({
          data: {
            studentId: student.id,
            quizId: quizzes[q].id,
            score: (correctCount / quizQuestions.length) * 100,
            totalQuestions: quizQuestions.length,
            correctCount,
            timeSpent: Math.floor(Math.random() * 400) + 100,
            completedAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
          },
        })
        for (let qq = 0; qq < quizQuestions.length; qq++) {
          const isCorrect = qq < correctCount
          await db.quizAnswer.create({
            data: {
              attemptId: att.id,
              questionId: quizQuestions[qq].id,
              selectedKey: isCorrect ? quizQuestions[qq].correctKey : ['A', 'B', 'C', 'D'].filter(k => k !== quizQuestions[qq].correctKey)[0],
              isCorrect,
            },
          })
        }
      }
    }
  }

  // Create intervention records
  await db.interventionRecord.create({
    data: {
      teacherId: teacher.id,
      studentId: student3.id,
      courseId: course1.id,
      reason: 'Score dropped significantly in recent quizzes',
      status: 'draft',
      message: 'Dear Karim, I noticed your recent quiz scores have been declining. Would you like to schedule office hours to discuss?',
    },
  })

  console.log('✅ Seed completed successfully!')
  console.log(`Created ${5} students, ${1} teacher, ${2} courses, ${topicIds.length} topics`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())

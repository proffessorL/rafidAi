import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  const uid = 'cmq0x9kup0002vfxgv6zefduy'
  
  const user = await db.user.findUnique({ where: { id: uid }, select: { id: true, email: true, name: true, role: true } })
  console.log('User:', JSON.stringify(user))
  
  const enrollments = await db.enrollment.findMany({ where: { studentId: uid }, include: { course: true } })
  console.log('Enrollments:', JSON.stringify(enrollments.map(e => ({ courseId: e.courseId, courseName: e.course.name }))))
  
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 86400000)
  console.log('Date range:', now.toISOString(), 'to', weekFromNow.toISOString())
  
  const allQuizzes = await db.quiz.findMany({ include: { topic: true } })
  console.log('All quizzes count:', allQuizzes.length)
  for (const q of allQuizzes) {
    console.log('  Quiz:', q.title, 'teacherId:', q.teacherId, 'dueDate:', q.dueDate, 'topic:', q.topic?.name, 'topicCourseId:', q.topic?.courseId)
  }
  const quizzes = await db.quiz.findMany({
    where: { teacherId: { not: null }, dueDate: { not: null, gte: now, lte: weekFromNow } },
    include: { topic: true }
  })
  console.log('Filtered quizzes count:', quizzes.length)
  for (const q of quizzes) {
    console.log('  Quiz:', q.title, 'due:', q.dueDate, 'topic:', q.topic?.name, 'topicCourseId:', q.topic?.courseId, 'teacherId:', q.teacherId)
  }
  
  const courseIds = enrollments.map(e => e.courseId)
  console.log('Enrolled courseIds:', courseIds)
  
  if (courseIds.length > 0) {
    const matched = await db.quiz.findMany({
      where: { teacherId: { not: null }, dueDate: { not: null, gte: now, lte: weekFromNow }, topic: { courseId: { in: courseIds } } },
      include: { topic: { include: { course: true } } }
    })
    console.log('Matched quizzes count:', matched.length)
    for (const q of matched) {
      console.log('  Quiz:', q.title, 'course:', q.topic.course.name, 'due:', q.dueDate)
    }
  }
  
  await db.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })

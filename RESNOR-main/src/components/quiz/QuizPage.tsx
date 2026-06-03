'use client'

import { useState } from 'react'
import QuizGenerator from './QuizGenerator'
import TeacherQuizTaker from './TeacherQuizTaker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, GraduationCap } from 'lucide-react'

export default function QuizPage() {
  const [tab, setTab] = useState('ai')
  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="w-full sm:w-auto mb-4">
        <TabsTrigger value="ai" className="gap-1.5">
          <Brain className="size-4" />
          AI Quiz Generator
        </TabsTrigger>
        <TabsTrigger value="teacher" className="gap-1.5">
          <GraduationCap className="size-4" />
          Teacher Quizzes
        </TabsTrigger>
      </TabsList>
      <TabsContent value="ai">
        <QuizGenerator />
      </TabsContent>
      <TabsContent value="teacher">
        <TeacherQuizTaker />
      </TabsContent>
    </Tabs>
  )
}

"use client"

import { Hero } from '../Hero'
import { ProgressBanner } from '../ProgressBanner'
import { StressMonitor } from '../StressMonitor'
import { RoutineGenerator } from '../RoutineGenerator'
import { ChatCheckIn } from '../ChatCheckIn'
import { AdaptiveLearning } from '../AdaptiveLearning'
import { StressRelief } from '../StressRelief'
import { Footer } from '../Footer'

export default function WellbeingHub() {
  return (
    <div className="wellbeing-hub">
      <Hero />
      <ProgressBanner />
      <StressMonitor />
      <RoutineGenerator />
      <ChatCheckIn />
      <AdaptiveLearning />
      <StressRelief />
      <Footer />
    </div>
  )
}

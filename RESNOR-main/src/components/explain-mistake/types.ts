export type MistakeTypeEnum =
  | 'CONCEPT_MISUNDERSTANDING'
  | 'FALSE_ASSUMPTION'
  | 'FORMULA_MISUSE'
  | 'ALGEBRAIC_ERROR'
  | 'CALCULATION_FLOW_EXCEPTION'
  | 'LOGIC_ERROR'
  | 'SEQUENTIAL_REASONING_FAILURE'
  | 'SYNTAX_ERROR'
  | 'EXECUTION_FLOW_DISCONNECT'
  | 'MISINTERPRETATION'
  | 'CARELESS_MISTAKE'
  | 'KNOWLEDGE_GAP'
  | 'GUESS_BASED'
  | 'SUPERFICIALLY_MEMORIZED'

export type CorrectnessLevelEnum =
  | 'CORRECT'
  | 'PARTIALLY_CORRECT'
  | 'INCORRECT'
  | 'CONCEPTUALLY_INCOMPLETE'
  | 'GUESS_BASED'
  | 'SUPERFICIALLY_MEMORIZED'

export type RecoveryStatusEnum =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'PRACTICING'
  | 'MASTERED'
  | 'REVIEWING'

export interface QuizQuestion {
  id: number
  text: string
  studentAnswer: string
  correctAnswer: string
  isCorrect: boolean
  mistakeType?: string
  difficulty?: string
  topic?: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
}

export function resolveOptionText(q: QuizQuestion, key: string): string {
  const map: Record<string, string | undefined> = {
    A: q.optionA,
    B: q.optionB,
    C: q.optionC,
    D: q.optionD,
  }
  return map[key] || key
}

export interface QuizAttempt {
  id: string
  label: string
  date: string
  score: number
  questions: QuizQuestion[]
}

export interface MistakeExplanationData {
  mistakeSummary: string
  rootCauseAnalysis: string
  reasoningBreakdown: string
  quickFix: string
  correctConceptExplanation: string
  simplifiedAnalogy: string
  stepByStepCorrection: string
  preventionTips: string
  errorCategory: string
  relatedTopics: string[]
  mistakeType: MistakeTypeEnum
  correctnessLevel: CorrectnessLevelEnum
  knowledgeGaps: string[]
  confidenceDissonanceFlag: boolean
  remediationExercises: RemediationExerciseData[]
  knowledgeNode: KnowledgeGraphNode | null
  knowledgeEdges: KnowledgeGraphEdge[]
  pending?: boolean
}

export interface CognitiveProfileData {
  totalEvaluations: number
  totalExplanations: number
  strongestAreas: string[]
  weakestAreas: string[]
  repeatedPatterns: string[]
  recoveryRate: number
  averageDissonanceScore: number
}

export interface MisconceptionRecord {
  id: string
  conceptNodeId: string
  conceptLabel: string
  frequencyCounter: number
  lastTriggeredAt: string
  recoveryStatus: RecoveryStatusEnum
  mistakeType: MistakeTypeEnum
  patternDescription: string | null
  relatedQuestions: { conceptLabel: string; date: string; questionId: string | null; attemptId: string | null }[]
}

export interface RemediationExerciseData {
  id: string
  exerciseType: string
  difficulty: string
  question: string
  correctAnswer: string
  options: string[] | null
  hint: string | null
  isCompleted: boolean
  score: number | null
}

export interface KnowledgeGraphNode {
  id: string
  label: string
  type: 'concept' | 'prerequisite' | 'skill'
  status: 'mastered' | 'weak' | 'failed' | 'untouched'
  strength: number
}

export interface KnowledgeGraphEdge {
  source: string
  target: string
  type: 'requires' | 'related'
  strength: number
}

export interface TeacherInsightData {
  id: string
  insightType: string
  title: string
  summary: string
  affectedStudents: number
  severity: string
  conceptNodeId: string | null
}

export interface ConfidenceLogData {
  id: string
  confidenceLevel: number
  expectedScore: number | null
  actualScore: number | null
  cognitiveDissonanceScore: number | null
  createdAt: string
}

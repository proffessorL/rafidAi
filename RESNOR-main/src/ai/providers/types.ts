export type AIProviderType = 'ollama' | 'groq' | 'openrouter' | 'huggingface'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamChunk {
  content: string
  done?: boolean
}

export interface CompletionParams {
  messages: ChatMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
  enabled: boolean
  priority: number
}

export interface EmbeddingVector {
  text: string
  vector: number[]
  metadata?: Record<string, unknown>
}

export interface DocumentChunk {
  id: string
  text: string
  metadata: {
    source: string
    page?: number
    chunkIndex: number
    totalChunks: number
  }
  embedding?: number[]
}

export interface RAGContext {
  chunks: DocumentChunk[]
  query: string
  queryEmbedding: number[]
}

export interface ProviderStatus {
  name: AIProviderType
  available: boolean
  model: string
  latencyMs?: number
}

export const DEFAULT_MODELS: Record<AIProviderType, string> = {
  ollama: 'llama3.2',
  groq: 'llama-3.1-8b-instant',
  openrouter: 'deepseek/deepseek-chat:free',
  huggingface: 'mistralai/Mistral-7B-Instruct-v0.3',
}

export const PROVIDER_PRIORITIES: Record<AIProviderType, number> = {
  ollama: 1,
  groq: 2,
  openrouter: 3,
  huggingface: 4,
}

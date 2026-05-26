import { NextResponse } from 'next/server'
import { vectorStore } from '@/ai/vector-store/vector-store'

export async function GET() {
  const stats = vectorStore.getStats()
  return NextResponse.json({
    documents: stats.sources.map((source) => ({
      id: source,
      name: source,
      chunks: stats.totalChunks,
      type: 'document',
    })),
    totalChunks: stats.totalChunks,
  })
}

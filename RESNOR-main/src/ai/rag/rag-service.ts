import { vectorStore } from '../vector-store/vector-store'
import type { DocumentChunk } from '../providers/types'

export class RAGService {
  private chunkSize: number
  private chunkOverlap: number

  constructor(chunkSize: number = 512, chunkOverlap: number = 64) {
    this.chunkSize = chunkSize
    this.chunkOverlap = chunkOverlap
  }

  chunkText(text: string, source: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = []
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean)
    let current = ''
    let chunkIndex = 0

    for (const para of paragraphs) {
      if ((current + para).length > this.chunkSize && current.length > 0) {
        chunks.push(this.makeChunk(current, source, chunkIndex++))
        current = current.slice(-this.chunkOverlap)
      }
      current += (current ? '\n\n' : '') + para
    }

    if (current.trim()) {
      chunks.push(this.makeChunk(current, source, chunkIndex++))
    }

    const total = chunks.length
    for (const c of chunks) {
      c.metadata.totalChunks = total
    }

    return chunks
  }

  async indexDocument(text: string, source: string): Promise<number> {
    const chunks = this.chunkText(text, source)
    await vectorStore.addChunks(chunks)
    return chunks.length
  }

  async retrieveRelevantChunks(query: string, topK: number = 5): Promise<DocumentChunk[]> {
    return await vectorStore.search(query, topK)
  }

  private cleanSourceName(source: string): string {
    if (source.startsWith('course-')) {
      return 'Course Material'
    }
    return source
  }

  buildRAGContext(chunks: DocumentChunk[]): string {
    if (chunks.length === 0) return ''

    return chunks
      .map(
        (c, i) =>
          `[${this.cleanSourceName(c.metadata.source)} — Part ${i + 1}]\n${c.text}`
      )
      .join('\n\n')
  }

  injectContext(systemPrompt: string, ragContext: string): string {
    if (!ragContext) return systemPrompt
    return `${systemPrompt}

---

RELEVANT COURSE MATERIAL:
${ragContext}

---

Use the above course material to inform your answer. If the material doesn't contain enough information, rely on your general knowledge. Reference the material naturally (e.g. "according to the course material").`
  }

  private makeChunk(text: string, source: string, index: number): DocumentChunk {
    return {
      id: `${source}-${index}-${Date.now()}`,
      text: text.trim(),
      metadata: { source, chunkIndex: index, totalChunks: 0 },
    }
  }
}

export const ragService = new RAGService()

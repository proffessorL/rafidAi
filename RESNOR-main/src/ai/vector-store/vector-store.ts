import { embeddingService } from '../embeddings/embedding-service'
import type { DocumentChunk } from '../providers/types'
import * as fs from 'fs'
import * as path from 'path'

const PERSIST_PATH = path.join(process.cwd(), '.vectordb', 'chunks.json')

export class VectorStore {
  private chunks: DocumentChunk[] = []
  private loaded = false

  constructor() {
    this.load()
  }

  async addChunks(newChunks: DocumentChunk[]): Promise<void> {
    const toEmbed = newChunks.filter((c) => !c.embedding)
    if (toEmbed.length > 0) {
      const texts = toEmbed.map((c) => c.text)
      const results = await embeddingService.embedBatch(texts)
      for (let i = 0; i < toEmbed.length; i++) {
        toEmbed[i].embedding = results[i].vector
      }
    }

    this.chunks.push(...newChunks)
    this.persist()
  }

  async search(query: string, topK: number = 5): Promise<DocumentChunk[]> {
    const queryVec = await embeddingService.embed(query)
    const scored = this.chunks
      .filter((c) => c.embedding && c.embedding.length > 0)
      .map((chunk) => ({
        chunk,
        score: embeddingService.cosineSimilarity(queryVec, chunk.embedding!),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    return scored.map((s) => s.chunk)
  }

  async deleteSource(source: string): Promise<void> {
    this.chunks = this.chunks.filter((c) => c.metadata.source !== source)
    this.persist()
  }

  getStats(): { totalChunks: number; sources: string[] } {
    const sources = [...new Set(this.chunks.map((c) => c.metadata.source))]
    return { totalChunks: this.chunks.length, sources }
  }

  private persist(): void {
    try {
      const dir = path.dirname(PERSIST_PATH)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(PERSIST_PATH, JSON.stringify(this.chunks, null, 2), 'utf-8')
    } catch {
    }
  }

  private load(): void {
    if (this.loaded) return
    try {
      if (fs.existsSync(PERSIST_PATH)) {
        const raw = fs.readFileSync(PERSIST_PATH, 'utf-8')
        this.chunks = JSON.parse(raw)
      }
    } catch {
      this.chunks = []
    }
    this.loaded = true
  }
}

export const vectorStore = new VectorStore()

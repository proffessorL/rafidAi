export interface EmbeddingResult {
  text: string
  vector: number[]
}

function simpleWordHash(text: string, dimensions: number = 384): number[] {
  const vector = new Array(dimensions).fill(0)
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)

  for (const word of words) {
    let hash = 0
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i)
      hash = hash & hash
    }
    const idx = Math.abs(hash) % dimensions
    vector[idx] += 1
  }

  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= magnitude
    }
  }

  return vector
}

export class EmbeddingService {
  private useHuggingFace: boolean
  private apiKey?: string

  constructor() {
    this.useHuggingFace = !!process.env.HUGGINGFACE_API_KEY
    this.apiKey = process.env.HUGGINGFACE_API_KEY
  }

  async embed(text: string): Promise<number[]> {
    if (this.useHuggingFace && this.apiKey) {
      try {
        return await this.huggingFaceEmbed(text)
      } catch {
        return simpleWordHash(text)
      }
    }
    return simpleWordHash(text)
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    if (this.useHuggingFace && this.apiKey && texts.length > 0) {
      try {
        const vectors = await this.huggingFaceEmbedBatch(texts)
        return texts.map((text, i) => ({ text, vector: vectors[i] || simpleWordHash(text) }))
      } catch {
      }
    }
    return texts.map((text) => ({ text, vector: simpleWordHash(text) }))
  }

  private async huggingFaceEmbed(text: string): Promise<number[]> {
    const res = await fetch(
      'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ inputs: text }),
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!res.ok) throw new Error(`HuggingFace embedding error: ${res.status}`)
    const data = await res.json()
    return Array.isArray(data) ? data[0] : data
  }

  private async huggingFaceEmbedBatch(texts: string[]): Promise<number[][]> {
    const res = await fetch(
      'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ inputs: texts }),
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!res.ok) throw new Error(`HuggingFace batch embedding error: ${res.status}`)
    return await res.json()
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    let dot = 0, magA = 0, magB = 0
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      magA += a[i] * a[i]
      magB += b[i] * b[i]
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB)
    return denom === 0 ? 0 : dot / denom
  }
}

export const embeddingService = new EmbeddingService()

import { PrismaClient } from '@prisma/client'
import { join } from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const dbPath = join(process.cwd(), 'db', 'custom.db')

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['warn', 'error'],
    datasources: {
      db: {
        url: `file:${dbPath}`,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
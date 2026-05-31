import { db } from '../src/lib/db'

async function main() {
  const r = await db.wellbeingAnalytics.deleteMany({})
  console.log('Deleted', r.count, 'analytics records')
  await db.$disconnect()
}

main().catch(console.error)

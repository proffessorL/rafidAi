import { db } from '../src/lib/db'

async function main() {
  const c = await db.burnoutCheckIn.deleteMany({})
  const p = await db.burnoutPrediction.deleteMany({})
  console.log(`Deleted ${c.count} check-ins and ${p.count} predictions`)
  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

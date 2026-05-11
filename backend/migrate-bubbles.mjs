/**
 * Migration one-shot : peuple ContentBubble depuis Content.bubbleId existant.
 * Doit tourner après `prisma db push` au démarrage.
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const contents = await prisma.content.findMany({
  where: {
    bubbleId: { not: null },
    bubbles: { none: {} },
  },
  select: { id: true, bubbleId: true },
})

if (contents.length > 0) {
  console.log(`[migrate-bubbles] Migration de ${contents.length} contenus vers ContentBubble...`)
  for (const c of contents) {
    await prisma.contentBubble.create({
      data: { contentId: c.id, bubbleId: c.bubbleId },
    })
  }
  console.log(`[migrate-bubbles] ✅ ${contents.length} contenus migrés.`)
} else {
  console.log('[migrate-bubbles] Rien à migrer.')
}

await prisma.$disconnect()

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const initial = [
  { type: 'support', value: 'livre' },
  { type: 'support', value: 'podcast' },
  { type: 'support', value: 'article' },
  { type: 'genre', value: 'Politique' },
  { type: 'genre', value: 'Sciences' },
  { type: 'genre', value: 'Philosophie' },
  { type: 'genre', value: 'Business' },
  { type: 'genre', value: 'Développement personnel' },
  { type: 'genre', value: 'Technologie' },
  { type: 'genre', value: 'Énergie' },
  { type: 'genre', value: 'Histoire' },
]
for (const tag of initial) {
  await prisma.tag.upsert({ where: { type_value: tag }, create: tag, update: {} })
}
console.log('Tags seedés')
await prisma.$disconnect()

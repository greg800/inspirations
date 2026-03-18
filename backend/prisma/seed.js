import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'greg@starvolt.fr' } })
  if (existing) {
    console.log('Admin déjà créé.')
    return
  }
  const hash = await bcrypt.hash('admin1234', 10)
  await prisma.user.create({
    data: {
      email: 'greg@starvolt.fr',
      password: hash,
      name: 'Greg',
      isApproved: true,
      isAdmin: true,
    },
  })
  console.log('Admin créé : greg@starvolt.fr / admin1234')
  console.log('⚠️  Change ce mot de passe après la première connexion.')
}

main().finally(() => prisma.$disconnect())

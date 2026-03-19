/**
 * Script de migration : envoie tout le contenu local vers Railway.
 * Usage : node migrate-to-prod.mjs <mot_de_passe_admin>
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROD_URL = 'https://inspirations-production-15d6.up.railway.app'
const ADMIN_EMAIL = 'greg@starvolt.fr'
const PASSWORD = process.argv[2]

if (!PASSWORD) {
  console.error('Usage: node migrate-to-prod.mjs <mot_de_passe>')
  process.exit(1)
}

// 1. Login
console.log('🔐 Connexion...')
const loginRes = await fetch(`${PROD_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: PASSWORD }),
})
const loginData = await loginRes.json()
if (!loginData.token) { console.error('Login échoué', loginData); process.exit(1) }
const TOKEN = loginData.token
console.log('✅ Connecté')

// 2. Tags
const DB_PATH = join(__dirname, 'prisma', 'dev.db')
const prisma = new PrismaClient({ datasources: { db: { url: `file:${DB_PATH}` } } })
const tags = await prisma.tag.findMany()
console.log(`\n🏷  Migration de ${tags.length} tags...`)
for (const tag of tags) {
  const r = await fetch(`${PROD_URL}/api/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ type: tag.type, value: tag.value }),
  })
  const d = await r.json()
  if (r.ok) console.log(`  ✅ ${tag.type}/${tag.value}`)
  else console.log(`  ⚠️  ${tag.type}/${tag.value} : ${d.error || 'déjà existant'}`)
}

// 3. Contenus
const contents = await prisma.content.findMany()
console.log(`\n📚 Migration de ${contents.length} contenus...`)
for (const c of contents) {
  try {
    // Image
    const imagePath = join(__dirname, c.coverImage.replace(/^\//, ''))
    let imageBuffer, mime, filename
    try {
      imageBuffer = readFileSync(imagePath)
      const ext = imagePath.split('.').pop().toLowerCase()
      mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/webp'
      filename = imagePath.split('/').pop()
    } catch {
      console.log(`  ⚠️  Image non trouvée pour "${c.title}", on ignore`)
      continue
    }

    const form = new FormData()
    form.append('title', c.title)
    form.append('author', c.author)
    form.append('summary', c.summary)
    form.append('whyRead', c.whyRead)
    form.append('rating', String(c.rating))
    form.append('sponsor', c.sponsor || '')
    if (c.support) form.append('support', c.support)
    if (c.genre) form.append('genre', c.genre)
    if (c.url) form.append('url', c.url)
    form.append('coverImage', new Blob([imageBuffer], { type: mime }), filename)

    const r = await fetch(`${PROD_URL}/api/content`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}` },
      body: form,
    })
    const d = await r.json()
    if (r.ok) console.log(`  ✅ "${c.title}"`)
    else console.log(`  ❌ "${c.title}" : ${JSON.stringify(d)}`)
  } catch (err) {
    console.log(`  ❌ "${c.title}" : ${err.message}`)
  }
}

await prisma.$disconnect()
console.log('\n🎉 Migration terminée !')

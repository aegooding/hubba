if (process.env.NODE_ENV !== 'production') require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg(process.env.DATABASE_URL)
const prisma = new PrismaClient({ adapter })

async function main() {
  const brands = [
    {
      name: 'Loan Fair',
      slug: 'loan-fair',
      primaryColor: '#356852',
      fromName: 'Loan Fair',
      fromEmail: 'hello@loanfair.com.au',
    },
    {
      name: 'klasp',
      slug: 'klasp',
      primaryColor: '#2D5F4F',
      fromName: 'klasp',
      fromEmail: 'hello@klasp.com.au',
    },
  ]

  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: brand,
      create: brand,
    })
    console.log(`Seeded brand: ${brand.name}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

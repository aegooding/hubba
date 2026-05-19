const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

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

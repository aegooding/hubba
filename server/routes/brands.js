const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')

router.get('/', async (req, res, next) => {
  try {
    const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' } })
    res.json({ brands })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const { name, primaryColor, logoUrl, fromName, fromEmail } = req.body
    const brand = await prisma.brand.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(fromName !== undefined && { fromName }),
        ...(fromEmail !== undefined && { fromEmail }),
      },
    })
    res.json(brand)
  } catch (err) {
    next(err)
  }
})

module.exports = router

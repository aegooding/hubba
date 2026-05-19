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

module.exports = router

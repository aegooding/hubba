const express = require('express')
const router = express.Router()
const multer = require('multer')
const { createClient } = require('@supabase/supabase-js')
const prisma = require('../lib/prisma')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

function getStorage() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY).storage
}

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

// POST /api/brands/:id/logo  — server-side upload bypasses RLS
router.post('/:id/logo', upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const brand = await prisma.brand.findUnique({ where: { id: req.params.id } })
    if (!brand) return res.status(404).json({ error: 'Brand not found' })

    const ext = req.file.originalname.split('.').pop().toLowerCase()
    const path = `brands/${brand.slug}/logo.${ext}`

    const storage = getStorage()
    const { error } = await storage
      .from('logos')
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      })

    if (error) throw error

    const { data: { publicUrl } } = storage.from('logos').getPublicUrl(path)
    const logoUrl = `${publicUrl}?v=${Date.now()}`

    const updated = await prisma.brand.update({
      where: { id: brand.id },
      data: { logoUrl },
    })

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

module.exports = router

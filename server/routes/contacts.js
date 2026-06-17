const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const Papa = require('papaparse')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// GET /api/contacts
router.get('/', async (req, res, next) => {
  try {
    const { search, unsubscribed, page = 1, limit = 100 } = req.query
    const where = {}

    if (unsubscribed === 'true') where.unsubscribed = true
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          leads: { include: { brand: true }, orderBy: { createdAt: 'desc' } },
          _count: { select: { leads: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.contact.count({ where }),
    ])

    res.json({ contacts, total })
  } catch (err) {
    next(err)
  }
})

// GET /api/contacts/import/template
router.get('/import/template', (req, res) => {
  const csv = 'email,first_name,last_name,phone,unsubscribed\nexample@email.com,Jane,Smith,0400000000,false\n'
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="contacts-template.csv"')
  res.send(csv)
})

// GET /api/contacts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: {
        leads: {
          include: { brand: true, referrer: true },
          orderBy: { createdAt: 'desc' },
        },
        emailEvents: {
          include: { campaignSend: { include: { campaign: true } } },
          orderBy: { occurredAt: 'desc' },
          take: 50,
        },
      },
    })
    if (!contact) return res.status(404).json({ error: 'Contact not found' })
    res.json(contact)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/contacts/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { firstName, lastName, phone, unsubscribed } = req.body
    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(unsubscribed !== undefined && { unsubscribed }),
      },
    })
    res.json(contact)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/contacts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    // Delete child records in dependency order
    await prisma.emailEvent.deleteMany({ where: { contactId: id } })
    await prisma.campaignSend.deleteMany({ where: { contactId: id } })
    await prisma.activity.deleteMany({ where: { lead: { contactId: id } } })
    await prisma.lead.deleteMany({ where: { contactId: id } })
    await prisma.contact.delete({ where: { id } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/contacts/import
router.post('/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const columnMap = req.body.columnMap ? JSON.parse(req.body.columnMap) : null
    const importTags = req.body.tags ? JSON.parse(req.body.tags) : []
    const text = req.file.buffer.toString('utf-8')
    const { data: rows, errors } = Papa.parse(text, { header: true, skipEmptyLines: true })

    let created = 0, updated = 0, skipped = 0
    const importErrors = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      try {
        const get = (field) => {
          const col = columnMap?.[field] || field
          return row[col]?.trim() || undefined
        }

        const email = get('email')
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          importErrors.push({ row: i + 2, message: `Invalid or missing email: ${email || '(empty)'}` })
          skipped++
          continue
        }

        const existing = await prisma.contact.findUnique({ where: { email } })
        const unsubVal = get('unsubscribed')
        const unsubscribed = unsubVal === 'true' ? true : unsubVal === 'false' ? false : undefined

        const data = {
          firstName: get('first_name'),
          lastName: get('last_name'),
          phone: get('phone'),
          ...(unsubscribed !== undefined && { unsubscribed }),
        }

        if (existing) {
          // Never silently re-subscribe — only set unsubscribed if explicitly false
          if (existing.unsubscribed && unsubscribed === false) data.unsubscribed = false
          else if (existing.unsubscribed) delete data.unsubscribed

          // Merge tags — never remove existing tags, only add new ones
          if (importTags.length) {
            data.tags = [...new Set([...(existing.tags || []), ...importTags])]
          }

          await prisma.contact.update({ where: { email }, data })
          updated++
        } else {
          await prisma.contact.create({ data: { email, ...data, ...(importTags.length && { tags: importTags }) } })
          created++
        }
      } catch (err) {
        importErrors.push({ row: i + 2, message: err.message })
        skipped++
      }
    }

    res.json({ created, updated, skipped, errors: importErrors })
  } catch (err) {
    next(err)
  }
})

module.exports = router

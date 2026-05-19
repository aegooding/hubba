const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')

// GET /api/leads
router.get('/', async (req, res, next) => {
  try {
    const {
      brandId, status, source, referrerId, tags,
      search, dateFrom, dateTo, page = 1, limit = 100,
    } = req.query

    const where = {}

    if (brandId && brandId !== 'all') where.brandId = brandId
    if (source) where.source = source
    if (referrerId) where.referrerId = referrerId

    if (status) {
      const statuses = Array.isArray(status) ? status : [status]
      where.status = { in: statuses }
    }

    if (tags) {
      const tagList = Array.isArray(tags) ? tags : [tags]
      where.tags = { hasSome: tagList }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    if (search) {
      where.contact = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: { contact: true, referrer: true, brand: true },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.lead.count({ where }),
    ])

    res.json({ leads, total })
  } catch (err) {
    next(err)
  }
})

// GET /api/leads/:id
router.get('/:id', async (req, res, next) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: req.params.id },
      include: {
        contact: true,
        referrer: true,
        brand: true,
        activities: { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    res.json(lead)
  } catch (err) {
    next(err)
  }
})

// POST /api/leads
router.post('/', async (req, res, next) => {
  try {
    const {
      brandId, email, firstName, lastName, phone,
      status = 'NEW', source, loanType, loanAmount, notes, tags = [], referrerId,
    } = req.body

    if (!brandId || !email) {
      return res.status(400).json({ error: 'brandId and email are required' })
    }

    const contact = await prisma.contact.upsert({
      where: { email },
      update: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
      },
      create: { email, firstName, lastName, phone },
    })

    const lead = await prisma.lead.create({
      data: {
        brandId, contactId: contact.id, status, source,
        loanType, loanAmount: loanAmount ? Number(loanAmount) : null,
        notes, tags, referrerId: referrerId || null,
      },
      include: { contact: true, referrer: true, brand: true },
    })

    res.status(201).json(lead)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/leads/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { status, loanType, loanAmount, notes, tags, referrerId, source } = req.body

    const lead = await prisma.lead.update({
      where: { id: req.params.id },
      data: {
        ...(status !== undefined && { status }),
        ...(source !== undefined && { source }),
        ...(loanType !== undefined && { loanType }),
        ...(loanAmount !== undefined && { loanAmount: loanAmount ? Number(loanAmount) : null }),
        ...(notes !== undefined && { notes }),
        ...(tags !== undefined && { tags }),
        ...(referrerId !== undefined && { referrerId: referrerId || null }),
      },
      include: { contact: true, referrer: true, brand: true },
    })

    res.json(lead)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/leads/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.activity.deleteMany({ where: { leadId: req.params.id } })
    await prisma.lead.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/leads/:id/activities
router.post('/:id/activities', async (req, res, next) => {
  try {
    const { type, body, meta } = req.body
    const activity = await prisma.activity.create({
      data: {
        leadId: req.params.id,
        type,
        body,
        meta,
        createdBy: req.user?.email,
      },
    })
    res.status(201).json(activity)
  } catch (err) {
    next(err)
  }
})

module.exports = router

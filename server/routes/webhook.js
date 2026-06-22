const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')

// POST /api/leads/webhook  (no JWT auth — uses X-Webhook-Secret header)
router.post('/', async (req, res, next) => {
  try {
    const secret = req.headers['x-webhook-secret']
    if (secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' })
    }

    const {
      email, firstName, lastName, phone,
      source, loanType, loanAmount, details,
      utm_source, brandId, brandSlug,
    } = req.body

    if (!email) return res.status(400).json({ error: 'email is required' })

    const brand = await prisma.brand.findFirst({
      where: brandId ? { id: brandId } : { slug: brandSlug },
    })
    if (!brand) return res.status(400).json({ error: 'Brand not found' })

    const contact = await prisma.contact.upsert({
      where: { email },
      update: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
      },
      create: { email, firstName, lastName, phone },
    })

    let referrerId = null
    if (utm_source) {
      const referrer = await prisma.referrer.findFirst({
        where: { brandId: brand.id, utmSource: utm_source, isActive: true },
      })
      if (referrer) referrerId = referrer.id
    }

    const lead = await prisma.lead.create({
      data: {
        brandId: brand.id,
        contactId: contact.id,
        status: 'NEW',
        source: source || 'webhook',
        loanType,
        loanAmount: loanAmount ? Number(loanAmount) : null,
        referrerId,
        ...(details && { details }),
      },
    })

    res.json({ success: true, leadId: lead.id })
  } catch (err) {
    next(err)
  }
})

module.exports = router

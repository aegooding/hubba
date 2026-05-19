const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const resend = require('../lib/resend')

// GET /api/referrers
router.get('/', async (req, res, next) => {
  try {
    const { brandId } = req.query
    const where = { isActive: true }
    if (brandId && brandId !== 'all') where.brandId = brandId

    const referrers = await prisma.referrer.findMany({
      where,
      include: {
        brand: true,
        _count: { select: { leads: true } },
        leads: {
          select: { status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    const withStats = referrers.map(r => {
      const total = r.leads.length
      const converted = r.leads.filter(l => l.status === 'CONVERTED').length
      const convRate = total > 0 ? Math.round((converted / total) * 100) : 0
      const lastActivity = r.leads[0]?.createdAt || null
      return { ...r, leads: undefined, stats: { total, converted, convRate, lastActivity } }
    })

    res.json({ referrers: withStats })
  } catch (err) {
    next(err)
  }
})

// GET /api/referrers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const referrer = await prisma.referrer.findUnique({
      where: { id: req.params.id },
      include: { brand: true },
    })
    if (!referrer) return res.status(404).json({ error: 'Referrer not found' })
    res.json(referrer)
  } catch (err) {
    next(err)
  }
})

// POST /api/referrers
router.post('/', async (req, res, next) => {
  try {
    const { brandId, name, company, email, phone, tier, utmSource, notes } = req.body
    if (!brandId || !name) return res.status(400).json({ error: 'brandId and name are required' })
    const referrer = await prisma.referrer.create({
      data: { brandId, name, company, email, phone, tier, utmSource, notes },
      include: { brand: true },
    })
    res.status(201).json(referrer)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/referrers/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { name, company, email, phone, tier, utmSource, notes, isActive } = req.body
    const referrer = await prisma.referrer.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(company !== undefined && { company }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(tier !== undefined && { tier }),
        ...(utmSource !== undefined && { utmSource }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { brand: true },
    })
    res.json(referrer)
  } catch (err) {
    next(err)
  }
})

// GET /api/referrers/:id/leads
router.get('/:id/leads', async (req, res, next) => {
  try {
    const leads = await prisma.lead.findMany({
      where: { referrerId: req.params.id },
      include: { contact: true, brand: true },
      orderBy: { createdAt: 'desc' },
    })

    const total = leads.length
    const converted = leads.filter(l => l.status === 'CONVERTED').length
    const convRate = total > 0 ? Math.round((converted / total) * 100) : 0

    // Leads this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const thisMonth = leads.filter(l => new Date(l.createdAt) >= startOfMonth).length

    res.json({ leads, stats: { total, converted, convRate, thisMonth } })
  } catch (err) {
    next(err)
  }
})

// POST /api/referrers/:id/report
router.post('/:id/report', async (req, res, next) => {
  try {
    const referrer = await prisma.referrer.findUnique({
      where: { id: req.params.id },
      include: { brand: true },
    })
    if (!referrer) return res.status(404).json({ error: 'Referrer not found' })
    if (!referrer.email) return res.status(400).json({ error: 'Referrer has no email address' })

    const leads = await prisma.lead.findMany({
      where: { referrerId: referrer.id },
      select: { status: true, createdAt: true },
    })

    const total = leads.length
    const converted = leads.filter(l => l.status === 'CONVERTED').length
    const convRate = total > 0 ? Math.round((converted / total) * 100) : 0

    const startOfMonth = new Date()
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const thisMonth = leads.filter(l => new Date(l.createdAt) >= startOfMonth).length

    const brand = referrer.brand
    const fromEmail = brand.fromEmail || `hello@${brand.slug}.com.au`
    const fromName = brand.fromName || brand.name

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body { font-family: 'DM Sans', Arial, sans-serif; background: #f7f5f0; margin: 0; padding: 20px; }
.container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
.header { background: ${brand.primaryColor || '#0f0f0f'}; padding: 32px; color: white; }
.header h1 { margin: 0; font-size: 24px; }
.header p { margin: 8px 0 0; opacity: 0.7; font-size: 14px; }
.body { padding: 32px; }
.stats { display: flex; gap: 16px; margin: 24px 0; }
.stat { flex: 1; background: #f7f5f0; border-radius: 8px; padding: 16px; text-align: center; }
.stat-value { font-size: 32px; font-weight: 700; color: #0f0f0f; }
.stat-label { font-size: 12px; color: #6b6560; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
.footer { padding: 20px 32px; background: #f7f5f0; font-size: 12px; color: #6b6560; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>Performance Report</h1>
    <p>${brand.name} · ${new Date().toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</p>
  </div>
  <div class="body">
    <p>Hi ${referrer.name},</p>
    <p>Here's your referral performance summary for ${brand.name}.</p>
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${total}</div>
        <div class="stat-label">Total Leads</div>
      </div>
      <div class="stat">
        <div class="stat-value">${thisMonth}</div>
        <div class="stat-label">This Month</div>
      </div>
      <div class="stat">
        <div class="stat-value">${convRate}%</div>
        <div class="stat-label">Conversion Rate</div>
      </div>
    </div>
    <p style="color:#6b6560;font-size:14px;">Thank you for your continued partnership with ${brand.name}.</p>
  </div>
  <div class="footer">This report was generated by Hubba. © ${brand.name}</div>
</div>
</body></html>`

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: referrer.email,
      subject: `Your ${brand.name} performance report — ${new Date().toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}`,
      html,
    })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router

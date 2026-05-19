const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')
const resend = require('../lib/resend')
const { templates } = require('../lib/emailTemplates')

function applyMergeTags(html, { firstName, brandName, unsubscribeUrl, brandLogoUrl }) {
  const logoImg = brandLogoUrl
    ? `<img src="${brandLogoUrl}" alt="${brandName}" style="max-height:48px;display:block;" />`
    : `<span style="display:block;font-size:22px;font-weight:700;color:white;letter-spacing:-0.5px;">${brandName}</span>`
  return html
    .replace(/\{\{first_name\}\}/g, firstName || 'there')
    .replace(/\{\{brand_name\}\}/g, brandName || '')
    .replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl || '#')
    .replace(/\{\{brand_logo\}\}/g, logoImg)
    .replace(/\{\{brand_logo_url\}\}/g, brandLogoUrl || '')
}

function buildUnsubscribeUrl(contactId, campaignId) {
  const token = jwt.sign(
    { contactId, campaignId },
    process.env.UNSUBSCRIBE_SECRET || 'dev-secret',
    { expiresIn: '90d' }
  )
  const base = process.env.CLIENT_URL || 'http://localhost:5173'
  return `${base}/unsubscribe?token=${token}`
}

async function resolveRecipients(segmentRules, brandId) {
  const where = { unsubscribed: false }
  if (brandId) {
    where.leads = { some: { brandId } }
  }

  if (segmentRules) {
    const leadWhere = { ...(brandId && { brandId }) }
    if (segmentRules.status?.length) leadWhere.status = { in: segmentRules.status }
    if (segmentRules.source) leadWhere.source = segmentRules.source
    if (segmentRules.referrerId) leadWhere.referrerId = segmentRules.referrerId
    if (segmentRules.tags?.length) leadWhere.tags = { hasSome: segmentRules.tags }
    where.leads = { some: leadWhere }
  }

  return prisma.contact.findMany({
    where,
    select: { id: true, email: true, firstName: true, lastName: true },
  })
}

// GET /api/campaigns
router.get('/', async (req, res, next) => {
  try {
    const { brandId } = req.query
    const where = brandId && brandId !== 'all' ? { brandId } : {}

    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        brand: true,
        _count: { select: { sends: true } },
        sends: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const withStats = campaigns.map(c => {
      const total = c.sends.length
      const delivered = c.sends.filter(s => s.status === 'delivered').length
      return { ...c, sends: undefined, recipientCount: total, deliveredCount: delivered }
    })

    res.json({ campaigns: withStats })
  } catch (err) {
    next(err)
  }
})

// GET /api/campaigns/:id
router.get('/:id', async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { brand: true, _count: { select: { sends: true } } },
    })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
    res.json(campaign)
  } catch (err) {
    next(err)
  }
})

// POST /api/campaigns
router.post('/', async (req, res, next) => {
  try {
    const {
      brandId, name, subject, previewText, htmlBody,
      fromName, fromEmail, replyTo, segmentRules,
    } = req.body
    if (!brandId || !name || !subject || !htmlBody || !fromName || !fromEmail) {
      return res.status(400).json({ error: 'brandId, name, subject, htmlBody, fromName, fromEmail are required' })
    }
    const campaign = await prisma.campaign.create({
      data: { brandId, name, subject, previewText, htmlBody, fromName, fromEmail, replyTo, segmentRules, status: 'DRAFT' },
      include: { brand: true },
    })
    res.status(201).json(campaign)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/campaigns/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const fields = ['name', 'subject', 'previewText', 'htmlBody', 'fromName', 'fromEmail', 'replyTo', 'segmentRules', 'scheduledAt']
    const data = {}
    for (const f of fields) {
      if (req.body[f] !== undefined) data[f] = req.body[f]
    }
    const campaign = await prisma.campaign.update({
      where: { id: req.params.id },
      data,
      include: { brand: true },
    })
    res.json(campaign)
  } catch (err) {
    next(err)
  }
})

// POST /api/campaigns/:id/test — send to a single address
router.post('/:id/test', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'email is required' })

    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { brand: true },
    })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })

    const html = applyMergeTags(campaign.htmlBody, {
      firstName: 'Test',
      brandName: campaign.brand.name,
      brandLogoUrl: campaign.brand.logoUrl,
      unsubscribeUrl: '#test-unsubscribe',
    })

    await resend.emails.send({
      from: `${campaign.fromName} <${campaign.fromEmail}>`,
      to: email,
      subject: `[TEST] ${campaign.subject}`,
      html,
    })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// POST /api/campaigns/:id/send
router.post('/:id/send', async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { brand: true },
    })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
    if (campaign.status === 'SENT') return res.status(400).json({ error: 'Campaign already sent' })

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'SENDING' },
    })

    const contacts = await resolveRecipients(campaign.segmentRules, campaign.brandId)

    if (contacts.length === 0) {
      await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'DRAFT' } })
      return res.status(400).json({ error: 'No eligible recipients' })
    }

    // Create send records
    await prisma.campaignSend.createMany({
      data: contacts.map(c => ({ campaignId: campaign.id, contactId: c.id, status: 'queued' })),
      skipDuplicates: true,
    })

    const sends = await prisma.campaignSend.findMany({
      where: { campaignId: campaign.id },
      include: { contact: true },
    })

    // Batch dispatch — 50 at a time
    const BATCH = 50
    for (let i = 0; i < sends.length; i += BATCH) {
      const batch = sends.slice(i, i + BATCH)
      await Promise.allSettled(batch.map(async (send) => {
        const html = applyMergeTags(campaign.htmlBody, {
          firstName: send.contact.firstName,
          brandName: campaign.brand.name,
          brandLogoUrl: campaign.brand.logoUrl,
          unsubscribeUrl: buildUnsubscribeUrl(send.contact.id, campaign.id),
        })
        try {
          const result = await resend.emails.send({
            from: `${campaign.fromName} <${campaign.fromEmail}>`,
            to: send.contact.email,
            subject: campaign.subject,
            html,
            ...(campaign.replyTo && { replyTo: campaign.replyTo }),
          })
          await prisma.campaignSend.update({
            where: { id: send.id },
            data: { resendId: result.data?.id, status: 'sent', sentAt: new Date() },
          })
        } catch {
          await prisma.campaignSend.update({
            where: { id: send.id },
            data: { status: 'failed' },
          })
        }
      }))
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'SENT', sentAt: new Date() },
    })

    res.json({ success: true, recipientCount: sends.length })
  } catch (err) {
    next(err)
  }
})

// GET /api/campaigns/:id/stats
router.get('/:id/stats', async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: {
        sends: {
          include: {
            contact: { select: { email: true, firstName: true, lastName: true } },
            emailEvents: true,
          },
        },
      },
    })
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })

    const allEvents = campaign.sends.flatMap(s => s.emailEvents)
    const count = (type) => allEvents.filter(e => e.event === type).length

    const stats = {
      sent: campaign.sends.length,
      delivered: count('delivered'),
      opens: count('opened'),
      clicks: count('clicked'),
      bounces: count('bounced'),
      unsubscribes: count('unsubscribed'),
      openRate: campaign.sends.length > 0 ? Math.round((count('opened') / campaign.sends.length) * 100) : 0,
      clickRate: campaign.sends.length > 0 ? Math.round((count('clicked') / campaign.sends.length) * 100) : 0,
    }

    // 48h hourly timeline from sentAt
    const timeline = []
    if (campaign.sentAt) {
      const start = new Date(campaign.sentAt)
      for (let h = 0; h < 48; h++) {
        const slotStart = new Date(start.getTime() + h * 3600000)
        const slotEnd = new Date(slotStart.getTime() + 3600000)
        const opens = allEvents.filter(e => e.event === 'opened' && new Date(e.occurredAt) >= slotStart && new Date(e.occurredAt) < slotEnd).length
        const clicks = allEvents.filter(e => e.event === 'clicked' && new Date(e.occurredAt) >= slotStart && new Date(e.occurredAt) < slotEnd).length
        timeline.push({ hour: h, time: slotStart.toISOString(), opens, clicks })
      }
    }

    const recipients = campaign.sends.map(s => ({
      email: s.contact.email,
      name: [s.contact.firstName, s.contact.lastName].filter(Boolean).join(' '),
      status: s.status,
      sentAt: s.sentAt,
      events: s.emailEvents.map(e => e.event),
    }))

    res.json({ stats, timeline, recipients })
  } catch (err) {
    next(err)
  }
})

// GET /api/campaigns/:id/recipient-count
router.get('/:id/recipient-count', async (req, res, next) => {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } })
    if (!campaign) return res.status(404).json({ error: 'Not found' })
    const contacts = await resolveRecipients(campaign.segmentRules, campaign.brandId)
    res.json({ count: contacts.length })
  } catch (err) {
    next(err)
  }
})

// POST /api/campaigns/audience-count — preview count without a saved campaign
router.post('/audience-count', async (req, res, next) => {
  try {
    const { brandId, segmentRules } = req.body
    const contacts = await resolveRecipients(segmentRules, brandId)
    res.json({ count: contacts.length })
  } catch (err) {
    next(err)
  }
})

// GET /api/campaigns/templates
router.get('/templates/list', (req, res) => {
  res.json({
    templates: [
      { id: 'loan-fair', name: 'Loan Fair branded' },
      { id: 'klasp', name: 'klasp branded' },
      { id: 'plain', name: 'Plain (no branding)' },
    ],
  })
})

router.get('/templates/:id', (req, res) => {
  const html = templates[req.params.id]
  if (!html) return res.status(404).json({ error: 'Template not found' })
  res.json({ html })
})

module.exports = router

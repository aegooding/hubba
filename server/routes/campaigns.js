const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const juice = require('juice')
const cheerio = require('cheerio')
const Anthropic = require('@anthropic-ai/sdk')
const prisma = require('../lib/prisma')
const resend = require('../lib/resend')
const { templates } = require('../lib/emailTemplates')

function applyMergeTags(html, { firstName, brandName, unsubscribeUrl, brandLogoUrl }) {
  const logoImg = brandLogoUrl
    ? `<img src="${brandLogoUrl}" alt="${brandName}" height="48" border="0" style="display:block;border:0;outline:none;height:48px;max-height:48px;max-width:100%;" />`
    : `<span style="display:block;font-size:22px;font-weight:700;color:white;letter-spacing:-0.5px;font-family:Arial,sans-serif;">${brandName}</span>`
  const logoTagCount = (html.match(/\{\{brand_logo\}\}/g) || []).length
  console.log(`[merge] {{brand_logo}} found ${logoTagCount} time(s), logoUrl: ${brandLogoUrl || 'none'}`)
  const merged = html
    .replace(/\{\{first_name\}\}/g, firstName || 'there')
    .replace(/\{\{brand_name\}\}/g, brandName || '')
    .replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl || '#')
    .replace(/\{\{brand_logo\}\}/g, logoImg)
    .replace(/\{\{brand_logo_url\}\}/g, brandLogoUrl || '')
  return juice(merged)
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

  const hasFilters = segmentRules && (
    segmentRules.status?.length || segmentRules.source || segmentRules.referrerId || segmentRules.tags?.length
  )

  if (hasFilters) {
    // Segment filters active — only contacts with matching leads
    const leadWhere = { ...(brandId && { brandId }) }
    if (segmentRules.status?.length) leadWhere.status = { in: segmentRules.status }
    if (segmentRules.source) leadWhere.source = segmentRules.source
    if (segmentRules.referrerId) leadWhere.referrerId = segmentRules.referrerId
    if (segmentRules.tags?.length) leadWhere.tags = { hasSome: segmentRules.tags }
    where.leads = { some: leadWhere }
  } else if (brandId) {
    // No filters — contacts with a lead for this brand, OR contacts with no leads (direct imports)
    where.OR = [
      { leads: { some: { brandId } } },
      { leads: { none: {} } },
    ]
  }
  // No brandId + no filters = all non-unsubscribed contacts

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
      const delivered = c.sends.filter(s => s.status === 'delivered' || s.status === 'sent').length
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

    console.log('[test-send] brand logoUrl:', campaign.brand.logoUrl)
    console.log('[test-send] htmlBody has {{brand_logo}}:', campaign.htmlBody?.includes('{{brand_logo}}'))
    const html = applyMergeTags(campaign.htmlBody, {
      firstName: 'Test',
      brandName: campaign.brand.name,
      brandLogoUrl: campaign.brand.logoUrl,
      unsubscribeUrl: '#test-unsubscribe',
    })

    const result = await resend.emails.send({
      from: `${campaign.fromName} <${campaign.fromEmail}>`,
      to: email,
      subject: `[TEST] ${campaign.subject}`,
      html,
    })

    if (result.error) {
      return res.status(400).json({ error: result.error.message || 'Resend rejected the email' })
    }

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

    console.log('[send] brand logoUrl:', campaign.brand.logoUrl)
    const hasMergeTag = campaign.htmlBody?.includes('{{brand_logo}}')
    console.log('[send] htmlBody has {{brand_logo}}:', hasMergeTag)
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

    // Dispatch sequentially in batches of 2 to stay under Resend's 2/s rate limit
    const BATCH = 2
    const sleep = (ms) => new Promise(r => setTimeout(r, ms))
    for (let i = 0; i < sends.length; i += BATCH) {
      const batch = sends.slice(i, i + BATCH)
      if (i > 0) await sleep(1100)
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
          if (result.error) {
            console.error(`Resend error for ${send.contact.email}:`, result.error)
            await prisma.campaignSend.update({
              where: { id: send.id },
              data: { status: 'failed' },
            })
          } else {
            await prisma.campaignSend.update({
              where: { id: send.id },
              data: { resendId: result.data?.id, status: 'sent', sentAt: new Date() },
            })
          }
        } catch (err) {
          console.error(`Send exception for ${send.contact.email}:`, err.message)
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

    const sentCount = campaign.sends.filter(s => s.status === 'sent' || s.status === 'delivered').length
    // Fall back to sent count if no webhook delivery events exist yet
    const deliveredFromWebhook = count('delivered')
    const delivered = deliveredFromWebhook > 0 ? deliveredFromWebhook : sentCount

    const stats = {
      sent: campaign.sends.length,
      delivered,
      opens: count('opened'),
      clicks: count('clicked'),
      bounces: count('bounced'),
      unsubscribes: count('unsubscribed'),
      openRate: delivered > 0 ? Math.round((count('opened') / delivered) * 100) : 0,
      clickRate: delivered > 0 ? Math.round((count('clicked') / delivered) * 100) : 0,
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

// POST /api/campaigns/sanitize-html — make pasted HTML email-safe
router.post('/sanitize-html', async (req, res, next) => {
  try {
    const { html } = req.body
    if (!html) return res.status(400).json({ error: 'html required' })

    let $ = cheerio.load(html, { decodeEntities: false })

    // 1. Strip @import web font declarations so juice doesn't try to fetch them
    $('style').each((i, el) => {
      $(el).html($(el).html().replace(/@import\s+url\([^)]+\)[^;]*;?\s*/g, ''))
    })

    // 2. Replace SVGs with merge tags — first SVG = header logo, second = footer logo
    let svgIndex = 0
    $('svg').each((i, el) => {
      if (svgIndex === 0) {
        $(el).replaceWith('{{brand_logo}}')
      } else if (svgIndex === 1) {
        const h = $(el).attr('height') || '28'
        $(el).replaceWith(`<img src="{{brand_logo_url}}" alt="{{brand_name}}" height="${h}" style="display:block;border:0;max-height:${h}px;" />`)
      } else {
        $(el).remove()
      }
      svgIndex++
    })

    // 3. Run juice to inline all CSS (must happen before we check for position:absolute)
    const inlined = juice($.html())

    // 4. Re-parse and remove anything that got position:absolute inlined (decorative blobs etc.)
    $ = cheerio.load(inlined, { decodeEntities: false })
    $('*').each((i, el) => {
      const style = $(el).attr('style') || ''
      if (/position\s*:\s*absolute/.test(style)) $(el).remove()
    })

    res.json({ html: $.html() })
  } catch (err) {
    next(err)
  }
})

// POST /api/campaigns/generate-email
router.post('/generate-email', async (req, res, next) => {
  try {
    const { prompt, brandId } = req.body
    if (!prompt) return res.status(400).json({ error: 'prompt is required' })

    const brand = brandId ? await prisma.brand.findUnique({ where: { id: brandId } }) : null

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const systemPrompt = `You are an expert HTML email designer. You write clean, beautiful, conversion-focused emails that render perfectly across all email clients including Gmail, Outlook, and Apple Mail.

STRICT RULES — you must follow all of these:
1. All CSS must be inline (style="..."). Never use <style> blocks or external stylesheets.
2. Max width 600px, centred with margin:0 auto.
3. Use table-based layouts for any multi-column sections (display:table or actual <table>).
4. No SVG elements — use text or <img> tags only.
5. No position:absolute, no position:relative, no flexbox, no CSS grid, no overflow:hidden.
6. No @import, no web fonts. Font stacks only: Arial,Helvetica,sans-serif or Georgia,'Times New Roman',serif.
7. All <a> elements must have color and text-decoration set as inline styles. Button links must have color:#ffffff !important (or the correct contrast colour) inline.
8. Images must have alt text, explicit width and height attributes, style="display:block;border:0;".
9. No <script>, no <form>, no interactive elements.
10. Output only the complete HTML document — no explanation, no markdown fences.

MERGE TAGS — include these exactly where appropriate:
- {{first_name}} — recipient first name (use in greeting)
- {{brand_name}} — the sender's brand name
- {{brand_logo}} — expands to a full <img> tag for the brand logo; use this in the header
- {{brand_logo_url}} — just the logo URL; use as src in a footer <img> if needed
- {{unsubscribe_url}} — must appear as an unsubscribe link in the footer`

    const brandContext = brand
      ? `Brand: ${brand.name}. Primary colour: ${brand.primaryColor || '#333333'}. Logo is available via {{brand_logo}} merge tag.`
      : ''

    console.log('[generate-email] starting generation for brand:', brand?.name)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: `${brandContext ? brandContext + '\n\n' : ''}Create an HTML email for the following:\n\n${prompt}`,
      }],
      system: systemPrompt,
    })

    console.log('[generate-email] done, tokens used:', message.usage)

    const html = message.content[0].text
    res.json({ html })
  } catch (err) {
    next(err)
  }
})

module.exports = router

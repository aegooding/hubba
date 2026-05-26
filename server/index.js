if (process.env.NODE_ENV !== 'production') require('dotenv').config()
const express = require('express')
const cors = require('cors')

const { requireAuth } = require('./middleware/auth')
const leadsRouter = require('./routes/leads')
const campaignsRouter = require('./routes/campaigns')
const referrersRouter = require('./routes/referrers')
const contactsRouter = require('./routes/contacts')
const webhookRouter = require('./routes/webhook')
const brandsRouter = require('./routes/brands')
const resendWebhookRouter = require('./routes/resendWebhook')

const app = express()
const PORT = process.env.PORT || 3001

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0' })
})

// Public routes — no auth
app.use('/api/leads/webhook', webhookRouter)
app.use('/api/webhooks/resend', resendWebhookRouter)

app.post('/api/contacts/unsubscribe', async (req, res, next) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ error: 'Token required' })

    const secret = process.env.UNSUBSCRIBE_SECRET
    let payload
    try {
      payload = require('jsonwebtoken').verify(token, secret)
    } catch {
      return res.status(400).json({ error: 'Invalid or expired unsubscribe link' })
    }

    const { contactId, campaignId } = payload
    const prisma = require('./lib/prisma')

    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: { unsubscribed: true },
      include: { leads: { include: { brand: true }, take: 1 } },
    })

    await prisma.emailEvent.create({
      data: { contactId, campaignSendId: null, event: 'unsubscribed' },
    })

    const brandName = contact.leads[0]?.brand?.name || ''
    res.json({ success: true, brandName })
  } catch (err) {
    next(err)
  }
})

// Public debug preview — no auth required, browser-accessible
app.get('/api/campaigns/:id/preview', async (req, res, next) => {
  try {
    const juice = require('juice')
    const prisma = require('./lib/prisma')
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { brand: true },
    })
    if (!campaign) return res.status(404).send('Campaign not found')
    const { name: brandName, logoUrl: brandLogoUrl } = campaign.brand
    const logoImg = brandLogoUrl
      ? `<img src="${brandLogoUrl}" alt="${brandName}" height="48" border="0" style="display:block;border:0;outline:none;height:48px;max-height:48px;max-width:100%;" />`
      : `<span style="display:block;font-size:22px;font-weight:700;color:white;font-family:Arial,sans-serif;">${brandName}</span>`
    const html = juice(campaign.htmlBody
      .replace(/\{\{first_name\}\}/g, 'Preview')
      .replace(/\{\{brand_name\}\}/g, brandName || '')
      .replace(/\{\{unsubscribe_url\}\}/g, '#preview')
      .replace(/\{\{brand_logo\}\}/g, logoImg)
      .replace(/\{\{brand_logo_url\}\}/g, brandLogoUrl || ''))
    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  } catch (err) { next(err) }
})

// Authenticated routes
app.use('/api/brands', requireAuth, brandsRouter)
app.use('/api/leads', requireAuth, leadsRouter)
app.use('/api/campaigns', requireAuth, campaignsRouter)
app.use('/api/referrers', requireAuth, referrersRouter)
app.use('/api/contacts', requireAuth, contactsRouter)

app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') console.error(err)
  else console.error(err.message)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Hubba server running on http://localhost:${PORT}`)
})

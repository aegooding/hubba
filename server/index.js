require('dotenv').config()
const express = require('express')
const cors = require('cors')

const { requireAuth } = require('./middleware/auth')
const leadsRouter = require('./routes/leads')
const campaignsRouter = require('./routes/campaigns')
const referrersRouter = require('./routes/referrers')
const contactsRouter = require('./routes/contacts')
const webhookRouter = require('./routes/webhook')
const brandsRouter = require('./routes/brands')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ ok: true, version: '1.0.0' })
})

// Public webhook — no auth
app.use('/api/leads/webhook', webhookRouter)

// All /api/* routes require auth except health and webhooks
app.use('/api/brands', requireAuth, brandsRouter)
app.use('/api/leads', requireAuth, leadsRouter)
app.use('/api/campaigns', requireAuth, campaignsRouter)
app.use('/api/referrers', requireAuth, referrersRouter)
app.use('/api/contacts', requireAuth, contactsRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Hubba server running on http://localhost:${PORT}`)
})

const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')

const EVENT_MAP = {
  'email.delivered': 'delivered',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
  'email.bounced': 'bounced',
  'email.unsubscribed': 'unsubscribed',
}

router.post('/', async (req, res, next) => {
  try {
    const { type, data } = req.body
    const event = EVENT_MAP[type]
    if (!event) return res.json({ ignored: true })

    const resendId = data?.email_id
    if (!resendId) return res.json({ ignored: true })

    const send = await prisma.campaignSend.findFirst({
      where: { resendId },
      include: { contact: true },
    })
    if (!send) return res.json({ ignored: true })

    await prisma.emailEvent.create({
      data: {
        campaignSendId: send.id,
        contactId: send.contactId,
        event,
        url: data?.click?.link || null,
      },
    })

    if (event === 'delivered') {
      await prisma.campaignSend.update({ where: { id: send.id }, data: { status: 'delivered' } })
    }

    if (event === 'unsubscribed') {
      await prisma.contact.update({ where: { id: send.contactId }, data: { unsubscribed: true } })
    }

    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router

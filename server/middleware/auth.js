const jwt = require('jsonwebtoken')

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' })
  }

  const token = authHeader.slice(7)

  try {
    const secret = process.env.SUPABASE_JWT_SECRET
    if (!secret) {
      const decoded = jwt.decode(token)
      if (!decoded?.sub) return res.status(401).json({ error: 'Invalid token' })
      req.user = { id: decoded.sub, email: decoded.email }
      return next()
    }
    const decoded = jwt.verify(token, secret)
    req.user = { id: decoded.sub, email: decoded.email }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = { requireAuth }

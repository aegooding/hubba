const { createClient } = require('@supabase/supabase-js')

let _supabase = null
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  }
  return _supabase
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' })
  }
  const token = authHeader.slice(7)
  const { data, error } = await getSupabase().auth.getUser(token)
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
  req.user = data.user
  next()
}

module.exports = { requireAuth }

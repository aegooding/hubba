import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../assets/Logo.svg'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: signInError } = await signIn(email, password)
    setLoading(false)
    if (signInError) {
      setError(signInError.message)
    } else {
      navigate('/leads')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--hubba-black)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--hubba-charcoal)',
        borderRadius: 12,
        padding: 40,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={Logo} alt="Hubba" style={{ height: 44, marginBottom: 20 }} />
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 700,
            color: 'white',
            margin: 0,
          }}>
            Welcome to Hubba
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 8, fontSize: 14 }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="label" style={{ color: 'rgba(255,255,255,0.45)' }}>Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: 'white' }}
            />
          </div>

          <div>
            <label className="label" style={{ color: 'rgba(255,255,255,0.45)' }}>Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: 'white' }}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--hubba-danger)', fontSize: 14, margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 15, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

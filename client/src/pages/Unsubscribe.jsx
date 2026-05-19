import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import Logo from '../assets/Logo.svg'

export default function Unsubscribe() {
  const [searchParams] = useSearchParams()
  const [state, setState] = useState('loading') // loading | success | error
  const [brandName, setBrandName] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setState('error')
      return
    }

    axios
      .post(`${import.meta.env.VITE_API_URL || ''}/api/contacts/unsubscribe`, { token })
      .then((res) => {
        setBrandName(res.data.brandName || '')
        setState('success')
      })
      .catch(() => setState('error'))
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--hubba-surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 480,
        textAlign: 'center',
        background: 'white',
        borderRadius: 12,
        padding: 48,
        border: '1px solid var(--hubba-border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <img src={Logo} alt="Hubba" style={{ height: 36, marginBottom: 24 }} />

        {state === 'loading' && (
          <p style={{ color: 'var(--hubba-text-muted)' }}>Processing…</p>
        )}

        {state === 'success' && (
          <>
            <h1 style={{ fontSize: 24, marginBottom: 12 }}>You've been unsubscribed</h1>
            <p style={{ color: 'var(--hubba-text-muted)', lineHeight: 1.6 }}>
              You've been unsubscribed from {brandName ? `${brandName} ` : ''}emails.
              You won't receive any further marketing emails from us.
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 style={{ fontSize: 24, marginBottom: 12, color: 'var(--hubba-danger)' }}>
              Invalid link
            </h1>
            <p style={{ color: 'var(--hubba-text-muted)' }}>
              This unsubscribe link is invalid or has expired.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

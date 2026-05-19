import { useState, useEffect } from 'react'
import api from '../../lib/api'

const TIERS = ['standard', 'premium', 'partner']

export default function ReferrerModal({ referrer, onClose, onSaved }) {
  const [brands, setBrands] = useState([])
  const [form, setForm] = useState({
    brandId: '', name: '', company: '', email: '',
    phone: '', tier: 'standard', utmSource: '', notes: '',
    ...referrer,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/brands').then(({ data }) => setBrands(data.brands)).catch(() => {})
  }, [])

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const { data } = referrer?.id
        ? await api.patch(`/api/referrers/${referrer.id}`, form)
        : await api.post('/api/referrers', form)
      onSaved?.(data)
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40,
      }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 520, maxWidth: '95vw', maxHeight: '90vh',
        background: 'white', borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid var(--hubba-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: 0 }}>
            {referrer?.id ? 'Edit Referrer' : 'New Referrer'}
          </h2>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', fontSize: 20,
            color: 'var(--hubba-text-muted)', cursor: 'pointer',
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="label">Name *</label>
              <input className="input" required value={form.name}
                onChange={e => set('name', e.target.value)} placeholder="Jane Smith" />
            </div>
            <div>
              <label className="label">Company</label>
              <input className="input" value={form.company || ''}
                onChange={e => set('company', e.target.value)} placeholder="Acme Pty Ltd" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email || ''}
                onChange={e => set('email', e.target.value)} placeholder="jane@example.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone || ''}
                onChange={e => set('phone', e.target.value)} placeholder="0400 000 000" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="label">Brand *</label>
              <select className="input" required value={form.brandId}
                onChange={e => set('brandId', e.target.value)}>
                <option value="">Select brand…</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tier</label>
              <select className="input" value={form.tier || 'standard'}
                onChange={e => set('tier', e.target.value)}>
                {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label">UTM Source</label>
            <input className="input" value={form.utmSource || ''}
              onChange={e => set('utmSource', e.target.value)}
              placeholder="jane-smith (matches utm_source on inbound leads)" />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={form.notes || ''}
              onChange={e => set('notes', e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>

          {error && <p style={{ color: 'var(--hubba-danger)', fontSize: 13 }}>{error}</p>}
        </form>

        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--hubba-border)',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button className="btn-secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : referrer?.id ? 'Save changes' : 'Create Referrer'}
          </button>
        </div>
      </div>
    </>
  )
}

import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { useBrand } from '../../context/BrandContext'

const LOAN_TYPES = ['car', 'personal', 'mortgage', 'business', 'other']
const SOURCES = ['web-form', 'referral', 'facebook', 'google', 'phone', 'manual', 'csv-import']

export default function CreateLeadModal({ onClose, onCreated }) {
  const { activeBrand, brands } = useBrand()
  const [form, setForm] = useState({
    brandId: activeBrand.slug !== 'all' ? activeBrand.id : '',
    email: '', firstName: '', lastName: '', phone: '',
    status: 'NEW', source: 'manual',
    loanType: '', loanAmount: '', notes: '', tags: '',
  })
  const [brandList, setBrandList] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/api/leads').then(() => {}).catch(() => {})
    // Load real brands from server to get IDs
    api.get('/api/brands').then(({ data }) => setBrandList(data.brands)).catch(() => {
      // fallback to context brands minus 'all'
      setBrandList(brands.filter(b => b.slug !== 'all'))
    })
  }, [])

  function set(field, val) {
    setForm(prev => ({ ...prev, [field]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = {
        ...form,
        loanAmount: form.loanAmount ? Number(form.loanAmount) : undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      }
      const { data } = await api.post('/api/leads', payload)
      onCreated?.(data)
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
        width: 540, maxWidth: '95vw', maxHeight: '90vh',
        background: 'white', borderRadius: 12,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--hubba-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: 0 }}>
            New Lead
          </h2>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', fontSize: 20,
            color: 'var(--hubba-text-muted)', cursor: 'pointer',
          }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="label">First Name</label>
              <input className="input" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jane" />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Smith" />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label">Email *</label>
            <input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0400 000 000" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="label">Brand *</label>
              <select className="input" required value={form.brandId} onChange={e => set('brandId', e.target.value)}>
                <option value="">Select brand…</option>
                {brandList.map(b => (
                  <option key={b.id || b.slug} value={b.id || b.slug}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Source</label>
              <select className="input" value={form.source} onChange={e => set('source', e.target.value)}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label className="label">Loan Type</label>
              <select className="input" value={form.loanType} onChange={e => set('loanType', e.target.value)}>
                <option value="">—</option>
                {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Loan Amount ($)</label>
              <input className="input" type="number" value={form.loanAmount} onChange={e => set('loanAmount', e.target.value)} placeholder="25000" />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label">Tags (comma-separated)</label>
            <input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="hot, priority" />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any initial notes…" style={{ resize: 'vertical' }} />
          </div>

          {error && <p style={{ color: 'var(--hubba-danger)', fontSize: 13, marginBottom: 8 }}>{error}</p>}
        </form>

        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--hubba-border)',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button className="btn-secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating…' : 'Create Lead'}
          </button>
        </div>
      </div>
    </>
  )
}

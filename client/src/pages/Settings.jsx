import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'

function BrandCard({ brand: initial }) {
  const [brand, setBrand] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...initial })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const fileRef = useRef()

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })) }

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleLogoUpload(file) {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      const { data } = await api.post(`/api/brands/${brand.id}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setBrand(data)
      setForm(prev => ({ ...prev, logoUrl: data.logoUrl }))
      showToast('success', 'Logo uploaded')
    } catch (err) {
      showToast('error', err.response?.data?.error || err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { data } = await api.patch(`/api/brands/${brand.id}`, {
        fromName: form.fromName,
        fromEmail: form.fromEmail,
        primaryColor: form.primaryColor,
      })
      setBrand(data)
      setEditing(false)
      showToast('success', 'Saved')
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ padding: '24px 28px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
        {/* Logo */}
        <div
          onClick={() => fileRef.current.click()}
          style={{
            width: 96, height: 96, borderRadius: 10, flexShrink: 0,
            border: '2px dashed var(--hubba-border)',
            background: brand.primaryColor ? `${brand.primaryColor}18` : 'var(--hubba-surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', overflow: 'hidden', position: 'relative',
          }}
          onMouseEnter={e => e.currentTarget.querySelector('.overlay').style.opacity = 1}
          onMouseLeave={e => e.currentTarget.querySelector('.overlay').style.opacity = 0}
        >
          {brand.logoUrl
            ? <img src={brand.logoUrl} alt={brand.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
            : <span style={{ fontSize: 28 }}>🏷️</span>
          }
          <div className="overlay" style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.15s', fontSize: 12, color: 'white', fontWeight: 600,
          }}>
            {uploading ? 'Uploading…' : 'Change logo'}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
            style={{ display: 'none' }}
            onChange={e => handleLogoUpload(e.target.files[0])}
          />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: 0 }}>{brand.name}</h2>
            <button
              className={editing ? 'btn-secondary' : 'btn-ghost'}
              style={{ fontSize: 13 }}
              onClick={() => { setEditing(e => !e); setForm({ ...brand }) }}
            >
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          <div style={{ fontSize: 13, color: 'var(--hubba-text-muted)', fontFamily: 'var(--font-mono)' }}>
            slug: {brand.slug}
          </div>
          {brand.logoUrl && (
            <div style={{ fontSize: 12, color: 'var(--hubba-text-muted)', marginTop: 4 }}>
              Logo uploaded ✓
            </div>
          )}
          {!brand.logoUrl && (
            <div style={{ fontSize: 12, color: 'var(--hubba-warning)', marginTop: 4 }}>
              No logo — click the box to upload one
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="label">From Name</label>
              <input className="input" value={form.fromName || ''} onChange={e => set('fromName', e.target.value)} placeholder="Loan Fair" />
            </div>
            <div>
              <label className="label">From Email</label>
              <input className="input" type="email" value={form.fromEmail || ''} onChange={e => set('fromEmail', e.target.value)} placeholder="hello@loanfair.com.au" />
            </div>
            <div>
              <label className="label">Primary Colour</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.primaryColor || '#000000'}
                  onChange={e => set('primaryColor', e.target.value)}
                  style={{ width: 40, height: 36, border: '1px solid var(--hubba-border)', borderRadius: 6, cursor: 'pointer', padding: 2 }}
                />
                <input className="input" value={form.primaryColor || ''} onChange={e => set('primaryColor', e.target.value)} style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }} placeholder="#356852" />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
          <div>
            <div className="label">From</div>
            <div>{brand.fromName ? `${brand.fromName} <${brand.fromEmail}>` : '—'}</div>
          </div>
          <div>
            <div className="label">Primary colour</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {brand.primaryColor && (
                <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 4, background: brand.primaryColor, border: '1px solid rgba(0,0,0,0.1)' }} />
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{brand.primaryColor || '—'}</span>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          marginTop: 12, padding: '8px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
          background: toast.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: toast.type === 'success' ? '#065f46' : '#991b1b',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

export default function Settings() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/brands').then(({ data }) => {
      setBrands(data.brands)
      setLoading(false)
    })
  }, [])

  return (
    <div style={{ padding: '28px 32px', maxWidth: 780 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '0 0 4px' }}>Settings</h1>
      <p style={{ color: 'var(--hubba-text-muted)', fontSize: 14, margin: '0 0 28px' }}>
        Manage brand settings and logos.
      </p>

      {loading ? (
        <p style={{ color: 'var(--hubba-text-muted)' }}>Loading…</p>
      ) : (
        brands.map(brand => <BrandCard key={brand.id} brand={brand} />)
      )}

      <div style={{ marginTop: 32, borderTop: '1px solid var(--hubba-border)', paddingTop: 24 }}>
        <div className="label" style={{ marginBottom: 8 }}>Merge tags reference</div>
        <div style={{ fontSize: 13, color: 'var(--hubba-text-muted)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['{{first_name}}', "Recipient's first name"],
            ['{{brand_name}}', 'Brand display name'],
            ['{{brand_logo}}', 'Brand logo as an <img> tag (falls back to brand name if no logo)'],
            ['{{brand_logo_url}}', 'Raw logo URL — use in your own <img src="..."> tag'],
            ['{{unsubscribe_url}}', 'Unsubscribe link (auto-injected in footer if using templates)'],
          ].map(([tag, desc]) => (
            <div key={tag} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--hubba-surface-2)', padding: '2px 7px', borderRadius: 4, flexShrink: 0 }}>{tag}</code>
              <span>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

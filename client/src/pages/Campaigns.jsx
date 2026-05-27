import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useBrand } from '../context/BrandContext'

const STATUS_STYLES = {
  DRAFT:     { background: 'var(--hubba-surface-2)', color: 'var(--hubba-text-muted)' },
  SCHEDULED: { background: '#e0f2fe', color: '#0369a1' },
  SENDING:   { background: '#fef9c3', color: '#854d0e' },
  SENT:      { background: '#d1fae5', color: '#065f46' },
  CANCELLED: { background: '#fee2e2', color: '#991b1b' },
}

export default function Campaigns() {
  const navigate = useNavigate()
  const { activeBrand } = useBrand()
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(id, e) {
    e.stopPropagation()
    setDeleting(true)
    try {
      await api.delete(`/api/campaigns/${id}`)
      setCampaigns(prev => prev.filter(c => c.id !== id))
      setConfirmDeleteId(null)
    } finally {
      setDeleting(false)
    }
  }

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = activeBrand.slug !== 'all' ? { brandId: activeBrand.id } : {}
      const { data } = await api.get('/api/campaigns', { params })
      setCampaigns(data.campaigns)
    } finally {
      setLoading(false)
    }
  }, [activeBrand.slug])

  useEffect(() => { fetch() }, [fetch])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '20px 28px 16px', borderBottom: '1px solid var(--hubba-border)',
        background: 'white', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: 0, flex: 1 }}>
          Campaigns
        </h1>
        <button className="btn-primary" onClick={() => navigate('/campaigns/new')}>
          + New Campaign
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--hubba-text-muted)' }}>Loading…</div>
        ) : campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--hubba-text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📧</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No campaigns yet</div>
            <div style={{ fontSize: 14, marginBottom: 20 }}>Create your first email campaign</div>
            <button className="btn-primary" onClick={() => navigate('/campaigns/new')}>
              + New Campaign
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {campaigns.map(c => (
              <div
                key={c.id}
                className="card"
                onClick={() => confirmDeleteId !== c.id && navigate(c.status === 'DRAFT' ? `/campaigns/${c.id}/edit` : `/campaigns/${c.id}`)}
                style={{ padding: '20px 22px', cursor: confirmDeleteId === c.id ? 'default' : 'pointer', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11, padding: '3px 9px', borderRadius: 999, fontWeight: 600,
                    ...(STATUS_STYLES[c.status] || STATUS_STYLES.DRAFT),
                  }}>{c.status}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--hubba-text-muted)' }}>{c.brand?.name}</span>
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDeleteId(c.id) }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                        color: 'var(--hubba-text-muted)', fontSize: 14, lineHeight: 1,
                        borderRadius: 4, display: confirmDeleteId === c.id ? 'none' : 'block',
                      }}
                      title="Delete campaign"
                    >🗑</button>
                  </div>
                </div>

                {confirmDeleteId === c.id ? (
                  <div onClick={e => e.stopPropagation()} style={{ padding: '8px 0' }}>
                    <p style={{ fontSize: 13, color: 'var(--hubba-text)', margin: '0 0 12px', fontWeight: 500 }}>
                      Delete "{c.name}"? This cannot be undone.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={e => handleDelete(c.id, e)}
                        disabled={deleting}
                        style={{
                          padding: '7px 16px', borderRadius: 6, border: 'none',
                          background: '#991b1b', color: 'white',
                          fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {deleting ? 'Deleting…' : 'Yes, delete'}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDeleteId(null) }}
                        className="btn-ghost"
                        style={{ fontSize: 13 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, fontFamily: 'var(--font-display)' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--hubba-text-muted)', marginBottom: 14 }}>
                      {c.subject}
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                      <div>
                        <span style={{ fontWeight: 600 }}>{c.recipientCount || 0}</span>
                        <span style={{ color: 'var(--hubba-text-muted)', marginLeft: 3 }}>recipients</span>
                      </div>
                      {c.status === 'SENT' && (
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--hubba-success)' }}>
                            {c.recipientCount > 0 ? Math.round((c.deliveredCount / c.recipientCount) * 100) : 0}%
                          </span>
                          <span style={{ color: 'var(--hubba-text-muted)', marginLeft: 3 }}>delivered</span>
                        </div>
                      )}
                      {c.sentAt && (
                        <div style={{ color: 'var(--hubba-text-muted)' }}>
                          {new Date(c.sentAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

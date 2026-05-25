import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useBrand } from '../context/BrandContext'
import ReferrerModal from '../components/referrers/ReferrerModal'

const TIER_STYLES = {
  standard: { background: 'var(--hubba-surface-2)', color: 'var(--hubba-text-muted)' },
  premium: { background: '#fde68a', color: '#92400e' },
  partner: { background: 'rgba(251,176,64,0.2)', color: 'var(--hubba-amber-dark)' },
}

export default function Referrers() {
  const navigate = useNavigate()
  const { activeBrand } = useBrand()
  const [referrers, setReferrers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = activeBrand.slug !== 'all' ? { brandId: activeBrand.id } : {}
      const { data } = await api.get('/api/referrers', { params })
      setReferrers(data.referrers)
    } finally {
      setLoading(false)
    }
  }, [activeBrand.slug])

  useEffect(() => { fetch() }, [fetch])

  function handleSaved(referrer) {
    setReferrers(prev => {
      const exists = prev.find(r => r.id === referrer.id)
      return exists ? prev.map(r => r.id === referrer.id ? referrer : r) : [referrer, ...prev]
    })
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '20px 28px 16px', borderBottom: '1px solid var(--hubba-border)',
        background: 'white', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: 0, flex: 1 }}>
          Referrers
        </h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Referrer
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--hubba-text-muted)' }}>Loading…</div>
        ) : referrers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--hubba-text-muted)' }}>
            No referrers yet. Add your first one.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--hubba-border)' }}>
                {['Name', 'Company', 'Brand', 'Tier', 'Total Leads', 'This Month', 'Conv. Rate', 'Last Activity'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--hubba-text-muted)',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {referrers.map(r => (
                <tr
                  key={r.id}
                  onClick={() => navigate(`/referrers/${r.id}`)}
                  style={{ borderBottom: '1px solid var(--hubba-border)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--hubba-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--hubba-text-muted)' }}>{r.company || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                      background: 'rgba(251,176,64,0.15)', color: 'var(--hubba-amber-dark)',
                    }}>{r.brand?.name}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                      ...(TIER_STYLES[r.tier] || TIER_STYLES.standard),
                    }}>{r.tier || 'standard'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.stats.total}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--hubba-text-muted)' }}>{r.stats.thisMonth ?? '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: r.stats.convRate >= 20 ? 'var(--hubba-success)' : 'var(--hubba-text)' }}>
                      {r.stats.convRate}%
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--hubba-text-muted)', whiteSpace: 'nowrap' }}>
                    {r.stats.lastActivity
                      ? new Date(r.stats.lastActivity).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <ReferrerModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

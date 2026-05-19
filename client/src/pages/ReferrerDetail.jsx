import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import StatusBadge from '../components/leads/StatusBadge'
import ReferrerModal from '../components/referrers/ReferrerModal'

function StatCard({ label, value, sub }) {
  return (
    <div className="card" style={{ padding: '20px 24px', flex: 1, minWidth: 140 }}>
      <div style={{
        fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-display)',
        color: 'var(--hubba-text)', lineHeight: 1,
      }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
        letterSpacing: '0.05em', color: 'var(--hubba-text-muted)', marginTop: 6 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--hubba-text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function ReferrerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [referrer, setReferrer] = useState(null)
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [sendingReport, setSendingReport] = useState(false)
  const [reportToast, setReportToast] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/api/referrers/${id}`),
      api.get(`/api/referrers/${id}/leads`),
    ]).then(([rRes, lRes]) => {
      setReferrer(rRes.data)
      setLeads(lRes.data.leads)
      setStats(lRes.data.stats)
      setLoading(false)
    }).catch(() => navigate('/referrers'))
  }, [id])

  async function handleSendReport() {
    if (!referrer.email) {
      setReportToast({ type: 'error', msg: 'This referrer has no email address.' })
      setTimeout(() => setReportToast(null), 4000)
      return
    }
    setSendingReport(true)
    try {
      await api.post(`/api/referrers/${id}/report`)
      setReportToast({ type: 'success', msg: `Report sent to ${referrer.email}` })
    } catch (err) {
      setReportToast({ type: 'error', msg: err.response?.data?.error || 'Failed to send report' })
    } finally {
      setSendingReport(false)
      setTimeout(() => setReportToast(null), 4000)
    }
  }

  if (loading) {
    return <div style={{ padding: 32, color: 'var(--hubba-text-muted)' }}>Loading…</div>
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      {/* Back + header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => navigate('/referrers')} className="btn-ghost" style={{ marginBottom: 12 }}>
          ← Referrers
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: 0, marginBottom: 4 }}>
              {referrer.name}
            </h1>
            <div style={{ color: 'var(--hubba-text-muted)', fontSize: 14 }}>
              {referrer.company && `${referrer.company} · `}
              {referrer.email && `${referrer.email} · `}
              {referrer.brand?.name}
              {referrer.tier && (
                <span style={{
                  marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 4,
                  background: 'var(--hubba-surface-2)', color: 'var(--hubba-text-muted)',
                  fontWeight: 600, textTransform: 'capitalize',
                }}>{referrer.tier}</span>
              )}
            </div>
            {referrer.utmSource && (
              <div style={{ fontSize: 12, color: 'var(--hubba-text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                utm_source={referrer.utmSource}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={() => setShowEdit(true)}>Edit</button>
            <button className="btn-primary" onClick={handleSendReport} disabled={sendingReport}>
              {sendingReport ? 'Sending…' : 'Send report'}
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {reportToast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
          background: reportToast.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: reportToast.type === 'success' ? '#065f46' : '#991b1b',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {reportToast.msg}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard label="Total Leads" value={stats.total || 0} />
        <StatCard label="This Month" value={stats.thisMonth || 0} />
        <StatCard label="Converted" value={stats.converted || 0} />
        <StatCard label="Conversion Rate" value={`${stats.convRate || 0}%`} />
      </div>

      {/* Notes */}
      {referrer.notes && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: 24 }}>
          <div className="label" style={{ marginBottom: 6 }}>Notes</div>
          <p style={{ fontSize: 14, margin: 0, color: 'var(--hubba-text)' }}>{referrer.notes}</p>
        </div>
      )}

      {/* Leads table */}
      <div>
        <div className="label" style={{ marginBottom: 12 }}>
          Attributed Leads ({leads.length})
        </div>
        {leads.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--hubba-text-muted)' }}>No leads attributed yet.</p>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--hubba-border)' }}>
                  {['Name', 'Email', 'Brand', 'Status', 'Source', 'Created'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left', fontSize: 12,
                      fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.05em', color: 'var(--hubba-text-muted)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => {
                  const name = [lead.contact.firstName, lead.contact.lastName].filter(Boolean).join(' ') || lead.contact.email
                  return (
                    <tr key={lead.id} style={{ borderBottom: '1px solid var(--hubba-border)' }}>
                      <td style={{ padding: '11px 16px', fontWeight: 600 }}>{name}</td>
                      <td style={{ padding: '11px 16px', color: 'var(--hubba-text-muted)' }}>{lead.contact.email}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4,
                          background: 'rgba(251,176,64,0.15)', color: 'var(--hubba-amber-dark)', fontWeight: 600 }}>
                          {lead.brand?.name}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px' }}><StatusBadge status={lead.status} /></td>
                      <td style={{ padding: '11px 16px', color: 'var(--hubba-text-muted)' }}>{lead.source || '—'}</td>
                      <td style={{ padding: '11px 16px', color: 'var(--hubba-text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEdit && (
        <ReferrerModal
          referrer={referrer}
          onClose={() => setShowEdit(false)}
          onSaved={updated => { setReferrer(updated); setShowEdit(false) }}
        />
      )}
    </div>
  )
}

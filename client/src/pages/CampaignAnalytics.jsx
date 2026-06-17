import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import api from '../lib/api'

function StatCard({ label, value, sub, color }) {
  return (
    <div className="card" style={{ padding: '18px 22px', flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color: color || 'var(--hubba-text)' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--hubba-text-muted)', marginTop: 4 }}>
        {label}
      </div>
      {sub !== undefined && (
        <div style={{ fontSize: 13, color: color || 'var(--hubba-text)', fontWeight: 600, marginTop: 2 }}>{sub}</div>
      )}
    </div>
  )
}

const EVENT_BADGE = {
  delivered: { bg: '#d1fae5', color: '#065f46' },
  opened:    { bg: '#dbeafe', color: '#1e40af' },
  clicked:   { bg: '#ede9fe', color: '#5b21b6' },
  bounced:   { bg: '#fee2e2', color: '#991b1b' },
  unsubscribed: { bg: '#fef3c7', color: '#92400e' },
}

export default function CampaignAnalytics() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState(null)
  const [stats, setStats] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [recipients, setRecipients] = useState([])
  const [tagBreakdown, setTagBreakdown] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get(`/api/campaigns/${id}`),
      api.get(`/api/campaigns/${id}/stats`),
    ]).then(([cRes, sRes]) => {
      setCampaign(cRes.data)
      setStats(sRes.data.stats)
      setTimeline(sRes.data.timeline.filter(t => t.opens > 0 || t.clicks > 0 || t.hour < 24))
      setRecipients(sRes.data.recipients)
      setTagBreakdown(sRes.data.tagBreakdown || [])
      setLoading(false)
    }).catch(() => navigate('/campaigns'))
  }, [id])

  if (loading) return <div style={{ padding: 32, color: 'var(--hubba-text-muted)' }}>Loading…</div>

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <button onClick={() => navigate('/campaigns')} className="btn-ghost" style={{ marginBottom: 16 }}>
        ← Campaigns
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: 0, marginBottom: 4 }}>
            {campaign.name}
          </h1>
          <div style={{ fontSize: 14, color: 'var(--hubba-text-muted)' }}>
            {campaign.subject} · {campaign.brand?.name}
            {campaign.sentAt && ` · Sent ${new Date(campaign.sentAt).toLocaleDateString()}`}
          </div>
        </div>
        <button className="btn-secondary" onClick={() => navigate(`/campaigns/${id}/edit`)}>
          Edit
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="Sent" value={stats.sent} />
        <StatCard label="Delivered" value={stats.delivered} sub={`${stats.sent > 0 ? Math.round(stats.delivered/stats.sent*100) : 0}%`} color="var(--hubba-success)" />
        <StatCard label="Opens" value={stats.opens} sub={`${stats.openRate}%`} color="#1e40af" />
        <StatCard label="Clicks" value={stats.clicks} sub={`${stats.clickRate}%`} color="#5b21b6" />
        <StatCard label="Bounces" value={stats.bounces} color="var(--hubba-danger)" />
        <StatCard label="Unsubs" value={stats.unsubscribes} color="var(--hubba-warning)" />
      </div>

      {/* Timeline chart */}
      {timeline.length > 0 && (
        <div className="card" style={{ padding: '20px 24px', marginBottom: 28 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Opens & Clicks (48h)</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeline} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hubba-border)" />
              <XAxis dataKey="hour" tickFormatter={h => `${h}h`} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(val, name) => [val, name === 'opens' ? 'Opens' : 'Clicks']} labelFormatter={h => `Hour ${h}`} />
              <Legend formatter={v => v === 'opens' ? 'Opens' : 'Clicks'} />
              <Line type="monotone" dataKey="opens" stroke="#1e40af" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="clicks" stroke="#5b21b6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Audience tag breakdown */}
      {tagBreakdown.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div className="label" style={{ marginBottom: 12 }}>Audience breakdown</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--hubba-border)' }}>
                  {['Audience', 'Sent', 'Delivered', 'Opens', 'Open rate', 'Clicks', 'Click rate'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontSize: 11,
                      fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                      color: 'var(--hubba-text-muted)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tagBreakdown.map(row => (
                  <tr key={row.tag} style={{ borderBottom: '1px solid var(--hubba-border)' }}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: 12, padding: '3px 10px', borderRadius: 999,
                        background: 'rgba(251,176,64,0.15)', color: 'var(--hubba-amber-dark)',
                        fontWeight: 600,
                      }}>{row.tag}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{row.sent}</td>
                    <td style={{ padding: '10px 14px' }}>{row.delivered}</td>
                    <td style={{ padding: '10px 14px' }}>{row.opens}</td>
                    <td style={{ padding: '10px 14px', color: '#1e40af', fontWeight: 600 }}>{row.openRate}%</td>
                    <td style={{ padding: '10px 14px' }}>{row.clicks}</td>
                    <td style={{ padding: '10px 14px', color: '#5b21b6', fontWeight: 600 }}>{row.clickRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recipients table */}
      <div>
        <div className="label" style={{ marginBottom: 12 }}>Recipients ({recipients.length})</div>
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--hubba-border)' }}>
                {['Name', 'Email', 'Audience', 'Status', 'Events', 'Sent'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left', fontSize: 11,
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: 'var(--hubba-text-muted)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recipients.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--hubba-border)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.name || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--hubba-text-muted)' }}>{r.email}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {(r.tags || []).map(t => (
                        <span key={t} style={{
                          fontSize: 10, padding: '1px 7px', borderRadius: 999,
                          background: 'rgba(251,176,64,0.15)', color: 'var(--hubba-amber-dark)',
                          fontWeight: 600,
                        }}>{t}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600, background: 'var(--hubba-surface-2)', color: 'var(--hubba-text-muted)' }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {[...new Set(r.events)].map(ev => (
                        <span key={ev} style={{
                          fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                          textTransform: 'capitalize',
                          ...(EVENT_BADGE[ev] || { bg: 'var(--hubba-surface-2)', color: 'var(--hubba-text-muted)' }),
                          background: (EVENT_BADGE[ev] || {}).bg,
                        }}>{ev}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--hubba-text-muted)', whiteSpace: 'nowrap' }}>
                    {r.sentAt ? new Date(r.sentAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

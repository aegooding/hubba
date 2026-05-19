import { useState, useEffect } from 'react'
import api from '../../lib/api'
import StatusBadge, { STATUS_LABELS } from './StatusBadge'

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'SUBMITTED', 'APPROVED', 'CONVERTED', 'LOST']

const ACTIVITY_ICONS = {
  note: '📝',
  status_change: '🔄',
  email_sent: '📧',
  call: '📞',
}

function contactName(lead) {
  const { firstName, lastName, email } = lead.contact
  return [firstName, lastName].filter(Boolean).join(' ') || email
}

export default function LeadSlideOver({ lead: initialLead, onClose, onUpdate, onDelete }) {
  const [lead, setLead] = useState(initialLead)
  const [activities, setActivities] = useState([])
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!initialLead?.id) return
    setLead(initialLead)
    api.get(`/api/leads/${initialLead.id}`).then(({ data }) => {
      setLead(data)
      setActivities(data.activities || [])
      setLoading(false)
    })
  }, [initialLead?.id])

  async function handleStatusChange(newStatus) {
    if (newStatus === lead.status) return
    const oldStatus = lead.status
    setLead(prev => ({ ...prev, status: newStatus }))
    try {
      const { data } = await api.patch(`/api/leads/${lead.id}`, { status: newStatus })
      await api.post(`/api/leads/${lead.id}/activities`, {
        type: 'status_change',
        meta: { from: oldStatus, to: newStatus },
      })
      const updated = await api.get(`/api/leads/${lead.id}`)
      setLead(updated.data)
      setActivities(updated.data.activities || [])
      onUpdate?.(updated.data)
    } catch {
      setLead(prev => ({ ...prev, status: oldStatus }))
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return
    setSavingNote(true)
    try {
      await api.post(`/api/leads/${lead.id}/activities`, { type: 'note', body: noteText })
      setNoteText('')
      const updated = await api.get(`/api/leads/${lead.id}`)
      setActivities(updated.data.activities || [])
    } finally {
      setSavingNote(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this lead? This cannot be undone.')) return
    await api.delete(`/api/leads/${lead.id}`)
    onDelete?.(lead.id)
    onClose()
  }

  if (!lead) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.3)',
          zIndex: 40,
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: 480, maxWidth: '100vw', height: '100vh',
        background: 'white',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        zIndex: 50,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--hubba-border)',
          background: 'var(--hubba-charcoal)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: 22,
                color: 'white', margin: 0, marginBottom: 4,
              }}>
                {contactName(lead)}
              </h2>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                {lead.contact.email}
                {lead.contact.phone && ` · ${lead.contact.phone}`}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {lead.source && (
                  <span style={{
                    fontSize: 11, background: 'rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: 4,
                  }}>
                    {lead.source}
                  </span>
                )}
                {lead.brand && (
                  <span style={{
                    fontSize: 11, background: 'rgba(251,176,64,0.2)',
                    color: 'var(--hubba-amber)', padding: '2px 8px', borderRadius: 4,
                  }}>
                    {lead.brand.name}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.55)', fontSize: 20,
              cursor: 'pointer', padding: 4, lineHeight: 1,
            }}>✕</button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Status selector */}
          <div style={{ marginBottom: 20 }}>
            <div className="label">Status</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  style={{
                    padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: '2px solid transparent',
                    background: lead.status === s ? 'var(--hubba-amber)' : 'var(--hubba-surface-2)',
                    color: lead.status === s ? 'var(--hubba-black)' : 'var(--hubba-text-muted)',
                    borderColor: lead.status === s ? 'var(--hubba-amber)' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Loan details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <div className="label">Loan Type</div>
              <div style={{ fontSize: 14 }}>{lead.loanType || '—'}</div>
            </div>
            <div>
              <div className="label">Loan Amount</div>
              <div style={{ fontSize: 14 }}>
                {lead.loanAmount ? `$${lead.loanAmount.toLocaleString()}` : '—'}
              </div>
            </div>
            <div>
              <div className="label">Referrer</div>
              <div style={{ fontSize: 14 }}>{lead.referrer?.name || '—'}</div>
            </div>
            <div>
              <div className="label">Created</div>
              <div style={{ fontSize: 14 }}>{new Date(lead.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Tags */}
          {lead.tags?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="label">Tags</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {lead.tags.map(tag => (
                  <span key={tag} style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 12,
                    background: 'var(--hubba-surface-2)', color: 'var(--hubba-text-muted)',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 24 }}>
            <div className="label">Add Note</div>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Write a note…"
              rows={3}
              className="input"
              style={{ resize: 'vertical', marginBottom: 8 }}
            />
            <button
              onClick={handleAddNote}
              disabled={savingNote || !noteText.trim()}
              className="btn-primary"
              style={{ opacity: (!noteText.trim() || savingNote) ? 0.5 : 1 }}
            >
              {savingNote ? 'Saving…' : 'Add note'}
            </button>
          </div>

          {/* Activity log */}
          <div>
            <div className="label" style={{ marginBottom: 12 }}>Activity</div>
            {loading ? (
              <p style={{ color: 'var(--hubba-text-muted)', fontSize: 14 }}>Loading…</p>
            ) : activities.length === 0 ? (
              <p style={{ color: 'var(--hubba-text-muted)', fontSize: 14 }}>No activity yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activities.map(a => (
                  <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16, marginTop: 1 }}>
                      {ACTIVITY_ICONS[a.type] || '•'}
                    </span>
                    <div style={{ flex: 1 }}>
                      {a.type === 'status_change' && a.meta ? (
                        <span style={{ fontSize: 13, color: 'var(--hubba-text-muted)' }}>
                          Status changed from <strong>{STATUS_LABELS[a.meta.from]}</strong> to{' '}
                          <strong>{STATUS_LABELS[a.meta.to]}</strong>
                        </span>
                      ) : (
                        <span style={{ fontSize: 13 }}>{a.body}</span>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--hubba-text-muted)', marginTop: 2 }}>
                        {new Date(a.createdAt).toLocaleString()}
                        {a.createdBy && ` · ${a.createdBy}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--hubba-border)',
          display: 'flex', gap: 8,
        }}>
          <button className="btn-secondary" style={{ flex: 1 }}>Edit</button>
          <button
            onClick={handleDelete}
            style={{
              padding: '8px 16px', borderRadius: 6, border: 'none',
              background: '#fee2e2', color: '#991b1b',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </>
  )
}

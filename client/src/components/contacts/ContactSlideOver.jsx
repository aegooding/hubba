import { useState, useEffect } from 'react'
import api from '../../lib/api'
import StatusBadge from '../leads/StatusBadge'

function contactName(c) {
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email
}

const EVENT_ICONS = {
  delivered: '✉️',
  opened: '👁️',
  clicked: '🔗',
  bounced: '↩️',
  unsubscribed: '🚫',
}

export default function ContactSlideOver({ contact: initial, onClose, onUpdate, onDelete }) {
  const [contact, setContact] = useState(initial)
  const [loading, setLoading] = useState(true)
  const [resubscribeConfirm, setResubscribeConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/api/contacts/${contact.id}`)
      onDelete?.(contact.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!initial?.id) return
    api.get(`/api/contacts/${initial.id}`).then(({ data }) => {
      setContact(data)
      setLoading(false)
    })
  }, [initial?.id])

  async function handleResubscribe() {
    setSaving(true)
    try {
      const { data } = await api.patch(`/api/contacts/${contact.id}`, { unsubscribed: false })
      setContact(prev => ({ ...prev, unsubscribed: false }))
      setResubscribeConfirm(false)
      onUpdate?.(data)
    } finally {
      setSaving(false)
    }
  }

  if (!contact) return null

  const brands = [...new Set((contact.leads || []).map(l => l.brand?.name).filter(Boolean))]

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40,
      }} />

      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: 480, maxWidth: '100vw', height: '100vh',
        background: 'white',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        zIndex: 50, display: 'flex', flexDirection: 'column', overflow: 'hidden',
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
                {contactName(contact)}
              </h2>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                {contact.email}
                {contact.phone && ` · ${contact.phone}`}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {brands.map(b => (
                  <span key={b} style={{
                    fontSize: 11, background: 'rgba(251,176,64,0.2)',
                    color: 'var(--hubba-amber)', padding: '2px 8px', borderRadius: 4,
                  }}>{b}</span>
                ))}
                {contact.unsubscribed && (
                  <span style={{
                    fontSize: 11, background: 'rgba(192,57,43,0.2)',
                    color: '#e74c3c', padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                  }}>Unsubscribed</span>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.55)', fontSize: 20, cursor: 'pointer', padding: 4,
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <p style={{ color: 'var(--hubba-text-muted)', fontSize: 14 }}>Loading…</p>
          ) : (
            <>
              {/* Leads */}
              <div style={{ marginBottom: 24 }}>
                <div className="label" style={{ marginBottom: 10 }}>
                  Leads ({contact.leads?.length || 0})
                </div>
                {contact.leads?.length === 0 ? (
                  <p style={{ fontSize: 14, color: 'var(--hubba-text-muted)' }}>No leads.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {contact.leads?.map(lead => (
                      <div key={lead.id} className="card" style={{
                        padding: '10px 14px', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{lead.brand?.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--hubba-text-muted)' }}>
                            {new Date(lead.createdAt).toLocaleDateString()}
                            {lead.source && ` · ${lead.source}`}
                          </div>
                        </div>
                        <StatusBadge status={lead.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Email history */}
              <div style={{ marginBottom: 24 }}>
                <div className="label" style={{ marginBottom: 10 }}>Email History</div>
                {contact.emailEvents?.length === 0 ? (
                  <p style={{ fontSize: 14, color: 'var(--hubba-text-muted)' }}>No email history.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {contact.emailEvents?.map(ev => (
                      <div key={ev.id} style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                        fontSize: 13, paddingBottom: 8,
                        borderBottom: '1px solid var(--hubba-border)',
                      }}>
                        <span style={{ fontSize: 16 }}>{EVENT_ICONS[ev.event] || '•'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{ev.event}</div>
                          {ev.campaignSend?.campaign?.name && (
                            <div style={{ fontSize: 12, color: 'var(--hubba-text-muted)' }}>
                              {ev.campaignSend.campaign.name}
                            </div>
                          )}
                          <div style={{ fontSize: 11, color: 'var(--hubba-text-muted)', marginTop: 2 }}>
                            {new Date(ev.occurredAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Re-subscribe */}
              {contact.unsubscribed && (
                <div style={{
                  background: '#fff5f5', border: '1px solid #fed7d7',
                  borderRadius: 8, padding: '14px 16px',
                }}>
                  <p style={{ fontSize: 13, color: 'var(--hubba-text)', marginBottom: 10 }}>
                    This contact has unsubscribed from marketing emails.
                  </p>
                  {!resubscribeConfirm ? (
                    <button
                      onClick={() => setResubscribeConfirm(true)}
                      className="btn-secondary"
                      style={{ fontSize: 13 }}
                    >
                      Re-subscribe
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--hubba-text-muted)' }}>
                        Are you sure?
                      </span>
                      <button
                        onClick={handleResubscribe}
                        className="btn-primary"
                        disabled={saving}
                        style={{ fontSize: 13, padding: '5px 14px' }}
                      >
                        {saving ? 'Saving…' : 'Yes, re-subscribe'}
                      </button>
                      <button
                        onClick={() => setResubscribeConfirm(false)}
                        className="btn-ghost"
                        style={{ fontSize: 13 }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer — delete */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--hubba-border)' }}>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: '8px 16px', borderRadius: 6, border: 'none',
                background: '#fee2e2', color: '#991b1b',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Delete contact
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--hubba-text-muted)', flex: 1 }}>
                Delete contact and all their leads? This cannot be undone.
              </span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '8px 16px', borderRadius: 6, border: 'none',
                  background: '#991b1b', color: 'white',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="btn-ghost"
                style={{ fontSize: 13 }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

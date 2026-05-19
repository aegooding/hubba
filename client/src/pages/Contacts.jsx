import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import ContactSlideOver from '../components/contacts/ContactSlideOver'

function contactName(c) {
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email
}

export default function Contacts() {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [unsubOnly, setUnsubOnly] = useState(false)
  const [selected, setSelected] = useState(null)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (unsubOnly) params.unsubscribed = 'true'
      const { data } = await api.get('/api/contacts', { params })
      setContacts(data.contacts)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [search, unsubOnly])

  useEffect(() => { fetchContacts() }, [fetchContacts])

  function handleUpdate(updated) {
    setContacts(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        padding: '20px 28px 16px', borderBottom: '1px solid var(--hubba-border)',
        background: 'white', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: 0, flex: 1 }}>
          Contacts
        </h1>
        <input
          className="input"
          style={{ width: 240 }}
          placeholder="Search by name, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={unsubOnly}
            onChange={e => setUnsubOnly(e.target.checked)}
            style={{ accentColor: 'var(--hubba-amber)', width: 15, height: 15 }}
          />
          Unsubscribed only
        </label>
        <button className="btn-primary" onClick={() => navigate('/contacts/import')}>
          Import CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--hubba-text-muted)' }}>Loading…</div>
        ) : contacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--hubba-text-muted)' }}>
            No contacts found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--hubba-border)' }}>
                {['Name', 'Email', 'Phone', 'Brands', 'Leads', 'Status'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left', fontSize: 12,
                    fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--hubba-text-muted)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => {
                const brands = [...new Set((c.leads || []).map(l => l.brand?.name).filter(Boolean))]
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    style={{ borderBottom: '1px solid var(--hubba-border)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--hubba-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{contactName(c)}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--hubba-text-muted)' }}>{c.email}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--hubba-text-muted)' }}>{c.phone || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {brands.map(b => (
                          <span key={b} style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 4,
                            background: 'rgba(251,176,64,0.15)', color: 'var(--hubba-amber-dark)',
                            fontWeight: 600,
                          }}>{b}</span>
                        ))}
                        {brands.length === 0 && <span style={{ color: 'var(--hubba-text-muted)' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--hubba-text-muted)' }}>
                      {c._count?.leads || 0}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {c.unsubscribed && (
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 4,
                          background: '#fee2e2', color: '#991b1b', fontWeight: 600,
                        }}>Unsubscribed</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <ContactSlideOver
          contact={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}

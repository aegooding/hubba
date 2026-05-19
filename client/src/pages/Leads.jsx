import { useState } from 'react'
import { useLeads } from '../hooks/useLeads'
import KanbanBoard from '../components/leads/KanbanBoard'
import LeadTable from '../components/leads/LeadTable'
import LeadSlideOver from '../components/leads/LeadSlideOver'
import CreateLeadModal from '../components/leads/CreateLeadModal'

const VIEW_KEY = 'hubba-leads-view'

export default function Leads() {
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || 'kanban')
  const [selectedLead, setSelectedLead] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  const { leads, loading, error, refetch, updateLeadStatus, setLeads } = useLeads(
    search ? { search } : {}
  )

  function switchView(v) {
    setView(v)
    localStorage.setItem(VIEW_KEY, v)
  }

  function handleLeadUpdate(updatedLead) {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l))
    if (selectedLead?.id === updatedLead.id) setSelectedLead(updatedLead)
  }

  function handleLeadDelete(leadId) {
    setLeads(prev => prev.filter(l => l.id !== leadId))
    setSelectedLead(null)
  }

  function handleCreated(lead) {
    refetch()
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{
        padding: '20px 28px 16px',
        borderBottom: '1px solid var(--hubba-border)',
        background: 'white',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: 0, flex: 1 }}>
          Leads
        </h1>

        {/* Search */}
        <input
          className="input"
          style={{ width: 240 }}
          placeholder="Search by name, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* View toggle */}
        <div style={{
          display: 'flex', background: 'var(--hubba-surface-2)',
          borderRadius: 6, padding: 3,
        }}>
          {[['kanban', 'Pipeline'], ['list', 'List']].map(([v, label]) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              style={{
                padding: '6px 14px', borderRadius: 4, border: 'none',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                background: view === v ? 'white' : 'transparent',
                color: view === v ? 'var(--hubba-text)' : 'var(--hubba-text-muted)',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          + New Lead
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: view === 'kanban' ? '24px 28px' : 0 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--hubba-text-muted)' }}>
            Loading…
          </div>
        )}

        {error && (
          <div style={{ padding: 24, color: 'var(--hubba-danger)' }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && view === 'kanban' && (
          <KanbanBoard
            leads={leads}
            onCardClick={setSelectedLead}
            onStatusChange={updateLeadStatus}
          />
        )}

        {!loading && !error && view === 'list' && (
          <div className="card" style={{ margin: 0, borderRadius: 0, border: 'none', borderTop: '1px solid var(--hubba-border)' }}>
            <LeadTable leads={leads} onRowClick={setSelectedLead} />
          </div>
        )}
      </div>

      {/* Lead detail slide-over */}
      {selectedLead && (
        <LeadSlideOver
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleLeadUpdate}
          onDelete={handleLeadDelete}
        />
      )}

      {/* Create lead modal */}
      {showCreate && (
        <CreateLeadModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

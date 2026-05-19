import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter, useDroppable } from '@dnd-kit/core'
import { useState } from 'react'
import StatusBadge, { STATUS_LABELS } from './StatusBadge'

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'SUBMITTED', 'APPROVED', 'CONVERTED', 'LOST']

function contactName(lead) {
  const { firstName, lastName, email } = lead.contact
  return [firstName, lastName].filter(Boolean).join(' ') || email
}

function LeadCard({ lead, onClick }) {
  return (
    <div
      className="card"
      onClick={() => onClick(lead)}
      style={{
        padding: '12px 14px',
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
    >
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
        {contactName(lead)}
      </div>
      <div style={{ fontSize: 12, color: 'var(--hubba-text-muted)', marginBottom: 8 }}>
        {lead.contact.email}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {lead.source && (
          <span style={{
            fontSize: 11, background: 'var(--hubba-surface-2)',
            padding: '2px 6px', borderRadius: 4, color: 'var(--hubba-text-muted)',
          }}>
            {lead.source}
          </span>
        )}
        {lead.loanAmount && (
          <span style={{ fontSize: 11, color: 'var(--hubba-text-muted)' }}>
            ${lead.loanAmount.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}

function KanbanColumn({ status, leads, onCardClick, isOver }) {
  return (
    <div style={{
      minWidth: 240,
      maxWidth: 260,
      flex: '0 0 240px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        padding: '0 2px',
      }}>
        <StatusBadge status={status} />
        <span style={{ fontSize: 12, color: 'var(--hubba-text-muted)', fontWeight: 600 }}>
          {leads.length}
        </span>
      </div>
      <div style={{
        flex: 1,
        minHeight: 80,
        padding: '8px 6px',
        borderRadius: 8,
        background: isOver ? 'rgba(251,176,64,0.08)' : 'rgba(0,0,0,0.03)',
        border: isOver ? '2px dashed var(--hubba-amber)' : '2px dashed transparent',
        transition: 'all 0.15s',
      }}>
        {leads.map(lead => (
          <LeadCard key={lead.id} lead={lead} onClick={onCardClick} />
        ))}
      </div>
    </div>
  )
}

export default function KanbanBoard({ leads, onCardClick, onStatusChange }) {
  const [activeId, setActiveId] = useState(null)
  const [overId, setOverId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s)
    return acc
  }, {})

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

  function handleDragStart({ active }) {
    setActiveId(active.id)
  }

  function handleDragOver({ over }) {
    setOverId(over?.id ?? null)
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    setOverId(null)
    if (!over) return
    const lead = leads.find(l => l.id === active.id)
    const newStatus = STATUSES.includes(over.id) ? over.id : null
    if (!newStatus || newStatus === lead.status) return
    onStatusChange(lead.id, newStatus, lead.status)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {STATUSES.map(status => (
          // Each column acts as a droppable via its id
          <DroppableColumn
            key={status}
            id={status}
            status={status}
            leads={byStatus[status]}
            onCardClick={onCardClick}
            isOver={overId === status}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead && (
          <div style={{ opacity: 0.85, transform: 'rotate(2deg)' }}>
            <LeadCard lead={activeLead} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

function DroppableColumn({ id, status, leads, onCardClick, isOver }) {
  const { setNodeRef } = useDroppable({ id })
  return (
    <div ref={setNodeRef} style={{ display: 'contents' }}>
      <KanbanColumn
        status={status}
        leads={leads}
        onCardClick={onCardClick}
        isOver={isOver}
      />
    </div>
  )
}

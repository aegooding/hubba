import StatusBadge from './StatusBadge'

function contactName(lead) {
  const { firstName, lastName, email } = lead.contact
  return [firstName, lastName].filter(Boolean).join(' ') || email
}

export default function LeadTable({ leads, onRowClick }) {
  if (leads.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 24px',
        color: 'var(--hubba-text-muted)', fontSize: 14,
      }}>
        No leads found.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--hubba-border)' }}>
            {['Name', 'Email', 'Brand', 'Status', 'Source', 'Referrer', 'Created'].map(h => (
              <th key={h} style={{
                padding: '10px 14px', textAlign: 'left',
                fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.05em', color: 'var(--hubba-text-muted)',
                whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => (
            <tr
              key={lead.id}
              onClick={() => onRowClick(lead)}
              style={{ borderBottom: '1px solid var(--hubba-border)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hubba-surface-2)'}
              onMouseLeave={e => e.currentTarget.style.background = ''}
            >
              <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                {contactName(lead)}
              </td>
              <td style={{ padding: '12px 14px', color: 'var(--hubba-text-muted)' }}>
                {lead.contact.email}
              </td>
              <td style={{ padding: '12px 14px' }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px',
                  borderRadius: 4, background: 'var(--hubba-surface-2)',
                }}>
                  {lead.brand?.name}
                </span>
              </td>
              <td style={{ padding: '12px 14px' }}>
                <StatusBadge status={lead.status} />
              </td>
              <td style={{ padding: '12px 14px', color: 'var(--hubba-text-muted)' }}>
                {lead.source || '—'}
              </td>
              <td style={{ padding: '12px 14px', color: 'var(--hubba-text-muted)' }}>
                {lead.referrer?.name || '—'}
              </td>
              <td style={{ padding: '12px 14px', color: 'var(--hubba-text-muted)', whiteSpace: 'nowrap' }}>
                {new Date(lead.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

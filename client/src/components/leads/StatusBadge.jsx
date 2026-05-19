const STATUS_LABELS = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  CONVERTED: 'Converted',
  LOST: 'Lost',
}

const STATUS_CLASSES = {
  NEW: 'badge-new',
  CONTACTED: 'badge-contacted',
  QUALIFIED: 'badge-qualified',
  SUBMITTED: 'badge-submitted',
  APPROVED: 'badge-approved',
  CONVERTED: 'badge-converted',
  LOST: 'badge-lost',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_CLASSES[status] || 'badge-new'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export { STATUS_LABELS }

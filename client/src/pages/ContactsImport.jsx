import { useNavigate } from 'react-router-dom'
import ImportWizard from '../components/shared/ImportWizard'

const FIELDS = [
  { key: 'email', label: 'Email', required: true },
  { key: 'first_name', label: 'First Name', required: false },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'unsubscribed', label: 'Unsubscribed', required: false },
]

export default function ContactsImport() {
  const navigate = useNavigate()

  return (
    <div style={{ padding: '28px 28px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/contacts')}
          className="btn-ghost"
          style={{ padding: '6px 10px' }}
        >
          ← Contacts
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: 0 }}>
          Import Contacts
        </h1>
      </div>
      <ImportWizard
        fields={FIELDS}
        uploadUrl="/api/contacts/import"
        templateUrl="/api/contacts/import/template"
        onDone={() => navigate('/contacts')}
        title="Import Contacts"
        allowTags
      />
    </div>
  )
}

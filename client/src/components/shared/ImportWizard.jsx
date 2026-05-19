import { useState, useRef } from 'react'
import Papa from 'papaparse'
import api from '../../lib/api'

export default function ImportWizard({ fields, uploadUrl, templateUrl, onDone, title = 'Import CSV' }) {
  const [step, setStep] = useState(1) // 1: upload, 2: map, 3: preview
  const [file, setFile] = useState(null)
  const [headers, setHeaders] = useState([])
  const [rows, setRows] = useState([])
  const [columnMap, setColumnMap] = useState({})
  const [result, setResult] = useState(null)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const requiredFields = fields.filter(f => f.required)
  const optionalFields = fields.filter(f => !f.required)

  function handleFile(f) {
    if (!f || !f.name.endsWith('.csv')) return
    setFile(f)
    Papa.parse(f, {
      header: true,
      preview: 6,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        setHeaders(meta.fields || [])
        setRows(data)
        // Auto-map where headers match field keys (case-insensitive)
        const autoMap = {}
        for (const field of fields) {
          const match = (meta.fields || []).find(
            h => h.toLowerCase().replace(/\s/g, '_') === field.key.toLowerCase()
          )
          if (match) autoMap[field.key] = match
        }
        setColumnMap(autoMap)
        setStep(2)
      },
    })
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  function getMappedValue(row, fieldKey) {
    const col = columnMap[fieldKey]
    return col ? row[col] : ''
  }

  function hasErrors(row) {
    return requiredFields.some(f => !getMappedValue(row, f.key)?.trim())
  }

  async function handleImport() {
    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('columnMap', JSON.stringify(columnMap))
      const { data } = await api.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
      setStep(3)
    } catch (err) {
      setResult({ error: err.response?.data?.error || err.message })
      setStep(3)
    } finally {
      setImporting(false)
    }
  }

  function downloadErrors() {
    if (!result?.errors?.length) return
    const csv = Papa.unparse(result.errors.map(e => ({ row: e.row, error: e.message })))
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'import-errors.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 24px' }}>
      {/* Steps */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
        {['Upload', 'Map columns', 'Result'].map((label, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              background: step > i + 1 ? 'var(--hubba-success)' : step === i + 1 ? 'var(--hubba-amber)' : 'var(--hubba-surface-2)',
              color: step >= i + 1 ? (step > i + 1 ? 'white' : 'var(--hubba-black)') : 'var(--hubba-text-muted)',
            }}>
              {step > i + 1 ? '✓' : i + 1}
            </div>
            <span style={{
              marginLeft: 8, fontSize: 13, fontWeight: 500,
              color: step === i + 1 ? 'var(--hubba-text)' : 'var(--hubba-text-muted)',
            }}>{label}</span>
            {i < 2 && <div style={{ flex: 1, height: 1, background: 'var(--hubba-border)', margin: '0 12px' }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--hubba-amber)' : 'var(--hubba-border)'}`,
              borderRadius: 10, padding: '48px 24px', textAlign: 'center',
              background: dragOver ? 'rgba(251,176,64,0.05)' : 'white',
              cursor: 'pointer', transition: 'all 0.15s', marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop your CSV here</div>
            <div style={{ fontSize: 13, color: 'var(--hubba-text-muted)' }}>or click to browse</div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
          </div>
          {templateUrl && (
            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault()
                const res = await api.get(templateUrl, { responseType: 'blob' })
                const url = URL.createObjectURL(res.data)
                const a = document.createElement('a')
                a.href = url; a.download = 'template.csv'; a.click()
                URL.revokeObjectURL(url)
              }}
              style={{ fontSize: 13, color: 'var(--hubba-amber)', textDecoration: 'none' }}
            >
              ↓ Download template CSV
            </a>
          )}
        </div>
      )}

      {/* Step 2: Map columns */}
      {step === 2 && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 16 }}>
            Map columns from <em>{file?.name}</em>
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 14 }}>
            <thead>
              <tr>
                {['Field', 'Required', 'CSV column'].map(h => (
                  <th key={h} style={{
                    padding: '8px 12px', textAlign: 'left', fontSize: 11,
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: 'var(--hubba-text-muted)', borderBottom: '2px solid var(--hubba-border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields.map(field => (
                <tr key={field.key} style={{ borderBottom: '1px solid var(--hubba-border)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 500 }}>{field.label}</td>
                  <td style={{ padding: '10px 12px' }}>
                    {field.required
                      ? <span style={{ color: 'var(--hubba-danger)', fontWeight: 600 }}>Required</span>
                      : <span style={{ color: 'var(--hubba-text-muted)' }}>Optional</span>
                    }
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <select
                      className="input"
                      style={{ width: '100%' }}
                      value={columnMap[field.key] || ''}
                      onChange={e => setColumnMap(prev => ({ ...prev, [field.key]: e.target.value }))}
                    >
                      <option value="">— Skip —</option>
                      {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Preview rows */}
          <div style={{ marginBottom: 24 }}>
            <div className="label" style={{ marginBottom: 8 }}>Preview (first 5 rows)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    {fields.filter(f => columnMap[f.key]).map(f => (
                      <th key={f.key} style={{
                        padding: '6px 10px', textAlign: 'left',
                        background: 'var(--hubba-surface-2)', fontWeight: 600,
                      }}>{f.label}</th>
                    ))}
                    <th style={{ padding: '6px 10px', background: 'var(--hubba-surface-2)' }}>Valid</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} style={{
                      borderBottom: '1px solid var(--hubba-border)',
                      background: hasErrors(row) ? '#fff5f5' : 'white',
                    }}>
                      {fields.filter(f => columnMap[f.key]).map(f => (
                        <td key={f.key} style={{ padding: '6px 10px' }}>{getMappedValue(row, f.key)}</td>
                      ))}
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        {hasErrors(row) ? '⚠️' : '✓'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 12, color: 'var(--hubba-text-muted)', marginTop: 8 }}>
              {rows.length} rows detected · {rows.filter(r => !hasErrors(r)).length} ready to import
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button
              className="btn-primary"
              onClick={handleImport}
              disabled={importing || requiredFields.some(f => !columnMap[f.key])}
            >
              {importing ? 'Importing…' : `Import ${rows.length} rows`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 3 && (
        <div>
          {result?.error ? (
            <div style={{
              background: '#fff5f5', border: '1px solid #fed7d7',
              borderRadius: 8, padding: 20, marginBottom: 24,
            }}>
              <div style={{ fontWeight: 600, color: 'var(--hubba-danger)', marginBottom: 4 }}>Import failed</div>
              <div style={{ fontSize: 14 }}>{result.error}</div>
            </div>
          ) : (
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac',
              borderRadius: 8, padding: 20, marginBottom: 24,
            }}>
              <div style={{ fontWeight: 600, color: 'var(--hubba-success)', marginBottom: 12, fontSize: 16 }}>
                Import complete
              </div>
              <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
                <div><strong>{result.created}</strong> created</div>
                <div><strong>{result.updated}</strong> updated</div>
                <div><strong>{result.skipped}</strong> skipped</div>
              </div>
              {result.errors?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: 'var(--hubba-warning)', fontSize: 13, marginBottom: 6 }}>
                    {result.errors.length} rows had errors
                  </div>
                  <button onClick={downloadErrors} className="btn-secondary" style={{ fontSize: 13 }}>
                    ↓ Download error report
                  </button>
                </div>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={() => { setStep(1); setFile(null); setResult(null) }}>
              Import another file
            </button>
            {onDone && (
              <button className="btn-primary" onClick={onDone}>Done</button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

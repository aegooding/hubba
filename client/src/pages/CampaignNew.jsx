import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import api from '../lib/api'
import { useBrand } from '../context/BrandContext'

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'SUBMITTED', 'APPROVED', 'CONVERTED', 'LOST']
const SOURCES = ['web-form', 'referral', 'facebook', 'google', 'phone', 'manual', 'csv-import', 'webhook']

function StepIndicator({ step }) {
  const steps = ['Compose', 'Audience', 'Review & Send']
  return (
    <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
      {steps.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700,
            background: step > i + 1 ? 'var(--hubba-success)' : step === i + 1 ? 'var(--hubba-amber)' : 'var(--hubba-surface-2)',
            color: step > i + 1 ? 'white' : step === i + 1 ? 'var(--hubba-black)' : 'var(--hubba-text-muted)',
          }}>{step > i + 1 ? '✓' : i + 1}</div>
          <span style={{
            marginLeft: 8, fontSize: 13, fontWeight: 500,
            color: step === i + 1 ? 'var(--hubba-text)' : 'var(--hubba-text-muted)',
          }}>{label}</span>
          {i < 2 && <div style={{ flex: 1, height: 1, background: 'var(--hubba-border)', margin: '0 12px' }} />}
        </div>
      ))}
    </div>
  )
}

export default function CampaignNew() {
  const navigate = useNavigate()
  const { id: editId } = useParams()
  const { activeBrand } = useBrand()

  const [step, setStep] = useState(1)
  const [brands, setBrands] = useState([])
  const [referrers, setReferrers] = useState([])
  const [templateList, setTemplateList] = useState([])
  const [mobilePreview, setMobilePreview] = useState(false)
  const [audienceCount, setAudienceCount] = useState(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testSent, setTestSent] = useState(false)
  const [campaignId, setCampaignId] = useState(editId || null)
  const [toast, setToast] = useState(null)
  const previewRef = useRef()
  const htmlFileRef = useRef()
  const [htmlDragOver, setHtmlDragOver] = useState(false)
  const [editorMode, setEditorMode] = useState('visual') // 'visual' | 'html'
  const [visualReady, setVisualReady] = useState(false)

  const [form, setForm] = useState({
    brandId: activeBrand.slug !== 'all' ? '' : '',
    name: '',
    subject: '',
    previewText: '',
    htmlBody: '',
    fromName: '',
    fromEmail: '',
    replyTo: '',
    segmentRules: { status: [], source: '', referrerId: '' },
  })

  function set(field, val) { setForm(prev => ({ ...prev, [field]: val })) }
  function setSegment(field, val) {
    setForm(prev => ({ ...prev, segmentRules: { ...prev.segmentRules, [field]: val } }))
  }

  useEffect(() => {
    Promise.all([
      api.get('/api/brands'),
      api.get('/api/campaigns/templates/list'),
    ]).then(([bRes, tRes]) => {
      setBrands(bRes.data.brands)
      setTemplateList(tRes.data.templates)
      if (!form.brandId && bRes.data.brands.length > 0) {
        const brand = activeBrand.slug !== 'all'
          ? bRes.data.brands.find(b => b.slug === activeBrand.slug) || bRes.data.brands[0]
          : bRes.data.brands[0]
        setForm(prev => ({
          ...prev,
          brandId: brand.id,
          fromName: brand.fromName || brand.name,
          fromEmail: brand.fromEmail || '',
        }))
      }
    }).catch(() => {})

    if (editId) {
      api.get(`/api/campaigns/${editId}`).then(({ data }) => {
        setForm({
          brandId: data.brandId,
          name: data.name,
          subject: data.subject,
          previewText: data.previewText || '',
          htmlBody: data.htmlBody,
          fromName: data.fromName,
          fromEmail: data.fromEmail,
          replyTo: data.replyTo || '',
          segmentRules: data.segmentRules || { status: [], source: '', referrerId: '' },
        })
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (form.brandId) {
      api.get('/api/referrers', { params: { brandId: form.brandId } })
        .then(({ data }) => setReferrers(data.referrers))
        .catch(() => {})
    }
  }, [form.brandId])

  useEffect(() => {
    if (!previewRef.current) return
    const doc = previewRef.current.contentDocument
    if (!doc) return

    const brand = brands.find(b => b.id === form.brandId)
    const brandName = brand?.name || '{{brand_name}}'
    const logoUrl = brand?.logoUrl || ''
    const logoImg = logoUrl
      ? `<img src="${logoUrl}" alt="" style="max-height:48px;display:block;margin-bottom:12px;" />`
      : `<span style="display:block;font-size:22px;font-weight:700;color:white;letter-spacing:-0.5px;margin-bottom:8px;">${brandName}</span>`

    const preview = (form.htmlBody || '<p style="padding:20px;color:#999">HTML preview will appear here…</p>')
      .replace(/\{\{brand_logo\}\}/g, logoImg)
      .replace(/\{\{brand_logo_url\}\}/g, logoUrl)
      .replace(/\{\{brand_name\}\}/g, brandName)
      .replace(/\{\{first_name\}\}/g, 'Preview')
      .replace(/\{\{unsubscribe_url\}\}/g, '#')

    doc.open(); doc.write(preview); doc.close()
  }, [form.htmlBody, form.brandId, brands])

  // Load Unlayer embed script once
  useEffect(() => {
    if (document.getElementById('unlayer-script')) {
      if (window.unlayer && editorMode === 'visual') initUnlayer()
      return
    }
    const script = document.createElement('script')
    script.id = 'unlayer-script'
    script.src = 'https://editor.unlayer.com/embed.js'
    script.onload = () => { if (editorMode === 'visual') initUnlayer() }
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (editorMode === 'visual' && window.unlayer) initUnlayer()
  }, [editorMode])

  function initUnlayer() {
    window.unlayer?.init({
      id: 'hubba-email-editor',
      displayMode: 'email',
      appearance: { theme: 'light' },
    })
    // Sync HTML into form state on every design change
    window.unlayer?.addEventListener('design:updated', () => {
      window.unlayer.exportHtml(({ html }) => {
        if (html) set('htmlBody', html)
      })
    })
    setVisualReady(true)
  }

  function exportVisualHtml() {
    // No-op — HTML is kept in sync via design:updated event
    return Promise.resolve(null)
  }

  function switchToHtml() {
    setEditorMode('html')
  }

  function switchToVisual() {
    setEditorMode('visual')
  }

  function readHtmlFile(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => set('htmlBody', e.target.result)
    reader.readAsText(file)
  }

  function handleHtmlDrop(e) {
    e.preventDefault()
    setHtmlDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
      readHtmlFile(file)
    }
  }

  async function loadTemplate(templateId) {
    try {
      const { data } = await api.get(`/api/campaigns/templates/${templateId}`)
      set('htmlBody', data.html)
      // Auto-switch brand to match template
      const matchingBrand = brands.find(b => b.slug === templateId)
      if (matchingBrand) {
        setForm(prev => ({
          ...prev,
          htmlBody: data.html,
          brandId: matchingBrand.id,
          fromName: matchingBrand.fromName || matchingBrand.name,
          fromEmail: matchingBrand.fromEmail || prev.fromEmail,
        }))
      }
    } catch {}
  }

  async function fetchAudienceCount() {
    try {
      const { data } = await api.post('/api/campaigns/audience-count', {
        brandId: form.brandId,
        segmentRules: {
          status: form.segmentRules.status?.length ? form.segmentRules.status : undefined,
          source: form.segmentRules.source || undefined,
          referrerId: form.segmentRules.referrerId || undefined,
        },
      })
      setAudienceCount(data.count)
    } catch {}
  }

  useEffect(() => {
    if (step === 2) fetchAudienceCount()
  }, [step, form.segmentRules, form.brandId])

  const FALLBACK_HTML = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:32px;max-width:600px;margin:0 auto"><p>Hi {{first_name}},</p><p>Write your message here.</p><p style="font-size:12px;color:#999;margin-top:32px;"><a href="{{unsubscribe_url}}">Unsubscribe</a></p></body></html>`

  async function saveDraft() {
    setSaving(true)
    try {
      const htmlBody = form.htmlBody || FALLBACK_HTML
      const payload = {
        ...form,
        htmlBody,
        segmentRules: {
          status: form.segmentRules.status?.length ? form.segmentRules.status : undefined,
          source: form.segmentRules.source || undefined,
          referrerId: form.segmentRules.referrerId || undefined,
        },
      }
      if (campaignId) {
        await api.patch(`/api/campaigns/${campaignId}`, payload)
        return campaignId
      } else {
        const { data } = await api.post('/api/campaigns', payload)
        setCampaignId(data.id)
        return data.id
      }
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to save')
      return null
    } finally {
      setSaving(false)
    }
  }

  async function handleSendTest() {
    if (!testEmail) return
    try {
      const id = await saveDraft()
      if (!id) return
      await api.post(`/api/campaigns/${id}/test`, { email: testEmail })
      setTestSent(true)
      setTimeout(() => setTestSent(false), 3000)
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Test send failed')
    }
  }

  async function handleSend() {
    setSending(true)
    try {
      const id = await saveDraft()
      if (!id) { setSending(false); return }
      const { data } = await api.post(`/api/campaigns/${id}/send`)
      showToast('success', `Campaign sent to ${data.recipientCount} recipients`)
      setTimeout(() => navigate('/campaigns'), 2000)
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Send failed')
      setSending(false)
    }
  }

  function showToast(type, msg) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 8000)
  }

  function toggleStatus(s) {
    const current = form.segmentRules.status || []
    setSegment('status', current.includes(s) ? current.filter(x => x !== s) : [...current, s])
  }

  const canProceed1 = form.name && form.subject && form.fromName && form.fromEmail && form.brandId &&
    (editorMode === 'visual' || form.htmlBody)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px 28px', borderBottom: '1px solid var(--hubba-border)',
        background: 'white', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <button onClick={() => navigate('/campaigns')} className="btn-ghost">← Campaigns</button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, margin: 0, flex: 1 }}>
          {editId ? 'Edit Campaign' : 'New Campaign'}
        </h1>
        <button onClick={saveDraft} className="btn-secondary" disabled={saving}>
          {saving ? 'Saving…' : 'Save draft'}
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', maxWidth: step === 1 ? '100%' : 800, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        <StepIndicator step={step} />

        {/* ── Step 1: Compose ── */}
        {step === 1 && (
          <div>
            {/* Campaign meta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label className="label">Campaign Name *</label>
                <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="May Newsletter" />
              </div>
              <div>
                <label className="label">Brand *</label>
                <select className="input" value={form.brandId} onChange={e => {
                  const brand = brands.find(b => b.id === e.target.value)
                  set('brandId', e.target.value)
                  if (brand) { set('fromName', brand.fromName || brand.name); set('fromEmail', brand.fromEmail || '') }
                }}>
                  <option value="">Select brand…</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Subject Line *</label>
                <input className="input" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Your May update from Loan Fair" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="label">Preview Text</label>
                <input className="input" value={form.previewText} onChange={e => set('previewText', e.target.value)} placeholder="Short summary shown in inbox preview…" />
              </div>
              <div>
                <label className="label">From Name *</label>
                <input className="input" value={form.fromName} onChange={e => set('fromName', e.target.value)} placeholder="Loan Fair" />
              </div>
              <div>
                <label className="label">From Email *</label>
                <input className="input" type="email" value={form.fromEmail} onChange={e => set('fromEmail', e.target.value)} placeholder="hello@loanfair.com.au" />
              </div>
            </div>

            {/* Editor mode toggle + toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <label className="label" style={{ margin: 0 }}>Email Body *</label>
                {/* Mode toggle */}
                <div style={{ display: 'flex', background: 'var(--hubba-surface-2)', borderRadius: 6, padding: 2 }}>
                  {[['visual', '🎨 Visual'], ['html', '</> HTML']].map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => mode === 'html' ? switchToHtml() : switchToVisual()}
                      style={{
                        padding: '4px 12px', borderRadius: 4, border: 'none',
                        fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        background: editorMode === mode ? 'white' : 'transparent',
                        color: editorMode === mode ? 'var(--hubba-text)' : 'var(--hubba-text-muted)',
                        boxShadow: editorMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >{label}</button>
                  ))}
                </div>
                {/* HTML-mode only controls */}
                {editorMode === 'html' && (
                  <>
                    <select
                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--hubba-border)', fontSize: 13, background: 'white' }}
                      defaultValue=""
                      onChange={e => e.target.value && loadTemplate(e.target.value)}
                    >
                      <option value="">Load template…</option>
                      {templateList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <button type="button" className="btn-secondary" style={{ fontSize: 12, padding: '4px 10px' }}
                      onClick={() => htmlFileRef.current.click()}>
                      ↑ Upload HTML
                    </button>
                    <input ref={htmlFileRef} type="file" accept=".html,.htm" style={{ display: 'none' }}
                      onChange={e => readHtmlFile(e.target.files[0])} />
                  </>
                )}
              </div>
              {editorMode === 'html' && (
                <button onClick={() => setMobilePreview(p => !p)} className="btn-ghost" style={{ fontSize: 13 }}>
                  {mobilePreview ? '🖥 Desktop' : '📱 Mobile'}
                </button>
              )}
            </div>

            {/* Editor area */}
            {editorMode === 'visual' ? (
              <>
                <div style={{ border: '1px solid var(--hubba-border)', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  {!visualReady && (
                    <div style={{
                      position: 'absolute', inset: 0, height: 580,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--hubba-text-muted)', fontSize: 14, background: 'var(--hubba-surface)',
                    }}>
                      Loading visual editor…
                    </div>
                  )}
                  <div id="hubba-email-editor" style={{ height: 580 }} />
                </div>
                {/* Colour controls */}
                {visualReady && (
                  <div style={{ display: 'flex', gap: 20, marginTop: 10, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label className="label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Background</label>
                      <input
                        type="color"
                        defaultValue="#f4f4f4"
                        onChange={e => window.unlayer?.setBodyValues({ backgroundColor: e.target.value })}
                        style={{ width: 36, height: 30, border: '1px solid var(--hubba-border)', borderRadius: 4, cursor: 'pointer', padding: 2 }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label className="label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Container</label>
                      <input
                        type="color"
                        defaultValue="#ffffff"
                        onChange={e => window.unlayer?.setBodyValues({ contentBackgroundColor: e.target.value })}
                        style={{ width: 36, height: 30, border: '1px solid var(--hubba-border)', borderRadius: 4, cursor: 'pointer', padding: 2 }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--hubba-text-muted)' }}>
                      Tip: click any block to edit, drag from the right panel to add content
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', gap: 16, height: 480 }}>
                <div
                  style={{
                    flex: 1, borderRadius: 8, overflow: 'hidden',
                    border: `2px ${htmlDragOver ? 'dashed var(--hubba-amber)' : 'solid var(--hubba-border)'}`,
                    background: htmlDragOver ? 'rgba(251,176,64,0.04)' : undefined,
                    transition: 'border-color 0.15s',
                  }}
                  onDragOver={e => { e.preventDefault(); setHtmlDragOver(true) }}
                  onDragLeave={() => setHtmlDragOver(false)}
                  onDrop={handleHtmlDrop}
                >
                  <Editor
                    language="html"
                    value={form.htmlBody}
                    onChange={val => set('htmlBody', val || '')}
                    theme="vs-light"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: 'off',
                      wordWrap: 'on',
                      scrollBeyondLastLine: false,
                      padding: { top: 12 },
                    }}
                  />
                </div>
                <div style={{
                  width: mobilePreview ? 375 : '50%', flexShrink: 0,
                  border: '1px solid var(--hubba-border)', borderRadius: 8, overflow: 'hidden',
                  transition: 'width 0.2s', display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{
                    background: 'var(--hubba-surface-2)', padding: '6px 12px',
                    fontSize: 11, color: 'var(--hubba-text-muted)', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    Preview {mobilePreview ? '(375px)' : ''}
                  </div>
                  <iframe ref={previewRef} style={{ flex: 1, border: 'none', background: 'white' }} title="email-preview" />
                </div>
              </div>
            )}

            {/* Merge tag hint */}
            {editorMode === 'html' && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--hubba-text-muted)' }}>
                Merge tags:{' '}
                {['{{first_name}}', '{{brand_name}}', '{{brand_logo}}', '{{brand_logo_url}}', '{{unsubscribe_url}}'].map(tag => (
                  <code key={tag} style={{ fontFamily: 'var(--font-mono)', background: 'var(--hubba-surface-2)', padding: '1px 5px', borderRadius: 3, marginRight: 5 }}>{tag}</code>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 20 }}>
              {!canProceed1 && (
                <span style={{ fontSize: 12, color: 'var(--hubba-text-muted)' }}>
                  Missing: {[
                    !form.name && 'Campaign Name',
                    !form.subject && 'Subject',
                    !form.fromName && 'From Name',
                    !form.fromEmail && 'From Email',
                    !form.brandId && 'Brand',
                    editorMode === 'html' && !form.htmlBody && 'HTML Body',
                  ].filter(Boolean).join(', ')}
                </span>
              )}
              <button
                className="btn-primary"
                onClick={() => setStep(2)}
                disabled={!canProceed1}
              >
                Next: Audience →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Audience ── */}
        {step === 2 && (
          <div>
            <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>Segment rules</h3>
                <div style={{
                  fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)',
                  color: audienceCount === null ? 'var(--hubba-text-muted)' : 'var(--hubba-amber)',
                }}>
                  {audienceCount === null ? '…' : audienceCount}
                  <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--hubba-text-muted)', marginLeft: 6 }}>
                    contacts will receive this
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="label">Lead Status (select any)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {STATUSES.map(s => {
                    const active = (form.segmentRules.status || []).includes(s)
                    return (
                      <button key={s} onClick={() => toggleStatus(s)} style={{
                        padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', border: '2px solid',
                        borderColor: active ? 'var(--hubba-amber)' : 'var(--hubba-border)',
                        background: active ? 'var(--hubba-amber)' : 'white',
                        color: active ? 'var(--hubba-black)' : 'var(--hubba-text-muted)',
                        transition: 'all 0.15s',
                      }}>{s}</button>
                    )
                  })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--hubba-text-muted)', marginTop: 4 }}>
                  Leave empty to include all statuses.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="label">Source</label>
                  <select className="input" value={form.segmentRules.source || ''} onChange={e => setSegment('source', e.target.value)}>
                    <option value="">Any source</option>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Referrer</label>
                  <select className="input" value={form.segmentRules.referrerId || ''} onChange={e => setSegment('referrerId', e.target.value)}>
                    <option value="">Any referrer</option>
                    {referrers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {audienceCount === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--hubba-text-muted)' }}>
                    No matching contacts — you can still proceed, but the send may fail.
                  </span>
                )}
                <button className="btn-primary" onClick={() => setStep(3)}
                  disabled={audienceCount === null}>
                  Next: Review & Send →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Review & Send ── */}
        {step === 3 && (
          <div>
            {/* Summary */}
            <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontFamily: 'var(--font-display)', fontSize: 18 }}>Campaign summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                {[
                  ['Name', form.name],
                  ['Brand', brands.find(b => b.id === form.brandId)?.name],
                  ['Subject', form.subject],
                  ['From', `${form.fromName} <${form.fromEmail}>`],
                  ['Recipients', audienceCount !== null ? `${audienceCount} contacts` : '…'],
                  ['Statuses', form.segmentRules.status?.length ? form.segmentRules.status.join(', ') : 'All'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="label">{label}</div>
                    <div style={{ fontWeight: 500 }}>{value || '—'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test send */}
            <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Send a test</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn-secondary"
                  onClick={handleSendTest}
                  disabled={!testEmail || saving}
                >
                  {testSent ? '✓ Sent!' : 'Send test'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
              <button
                className="btn-primary"
                onClick={handleSend}
                disabled={sending || audienceCount === 0}
                style={{ padding: '10px 28px', fontSize: 15 }}
              >
                {sending ? 'Sending…' : `Send to ${audienceCount ?? '…'} contacts`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          padding: '12px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500,
          background: toast.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: toast.type === 'success' ? '#065f46' : '#991b1b',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

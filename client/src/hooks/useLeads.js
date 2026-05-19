import { useState, useEffect, useCallback } from 'react'
import api from '../lib/api'
import { useBrand } from '../context/BrandContext'

export function useLeads(filters = {}) {
  const { activeBrand } = useBrand()
  const [leads, setLeads] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { ...filters }
      if (activeBrand.slug !== 'all') params.brandId = activeBrand.slug
      const { data } = await api.get('/api/leads', { params })
      setLeads(data.leads)
      setTotal(data.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [activeBrand.slug, JSON.stringify(filters)])

  useEffect(() => { fetch() }, [fetch])

  const updateLeadStatus = useCallback(async (leadId, newStatus, oldStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
    try {
      await api.patch(`/api/leads/${leadId}`, { status: newStatus })
      await api.post(`/api/leads/${leadId}/activities`, {
        type: 'status_change',
        meta: { from: oldStatus, to: newStatus },
      })
    } catch {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: oldStatus } : l))
    }
  }, [])

  return { leads, total, loading, error, refetch: fetch, updateLeadStatus, setLeads }
}

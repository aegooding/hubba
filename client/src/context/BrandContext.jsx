import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const ALL_BRANDS = { id: 'all', name: 'All Brands', slug: 'all' }

const BrandContext = createContext(null)

export function BrandProvider({ children }) {
  const [brands, setBrands] = useState([ALL_BRANDS])
  const [activeBrand, setActiveBrandState] = useState(() => {
    const saved = localStorage.getItem('hubba-active-brand')
    return saved ? JSON.parse(saved) : ALL_BRANDS
  })

  useEffect(() => {
    api.get('/api/brands').then(({ data }) => {
      const list = [ALL_BRANDS, ...data.brands]
      setBrands(list)
      // Re-sync active brand with real ID from server
      setActiveBrandState(prev => {
        if (prev.id === 'all') return prev
        const match = data.brands.find(b => b.slug === prev.slug)
        if (match) {
          const updated = { ...prev, id: match.id }
          localStorage.setItem('hubba-active-brand', JSON.stringify(updated))
          return updated
        }
        return prev
      })
    }).catch(() => {})
  }, [])

  const setActiveBrand = (brand) => {
    setActiveBrandState(brand)
    localStorage.setItem('hubba-active-brand', JSON.stringify(brand))
  }

  return (
    <BrandContext.Provider value={{ activeBrand, setActiveBrand, brands }}>
      {children}
    </BrandContext.Provider>
  )
}

export const useBrand = () => useContext(BrandContext)

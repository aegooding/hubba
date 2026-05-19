import { createContext, useContext, useState, useEffect } from 'react'

const BRANDS = [
  { id: 'all', name: 'All Brands', slug: 'all' },
  { id: 'loan-fair', name: 'Loan Fair', slug: 'loan-fair' },
  { id: 'klasp', name: 'klasp', slug: 'klasp' },
]

const BrandContext = createContext(null)

export function BrandProvider({ children }) {
  const [activeBrand, setActiveBrandState] = useState(() => {
    const saved = localStorage.getItem('hubba-active-brand')
    return saved ? JSON.parse(saved) : BRANDS[0]
  })

  const setActiveBrand = (brand) => {
    setActiveBrandState(brand)
    localStorage.setItem('hubba-active-brand', JSON.stringify(brand))
  }

  return (
    <BrandContext.Provider value={{ activeBrand, setActiveBrand, brands: BRANDS }}>
      {children}
    </BrandContext.Provider>
  )
}

export const useBrand = () => useContext(BrandContext)

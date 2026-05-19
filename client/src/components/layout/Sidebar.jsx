import { NavLink } from 'react-router-dom'
import { useBrand } from '../../context/BrandContext'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../assets/Logo.svg'

const NAV_ITEMS = [
  { to: '/leads', label: 'Leads', icon: '◈' },
  { to: '/contacts', label: 'Contacts', icon: '◉' },
  { to: '/campaigns', label: 'Campaigns', icon: '◆' },
  { to: '/referrers', label: 'Referrers', icon: '◇' },
  { to: '/settings', label: 'Settings', icon: '◎' },
]

export default function Sidebar() {
  const { activeBrand, setActiveBrand, brands } = useBrand()
  const { signOut } = useAuth()

  return (
    <aside style={{
      width: 240,
      minWidth: 240,
      background: 'var(--hubba-black)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <img src={Logo} alt="Hubba" style={{ height: 36, display: 'block' }} />
      </div>

      {/* Brand switcher */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <select
          value={activeBrand.slug}
          onChange={(e) => setActiveBrand(brands.find(b => b.slug === e.target.value))}
          style={{
            width: '100%',
            padding: '7px 10px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6,
            color: 'rgba(255,255,255,0.85)',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {brands.map(b => (
            <option key={b.slug} value={b.slug}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            style={{ marginBottom: 2 }}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={signOut}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 6,
            color: 'rgba(255,255,255,0.45)',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}

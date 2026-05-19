import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppShell() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{
        marginLeft: 240,
        flex: 1,
        minHeight: '100vh',
        background: 'var(--hubba-surface)',
        overflow: 'auto',
      }}>
        <Outlet />
      </main>
    </div>
  )
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BrandProvider } from './context/BrandContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Leads from './pages/Leads'
import Contacts from './pages/Contacts'
import ContactsImport from './pages/ContactsImport'
import Campaigns from './pages/Campaigns'
import CampaignNew from './pages/CampaignNew'
import CampaignAnalytics from './pages/CampaignAnalytics'
import Referrers from './pages/Referrers'
import ReferrerDetail from './pages/ReferrerDetail'
import Settings from './pages/Settings'
import Unsubscribe from './pages/Unsubscribe'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BrandProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />

            <Route path="/" element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/leads" replace />} />
              <Route path="leads" element={<Leads />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="contacts/import" element={<ContactsImport />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="campaigns/new" element={<CampaignNew />} />
              <Route path="campaigns/:id" element={<CampaignAnalytics />} />
              <Route path="campaigns/:id/edit" element={<CampaignNew />} />
              <Route path="referrers" element={<Referrers />} />
              <Route path="referrers/:id" element={<ReferrerDetail />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrandProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

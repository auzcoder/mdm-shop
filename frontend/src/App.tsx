import { Navigate, Route, Routes } from 'react-router-dom'

import Layout from './components/Layout'
import { useAuth } from './lib/auth'
import Audit from './pages/Audit'
import Calculator from './pages/Calculator'
import ContractNew from './pages/ContractNew'
import CustomerEdit from './pages/CustomerEdit'
import CustomerNew from './pages/CustomerNew'
import Customers from './pages/Customers'
import Dashboard from './pages/Dashboard'
import DeviceDetail from './pages/DeviceDetail'
import DeviceNew from './pages/DeviceNew'
import Devices from './pages/Devices'
import Collection from './pages/Collection'
import GoogleCallback from './pages/GoogleCallback'
import Login from './pages/Login'
import Models from './pages/Models'
import Payments from './pages/Payments'
import PaymentDetail from './pages/PaymentDetail'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import UserEdit from './pages/UserEdit'
import UserNew from './pages/UserNew'
import Users from './pages/Users'
import AppleConfiguratorGuide from './pages/AppleConfiguratorGuide'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { can } = useAuth()
  if (!can('admin')) return <Navigate to="/" replace />
  return <>{children}</>
}

// Modul tartibi — o'chirilgan modulga kirilganda birinchi OCHIQ modulga
// yo'naltirish uchun (loop bo'lmasligi uchun joriy modul chiqarib tashlanadi).
const MODULE_ROUTES: { path: string; feature: string }[] = [
  { path: '/', feature: 'dashboard' },
  { path: '/devices', feature: 'devices' },
  { path: '/customers', feature: 'customers' },
  { path: '/payments', feature: 'payments' },
  { path: '/collection', feature: 'collection' },
  { path: '/calculator', feature: 'calculator' },
  { path: '/reports', feature: 'reports' },
  { path: '/models', feature: 'models' },
  { path: '/audit', feature: 'audit' },
  { path: '/settings', feature: 'settings' },
]

function RequireFeature({ feature, children }: { feature: string; children: React.ReactNode }) {
  const { hasFeature } = useAuth()
  if (!hasFeature(feature)) {
    const fallback = MODULE_ROUTES.find((m) => m.feature !== feature && hasFeature(m.feature))
    // Hech qaysi modul ochiq bo'lmasa, feature'siz yordam sahifasiga.
    return <Navigate to={fallback?.path ?? '/help/apple-configurator'} replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/google/oauth/callback" element={<GoogleCallback />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<RequireFeature feature="dashboard"><Dashboard /></RequireFeature>} />
        <Route path="/devices" element={<RequireFeature feature="devices"><Devices /></RequireFeature>} />
        <Route path="/devices/new" element={<RequireFeature feature="devices"><DeviceNew /></RequireFeature>} />
        <Route path="/devices/:id" element={<RequireFeature feature="devices"><DeviceDetail /></RequireFeature>} />
        <Route path="/devices/:id/contract/new" element={<RequireFeature feature="devices"><ContractNew /></RequireFeature>} />
        <Route path="/customers" element={<RequireFeature feature="customers"><Customers /></RequireFeature>} />
        <Route path="/customers/new" element={<RequireFeature feature="customers"><CustomerNew /></RequireFeature>} />
        <Route path="/customers/:id/edit" element={<RequireFeature feature="customers"><CustomerEdit /></RequireFeature>} />
        <Route path="/payments" element={<RequireFeature feature="payments"><Payments /></RequireFeature>} />
        <Route path="/payments/:id" element={<RequireFeature feature="payments"><PaymentDetail /></RequireFeature>} />
        <Route path="/collection" element={<RequireFeature feature="collection"><Collection /></RequireFeature>} />
        <Route path="/calculator" element={<RequireFeature feature="calculator"><Calculator /></RequireFeature>} />
        <Route path="/reports" element={<RequireFeature feature="reports"><Reports /></RequireFeature>} />
        <Route path="/reports/:reportId" element={<RequireFeature feature="reports"><Reports /></RequireFeature>} />
        <Route path="/models" element={<RequireFeature feature="models"><Models /></RequireFeature>} />
        <Route path="/audit" element={<RequireFeature feature="audit"><Audit /></RequireFeature>} />
        <Route path="/settings" element={<RequireFeature feature="settings"><Settings /></RequireFeature>} />
        <Route path="/help/apple-configurator" element={<AppleConfiguratorGuide />} />
        <Route
          path="/users"
          element={
            <RequireAdmin>
              <RequireFeature feature="users">
                <Users />
              </RequireFeature>
            </RequireAdmin>
          }
        />
        <Route
          path="/users/new"
          element={
            <RequireAdmin>
              <RequireFeature feature="users">
                <UserNew />
              </RequireFeature>
            </RequireAdmin>
          }
        />
        <Route
          path="/users/:id/edit"
          element={
            <RequireAdmin>
              <RequireFeature feature="users">
                <UserEdit />
              </RequireFeature>
            </RequireAdmin>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

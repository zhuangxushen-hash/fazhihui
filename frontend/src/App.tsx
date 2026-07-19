import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import LeadManagement from './pages/LeadManagement'
import CaseManagement from './pages/CaseManagement'
import ComplianceManagement from './pages/ComplianceManagement'
import ComplianceCenter from './pages/ComplianceCenter'
import FinanceManagement from './pages/FinanceManagement'
import UserManagement from './pages/UserManagement'
import AITools from './pages/AITools'
import ClientHome from './pages/client/ClientHome'
import AIConsult from './pages/client/AIConsult'
import Complaint from './pages/client/Complaint'
import Payment from './pages/client/Payment'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" />
  }
  return <Layout>{children}</Layout>
}

const ClientRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" />
  }
  return <>{children}</>
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/leads" element={<ProtectedRoute><LeadManagement /></ProtectedRoute>} />
        <Route path="/cases" element={<ProtectedRoute><CaseManagement /></ProtectedRoute>} />
        <Route path="/compliance" element={<ProtectedRoute><ComplianceManagement /></ProtectedRoute>} />
        <Route path="/compliance-center" element={<ProtectedRoute><ComplianceCenter /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute><FinanceManagement /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/ai-tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
        <Route path="/client" element={<ClientRoute><ClientHome /></ClientRoute>} />
        <Route path="/client/ai-consult" element={<ClientRoute><AIConsult /></ClientRoute>} />
        <Route path="/client/complaint" element={<ClientRoute><Complaint /></ClientRoute>} />
        <Route path="/client/payment" element={<ClientRoute><Payment /></ClientRoute>} />
      </Routes>
    </Router>
  )
}

export default App

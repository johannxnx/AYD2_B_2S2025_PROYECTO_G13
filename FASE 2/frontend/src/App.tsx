// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Principal from './pages/Principal/Principal';
import TiposRegistro from './pages/Registro/TiposRegistro';
import Login from './pages/Principal/Login';
import PrincipalClient from './pages/client/PrincipalClient';
import ClientContracts from './pages/client/ClientContracts';
import ClientContractDetail from './pages/client/ClientContractDetail';
import ClienteFacturasPage from './pages/client/ClienteFacturasPage';
import ClientePagosPage from './pages/client/ClientePagosPage';
import PrincipalLogistico from './pages/logistico/PrincipalLogistico';
import ContratosList from './pages/logistico/ContratosList';
import ContratoForm from './pages/logistico/ContratoForm';
import ContratoDetail from './pages/logistico/ContratoDetail';
import ProtectedRoute from './components/auth/ProtectedRoute';
import FacturacionPage from './pages/finanzas/FacturacionPage';
import PagosPage from './pages/finanzas/PagosPage';
import DashboardGerencial from './pages/finanzas/DashboardGerencial';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Principal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro/tipos" element={<TiposRegistro />} />

          {/* ── Cliente ── */}
          <Route
            path="/client/dashboard"
            element={
              <ProtectedRoute allowedRoles={['client', 'cliente']}>
                <PrincipalClient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/contracts"
            element={
              <ProtectedRoute allowedRoles={['client', 'cliente']}>
                <ClientContracts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/contracts/:id"
            element={
              <ProtectedRoute allowedRoles={['client', 'cliente']}>
                <ClientContractDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/orders"
            element={
              <ProtectedRoute allowedRoles={['client', 'cliente']}>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-700">Órdenes de Servicio</h2>
                    <p className="text-gray-500 mt-2">Próximamente disponible</p>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/invoices"
            element={
              <ProtectedRoute allowedRoles={['client', 'cliente']}>
                <ClienteFacturasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/payments"
            element={
              <ProtectedRoute allowedRoles={['client', 'cliente']}>
                <ClientePagosPage />
              </ProtectedRoute>
            }
          />

          {/* ── Logístico ── */}
          <Route
            path="/logistico/dashboard"
            element={
              <ProtectedRoute allowedRoles={['logistic', 'logistico', 'operativo', 'admin']}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/contratos"
            element={
              <ProtectedRoute allowedRoles={['logistic', 'logistico', 'operativo', 'admin']}>
                <ContratosList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/contratos/nuevo"
            element={
              <ProtectedRoute allowedRoles={['logistic', 'logistico', 'operativo', 'admin']}>
                <ContratoForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/contratos/:id"
            element={
              <ProtectedRoute allowedRoles={['logistic', 'logistico', 'operativo', 'admin']}>
                <ContratoDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/contratos/:id/editar"
            element={
              <ProtectedRoute allowedRoles={['logistic', 'logistico', 'operativo', 'admin']}>
                <ContratoForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/ordenes"
            element={
              <ProtectedRoute allowedRoles={['logistic', 'logistico', 'operativo', 'admin']}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/asignaciones"
            element={
              <ProtectedRoute allowedRoles={['logistic', 'logistico', 'operativo', 'admin']}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/clientes"
            element={
              <ProtectedRoute allowedRoles={['logistic', 'logistico', 'operativo', 'admin']}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/reportes"
            element={
              <ProtectedRoute allowedRoles={['logistic', 'logistico', 'operativo', 'admin']}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/rutas"
            element={
              <ProtectedRoute allowedRoles={['logistic', 'logistico', 'operativo', 'admin']}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/vehiculos"
            element={
              <ProtectedRoute allowedRoles={['logistic', 'logistico', 'operativo', 'admin']}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/seguimiento"
            element={
              <ProtectedRoute allowedRoles={['logistic', 'logistico', 'operativo', 'admin']}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />

          {/* ── Finanzas ── */}
          <Route
            path="/finanzas/facturacion"
            element={
              <ProtectedRoute allowedRoles={['finanzas', 'gerencia', 'admin']}>
                <FacturacionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finanzas/pagos"
            element={
              <ProtectedRoute allowedRoles={['finanzas', 'gerencia', 'admin']}>
                <PagosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finanzas/dashboard"
            element={
              <ProtectedRoute allowedRoles={['finanzas', 'gerencia', 'admin']}>
                <DashboardGerencial />
              </ProtectedRoute>
            }
          />

          {/* ── 404 ── */}
          <Route
            path="*"
            element={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-300">404</h1>
                  <h2 className="text-xl font-semibold text-gray-700 mt-4">Página no encontrada</h2>
                  <p className="text-gray-500 mt-2">La página que buscas no existe</p>
                  <a href="/" className="mt-6 inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                    Volver al inicio
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
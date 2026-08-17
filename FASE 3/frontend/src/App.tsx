import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Principal from "./pages/Principal/Principal";
import TiposRegistro from "./pages/Registro/TiposRegistro";
import Login from "./pages/Principal/Login";
import PrincipalClient from "./pages/client/PrincipalClient";
import ClientContracts from "./pages/client/ClientContracts";
import ClientContractDetail from "./pages/client/ClientContractDetail";
import ClienteFacturasPage from "./pages/client/ClienteFacturasPage";
import ClientePagosPage from "./pages/client/ClientePagosPage";
import PrincipalLogistico from "./pages/logistico/PrincipalLogistico";
import ContratosList from "./pages/logistico/ContratosList";
import ContratoForm from "./pages/logistico/ContratoForm";
import ContratoDetail from "./pages/logistico/ContratoDetail";
import ClientesList from "./pages/logistico/ClientesList";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import FacturacionPage from "./pages/finanzas/FacturacionPage";
import PagosPage from "./pages/finanzas/PagosPage";
import TarifasPage from "./pages/finanzas/TarifasPage";
import DashboardGerencial from "./pages/gerencia/DashboardGerencial";
import BitacoraOrdenes from "./pages/gerencia/BitacoraOrdenes";
import DashboardFinanzas from "./pages/finanzas/DashboardFinanzas";
import CobrosPage from "./pages/finanzas/CobrosPage";
import { AuthProvider } from "./context/AuthContext";
import ClienteOrdenesPage from "./pages/client/ClientOrdenesPage";
import OperativoPrincipal from "./pages/Operativo/OperativoPrincipal";

// Imports de Piloto
import PrincipalPiloto from "./pages/piloto/PrincipalPiloto";
import IniciarViaje from "./pages/piloto/IniciarViaje";
import FinalizarEntrega from "./pages/piloto/FinalizarEntrega";
import ReportarEvento from "./pages/piloto/ReportarEvento";
import OrdenDetalle from "./pages/piloto/OrdenDetalle";
import MisOrdenes from "./pages/piloto/MisOrdenes";
import EnTransito from "./pages/piloto/EnTransito";
import Historial from "./pages/piloto/Historial";

// Import de Patio (solo el dashboard principal
import PrincipalPatio from "./pages/patio/PrincipalPatio";

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
              <ProtectedRoute allowedRoles={["client", "cliente"]}>
                <PrincipalClient />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/contracts"
            element={
              <ProtectedRoute allowedRoles={["client", "cliente"]}>
                <ClientContracts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/contracts/:id"
            element={
              <ProtectedRoute allowedRoles={["client", "cliente"]}>
                <ClientContractDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/orders"
            element={
              <ProtectedRoute allowedRoles={["client", "cliente"]}>
                <ClienteOrdenesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/invoices"
            element={
              <ProtectedRoute allowedRoles={["client", "cliente"]}>
                <ClienteFacturasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/payments"
            element={
              <ProtectedRoute allowedRoles={["client", "cliente"]}>
                <ClientePagosPage />
              </ProtectedRoute>
            }
          />

          {/* ── Operativo ── */}
          <Route
            path="/operativo/dashboard"
            element={
              <ProtectedRoute allowedRoles={["operativo"]}>
                <OperativoPrincipal />
              </ProtectedRoute>
            }
          />

          {/* ── Logístico ── */}
          <Route
            path="/logistico/dashboard"
            element={
              <ProtectedRoute allowedRoles={["logistic", "logistico", "admin"]}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/contratos"
            element={
              <ProtectedRoute allowedRoles={["logistic", "logistico", "admin"]}>
                <ContratosList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/contratos/nuevo"
            element={
              <ProtectedRoute allowedRoles={["logistic", "logistico", "admin"]}>
                <ContratoForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/contratos/:id"
            element={
              <ProtectedRoute allowedRoles={["logistic", "logistico", "admin"]}>
                <ContratoDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/contratos/:id/editar"
            element={
              <ProtectedRoute allowedRoles={["logistic", "logistico", "admin"]}>
                <ContratoForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/ordenes"
            element={
              <ProtectedRoute allowedRoles={["logistic", "logistico", "admin"]}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/asignaciones"
            element={
              <ProtectedRoute allowedRoles={["logistic", "logistico", "admin"]}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/clientes"
            element={
              <ProtectedRoute allowedRoles={["logistic", "logistico", "admin"]}>
                <ClientesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/reportes"
            element={
              <ProtectedRoute allowedRoles={["logistic", "logistico", "admin"]}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/rutas"
            element={
              <ProtectedRoute allowedRoles={["logistic", "logistico", "admin"]}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/vehiculos"
            element={
              <ProtectedRoute allowedRoles={["logistic", "logistico", "admin"]}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logistico/seguimiento"
            element={
              <ProtectedRoute allowedRoles={["logistic", "logistico", "admin"]}>
                <PrincipalLogistico />
              </ProtectedRoute>
            }
          />

          {/* ── Finanzas ── */}
          <Route
            path="/finanzas/facturacion"
            element={
              <ProtectedRoute allowedRoles={["finanzas", "gerencia", "admin"]}>
                <FacturacionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finanzas/pagos"
            element={
              <ProtectedRoute allowedRoles={["finanzas", "gerencia", "admin"]}>
                <PagosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finanzas/dashboard"
            element={
              <ProtectedRoute allowedRoles={["finanzas", "gerencia", "admin"]}>
                <DashboardFinanzas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/finanzas/cobros"
            element={
              <ProtectedRoute allowedRoles={["finanzas", "gerencia", "admin"]}>
                <CobrosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finanzas/tarifaz"
            element={
              <ProtectedRoute allowedRoles={["finanzas", "gerencia", "admin"]}>
                <TarifasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/Gerencia/dashboad"
            element={
              <ProtectedRoute allowedRoles={["gerencia", "admin"]}>
                <DashboardGerencial />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Gerencia/bitacora"
            element={
              <ProtectedRoute allowedRoles={["gerencia", "admin"]}>
                <BitacoraOrdenes />
              </ProtectedRoute>
            }
          />

          {/* ── Piloto ── */}
          <Route
            path="/piloto/dashboard"
            element={
              <ProtectedRoute allowedRoles={["piloto"]}>
                <PrincipalPiloto />
              </ProtectedRoute>
            }
          />
          <Route
            path="/piloto/ordenes"
            element={
              <ProtectedRoute allowedRoles={["piloto"]}>
                <MisOrdenes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/piloto/en-transito"
            element={
              <ProtectedRoute allowedRoles={["piloto"]}>
                <EnTransito />
              </ProtectedRoute>
            }
          />
          <Route
            path="/piloto/historial"
            element={
              <ProtectedRoute allowedRoles={["piloto"]}>
                <Historial />
              </ProtectedRoute>
            }
          />
          <Route
            path="/piloto/orden/:id"
            element={
              <ProtectedRoute allowedRoles={["piloto"]}>
                <OrdenDetalle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/piloto/orden/:id/iniciar-viaje"
            element={
              <ProtectedRoute allowedRoles={["piloto"]}>
                <IniciarViaje />
              </ProtectedRoute>
            }
          />
          <Route
            path="/piloto/orden/:id/finalizar"
            element={
              <ProtectedRoute allowedRoles={["piloto"]}>
                <FinalizarEntrega />
              </ProtectedRoute>
            }
          />
          <Route
            path="/piloto/orden/:id/evento"
            element={
              <ProtectedRoute allowedRoles={["piloto"]}>
                <ReportarEvento />
              </ProtectedRoute>
            }
          />

          {/* ── Patio (solo dashboard principal) ── */}
          <Route
            path="/patio/dashboard"
            element={
              <ProtectedRoute allowedRoles={["patio"]}>
                <PrincipalPatio />
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
                  <h2 className="text-xl font-semibold text-gray-700 mt-4">
                    Página no encontrada
                  </h2>
                  <p className="text-gray-500 mt-2">
                    La página que buscas no existe
                  </p>
                  <a
                    href="/"
                    className="mt-6 inline-block px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
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

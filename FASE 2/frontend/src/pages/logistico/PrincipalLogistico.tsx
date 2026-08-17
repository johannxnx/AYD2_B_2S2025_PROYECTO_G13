// src/pages/logistico/PrincipalLogistico.tsx
import React, { useState, useEffect } from 'react';
import { 
  FaTruck, 
  FaClipboardList, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaUser,
  FaFileContract,
  FaChartLine,
  FaSync,
  FaEye,
  FaSearch,
  FaCalculator
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import LogisticHeader from '../../components/logistico/LogisticHeader';
import LogisticMenu from '../../components/logistico/LogisticMenu';
import ValidacionClienteModal from '../../components/logistico/ValidacionClienteModal';
import { useAuth } from '../../context/AuthContext';
import { useContratos } from '../../services/Logistico/hooks/useContratos';
import { formatMoney, formatDate, getContratoEstadoInfo } from '../../services/Logistico/Logistico';
import type { Contrato } from '../../services/api';

interface DashboardStats {
  totalContratos: number;
  contratosVigentes: number;
  contratosVencidos: number;
  contratosCancelados: number;
  totalCreditoDisponible: number;
  totalCreditoUsado: number;
  clientesActivos: number;
}

const PrincipalLogistico: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { todosContratos, listarTodosContratos, loading, error, limpiarError } = useContratos();
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [showValidacionModal, setShowValidacionModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalContratos: 0,
    contratosVigentes: 0,
    contratosVencidos: 0,
    contratosCancelados: 0,
    totalCreditoDisponible: 0,
    totalCreditoUsado: 0,
    clientesActivos: 0
  });

  const userName = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Operador Logístico';

  // Cargar contratos al montar el componente
  useEffect(() => {
    cargarContratos();
  }, []);

  const cargarContratos = async () => {
    await listarTodosContratos();
  };

  // Calcular estadísticas cuando cambian los contratos
  useEffect(() => {
    if (todosContratos.length > 0) {
      const vigentes = todosContratos.filter(c => c.estado === 'VIGENTE');
      const vencidos = todosContratos.filter(c => c.estado === 'VENCIDO');
      const cancelados = todosContratos.filter(c => c.estado === 'CANCELADO');
      
      const totalCredito = vigentes.reduce((sum, c) => sum + (c.limite_credito || 0), 0);
      const totalUsado = vigentes.reduce((sum, c) => sum + (c.saldo_usado || 0), 0);
      const clientesUnicos = new Set(todosContratos.map(c => c.cliente_id)).size;

      setStats({
        totalContratos: todosContratos.length,
        contratosVigentes: vigentes.length,
        contratosVencidos: vencidos.length,
        contratosCancelados: cancelados.length,
        totalCreditoDisponible: totalCredito - totalUsado,
        totalCreditoUsado: totalUsado,
        clientesActivos: clientesUnicos
      });
    } else {
      setStats({
        totalContratos: 0,
        contratosVigentes: 0,
        contratosVencidos: 0,
        contratosCancelados: 0,
        totalCreditoDisponible: 0,
        totalCreditoUsado: 0,
        clientesActivos: 0
      });
    }
  }, [todosContratos]);

  // Filtrar contratos
  const contratosFiltrados = todosContratos.filter(contrato => {
    // Filtro por estado
    if (estadoFiltro !== 'todos' && contrato.estado !== estadoFiltro) {
      return false;
    }
    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        contrato.numero_contrato.toLowerCase().includes(searchLower) ||
        contrato.cliente_nombre?.toLowerCase().includes(searchLower) ||
        contrato.cliente_nit?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Contratos vigentes para mostrar en la tabla principal (top 5)
  const contratosVigentesMostrar = todosContratos
    .filter(c => c.estado === 'VIGENTE')
    .slice(0, 5);

  const StatCard = ({ icon: Icon, title, value, color, subtitle, trend }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const handleVerDetalle = (contratoId: number) => {
    navigate(`/logistico/contratos/${contratoId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LogisticHeader 
        userName={userName}
        userRole="Coordinador de Operaciones"
      />
      <LogisticMenu />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bienvenida */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard Logístico
          </h1>
          <p className="text-gray-600 mt-1">
            Panel de control para gestión de contratos y operaciones de transporte
          </p>
        </div>

        {/* Botón refrescar */}
        <div className="flex justify-end mb-4">
          <button
            onClick={cargarContratos}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
          >
            <FaSync className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={limpiarError} className="text-red-700 hover:text-red-900">
              ×
            </button>
          </div>
        )}

        {loading && todosContratos.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : todosContratos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FaFileContract className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contratos registrados</h3>
            <p className="text-gray-500 mb-4">
              Comience creando el primer contrato
            </p>
            <button
              onClick={() => navigate('/logistico/contratos/nuevo')}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Crear nuevo contrato
            </button>
          </div>
        ) : (
          <>
            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6 mb-8">
              <StatCard
                icon={FaFileContract}
                title="Total Contratos"
                value={stats.totalContratos}
                color="bg-blue-500"
                subtitle="Registrados"
              />
              <StatCard
                icon={FaCheckCircle}
                title="Vigentes"
                value={stats.contratosVigentes}
                color="bg-green-500"
                subtitle="Activos"
              />
              <StatCard
                icon={FaExclamationTriangle}
                title="Vencidos"
                value={stats.contratosVencidos}
                color="bg-red-500"
                subtitle="Requieren renovación"
              />
              <StatCard
                icon={FaChartLine}
                title="Crédito Disponible"
                value={formatMoney(stats.totalCreditoDisponible)}
                color="bg-teal-500"
                subtitle="Para uso"
              />
              <StatCard
                icon={FaTruck}
                title="Crédito Usado"
                value={formatMoney(stats.totalCreditoUsado)}
                color="bg-yellow-500"
                subtitle="En facturas"
              />
              <StatCard
                icon={FaUser}
                title="Clientes Activos"
                value={stats.clientesActivos}
                color="bg-purple-500"
                subtitle="Con contratos"
              />
            </div>

            {/* Acciones rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <button 
                onClick={() => navigate('/logistico/contratos/nuevo')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-sm p-6 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <FaFileContract className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">Nuevo Contrato</h3>
                    <p className="text-sm text-blue-100">Crear contrato para cliente</p>
                    <p className="text-xs text-blue-200 mt-1">Gestionar tarifas y crédito</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/logistico/contratos')}
                className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-sm p-6 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <FaClipboardList className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Todos los Contratos</h3>
                    <p className="text-sm text-green-100">Ver listado completo</p>
                    <p className="text-xs text-green-200 mt-1">{stats.totalContratos} contratos</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => setShowValidacionModal(true)}
                className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl shadow-sm p-6 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <FaCalculator className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Validar Cliente</h3>
                    <p className="text-sm text-teal-100">Verificar autorización de servicio</p>
                    <p className="text-xs text-teal-200 mt-1">Rutas, tarifas y descuentos</p>
                  </div>
                </div>
              </button>
              
              <button className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-sm p-6 hover:shadow-md transition-all text-left group">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <FaMapMarkerAlt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Rutas Activas</h3>
                    <p className="text-sm text-purple-100">Monitorear transporte</p>
                    <p className="text-xs text-purple-200 mt-1">Próximamente</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Búsqueda y filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar por número de contrato, cliente o NIT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="VIGENTE">Vigentes</option>
                    <option value="VENCIDO">Vencidos</option>
                    <option value="CANCELADO">Cancelados</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contratos Vigentes Recientes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Contratos Vigentes Recientes</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Últimos contratos activos registrados
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/logistico/contratos')}
                  className="text-sm text-orange-600 hover:text-orange-800 font-medium flex items-center space-x-1"
                >
                  <span>Ver todos</span>
                  <span>→</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                {contratosVigentesMostrar.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay contratos vigentes registrados
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          N° Contrato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vigencia
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Límite Crédito
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Saldo Usado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Crédito Disp.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contratosVigentesMostrar.map((contrato) => {
                        const saldoUsado = contrato.saldo_usado || 0;
                        const creditoDisponible = contrato.limite_credito - saldoUsado;
                        
                        return (
                          <tr key={contrato.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {contrato.numero_contrato}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{contrato.cliente_nombre}</div>
                              <div className="text-xs text-gray-500">NIT: {contrato.cliente_nit}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <div>{formatDate(contrato.fecha_inicio)}</div>
                              <div className="text-xs text-gray-400">→ {formatDate(contrato.fecha_fin)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatMoney(contrato.limite_credito)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatMoney(saldoUsado)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              {formatMoney(creditoDisponible)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleVerDetalle(contrato.id)}
                                className="text-orange-600 hover:text-orange-900 flex items-center"
                              >
                                <FaEye className="h-4 w-4 mr-1" />
                                Detalles
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Listado de todos los contratos (resumen) */}
            {contratosFiltrados.length > 0 && (
              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Todos los Contratos {estadoFiltro !== 'todos' && `- ${estadoFiltro}`}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Mostrando {contratosFiltrados.length} de {todosContratos.length} contratos
                  </p>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          N° Contrato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Inicio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha Fin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Crédito
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contratosFiltrados.map((contrato) => {
                        const estadoInfo = getContratoEstadoInfo(contrato.estado);
                        return (
                          <tr key={contrato.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {contrato.numero_contrato}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{contrato.cliente_nombre}</div>
                              <div className="text-xs text-gray-500">{contrato.cliente_nit}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(contrato.fecha_inicio)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {formatDate(contrato.fecha_fin)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <div>{formatMoney(contrato.limite_credito)}</div>
                              <div className="text-xs text-gray-400">Usado: {formatMoney(contrato.saldo_usado || 0)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}>
                                {estadoInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleVerDetalle(contrato.id)}
                                className="text-orange-600 hover:text-orange-900"
                              >
                                <FaEye className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de validación de cliente */}
      <ValidacionClienteModal 
        isOpen={showValidacionModal}
        onClose={() => setShowValidacionModal(false)}
      />
    </div>
  );
};

export default PrincipalLogistico;
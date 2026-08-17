// src/pages/logistico/PrincipalLogistico.tsx
import React, { useState, useEffect } from 'react';
import { 
  FaTruck, 
  FaClipboardList, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaUser,
  FaFileContract,
  FaChartLine,
  FaSync,
  FaEye,
  FaSearch
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import LogisticHeader from '../../components/logistico/LogisticHeader';
import LogisticMenu from '../../components/logistico/LogisticMenu';
import { useAuth } from '../../context/AuthContext';
import { useContratos } from '../../services/Logistico/hooks/useContratos';
import { formatMoney, formatDate, getContratoEstadoInfo } from '../../services/Logistico/Logistico';
import { API_BASE_URL } from '../../services/api';


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

  // Cargar contratos y estadísticas al montar el componente
  useEffect(() => {
    cargarContratos();
  }, []);

  const cargarContratos = async () => {
    await listarTodosContratos();
    await cargarEstadisticas();
  };

  // Cargar estadísticas desde el servidor
  const cargarEstadisticas = async () => {
    try {
      const token = localStorage.getItem('authToken');
      console.log('[Frontend] Token disponible:', !!token);
      
      if (!token) {
        console.warn('[Frontend] No token available for fetching statistics');
        return;
      }

      const url = `${API_BASE_URL}/contratos/estadisticas/dashboard`;
      console.log('[Frontend] Llamando a:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[Frontend] Respuesta recibida, status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[Frontend] Datos recibidos:', data);
        
        if (data.ok) {
          console.log('[Frontend] Estableciendo stats:', data.data);
          setStats(data.data);
        }
      } else {
        const errorText = await response.text();
        console.error('[Frontend] Error en respuesta:', response.status, errorText);
      }
    } catch (error) {
      console.error('[Frontend] Error al cargar estadísticas:', error);
    }
  };

  // Calcular estadísticas cuando cambian los contratos (respaldo)
  useEffect(() => {
    if (todosContratos.length > 0) {
      const vigentes = todosContratos.filter(c => c.estado === 'VIGENTE');
      const vencidos = todosContratos.filter(c => c.estado === 'VENCIDO');
      const cancelados = todosContratos.filter(c => c.estado === 'CANCELADO');
      
      const totalCredito = vigentes.reduce((sum, c) => sum + (c.limite_credito || 0), 0);
      const totalUsado = vigentes.reduce((sum, c) => sum + (c.saldo_usado || 0), 0);

      setStats({
        totalContratos: todosContratos.length,
        contratosVigentes: vigentes.length,
        contratosVencidos: vencidos.length,
        contratosCancelados: cancelados.length,
        totalCreditoDisponible: totalCredito - totalUsado,
        totalCreditoUsado: totalUsado,
        clientesActivos: stats.clientesActivos // Mantender valor del servidor
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-2">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Logístico
            </h1>
            <p className="text-gray-600 mt-2">
              Panel de control para gestión de contratos y operaciones de transporte
            </p>
          </div>
          <button
            onClick={cargarContratos}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-all disabled:opacity-50"
          >
            <FaSync className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={limpiarError} className="text-red-700 hover:text-red-900 text-xl">
              ×
            </button>
          </div>
        )}

        {loading && todosContratos.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : todosContratos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
            <FaFileContract className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay contratos registrados</h3>
            <p className="text-gray-500 mb-6">
              Comience creando el primer contrato para gestionar operaciones
            </p>
            <button
              onClick={() => navigate('/logistico/contratos/nuevo')}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
            >
              Crear primer contrato
            </button>
          </div>
        ) : (
          <>
            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
              <StatCard
                icon={FaFileContract}
                title="Total Contratos"
                value={stats.totalContratos}
                color="bg-blue-500"
              />
              <StatCard
                icon={FaCheckCircle}
                title="Vigentes"
                value={stats.contratosVigentes}
                color="bg-green-500"
              />
              <StatCard
                icon={FaExclamationTriangle}
                title="Vencidos"
                value={stats.contratosVencidos}
                color="bg-red-500"
              />
              <StatCard
                icon={FaUser}
                title="Clientes Activos"
                value={stats.clientesActivos}
                color="bg-purple-500"
              />
              <StatCard
                icon={FaChartLine}
                title="Crédito Disponible"
                value={formatMoney(stats.totalCreditoDisponible)}
                color="bg-teal-500"
              />
              <StatCard
                icon={FaTruck}
                title="Crédito Usado"
                value={formatMoney(stats.totalCreditoUsado)}
                color="bg-amber-500"
              />
              <StatCard
                icon={FaFileContract}
                title="Cancelados"
                value={stats.contratosCancelados}
                color="bg-gray-500"
              />
            </div>

            {/* Acciones rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 max-w-2xl mx-auto">
              <button 
                onClick={() => navigate('/logistico/contratos/nuevo')}
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors flex-shrink-0">
                    <FaFileContract className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm">Nuevo Contrato</h3>
                    <p className="text-xs text-blue-100">Crear para cliente</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => navigate('/logistico/contratos')}
                className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors flex-shrink-0">
                    <FaClipboardList className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm">Todos los Contratos</h3>
                    <p className="text-xs text-green-100">{stats.totalContratos} registrados</p>
                  </div>
                </div>
              </button>

            </div>

            {/* Búsqueda y filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar contrato, cliente o NIT..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
                <select
                  value={estadoFiltro}
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="VIGENTE">Vigentes</option>
                  <option value="VENCIDO">Vencidos</option>
                  <option value="CANCELADO">Cancelados</option>
                </select>
              </div>
            </div>

            {/* Contratos Vigentes Recientes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Contratos Vigentes Recientes</h3>
                  <p className="text-sm text-gray-500 mt-1">Últimos contratos activos registrados</p>
                </div>
                <button 
                  onClick={() => navigate('/logistico/contratos')}
                  className="text-sm text-orange-600 hover:text-orange-800 font-semibold flex items-center space-x-1 hover:space-x-2 transition-all"
                >
                  <span>Ver todos</span>
                  <span>→</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                {contratosVigentesMostrar.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FaTruck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p>No hay contratos vigentes</p>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Contrato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Vigencia
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Límite Crédito
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Disponible
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {contratosVigentesMostrar.map((contrato) => {
                        const saldoUsado = contrato.saldo_usado || 0;
                        const creditoDisponible = contrato.limite_credito - saldoUsado;
                        
                        return (
                          <tr key={contrato.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-gray-900">{contrato.numero_contrato}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{contrato.cliente_nombre}</div>
                              <div className="text-xs text-gray-500">{contrato.cliente_nit}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <div className="text-xs">{formatDate(contrato.fecha_inicio)}</div>
                              <div className="text-xs text-gray-400">{formatDate(contrato.fecha_fin)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatMoney(contrato.limite_credito, contrato.nombre_moneda || 'GTQ')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-green-600">
                                {formatMoney(creditoDisponible, contrato.nombre_moneda || 'GTQ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleVerDetalle(contrato.id)}
                                className="text-orange-600 hover:text-orange-900 font-medium flex items-center space-x-1 transition-colors"
                              >
                                <FaEye className="h-3.5 w-3.5" />
                                <span>Detalles</span>
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

            {/* Listado de todos los contratos */}
            {contratosFiltrados.length > 0 && (
              <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Todos los Contratos {estadoFiltro !== 'todos' && `• ${estadoFiltro}`}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Mostrando <span className="font-semibold">{contratosFiltrados.length}</span> de <span className="font-semibold">{todosContratos.length}</span> contratos
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Contrato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Fechas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Crédito
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Acción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {contratosFiltrados.map((contrato) => {
                        const estadoInfo = getContratoEstadoInfo(contrato.estado);
                        return (
                          <tr key={contrato.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-gray-900">{contrato.numero_contrato}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{contrato.cliente_nombre}</div>
                              <div className="text-xs text-gray-500">{contrato.cliente_nit}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              <div className="text-xs">{formatDate(contrato.fecha_inicio)}</div>
                              <div className="text-xs text-gray-400">{formatDate(contrato.fecha_fin)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{formatMoney(contrato.limite_credito, contrato.nombre_moneda || 'GTQ')}</div>
                              <div className="text-xs text-gray-500">Usado: {formatMoney(contrato.saldo_usado || 0, contrato.nombre_moneda || 'GTQ')}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}>
                                {estadoInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleVerDetalle(contrato.id)}
                                className="text-orange-600 hover:text-orange-900 font-medium transition-colors"
                              >
                                Ver detalles
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

    </div>
  );
};

export default PrincipalLogistico;
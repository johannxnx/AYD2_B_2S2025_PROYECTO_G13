// src/pages/logistico/ContratosList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEye, FaEdit, FaSearch, FaFileContract, FaCalendarAlt, FaCoins } from 'react-icons/fa';
import { useContratos } from '../../services/Logistico/hooks/useContratos';
import { formatMoney, formatDate, getContratoEstadoInfo } from '../../services/Logistico/Logistico';
import LogisticHeader from '../../components/logistico/LogisticHeader';
import LogisticMenu from '../../components/logistico/LogisticMenu';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';

// Función para mapear moneda_id a código de moneda
const getCodigoMonedaDesdeId = (moneda_id?: number): string => {
  const monedasMap: Record<number, string> = {
    1: 'GTQ',
    2: 'USD',
    6: 'HNL',
    7: 'SVC'
  };
  return moneda_id ? (monedasMap[moneda_id] || 'GTQ') : 'GTQ';
};

const ContratosList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { todosContratos, listarTodosContratos, loading, error, limpiarError } = useContratos();

  const [clientes, setClientes]               = useState<any[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteId, setClienteId]             = useState<string>('');
  const [searchTerm, setSearchTerm]           = useState('');

  const userName = user?.nombres && user?.apellidos
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Operador Logístico';

  // Cargar todos los contratos al montar el componente
  useEffect(() => {
    listarTodosContratos();
  }, []);

  // Cargar lista de clientes corporativos
  useEffect(() => {
    const cargarClientes = async () => {
      setLoadingClientes(true);
      try {
        const response = await (apiService as any).request(
          '/usuarios?tipo_usuario=CLIENTE_CORPORATIVO',
          { method: 'GET' }
        );
        if (response.ok) {
          setClientes(response.data);
        }
      } catch (err) {
        console.error('Error al cargar clientes:', err);
      } finally {
        setLoadingClientes(false);
      }
    };

    cargarClientes();
  }, []);

  // Filtrar contratos por cliente (si está seleccionado) y búsqueda
  const contratosFiltrados = todosContratos.filter(contrato => {
    // Filtro por cliente
    if (clienteId && contrato.cliente_id !== parseInt(clienteId)) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <LogisticHeader
        userName={userName}
        userRole="Gestión de Contratos"
      />
      <LogisticMenu />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contratos de Transporte</h1>
            <p className="text-gray-600 mt-2">Gestión completa de contratos, tarifas negociadas y crédito disponible</p>
          </div>
          <button
            onClick={() => navigate('/logistico/contratos/nuevo')}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            <FaPlus className="h-4 w-4 mr-2" />
            Nuevo Contrato
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={limpiarError} className="text-red-700 hover:text-red-900 text-xl">×</button>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Combobox de clientes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Cliente (Opcional)
              </label>
              {loadingClientes ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-400 text-sm">
                  Cargando clientes...
                </div>
              ) : (
                <select
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all"
                >
                  <option value="">Ver todos los contratos</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} — NIT: {cliente.nit}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Buscador */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Número de contrato, cliente o NIT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        )}

        {/* Listado de Contratos en Tarjetas */}
        {!loading && (
          <>
            {contratosFiltrados.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <FaFileContract className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-4">
                  {todosContratos.length === 0 
                    ? 'No hay contratos registrados' 
                    : 'No hay contratos que coincidan con tu búsqueda'}
                </p>
                {todosContratos.length === 0 && (
                  <button
                    onClick={() => navigate('/logistico/contratos/nuevo')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    Crear primer contrato
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {contratosFiltrados.map((contrato) => {
                  const estadoInfo = getContratoEstadoInfo(contrato.estado);
                  const saldoUsado = contrato.saldo_usado || 0;
                  const creditoDisponible = contrato.limite_credito - saldoUsado;

                  return (
                    <div
                      key={contrato.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all p-6"
                    >
                      {/* Header de tarjeta */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {contrato.numero_contrato}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {contrato.cliente_nombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            NIT: {contrato.cliente_nit}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}
                        >
                          {estadoInfo.label}
                        </span>
                      </div>

                      {/* Descripción breve */}
                      <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <span className="text-gray-600">Vigencia: </span>
                            <span className="font-medium text-gray-900">
                              {formatDate(contrato.fecha_inicio)} → {formatDate(contrato.fecha_fin)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <FaCoins className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <span className="text-gray-600">Crédito: </span>
                            <span className="font-medium text-gray-900">
                              {formatMoney(contrato.limite_credito, getCodigoMonedaDesdeId(contrato.moneda_id))}
                            </span>
                            <span className="text-gray-600 ml-2">
                              (Usado: {formatMoney(saldoUsado, getCodigoMonedaDesdeId(contrato.moneda_id))})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <FaCoins className="h-4 w-4 text-purple-400" />
                          <div className="text-sm">
                            <span className="text-gray-600">Moneda: </span>
                            <span className="font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
                              {contrato.nombre_moneda || `Moneda ${contrato.moneda_id}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <FaFileContract className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <span className="text-gray-600">Disponible: </span>
                            <span className="font-bold text-green-600">
                              {formatMoney(creditoDisponible, getCodigoMonedaDesdeId(contrato.moneda_id))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex space-x-3">
                        <button
                          onClick={() => navigate(`/logistico/contratos/${contrato.id}`)}
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors font-medium text-sm"
                        >
                          <FaEye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </button>
                        <button
                          onClick={() => navigate(`/logistico/contratos/${contrato.id}/editar`)}
                          className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
                        >
                          <FaEdit className="h-4 w-4 mr-2" />
                          Editar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Resumen de resultados */}
            {!loading && contratosFiltrados.length > 0 && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-sm text-blue-800">
                  Mostrando <span className="font-bold">{contratosFiltrados.length}</span> de <span className="font-bold">{todosContratos.length}</span> contratos
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ContratosList;
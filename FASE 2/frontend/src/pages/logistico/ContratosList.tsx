// src/pages/logistico/ContratosList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEye, FaEdit, FaSearch, FaSync } from 'react-icons/fa';
import { useContratos } from '../../services/Logistico/hooks/useContratos';
import { formatMoney, formatDate, getContratoEstadoInfo } from '../../services/Logistico/Logistico';
import LogisticHeader from '../../components/logistico/LogisticHeader';
import LogisticMenu from '../../components/logistico/LogisticMenu';
import { useAuth } from '../../context/AuthContext';

const ContratosList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contratos, listarContratosCliente, loading, error, limpiarError } = useContratos();
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteId, setClienteId] = useState<string>('');

  const userName = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Operador Logístico';

  const cargarContratos = async () => {
    if (clienteId) {
      await listarContratosCliente(parseInt(clienteId));
    }
  };

  useEffect(() => {
    if (clienteId) {
      cargarContratos();
    }
  }, [clienteId]);

  const filteredContratos = contratos.filter(contrato =>
    contrato.numero_contrato.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contrato.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-2xl font-bold text-gray-900">Contratos de Transporte</h1>
            <p className="text-gray-600 mt-1">Gestión de contratos, tarifas negociadas y crédito de clientes</p>
          </div>
          <button
            onClick={() => navigate('/logistico/contratos/nuevo')}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <FaPlus className="h-4 w-4 mr-2" />
            Nuevo Contrato
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

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID del Cliente
              </label>
              <input
                type="number"
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                placeholder="Ingrese ID del cliente para buscar sus contratos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar por número o cliente
              </label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar contrato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
          {!clienteId && (
            <p className="text-sm text-gray-500 mt-3">
              Ingrese un ID de cliente para ver sus contratos
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        )}

        {/* Table */}
        {!loading && clienteId && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {filteredContratos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No hay contratos registrados para este cliente</p>
                <button
                  onClick={() => navigate('/logistico/contratos/nuevo')}
                  className="mt-4 text-orange-600 hover:text-orange-800"
                >
                  Crear primer contrato
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContratos.map((contrato) => {
                      const estadoInfo = getContratoEstadoInfo(contrato.estado);
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
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{formatMoney(saldoUsado)}</div>
                            <div className="text-xs text-gray-400">
                              Disponible: {formatMoney(creditoDisponible)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}>
                              {estadoInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => navigate(`/logistico/contratos/${contrato.id}`)}
                              className="text-orange-600 hover:text-orange-900 mr-3"
                              title="Ver detalles"
                            >
                              <FaEye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/logistico/contratos/${contrato.id}/editar`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContratosList;
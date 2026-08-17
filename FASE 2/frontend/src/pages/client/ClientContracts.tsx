// src/pages/client/ClientContracts.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaFileContract, FaChartLine, FaCalendarAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useClientContracts } from '../../services/client/hooks/useClientContracts';
import { formatMoney, formatDate, getContratoEstadoInfo } from '../../services/client/client';
import ClientHeader from '../../components/client/ClientHeader';
import ClientMenu from '../../components/client/ClientMenu';

const ClientContracts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { contratos, loading, error, estadisticas, cargarContratos, limpiarError } = useClientContracts();

  const userName = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Cliente';
  
  const companyName = user?.empresa || "Mi Empresa";
  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      cargarContratos(userId);
    }
  }, [userId, cargarContratos]);

  const handleVerDetalle = (contratoId: number) => {
    navigate(`/client/contracts/${contratoId}`);
  };

  if (loading && contratos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ClientHeader companyName={companyName} userName={userName} />
        <ClientMenu />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientHeader companyName={companyName} userName={userName} />
      <ClientMenu />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mis Contratos</h1>
          <p className="text-gray-600 mt-1">
            Gestión de contratos de transporte y crédito disponible
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <span>{error}</span>
            <button onClick={limpiarError} className="float-right">×</button>
          </div>
        )}

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Contratos</p>
                <p className="text-2xl font-bold text-gray-900">{contratos.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <FaFileContract className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Contratos Vigentes</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.activeContracts}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <FaCalendarAlt className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Crédito Disponible</p>
                <p className="text-2xl font-bold text-teal-600">{formatMoney(estadisticas.availableCredit)}</p>
              </div>
              <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                <FaChartLine className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Crédito Utilizado</p>
                <p className="text-2xl font-bold text-yellow-600">{formatMoney(estadisticas.usedCredit)}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <FaChartLine className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de contratos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Mis Contratos</h3>
            <p className="text-sm text-gray-500 mt-1">
              Contratos activos y anteriores
            </p>
          </div>
          
          {contratos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No tiene contratos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Contrato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vigencia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Límite Crédito</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Usado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crédito Disp.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contratos.map((contrato) => {
                    const estadoInfo = getContratoEstadoInfo(contrato.estado);
                    const saldoUsado = contrato.saldo_usado || 0;
                    const creditoDisponible = contrato.limite_credito - saldoUsado;
                    
                    return (
                      <tr key={contrato.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {contrato.numero_contrato}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div>{formatDate(contrato.fecha_inicio)}</div>
                          <div className="text-xs text-gray-400">→ {formatDate(contrato.fecha_fin)}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatMoney(contrato.limite_credito)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatMoney(saldoUsado)}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-green-600">
                          {formatMoney(creditoDisponible)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}>
                            {estadoInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientContracts;
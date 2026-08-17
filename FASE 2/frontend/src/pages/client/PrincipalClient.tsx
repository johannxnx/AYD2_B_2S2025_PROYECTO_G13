// src/pages/client/PrincipalClient.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaFileInvoiceDollar, FaCreditCard, FaFileContract } from 'react-icons/fa';
import ClientHeader from '../../components/client/ClientHeader';
import ClientMenu from '../../components/client/ClientMenu';
import { useAuth } from '../../context/AuthContext';
import { useClientContracts } from '../../services/client/hooks/useClientContracts';
import { formatMoney, formatDate, getContratoEstadoInfo } from '../../services/client/client';

const PrincipalClient: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    loading, 
    error, 
    contratoActivo, 
    estadisticas, 
    actividadesRecientes,
    cargarContratos,
    limpiarError 
  } = useClientContracts();

  console.log('[PrincipalClient] User:', user);
  console.log('[PrincipalClient] User ID:', user?.id);

  const userName = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Usuario';
  
  const companyName = user?.empresa || "Mi Empresa";
  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      console.log('[PrincipalClient] Cargando contratos para cliente ID:', userId);
      cargarContratos(userId);
    } else {
      console.log('[PrincipalClient] No hay userId disponible');
    }
  }, [userId, cargarContratos]);

  const StatCard = ({ icon: Icon, title, value, color, tooltip }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow group relative">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-full flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </div>
  );

  const handleViewContractDetails = (contratoId: number) => {
    navigate(`/client/contracts/${contratoId}`);
  };

  if (loading && !contratoActivo) {
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
      <ClientHeader 
        companyName={companyName}
        userName={userName}
      />
      <ClientMenu />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenido, {userName}
          </h1>
          <p className="text-gray-600 mt-1">
            Resumen de tu actividad y contratos
          </p>
          {userId && (
            <p className="text-sm text-gray-400 mt-2">
              ID de Cliente: {userId}
            </p>
          )}
        </div>

        {error && !error.includes('permisos') && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={limpiarError} className="text-red-700 hover:text-red-900">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FaFileContract}
            title="Contratos Activos"
            value={estadisticas.activeContracts}
            color="bg-blue-500"
            tooltip="Contratos vigentes"
          />
          <StatCard
            icon={FaTruck}
            title="Órdenes Pendientes"
            value={estadisticas.pendingOrders}
            color="bg-orange-500"
            tooltip="Próximamente disponible"
          />
          <StatCard
            icon={FaFileInvoiceDollar}
            title="Facturas Pendientes"
            value={estadisticas.pendingInvoices}
            color="bg-red-500"
            tooltip="Próximamente disponible"
          />
          <StatCard
            icon={FaCreditCard}
            title="Crédito Disponible"
            value={formatMoney(estadisticas.availableCredit)}
            color="bg-green-500"
            tooltip={`Límite: ${formatMoney(estadisticas.totalCreditLimit)} • Usado: ${formatMoney(estadisticas.usedCredit)}`}
          />
        </div>

        {contratoActivo ? (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Mi Contrato Activo</h2>
              <button
                onClick={() => handleViewContractDetails(contratoActivo.id)}
                className="text-sm text-orange-600 hover:text-orange-800"
              >
                Ver detalles →
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Número de Contrato</p>
                    <p className="text-lg font-semibold text-gray-900">{contratoActivo.numero_contrato}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vigencia</p>
                    <p className="text-gray-900">
                      {formatDate(contratoActivo.fecha_inicio)} - {formatDate(contratoActivo.fecha_fin)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Plazo de Pago</p>
                    <p className="text-gray-900">{contratoActivo.plazo_pago} días</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                      getContratoEstadoInfo(contratoActivo.estado).bg
                    } ${getContratoEstadoInfo(contratoActivo.estado).color}`}>
                      {getContratoEstadoInfo(contratoActivo.estado).label}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Límite de Crédito</p>
                    <p className="text-xl font-bold text-gray-900">{formatMoney(contratoActivo.limite_credito)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Crédito Utilizado</p>
                    <p className="text-xl font-bold text-yellow-600">{formatMoney(contratoActivo.saldo_usado || 0)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Crédito Disponible</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatMoney((contratoActivo.limite_credito - (contratoActivo.saldo_usado || 0)))}
                    </p>
                  </div>
                </div>
                
                {contratoActivo.tarifas_negociadas && contratoActivo.tarifas_negociadas.length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-gray-700 mb-3">Tarifas Negociadas</p>
                    <div className="flex flex-wrap gap-4">
                      {contratoActivo.tarifas_negociadas.map((tarifa: any, idx: number) => (
                        <div key={idx} className="bg-blue-50 rounded-lg px-4 py-2">
                          <span className="text-sm font-medium text-blue-700">{tarifa.tipo_unidad}</span>
                          <span className="text-sm text-blue-600 ml-2">{formatMoney(tarifa.costo_km_negociado)}/km</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    className="w-full md:w-auto px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Solicitar Servicio de Transporte
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <FaFileContract className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes contratos activos</h3>
            <p className="text-gray-500 mb-4">
              Para solicitar servicios de transporte, primero debes tener un contrato activo.
            </p>
            <button
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Contactar al área comercial
            </button>
          </div>
        )}

        {actividadesRecientes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {actividadesRecientes.map((actividad) => (
                <div key={actividad.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {actividad.descripcion}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {new Date(actividad.fecha).toLocaleDateString('es-GT', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          actividad.estado === 'Activo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {actividad.estado}
                        </span>
                      </div>
                    </div>
                    {actividad.tipo === 'contrato' && (
                      <button
                        onClick={() => handleViewContractDetails(actividad.id)}
                        className="text-xs text-orange-600 hover:text-orange-800"
                      >
                        Ver detalles →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrincipalClient;
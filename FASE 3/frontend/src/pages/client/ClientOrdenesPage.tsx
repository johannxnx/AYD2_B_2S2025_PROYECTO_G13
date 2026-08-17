import React, { useEffect, useState } from "react";
import {
  FaBoxOpen,
  FaTruck,
  FaCheckCircle,
  FaPlus,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useClientOrders } from "../../services/client/hooks/useClientOrdenes";
import {
  formatMoney,
  formatDate,
  ClientService,
} from "../../services/client/client";
import ClientHeader from "../../components/client/ClientHeader";
import ClientMenu from "../../components/client/ClientMenu";
import ModalNuevaOrden from "../../components/client/ModalNuevaOrden";
import apiService from "../../services/api";

// Helper para obtener código de moneda desde moneda_id
const getCodigoMonedaDesdeId = (moneda_id?: number): string => {
  const monedasMap: Record<number, string> = {
    1: 'GTQ',
    2: 'USD',
    6: 'HNL',
    7: 'SVC'
  };
  return moneda_id ? (monedasMap[moneda_id] || 'GTQ') : 'GTQ';
};

const ClienteOrdenesPage: React.FC = () => {
  const { user } = useAuth();

  const {
    ordenes,
    loading,
    error,
    estadisticas,
    rutas,
    cargarDatos,
    crearNuevaOrden,
    limpiarError,
  } = useClientOrders();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monedaCode, setMonedaCode] = useState('GTQ');

  const userName =
    user?.nombres && user?.apellidos
      ? `${user.nombres} ${user.apellidos}`
      : user?.email?.split("@")[0] || "Cliente";

  const companyName = user?.empresa || "Mi Empresa";
  const userId = user?.id;

  useEffect(() => {
    if (userId) {
      cargarDatos(userId);
      // Obtener contratos para determinar la moneda del cliente
      (async () => {
        try {
          const resContratos = await (apiService as any).listarContratosPorCliente(userId);
          if (resContratos?.ok && resContratos.data?.length > 0) {
            const moneda = getCodigoMonedaDesdeId(resContratos.data[0].moneda_id);
            setMonedaCode(moneda);
          }
        } catch (err) {
          console.error('Error al cargar contratos:', err);
        }
      })();
    }
  }, [userId, cargarDatos]);

  const handleCrearOrden = async (data: any) => {
    const payload = { ...data, cliente_id: userId, creado_por: userId };
    const resultado = await crearNuevaOrden(payload);
    if (resultado.ok) {
      setIsModalOpen(false);
      cargarDatos(userId!);
    }
  };

  if (loading && ordenes.length === 0) {
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
    <>
      <div className="min-h-screen bg-gray-50">
        <ClientHeader companyName={companyName} userName={userName} />
        <ClientMenu />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Órdenes</h1>
              <p className="text-gray-600 mt-1">
                Seguimiento y gestión de servicios de transporte
              </p>
            </div>
            <button
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
              onClick={() => setIsModalOpen(true)} // 3. Abrir el modal
            >
              <FaPlus className="text-sm" />
              Nueva Orden
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={limpiarError}
                className="font-bold text-xl leading-none"
              >
                ×
              </button>
            </div>
          )}

          {/* Tarjetas de estadísticas */}
          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Órdenes Totales */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Órdenes Totales
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {ordenes.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaBoxOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* En Tránsito / Pendientes */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    En Gestión
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {estadisticas?.pendingOrders || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <FaTruck className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Entregadas */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Entregadas
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {estadisticas?.completedOrders || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Crédito Disponible */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Crédito Disponible
                  </p>
                  <p className="text-2xl font-bold text-teal-600">
                    {formatMoney(estadisticas?.availableCredit || 0, monedaCode)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <FaMapMarkerAlt className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de órdenes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">
                Listado de Servicios
              </h3>
            </div>

            {ordenes.length === 0 ? (
              <div className="text-center py-12">
                <FaBoxOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-500">
                  No tiene órdenes de transporte registradas
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        N° Orden
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Ruta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Mercancía / Peso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Costo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Despachado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Entregado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ordenes.map((orden) => {
                      const estadoInfo = ClientService.getOrdenEstadoInfo(
                        orden.estado,
                      );
                      return (
                        <tr
                          key={orden.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-bold text-gray-900">
                            {orden.numero_orden}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="font-medium text-gray-800">
                              {orden.origen}
                            </div>
                            <div className="text-xs text-gray-400">
                              → {orden.destino}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="capitalize">
                              {orden.tipo_mercancia.toLowerCase()}
                            </div>
                            <div className="text-xs">
                              <span className="font-semibold text-gray-500 uppercase text-[10px]">
                                Peso:
                              </span>
                              <div className="font-bold text-gray-800">
                                {orden.peso_real ? (
                                  <span title="Peso confirmado en báscula">
                                    {orden.peso_real} kg{" "}
                                    <span className="text-[10px] text-green-600 font-medium">
                                      (Real)
                                    </span>
                                  </span>
                                ) : (
                                  <span title="Peso declarado por el cliente">
                                    {orden.peso_estimado} kg{" "}
                                    <span className="text-[10px] text-orange-500 font-medium">
                                      (Est.)
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {formatMoney(orden.costo, monedaCode)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 text-xs font-bold rounded-full ${estadoInfo.bg} ${estadoInfo.color}`}
                            >
                              {estadoInfo.label}
                            </span>
                          </td>
                          {/* 4. Manejo de fechas que pueden ser nulas */}
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {orden.fecha_despacho
                              ? formatDate(orden.fecha_despacho)
                              : "Pendiente"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {orden.fecha_entrega
                              ? formatDate(orden.fecha_entrega)
                              : "En camino"}
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

      {/* Modal */}
      <ModalNuevaOrden
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rutas={rutas}
        onSubmit={handleCrearOrden}
      />
    </>
  );
};

export default ClienteOrdenesPage;

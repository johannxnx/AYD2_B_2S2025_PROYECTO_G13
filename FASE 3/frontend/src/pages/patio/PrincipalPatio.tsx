// src/pages/patio/PrincipalPatio.tsx
import React, { useEffect, useState } from 'react';
import { FaWarehouse, FaClipboardList, FaTruck, FaCheckCircle, FaExclamationTriangle, FaSyncAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import PatioHeader from '../../components/patio/PatioHeader';
import PatioMenu from '../../components/patio/PatioMenu';
import PatioOrdenCard from '../../components/patio/PatioOrdenCard';
import ModalAutorizarSalida from '../../components/patio/ModalAutorizarSalida';
import { patioApi } from '../../services/patio/patioApi';
import type { OrdenPlanificada } from '../../services/patio/patioApi'; // Usar type-only import

const PrincipalPatio: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ordenesPlanificadas, setOrdenesPlanificadas] = useState<OrdenPlanificada[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<OrdenPlanificada | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const patioNombre = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Encargado de Patio';

  useEffect(() => {
    cargarOrdenesPlanificadas();
  }, []);

  const cargarOrdenesPlanificadas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await patioApi.getOrdenesPlanificadas();
      setOrdenesPlanificadas(data);
    } catch (err: any) {
      console.error('Error cargando órdenes planificadas:', err);
      setError(err.message || 'Error al cargar las órdenes planificadas');
    } finally {
      setLoading(false);
    }
  };

  const handleAutorizarSalida = (orden: OrdenPlanificada) => {
    setSelectedOrden(orden);
    setIsModalOpen(true);
  };

  const handleConfirmarSalida = async (
    ordenId: number, 
    payload: { codigo_orden: string; peso_real: number; asegurada: boolean; estibada: boolean }
  ) => {
    await patioApi.registrarSalidaPatio(ordenId, payload);
    setSuccess(`Salida autorizada correctamente para la orden ${payload.codigo_orden}`);
    
    await cargarOrdenesPlanificadas();
    
    setTimeout(() => setSuccess(null), 3000);
  };

  const StatCard = ({ icon: Icon, title, value, color, bgColor }: any) => (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  const ordenesProcesadas = ordenesPlanificadas.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <PatioHeader patioNombre={patioNombre} />
      <PatioMenu />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Panel de Control - Patio
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona las salidas de patio y verifica las órdenes listas para despacho
              </p>
            </div>
            <button
              onClick={cargarOrdenesPlanificadas}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FaSyncAlt className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
            <FaCheckCircle className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <FaExclamationTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={FaClipboardList}
            title="Órdenes Planificadas"
            value={ordenesProcesadas}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
          <StatCard
            icon={FaTruck}
            title="En Tránsito"
            value="0"
            color="text-purple-600"
            bgColor="bg-purple-100"
          />
          <StatCard
            icon={FaWarehouse}
            title="Vehículos en Patio"
            value="0"
            color="text-green-600"
            bgColor="bg-green-100"
          />
          <StatCard
            icon={FaCheckCircle}
            title="Salidas Hoy"
            value="0"
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaClipboardList className="h-5 w-5 text-blue-600" />
            Órdenes Planificadas para Despacho
          </h2>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : ordenesPlanificadas.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {ordenesPlanificadas.map((orden) => (
                <PatioOrdenCard
                  key={orden.id}
                  orden={orden}
                  onAutorizarSalida={handleAutorizarSalida}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <FaClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay órdenes planificadas
              </h3>
              <p className="text-gray-500">
                Las órdenes planificadas aparecerán aquí cuando estén listas para despacho.
              </p>
            </div>
          )}
        </div>
      </div>

      <ModalAutorizarSalida
        isOpen={isModalOpen}
        orden={selectedOrden}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrden(null);
        }}
        onConfirm={handleConfirmarSalida}
      />
    </div>
  );
};

export default PrincipalPatio;
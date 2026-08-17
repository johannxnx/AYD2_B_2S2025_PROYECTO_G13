// src/components/patio/ModalAutorizarSalida.tsx
import React, { useState } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaWeight, FaShieldAlt, FaClipboardCheck } from 'react-icons/fa';
import type { OrdenPlanificada } from '../../services/patio/patioApi';

interface ModalAutorizarSalidaProps {
  isOpen: boolean;
  orden: OrdenPlanificada | null;
  onClose: () => void;
  onConfirm: (ordenId: number, payload: { codigo_orden: string; peso_real: number; asegurada: boolean; estibada: boolean }) => Promise<void>;
}

const ModalAutorizarSalida: React.FC<ModalAutorizarSalidaProps> = ({ isOpen, orden, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    codigo_orden: '',
    peso_real: '',
    asegurada: false,
    estibada: false
  });

  if (!isOpen || !orden) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onConfirm(orden.id, {
        codigo_orden: formData.codigo_orden,
        peso_real: parseFloat(formData.peso_real),
        asegurada: formData.asegurada,
        estibada: formData.estibada
      });
      
      setFormData({
        codigo_orden: '',
        peso_real: '',
        asegurada: false,
        estibada: false
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al autorizar la salida');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">
                Autorizar Salida de Patio
              </h3>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <p className="text-green-100 text-sm mt-1">
              Orden #{orden.numero_orden}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Orden
                </label>
                <input
                  type="text"
                  name="codigo_orden"
                  value={formData.codigo_orden}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  placeholder="Ingrese el código de la orden"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El código debe coincidir con el número de orden
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Peso Real (kg)
                </label>
                <div className="relative">
                  <FaWeight className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="number"
                    name="peso_real"
                    value={formData.peso_real}
                    onChange={handleInputChange}
                    required
                    step="0.01"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="Peso real de la carga"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Peso estimado: {orden.peso_estimado} kg
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Verificaciones de Carga
                </label>
                
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="asegurada"
                    checked={formData.asegurada}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <FaShieldAlt className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    La carga está asegurada correctamente
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    name="estibada"
                    checked={formData.estibada}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <FaClipboardCheck className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    La carga está correctamente estibada
                  </span>
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-start gap-2">
                  <FaExclamationTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="h-4 w-4" />
                    Autorizar Salida
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalAutorizarSalida;
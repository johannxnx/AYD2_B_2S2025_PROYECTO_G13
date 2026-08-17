// src/components/logistico/ValidacionClienteModal.tsx
import React, { useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaCalculator } from 'react-icons/fa';
import { useContratos } from '../../services/Logistico/hooks/useContratos';
import { formatMoney } from '../../services/Logistico/Logistico';

interface ValidacionClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ValidacionClienteModal: React.FC<ValidacionClienteModalProps> = ({ isOpen, onClose }) => {
  const { validarServicio, validacionActual, loading, limpiarValidacion } = useContratos();
  
  const [formData, setFormData] = useState({
    clienteId: '',
    origen: '',
    destino: '',
    tipoUnidad: 'LIGERA'
  });

  const [mostrarCalculo, setMostrarCalculo] = useState(false);
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);
  const [costoTotal, setCostoTotal] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.clienteId && formData.origen && formData.destino) {
      await validarServicio(
        parseInt(formData.clienteId),
        formData.origen,
        formData.destino,
        formData.tipoUnidad
      );
    }
  };

  const handleCalcularCosto = () => {
    if (validacionActual?.esValido && validacionActual.costoFinalPorKm && distanciaKm && distanciaKm > 0) {
      const total = validacionActual.costoFinalPorKm * distanciaKm;
      setCostoTotal(total);
    }
  };

  const handleClose = () => {
    limpiarValidacion();
    setFormData({ clienteId: '', origen: '', destino: '', tipoUnidad: 'LIGERA' });
    setDistanciaKm(null);
    setCostoTotal(null);
    setMostrarCalculo(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FaCalculator className="h-5 w-5 text-orange-600" />
            Validar Cliente para Servicio
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID del Cliente *
                </label>
                <input
                  type="number"
                  value={formData.clienteId}
                  onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ej: 5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Unidad *
                </label>
                <select
                  value={formData.tipoUnidad}
                  onChange={(e) => setFormData({ ...formData, tipoUnidad: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="LIGERA">Ligera (Moto, Auto)</option>
                  <option value="PESADA">Pesada (Camión)</option>
                  <option value="CABEZAL">Cabezal (Tractocamión)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origen *
                </label>
                <input
                  type="text"
                  value={formData.origen}
                  onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ciudad de origen"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destino *
                </label>
                <input
                  type="text"
                  value={formData.destino}
                  onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ciudad de destino"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Validando...
                </>
              ) : (
                <>
                  <FaCheckCircle className="h-4 w-4 mr-2" />
                  Validar Cliente
                </>
              )}
            </button>
          </form>
          
          {validacionActual && (
            <div className={`mt-6 p-4 rounded-lg ${validacionActual.esValido ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                {validacionActual.esValido ? (
                  <FaCheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <FaTimesCircle className="h-5 w-5 text-red-600" />
                )}
                <h3 className={`font-semibold ${validacionActual.esValido ? 'text-green-800' : 'text-red-800'}`}>
                  {validacionActual.esValido ? ' Cliente Autorizado' : ' Cliente No Autorizado'}
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{validacionActual.mensaje}</p>
              
              {validacionActual.esValido && (
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Contrato:</span>
                        <p className="font-medium text-gray-900">{validacionActual.contratoNumero || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Tarifa base:</span>
                        <p className="font-medium text-gray-900">{formatMoney(validacionActual.tarifaAplicable || 0)}/km</p>
                      </div>
                      {validacionActual.descuentoAplicable && validacionActual.descuentoAplicable > 0 && (
                        <div>
                          <span className="text-gray-500">Descuento aplicado:</span>
                          <p className="font-medium text-green-600">{validacionActual.descuentoAplicable}%</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Costo final por km:</span>
                        <p className="font-medium text-orange-600">{formatMoney(validacionActual.costoFinalPorKm || 0)}/km</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Cálculo de costo total */}
                  <button
                    onClick={() => setMostrarCalculo(!mostrarCalculo)}
                    className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center text-sm"
                  >
                    <FaCalculator className="h-4 w-4 mr-2" />
                    Calcular costo total del servicio
                  </button>
                  
                  {mostrarCalculo && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Distancia (km) *
                          </label>
                          <input
                            type="number"
                            value={distanciaKm || ''}
                            onChange={(e) => setDistanciaKm(parseFloat(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            placeholder="Ej: 45.5"
                            step="0.1"
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={handleCalcularCosto}
                            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Calcular
                          </button>
                        </div>
                      </div>
                      
                      {costoTotal !== null && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Costo estimado del servicio:</span>
                            <span className="text-xl font-bold text-green-600">{formatMoney(costoTotal)}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            * Calculado como: {formatMoney(validacionActual.costoFinalPorKm || 0)}/km × {distanciaKm} km
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidacionClienteModal;
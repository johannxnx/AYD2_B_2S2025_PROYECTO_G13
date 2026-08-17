// src/components/client/ModalNuevaOrden.tsx
import React, { useState } from "react";
import type { RutaAutorizada } from "../../services/api";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  rutas: RutaAutorizada[];
  onSubmit: (data: any) => Promise<void>;
}

const ModalNuevaOrden: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  rutas,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    ruta_idx: "",
    tipo_mercancia: "",
    peso_estimado: "",
    comentarios: "",
  });

  if (!isOpen) return null;

  // Verificamos si hay rutas disponibles
  const tieneRutas = rutas.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tieneRutas) return; // Seguridad adicional

    const rutaSeleccionada = rutas[parseInt(formData.ruta_idx)];

    await onSubmit({
      origen: rutaSeleccionada.origen,
      destino: rutaSeleccionada.destino,
      tipo_mercancia: formData.tipo_mercancia,
      peso_estimado: parseFloat(formData.peso_estimado),
      comentarios: formData.comentarios,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-orange-50">
          <h3 className="text-lg font-bold text-orange-900">
            Solicitar Nueva Orden
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* MENSAJE INFORMATIVO SI NO HAY RUTAS */}
          {!tieneRutas ? (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-amber-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700 font-medium">
                    No se encontró un contrato activo con rutas autorizadas.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ruta Autorizada
              </label>
              <select
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.ruta_idx}
                onChange={(e) =>
                  setFormData({ ...formData, ruta_idx: e.target.value })
                }
              >
                <option value="">Seleccione una ruta...</option>
                {rutas.map((ruta, index) => (
                  <option key={index} value={index}>
                    {ruta.origen} → {ruta.destino} (
                    {ruta.tipo_carga || "Carga General"})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Mercancía
              </label>
              <input
                type="text"
                required
                disabled={!tieneRutas}
                placeholder="Ej. Alimentos"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                value={formData.tipo_mercancia}
                onChange={(e) =>
                  setFormData({ ...formData, tipo_mercancia: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso Est. (t)
              </label>
              <input
                type="number"
                required
                disabled={!tieneRutas}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
                value={formData.peso_estimado}
                onChange={(e) =>
                  setFormData({ ...formData, peso_estimado: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!tieneRutas}
              className={`flex-1 px-4 py-2 text-white rounded-lg font-medium shadow-sm transition-all ${
                tieneRutas
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              Confirmar Orden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalNuevaOrden;

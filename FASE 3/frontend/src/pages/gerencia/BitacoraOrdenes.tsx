// src/pages/gerencia/BitacoraOrdenes.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaArrowLeft, FaClipboard } from "react-icons/fa";
import EventosOrdenes from "../../components/gerencial/EventosOrdenes";

const BitacoraOrdenes: React.FC = () => {
  const navigate = useNavigate();
  const [desde, setDesde] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [hasta, setHasta] = useState(new Date().toISOString().split("T")[0]);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 py-5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FaClipboard className="text-2xl" />
              <h1 className="text-2xl font-bold">
                Bitácora de Eventos - Órdenes
              </h1>
            </div>
            <p className="text-blue-200 text-sm mt-1">
              Registro de anomalías y eventos detectados en la operación
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => navigate("/Gerencia/dashboad")}
              className="flex items-center px-4 py-2 bg-blue-800 text-white rounded-xl hover:bg-blue-700 transition"
            >
              <FaArrowLeft className="mr-2" />
              Volver al Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-sm text-white hover:text-red-600 transition-colors"
            >
              <FaSignOutAlt className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Filtros de fecha */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Desde:
              </label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hasta:
              </label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDesde(
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0],
                  );
                  setHasta(new Date().toISOString().split("T")[0]);
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Últimos 30 días
              </button>
            </div>
          </div>
        </div>

        {/* Eventos */}
        <EventosOrdenes desde={desde} hasta={hasta} sede={undefined} />
      </div>
    </div>
  );
};

export default BitacoraOrdenes;

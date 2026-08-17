// src/pages/piloto/IniciarViaje.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaTruck, FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import PilotoHeader from '../../components/piloto/PilotoHeader';
import PilotoMenu from '../../components/piloto/PilotoMenu';
import { useAuth } from '../../context/AuthContext';
import { pilotoApi } from '../../services/piloto/pilotoApi';

const IniciarViaje: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const pilotoNombre = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Piloto';

  useEffect(() => {
    // Al entrar a la página, automáticamente iniciar el viaje
    iniciarViaje();
  }, []);

  const iniciarViaje = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      await pilotoApi.iniciarTransito(parseInt(id));
      setSuccess(true);
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/piloto/dashboard', { 
          state: { message: 'Viaje iniciado exitosamente' }
        });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar el viaje');
      setLoading(false);
    }
  };

  const handleVolver = () => {
    navigate('/piloto/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PilotoHeader pilotoNombre={pilotoNombre} />
      <PilotoMenu />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={handleVolver}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FaArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FaTruck className="h-6 w-6" />
              Iniciar Viaje
            </h1>
            <p className="text-green-100 mt-1">Orden #{id}</p>
          </div>

          <div className="p-8 text-center">
            {loading && (
              <div>
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Iniciando viaje...</p>
                <p className="text-sm text-gray-400 mt-2">Por favor espere</p>
              </div>
            )}

            {success && (
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  ¡Viaje Iniciado!
                </h2>
                <p className="text-gray-600">
                  El estado de la orden ha sido actualizado a "En Tránsito"
                </p>
                <p className="text-sm text-gray-400 mt-4">
                  Redirigiendo al dashboard...
                </p>
              </div>
            )}

            {error && !loading && !success && (
              <div>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaExclamationTriangle className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Error al iniciar el viaje
                </h2>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={iniciarViaje}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IniciarViaje;
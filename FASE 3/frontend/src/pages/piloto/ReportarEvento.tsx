// src/pages/piloto/ReportarEvento.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaTruck, FaCheckCircle, FaExclamationTriangle, FaExclamationCircle, FaClock, FaShieldAlt } from 'react-icons/fa';
import PilotoHeader from '../../components/piloto/PilotoHeader';
import PilotoMenu from '../../components/piloto/PilotoMenu';
import { useAuth } from '../../context/AuthContext';
import { pilotoApi } from '../../services/piloto/pilotoApi';

const ReportarEvento: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tipo_evento: 'NORMAL' as 'NORMAL' | 'INCIDENTE' | 'RETRASO' | 'CRITICO',
    descripcion: '',
    genera_retraso: false
  });

  const pilotoNombre = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Piloto';
  
  const pilotoId = user?.id;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !pilotoId) return;

    if (!formData.descripcion.trim()) {
      setError('Debe ingresar una descripción del evento');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await pilotoApi.registrarEvento({
        orden_id: parseInt(id),
        piloto_id: pilotoId,
        tipo_evento: formData.tipo_evento,
        descripcion: formData.descripcion,
        genera_retraso: formData.genera_retraso
      });
      
      setSuccess('Evento registrado exitosamente');
      
      // Limpiar formulario
      setFormData({
        tipo_evento: 'NORMAL',
        descripcion: '',
        genera_retraso: false
      });
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/piloto/dashboard', { 
          state: { message: 'Evento registrado exitosamente' }
        });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al registrar el evento');
    } finally {
      setLoading(false);
    }
  };

  const getEventoIcon = (tipo: string) => {
    switch (tipo) {
      case 'NORMAL':
        return <FaCheckCircle className="h-5 w-5 text-green-500" />;
      case 'INCIDENTE':
        return <FaExclamationTriangle className="h-5 w-5 text-yellow-500" />;
      case 'RETRASO':
        return <FaClock className="h-5 w-5 text-orange-500" />;
      case 'CRITICO':
        return <FaExclamationCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FaShieldAlt className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PilotoHeader pilotoNombre={pilotoNombre} />
      <PilotoMenu />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FaExclamationTriangle className="h-6 w-6" />
              Reportar Evento
            </h1>
            <p className="text-orange-100 mt-1">Registra novedades durante el tránsito para la orden #{id}</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-2">
                <FaExclamationTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-start gap-2">
                <FaCheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Evento
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['NORMAL', 'INCIDENTE', 'RETRASO', 'CRITICO'] as const).map((tipo) => (
                    <label
                      key={tipo}
                      className={`
                        flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                        ${formData.tipo_evento === tipo 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-orange-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="tipo_evento"
                        value={tipo}
                        checked={formData.tipo_evento === tipo}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      {getEventoIcon(tipo)}
                      <span className="text-sm font-medium">
                        {tipo === 'NORMAL' ? 'Normal' : 
                         tipo === 'INCIDENTE' ? 'Incidente' :
                         tipo === 'RETRASO' ? 'Retraso' : 'Crítico'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción del Evento
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describa detalladamente el evento ocurrido..."
                />
              </div>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  name="genera_retraso"
                  checked={formData.genera_retraso}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">
                  Este evento genera retraso en la entrega
                </span>
              </label>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Los eventos críticos generan alertas inmediatas 
                  al área de logística y pueden afectar los indicadores de rendimiento.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/piloto/dashboard')}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="h-4 w-4" />
                      Registrar Evento
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportarEvento;
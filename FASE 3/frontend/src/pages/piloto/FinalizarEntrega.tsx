// src/pages/piloto/FinalizarEntrega.tsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaTruck, FaCheckCircle, FaExclamationTriangle, FaUpload, FaTimes } from 'react-icons/fa';
import PilotoHeader from '../../components/piloto/PilotoHeader';
import PilotoMenu from '../../components/piloto/PilotoMenu';
import { useAuth } from '../../context/AuthContext';
import { pilotoApi } from '../../services/piloto/pilotoApi';

const FinalizarEntrega: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [evidencias, setEvidencias] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const pilotoNombre = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Piloto';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...evidencias, ...files];
    
    // Limitar a 5 archivos máximo
    if (newFiles.length > 5) {
      setError('Solo se pueden subir máximo 5 archivos de evidencia');
      return;
    }
    
    setEvidencias(newFiles);
    
    // Crear previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
    setError(null);
  };

  const removeFile = (index: number) => {
    // Liberar URL del objeto
    URL.revokeObjectURL(previews[index]);
    
    const newEvidencias = [...evidencias];
    const newPreviews = [...previews];
    newEvidencias.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setEvidencias(newEvidencias);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (evidencias.length === 0) {
      setError('Debe adjuntar al menos una imagen de evidencia');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await pilotoApi.finalizarEntrega(parseInt(id), evidencias);
      
      setSuccess('Entrega finalizada exitosamente');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/piloto/dashboard', { 
          state: { message: 'Entrega finalizada exitosamente' }
        });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al finalizar la entrega');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PilotoHeader pilotoNombre={pilotoNombre} />
      <PilotoMenu />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FaTruck className="h-6 w-6" />
              Finalizar Entrega
            </h1>
            <p className="text-purple-100 mt-1">Registra la finalización de la entrega para la orden #{id}</p>
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
                  Evidencias de Entrega (Máximo 5 archivos)
                </label>
                
                <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-purple-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                      >
                        <span>Subir archivos</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                          disabled={loading}
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, PDF hasta 10MB cada uno
                    </p>
                    <p className="text-xs text-gray-500">
                      Archivos seleccionados: {evidencias.length}/5
                    </p>
                  </div>
                </div>

                {previews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {previews.map((preview, index) => (
                      <div key={index} className="relative group">
                        {evidencias[index]?.type?.startsWith('image/') ? (
                          <img
                            src={preview}
                            alt={`Evidencia ${index + 1}`}
                            className="h-24 w-full object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="h-24 w-full bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-500">PDF</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={loading}
                        >
                          <FaTimes className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {evidencias[index]?.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Al finalizar la entrega, se liberará el vehículo 
                  y se registrará el tiempo real de la ruta. Asegúrate de haber completado 
                  todas las verificaciones antes de continuar.
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
                  disabled={loading || evidencias.length === 0}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="h-4 w-4" />
                      Finalizar Entrega
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

export default FinalizarEntrega;
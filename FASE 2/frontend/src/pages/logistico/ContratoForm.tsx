// src/pages/logistico/ContratoForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import { useContratos } from '../../services/Logistico/hooks/useContratos';
import { getTipoUnidadLabel, formatMoney } from '../../services/Logistico/Logistico';
import LogisticHeader from '../../components/logistico/LogisticHeader';
import LogisticMenu from '../../components/logistico/LogisticMenu';
import { useAuth } from '../../context/AuthContext';
import type { Tarifario } from '../../services/api';

interface TarifaForm {
  tarifario_id: number;
  costo_km_negociado: number;
  tipo_unidad: string;
}

interface RutaForm {
  origen: string;
  destino: string;
  distancia_km: number;
  tipo_carga: string;
}

const ContratoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { 
    crearContrato, 
    obtenerContrato, 
    loading, 
    error, 
    limpiarError,
    tarifarios,
    loadingTarifarios
  } = useContratos();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    numero_contrato: '',
    cliente_id: 0,
    fecha_inicio: '',
    fecha_fin: '',
    limite_credito: 0,
    plazo_pago: 30,
    tarifas: [] as TarifaForm[],
    rutas: [] as RutaForm[]
  });

  const [nuevaTarifa, setNuevaTarifa] = useState<TarifaForm>({
    tarifario_id: 0,
    costo_km_negociado: 0,
    tipo_unidad: ''
  });

  const [nuevaRuta, setNuevaRuta] = useState<RutaForm>({
    origen: '',
    destino: '',
    distancia_km: 0,
    tipo_carga: ''
  });

  const userName = user?.nombres && user?.apellidos 
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Operador Logístico';

  useEffect(() => {
    if (isEdit && id) {
      cargarContrato(parseInt(id));
    }
  }, [isEdit, id]);

  const cargarContrato = async (contratoId: number) => {
    const contrato = await obtenerContrato(contratoId);
    if (contrato) {
      setFormData({
        numero_contrato: contrato.numero_contrato,
        cliente_id: contrato.cliente_id,
        fecha_inicio: contrato.fecha_inicio.split('T')[0],
        fecha_fin: contrato.fecha_fin.split('T')[0],
        limite_credito: contrato.limite_credito,
        plazo_pago: contrato.plazo_pago,
        tarifas: contrato.tarifas_negociadas?.map(t => ({
          tarifario_id: t.tarifario_id,
          costo_km_negociado: t.costo_km_negociado,
          tipo_unidad: t.tipo_unidad
        })) || [],
        rutas: contrato.rutas_autorizadas?.map(r => ({
          origen: r.origen,
          destino: r.destino,
          distancia_km: r.distancia_km || 0,
          tipo_carga: r.tipo_carga || ''
        })) || []
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cliente_id' || name === 'limite_credito' || name === 'plazo_pago'
        ? Number(value)
        : value
    }));
  };

  const handleTarifarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tarifarioId = parseInt(e.target.value);
    const tarifarioSeleccionado = tarifarios.find(t => t.id === tarifarioId);
    if (tarifarioSeleccionado) {
      setNuevaTarifa({
        tarifario_id: tarifarioId,
        costo_km_negociado: tarifarioSeleccionado.costo_base_km,
        tipo_unidad: tarifarioSeleccionado.tipo_unidad
      });
    }
  };

  const agregarTarifa = () => {
    if (nuevaTarifa.tarifario_id && nuevaTarifa.costo_km_negociado > 0) {
      // Verificar si ya existe una tarifa para ese tipo de unidad
      const existe = formData.tarifas.some(t => t.tipo_unidad === nuevaTarifa.tipo_unidad);
      if (existe) {
        alert(`Ya existe una tarifa negociada para ${getTipoUnidadLabel(nuevaTarifa.tipo_unidad)}`);
        return;
      }
      setFormData(prev => ({
        ...prev,
        tarifas: [...prev.tarifas, { ...nuevaTarifa }]
      }));
      setNuevaTarifa({ tarifario_id: 0, costo_km_negociado: 0, tipo_unidad: '' });
    } else {
      alert('Seleccione un tipo de unidad y verifique el costo');
    }
  };

  const eliminarTarifa = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tarifas: prev.tarifas.filter((_, i) => i !== index)
    }));
  };

  const agregarRuta = () => {
    if (nuevaRuta.origen && nuevaRuta.destino) {
      setFormData(prev => ({
        ...prev,
        rutas: [...prev.rutas, { ...nuevaRuta }]
      }));
      setNuevaRuta({ origen: '', destino: '', distancia_km: 0, tipo_carga: '' });
    } else {
      alert('Complete los campos de origen y destino');
    }
  };

  const eliminarRuta = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rutas: prev.rutas.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.tarifas.length === 0) {
      alert('Debe agregar al menos una tarifa negociada');
      return;
    }

    if (!formData.cliente_id || formData.cliente_id <= 0) {
      alert('Ingrese un ID de cliente válido');
      return;
    }

    const payload = {
      numero_contrato: formData.numero_contrato,
      cliente_id: formData.cliente_id,
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin,
      limite_credito: formData.limite_credito,
      plazo_pago: formData.plazo_pago,
      tarifas: formData.tarifas.map(t => ({
        tarifario_id: t.tarifario_id,
        costo_km_negociado: t.costo_km_negociado
      })),
      rutas: formData.rutas.map(r => ({
        origen: r.origen,
        destino: r.destino,
        distancia_km: r.distancia_km || undefined,
        tipo_carga: r.tipo_carga || undefined
      }))
    };

    const result = await crearContrato(payload);
    if (result) {
      navigate('/logistico/contratos');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LogisticHeader 
        userName={userName}
        userRole={isEdit ? "Editar Contrato" : "Nuevo Contrato"}
      />
      <LogisticMenu />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Editar Contrato' : 'Nuevo Contrato'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Modificar información del contrato' : 'Registrar un nuevo contrato de transporte'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={limpiarError} className="text-red-700 hover:text-red-900">×</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Datos Principales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos del Contrato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Contrato *
                </label>
                <input
                  type="text"
                  name="numero_contrato"
                  value={formData.numero_contrato}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  placeholder="CTR-2024-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID del Cliente *
                </label>
                <input
                  type="number"
                  name="cliente_id"
                  value={formData.cliente_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  placeholder="ID del cliente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Fin *
                </label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite de Crédito (GTQ) *
                </label>
                <input
                  type="number"
                  name="limite_credito"
                  value={formData.limite_credito}
                  onChange={handleChange}
                  required
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plazo de Pago (días) *
                </label>
                <input
                  type="number"
                  name="plazo_pago"
                  value={formData.plazo_pago}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Tarifas Negociadas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarifas Negociadas</h2>
            
            {formData.tarifas.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.tarifas.map((tarifa, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <span className="font-medium">{getTipoUnidadLabel(tarifa.tipo_unidad)}</span>
                      <span className="text-gray-500 ml-2">{formatMoney(tarifa.costo_km_negociado)}/km</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarTarifa(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Unidad *
                </label>
                <select
                  value={nuevaTarifa.tarifario_id}
                  onChange={handleTarifarioChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  disabled={loadingTarifarios}
                >
                  <option value="">Seleccionar</option>
                  {tarifarios.map(t => (
                    <option key={t.id} value={t.id}>
                      {getTipoUnidadLabel(t.tipo_unidad)} - {formatMoney(t.costo_base_km)}/km (base)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo negociado por km (GTQ) *
                </label>
                <input
                  type="number"
                  value={nuevaTarifa.costo_km_negociado}
                  onChange={(e) => setNuevaTarifa({ ...nuevaTarifa, costo_km_negociado: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  step="0.01"
                  placeholder="Ej: 2.50"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={agregarTarifa}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                >
                  <FaPlus className="h-4 w-4 mr-2" />
                  Agregar Tarifa
                </button>
              </div>
            </div>
            {loadingTarifarios && (
              <p className="text-sm text-gray-500 mt-2">Cargando tarifarios...</p>
            )}
          </div>

          {/* Rutas Autorizadas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rutas Autorizadas (Opcional)</h2>
            
            {formData.rutas.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.rutas.map((ruta, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div>
                      <span className="font-medium">{ruta.origen} → {ruta.destino}</span>
                      {ruta.distancia_km > 0 && (
                        <span className="text-gray-500 ml-2">{ruta.distancia_km} km</span>
                      )}
                      {ruta.tipo_carga && (
                        <span className="text-gray-500 ml-2">({ruta.tipo_carga})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarRuta(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Origen
                </label>
                <input
                  type="text"
                  value={nuevaRuta.origen}
                  onChange={(e) => setNuevaRuta({ ...nuevaRuta, origen: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ciudad de origen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destino
                </label>
                <input
                  type="text"
                  value={nuevaRuta.destino}
                  onChange={(e) => setNuevaRuta({ ...nuevaRuta, destino: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ciudad de destino"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distancia (km)
                </label>
                <input
                  type="number"
                  value={nuevaRuta.distancia_km}
                  onChange={(e) => setNuevaRuta({ ...nuevaRuta, distancia_km: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  step="0.01"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={agregarRuta}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                >
                  <FaPlus className="h-4 w-4 mr-2" />
                  Agregar Ruta
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/logistico/contratos')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <FaTimes className="h-4 w-4 mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center disabled:opacity-50"
            >
              <FaSave className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContratoForm;
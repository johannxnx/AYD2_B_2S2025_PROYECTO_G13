// src/pages/logistico/ContratoForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes, FaPlus, FaTrash, FaEdit, FaTruck, FaDollarSign, FaMap, FaGift, FaInfoCircle, FaLightbulb, FaCheckCircle, FaRocket, FaGlobeAmericas } from 'react-icons/fa';
import { useContratos } from '../../services/Logistico/hooks/useContratos';
import { getTipoUnidadLabel, formatMoney } from '../../services/Logistico/Logistico';
import LogisticHeader from '../../components/logistico/LogisticHeader';
import LogisticMenu from '../../components/logistico/LogisticMenu';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api';
import { ContratoService } from '../../services/Logistico/Logistico';
import { obtenerMonedaPorPais, obtenerNombreMonedaPorPais, obtenerSimboloMonedaPorPais } from '../../utils/monedaPorPais';

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
  id?: number; // Para distinguir rutas existentes
}

interface TarifaFormConId extends TarifaForm {
  id?: number; // Para distinguir tarifas existentes
}

interface DescuentoForm {
  tipo_unidad: string;
  porcentaje_descuento: number;
  observacion: string;
  id?: number; // Para distinguir descuentos existentes
}

// Rutas comunes predefinidas
const RUTAS_COMUNES = [
  { origen: 'Quetzaltenango', destino: 'Guatemala' },
  { origen: 'Quetzaltenango', destino: 'Puerto Barrios' },
  { origen: 'Guatemala', destino: 'Quetzaltenango' },
  { origen: 'Guatemala', destino: 'Puerto Barrios' },
  { origen: 'Puerto Barrios', destino: 'Quetzaltenango' },
  { origen: 'Puerto Barrios', destino: 'Guatemala' }
];

// Tipos de carga disponibles
const TIPOS_CARGA = [
  'General',
  'Refrigerado',
  'Frágil',
  'Peligroso',
  'Granel',
  'Contenedor',
  'Carga Pesada'
];

const ContratoForm: React.FC = () => {
  const navigate  = useNavigate();
  const { id }    = useParams<{ id: string }>();
  const { user }  = useAuth();
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
    cliente_id:      0,
    moneda_id:       1, // 1 = QUETZAL por defecto
    fecha_inicio:    '',
    fecha_fin:       '',
    limite_credito:  0,
    plazo_pago:      30,
    tarifas:         [] as TarifaFormConId[],
    rutas:           [] as RutaForm[],
    descuentos:      [] as DescuentoForm[]
  });

  const [nuevaTarifa, setNuevaTarifa] = useState<TarifaForm>({
    tarifario_id: 0, costo_km_negociado: 0, tipo_unidad: ''
  });

  const [nuevaRuta, setNuevaRuta] = useState<RutaForm>({
    origen: '', destino: '', distancia_km: 0, tipo_carga: ''
  });

  const [nuevoDescuento, setNuevoDescuento] = useState<DescuentoForm>({
    tipo_unidad: '', porcentaje_descuento: 0, observacion: ''
  });

  const [tipoRuta, setTipoRuta] = useState<'comun' | 'personalizada'>('comun');

  // Función para obtener el código de moneda (GTQ, USD, HNL, SVC) según el moneda_id
  const getCodigoMoneda = (monedaId: number): string => {
    const monedasMap: Record<number, string> = {
      1: 'GTQ',
      2: 'USD',
      6: 'HNL',
      7: 'SVC'
    };
    return monedasMap[monedaId] || 'GTQ';
  };

  // Función para obtener el símbolo de la moneda según el moneda_id
  const getSimboloMoneda = (monedaId: number): string => {
    const simbolosMap: Record<number, string> = {
      1: 'Q',
      2: '$',
      6: 'L',
      7: '₡'
    };
    return simbolosMap[monedaId] || 'Q';
  };

  // Función para obtener las 2 monedas disponibles: la del país + USD
  const getMonedasDisponibles = (): Array<{id: number, nombre: string, flag: string}> => {
    if (!monedaRecomendada) {
      return []; // Si no hay cliente, no hay opciones
    }

    const monedasInfo: Record<number, {nombre: string, flag: string}> = {
      1: { nombre: 'Q - QUETZAL (GTQ) - Guatemala', flag: '🇬🇹' },
      2: { nombre: '$ - DÓLAR (USD) - USA', flag: '🇺🇸' },
      6: { nombre: 'L - LEMPIRA (HNL) - Honduras', flag: '🇭🇳' },
      7: { nombre: '₡ - COLÓN (SVC) - El Salvador', flag: '🇸🇻' }
    };

    const monedaDelPais = monedasInfo[monedaRecomendada];
    const usd = monedasInfo[2];

    // Si moneda del país es USD, mostrar solo USD
    if (monedaRecomendada === 2) {
      return [{id: 2, nombre: usd.nombre, flag: usd.flag}];
    }

    // Mostrar moneda del país + USD
    return [
      {id: monedaRecomendada, nombre: monedaDelPais.nombre, flag: monedaDelPais.flag},
      {id: 2, nombre: usd.nombre, flag: usd.flag}
    ];
  };
  const [rutaSeleccionada, setRutaSeleccionada] = useState<string>('');

  const [clientes, setClientes]               = useState<any[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [loadingSubmit, setLoadingSubmit]     = useState(false);
  const [success, setSuccess]                 = useState<string | null>(null);
  const [paisClienteSeleccionado, setPaisClienteSeleccionado] = useState<string | null>(null);
  const [monedaRecomendada, setMonedaRecomendada] = useState<number | null>(null);

  const userName = user?.nombres && user?.apellidos
    ? `${user.nombres} ${user.apellidos}`
    : user?.email?.split('@')[0] || 'Operador Logístico';

  // Cargar clientes corporativos
  useEffect(() => {
    const cargarClientes = async () => {
      setLoadingClientes(true);
      try {
        const response = await (apiService as any).request(
          '/usuarios?tipo_usuario=CLIENTE_CORPORATIVO',
          { method: 'GET' }
        );
        if (response.ok) setClientes(response.data);
      } catch (err) {
        console.error('Error al cargar clientes:', err);
      } finally {
        setLoadingClientes(false);
      }
    };
    cargarClientes();
  }, []);

  // Cargar próximo número de contrato
  useEffect(() => {
    const cargarNumeroContrato = async () => {
      try {
        const response = await apiService.obtenerProxNumeroContrato();
        if (response.ok && response.data?.numero_contrato) {
          setFormData(prev => ({
            ...prev,
            numero_contrato: response.data.numero_contrato
          }));
        }
      } catch (err) {
        console.error('Error al obtener número de contrato:', err);
      }
    };
    cargarNumeroContrato();
  }, []);

  // Cargar contrato si es edición
  useEffect(() => {
    if (isEdit && id) cargarContrato(parseInt(id));
  }, [isEdit, id]);

  const cargarContrato = async (contratoId: number) => {
    const contrato = await obtenerContrato(contratoId);
    if (contrato) {
      setFormData({
        numero_contrato: contrato.numero_contrato,
        cliente_id:      contrato.cliente_id,
        moneda_id:       contrato.moneda_id || 1,
        fecha_inicio:    contrato.fecha_inicio.split('T')[0],
        fecha_fin:       contrato.fecha_fin.split('T')[0],
        limite_credito:  contrato.limite_credito,
        plazo_pago:      contrato.plazo_pago,
        tarifas: contrato.tarifas?.map((t: any) => ({
          tarifario_id:       t.tarifario_id,
          costo_km_negociado: t.costo_km_negociado,
          tipo_unidad:        t.tipo_unidad,
          id:                 t.id // Marcar como existente
        })) || [],
        rutas: contrato.rutas?.map((r: any) => ({
          origen:       r.origen,
          destino:      r.destino,
          distancia_km: r.distancia_km || 0,
          tipo_carga:   r.tipo_carga || '',
          id:           r.id // Marcar como existente
        })) || [],
        descuentos: contrato.descuentos?.map((d: any) => ({
          tipo_unidad:          d.tipo_unidad,
          porcentaje_descuento: d.porcentaje_descuento,
          observacion:          d.observacion || '',
          id:                   d.id // Marcar como existente
        })) || []
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'cliente_id' || name === 'moneda_id' || name === 'limite_credito' || name === 'plazo_pago'
        ? Number(value) : value
    }));

    // Lógica especial para cliente_id: auto-asignar moneda por país
    if (name === 'cliente_id') {
      const clienteSeleccionado = clientes.find(c => c.id === Number(value));
      if (clienteSeleccionado) {
        const pais = clienteSeleccionado.pais;
        setPaisClienteSeleccionado(pais);
        
        const monedaAutomatica = obtenerMonedaPorPais(pais);
        setMonedaRecomendada(monedaAutomatica);
        
        // Auto-asignar la moneda
        setFormData(prev => ({
          ...prev,
          moneda_id: monedaAutomatica
        }));
      }
    }
  };

  const handleTarifarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tarifarioId           = parseInt(e.target.value);
    const tarifarioSeleccionado = tarifarios.find(t => t.id === tarifarioId);
    if (tarifarioSeleccionado) {
      setNuevaTarifa({
        tarifario_id:       tarifarioId,
        costo_km_negociado: tarifarioSeleccionado.costo_base_km,
        tipo_unidad:        tarifarioSeleccionado.tipo_unidad
      });
    }
  };

  const agregarTarifa = () => {
    if (nuevaTarifa.tarifario_id && nuevaTarifa.costo_km_negociado > 0) {
      const existe = formData.tarifas.some(t => t.tipo_unidad === nuevaTarifa.tipo_unidad);
      if (existe) {
        alert(`Ya existe una tarifa para ${getTipoUnidadLabel(nuevaTarifa.tipo_unidad)}`);
        return;
      }
      setFormData(prev => ({ ...prev, tarifas: [...prev.tarifas, { ...nuevaTarifa }] }));
      setNuevaTarifa({ tarifario_id: 0, costo_km_negociado: 0, tipo_unidad: '' });
    } else {
      alert('Seleccione un tipo de unidad y verifique el costo');
    }
  };

  const eliminarTarifa = (index: number) => {
    setFormData(prev => ({ ...prev, tarifas: prev.tarifas.filter((_, i) => i !== index) }));
  };

  const agregarRuta = () => {
    let rutaParaAgregar = nuevaRuta;
    
    // Si es ruta común, cargar datos de la ruta seleccionada
    if (tipoRuta === 'comun' && rutaSeleccionada) {
      const rutaComun = RUTAS_COMUNES[parseInt(rutaSeleccionada)];
      rutaParaAgregar = { ...nuevaRuta, origen: rutaComun.origen, destino: rutaComun.destino };
    }
    
    if (rutaParaAgregar.origen && rutaParaAgregar.destino) {
      // Verificar si la ruta ya existe
      const existe = formData.rutas.some(r => 
        r.origen === rutaParaAgregar.origen && r.destino === rutaParaAgregar.destino
      );
      
      if (existe) {
        alert(`La ruta ${rutaParaAgregar.origen} → ${rutaParaAgregar.destino} ya existe`);
        return;
      }
      
      setFormData(prev => ({ ...prev, rutas: [...prev.rutas, { ...rutaParaAgregar }] }));
      setNuevaRuta({ origen: '', destino: '', distancia_km: 0, tipo_carga: '' });
      setTipoRuta('comun');
      setRutaSeleccionada('');
    } else {
      alert('Complete los campos requeridos');
    }
  };

  const eliminarRuta = (index: number) => {
    setFormData(prev => ({ ...prev, rutas: prev.rutas.filter((_, i) => i !== index) }));
  };

  const agregarDescuento = () => {
    if (nuevoDescuento.tipo_unidad && nuevoDescuento.porcentaje_descuento > 0 && nuevoDescuento.porcentaje_descuento <= 100) {
      const existe = formData.descuentos.some(d => d.tipo_unidad === nuevoDescuento.tipo_unidad);
      if (existe) {
        alert(`Ya existe un descuento para ${getTipoUnidadLabel(nuevoDescuento.tipo_unidad)}`);
        return;
      }
      setFormData(prev => ({ ...prev, descuentos: [...prev.descuentos, { ...nuevoDescuento }] }));
      setNuevoDescuento({ tipo_unidad: '', porcentaje_descuento: 0, observacion: '' });
    } else {
      alert('Seleccione tipo de unidad y porcentaje válido (0-100%)');
    }
  };

  const eliminarDescuento = (index: number) => {
    setFormData(prev => ({ ...prev, descuentos: prev.descuentos.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEdit && formData.tarifas.length === 0) {
      alert('Debe agregar al menos una tarifa negociada');
      return;
    }
    if (!formData.cliente_id || formData.cliente_id <= 0) {
      alert('Seleccione un cliente');
      return;
    }

    setLoadingSubmit(true);
    setSuccess(null);
    try {
      if (isEdit && id) {
        // Actualización del contrato base
        const payload = {
          moneda_id:      formData.moneda_id,
          fecha_inicio:   formData.fecha_inicio,
          fecha_fin:      formData.fecha_fin,
          limite_credito: formData.limite_credito,
          plazo_pago:     formData.plazo_pago,
          estado:         'VIGENTE'
        };
        await ContratoService.actualizar(parseInt(id), payload);

        // Agregar nuevas rutas (las que no tienen id)
        const rutasNuevas = formData.rutas.filter(r => !r.id);
        for (const ruta of rutasNuevas) {
          await ContratoService.agregarRuta(parseInt(id), {
            origen:       ruta.origen,
            destino:      ruta.destino,
            distancia_km: ruta.distancia_km || undefined,
            tipo_carga:   ruta.tipo_carga   || undefined
          });
        }

        // Agregar nuevos descuentos (los que no tienen id)
        const descuentosNuevos = formData.descuentos.filter(d => !d.id);
        for (const descuento of descuentosNuevos) {
          await ContratoService.agregarDescuento(parseInt(id), {
            tipo_unidad:          descuento.tipo_unidad,
            porcentaje_descuento: descuento.porcentaje_descuento,
            observacion:          descuento.observacion || undefined
          });
        }

        // Mostrar mensaje de éxito
        setSuccess(' Contrato actualizado exitosamente');
        setTimeout(() => {
          navigate('/logistico/contratos');
        }, 2000); // Esperar 2 segundos antes de redirigir
      } else {
        // Crear nuevo contrato
        const payload = {
          numero_contrato: formData.numero_contrato,
          cliente_id:      formData.cliente_id,
          moneda_id:       formData.moneda_id,
          fecha_inicio:    formData.fecha_inicio,
          fecha_fin:       formData.fecha_fin,
          limite_credito:  formData.limite_credito,
          plazo_pago:      formData.plazo_pago,
          tarifas: formData.tarifas.map(t => ({
            tarifario_id:       t.tarifario_id,
            costo_km_negociado: t.costo_km_negociado
          })),
          rutas: formData.rutas.map(r => ({
            origen:       r.origen,
            destino:      r.destino,
            distancia_km: r.distancia_km || undefined,
            tipo_carga:   r.tipo_carga   || undefined
          })),
          descuentos: formData.descuentos.map(d => ({
            tipo_unidad:          d.tipo_unidad,
            porcentaje_descuento: d.porcentaje_descuento,
            observacion:          d.observacion || undefined
          }))
        };
        const result = await crearContrato(payload);
        if (result) {
          setSuccess(' Contrato creado exitosamente');
          setTimeout(() => {
            navigate('/logistico/contratos');
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Error al guardar contrato:', err);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <LogisticHeader
        userName={userName}
        userRole={isEdit ? 'Editar Contrato' : 'Nuevo Contrato'}
      />
      <LogisticMenu />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Mejorado */}
        <div className="mb-10 bg-gradient-to-r from-orange-600 to-orange-700 rounded-2xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-5xl opacity-30">
                {isEdit ? <FaEdit /> : <FaTruck />}
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  {isEdit ? 'Editar Contrato' : 'Nuevo Contrato'}
                </h1>
                <p className="text-orange-100 text-lg">
                  {isEdit ? 'Modifica los detalles del contrato de transporte' : 'Registra un nuevo contrato con tarifas, rutas y descuentos'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg shadow-md flex justify-between items-center animate-pulse">
            <div className="flex items-center">
              <FaTimes className="text-2xl mr-3" />
              <span className="font-medium">{error}</span>
            </div>
            <button onClick={limpiarError} className="text-red-500 hover:text-red-700 font-bold transition-colors"><FaTimes className="h-5 w-5" /></button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg shadow-md flex justify-between items-center animate-pulse">
            <div className="flex items-center">
              <FaCheckCircle className="text-2xl mr-3" />
              <span className="font-medium">{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700 font-bold transition-colors"><FaTimes className="h-5 w-5" /></button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Datos Principales */}
          <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center mb-6 pb-4 border-b-2 border-orange-100">
              <FaEdit className="text-3xl mr-3 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">Datos del Contrato</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Número de Contrato *</label>
                <input
                  type="text"
                  name="numero_contrato"
                  value={formData.numero_contrato}
                  onChange={handleChange}
                  required
                  disabled={true}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed transition-colors"
                  placeholder="Se genera automáticamente"
                />
                <p className="text-xs text-gray-500 mt-1 flex items-center"><FaCheckCircle className="mr-2" /> Se genera automáticamente</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Cliente *</label>
                {loadingClientes ? (
                  <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-400">
                    Cargando clientes...
                  </div>
                ) : (
                  <select
                    name="cliente_id"
                    value={formData.cliente_id}
                    onChange={handleChange}
                    required
                    disabled={isEdit}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white disabled:bg-gray-100 transition-all hover:border-orange-300"
                  >
                    <option value={0}>Seleccione un cliente...</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre} — NIT: {cliente.nit}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Moneda del Contrato (Pactada) *</label>
                
                {/* Moneda Sugerida por País */}
                {paisClienteSeleccionado && monedaRecomendada && (
                  <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded flex items-start gap-3">
                    <FaLightbulb className="text-blue-600 text-lg mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Moneda Sugerida por País</p>
                      <p className="text-xs text-blue-700">
                        País: <span className="font-bold">{paisClienteSeleccionado}</span> 
                        {' '} → {' '}
                        <span className="font-bold text-blue-900">
                          {obtenerSimboloMonedaPorPais(paisClienteSeleccionado)} {obtenerNombreMonedaPorPais(paisClienteSeleccionado)}
                        </span>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Puedes cambiarla si es necesario</p>
                    </div>
                  </div>
                )}

                {/* Selector de Moneda - Dinámico (moneda del país + USD) */}
                <select
                  name="moneda_id"
                  value={formData.moneda_id}
                  onChange={handleChange}
                  disabled={!formData.cliente_id}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white transition-all hover:border-orange-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {!formData.cliente_id ? (
                    <option value={0}>Primero selecciona un cliente...</option>
                  ) : getMonedasDisponibles().length === 0 ? (
                    <option value={0}>Cargando monedas...</option>
                  ) : (
                    <>
                      <option value={0}>Seleccione una moneda...</option>
                      {getMonedasDisponibles().map(moneda => (
                        <option key={moneda.id} value={moneda.id}>
                          {moneda.flag} {moneda.nombre}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {!formData.cliente_id
                    ? 'Selecciona un cliente para ver sus monedas disponibles'
                    : `Moneda recomendada para ${paisClienteSeleccionado}: ${getMonedasDisponibles()[0]?.nombre || 'GTQ'}`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Inicio *</label>
                <input
                  type="date" name="fecha_inicio" value={formData.fecha_inicio}
                  onChange={handleChange} required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all hover:border-orange-300"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Fin *</label>
                <input
                  type="date" name="fecha_fin" value={formData.fecha_fin}
                  onChange={handleChange} required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all hover:border-orange-300"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Límite de Crédito ({obtenerSimboloMonedaPorPais(paisClienteSeleccionado)}) *
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center px-4 py-3 bg-gray-100 rounded-lg border-2 border-gray-300 text-gray-700 font-bold min-w-fit">
                    {obtenerSimboloMonedaPorPais(paisClienteSeleccionado)}
                  </div>
                  <input
                    type="number" name="limite_credito" value={formData.limite_credito}
                    onChange={handleChange} required step="0.01"
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 transition-all hover:border-orange-300"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  En moneda: <span className="font-bold">{obtenerNombreMonedaPorPais(paisClienteSeleccionado)}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Plazo de Pago *</label>
                <select
                  name="plazo_pago" value={formData.plazo_pago}
                  onChange={handleChange} required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-600 focus:border-orange-600 bg-white transition-all hover:border-orange-300"
                >
                  <option value={15}>15 días</option>
                  <option value={30}>30 días</option>
                  <option value={45}>45 días</option>
                </select>
              </div>

            </div>
          </div>

          {/* Tarifas Negociadas */}
          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-blue-100">
              <div className="flex items-center">
                <FaDollarSign className="text-3xl mr-3 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Tarifas Negociadas</h2>
              </div>
              {isEdit && formData.tarifas.length > 0 && (
                <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {formData.tarifas.filter(t => t.id).length} existentes
                </span>
              )}
            </div>

            {isEdit && (
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg text-blue-700 flex items-center">
                <FaInfoCircle className="text-2xl mr-3" />
                <span>Las tarifas negociadas no pueden ser modificadas. Solo se pueden agregar rutas autorizadas.</span>
              </div>
            )}

            {formData.tarifas.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.tarifas.map((tarifa, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border-l-4 border-orange-500">
                    <div>
                      <span className="font-medium">{getTipoUnidadLabel(tarifa.tipo_unidad)}</span>
                      <span className="text-gray-500 ml-2">{getSimboloMoneda(formData.moneda_id)} {tarifa.costo_km_negociado.toFixed(2)}/km</span>
                      {tarifa.id && <span className="text-xs text-green-600 ml-2">(Existente)</span>}
                      {!tarifa.id && <span className="text-xs text-blue-600 ml-2">(Nueva)</span>}
                    </div>
                    {!isEdit && (
                      <button type="button" onClick={() => eliminarTarifa(index)} className="text-red-500 hover:text-red-700">
                        <FaTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isEdit && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Unidad *</label>
                  <select
                    value={nuevaTarifa.tarifario_id} onChange={handleTarifarioChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all hover:border-blue-300"
                    disabled={loadingTarifarios}
                  >
                    <option value="">Seleccionar</option>
                    {tarifarios.map(t => (
                      <option key={t.id} value={t.id}>
                        {getTipoUnidadLabel(t.tipo_unidad)} - {getSimboloMoneda(formData.moneda_id)} {t.costo_base_km.toFixed(2)}/km (base)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Costo negociado por km ({getCodigoMoneda(formData.moneda_id)}) *</label>
                  <input
                    type="number" value={isNaN(nuevaTarifa.costo_km_negociado) ? '' : nuevaTarifa.costo_km_negociado}
                    onChange={(e) => setNuevaTarifa({ ...nuevaTarifa, costo_km_negociado: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all hover:border-blue-300"
                    step="0.01" placeholder="Ej: 7.50"
                  />
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={agregarTarifa}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center font-semibold"
                  >
                    <FaPlus className="h-5 w-5 mr-2" />
                    Agregar Tarifa
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Rutas Autorizadas */}
          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-purple-100">
              <div className="flex items-center">
                <FaMap className="text-3xl mr-3 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">Rutas Autorizadas</h2>
                <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">Opcional</span>
              </div>
              {isEdit && formData.rutas.length > 0 && (
                <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  {formData.rutas.filter(r => r.id).length} existentes • {formData.rutas.filter(r => !r.id).length} nuevas
                </span>
              )}
            </div>

            {isEdit && (
              <div className="mb-6 p-4 bg-purple-50 border-l-4 border-purple-500 rounded-lg text-purple-700 flex items-center">
                <FaRocket className="text-2xl mr-3" />
                <span>Puedes agregar nuevas rutas autorizadas a este contrato.</span>
              </div>
            )}

            {formData.rutas.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.rutas.map((ruta, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                    <div>
                      <span className="font-medium">{ruta.origen} → {ruta.destino}</span>
                      {ruta.distancia_km > 0 && <span className="text-gray-500 ml-2">{ruta.distancia_km} km</span>}
                      {ruta.tipo_carga && <span className="text-gray-500 ml-2">({ruta.tipo_carga})</span>}
                      {ruta.id && <span className="text-xs text-green-600 ml-2">(Existente)</span>}
                      {!ruta.id && <span className="text-xs text-blue-600 ml-2">(Nueva)</span>}
                    </div>
                    <button type="button" onClick={() => eliminarRuta(index)} className="text-red-500 hover:text-red-700">
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tabs: Ruta Común o Personalizada */}
            <div className="flex space-x-4 mb-4 border-b border-gray-300">
              <button
                type="button"
                onClick={() => setTipoRuta('comun')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  tipoRuta === 'comun'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ruta Común (6 habituales)
              </button>
              <button
                type="button"
                onClick={() => setTipoRuta('personalizada')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  tipoRuta === 'personalizada'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ruta Personalizada
              </button>
            </div>

            {tipoRuta === 'comun' ? (
              // Seleccionar ruta común
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">Selecciona una ruta</label>
                <select
                  value={rutaSeleccionada}
                  onChange={(e) => setRutaSeleccionada(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all hover:border-purple-300"
                >
                  <option value="">- Seleccionar una ruta -</option>
                  {RUTAS_COMUNES.map((ruta, idx) => (
                    <option key={idx} value={idx}>
                      {ruta.origen} → {ruta.destino}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              // Ingresar ruta personalizada
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Origen *</label>
                  <input
                    type="text"
                    value={nuevaRuta.origen}
                    onChange={(e) => setNuevaRuta({ ...nuevaRuta, origen: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all hover:border-purple-300"
                    placeholder="ej: Escuintla"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Destino *</label>
                  <input
                    type="text"
                    value={nuevaRuta.destino}
                    onChange={(e) => setNuevaRuta({ ...nuevaRuta, destino: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all hover:border-purple-300"
                    placeholder="ej: Cobán"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Distancia (km)</label>
                <input
                  type="number"
                  value={isNaN(nuevaRuta.distancia_km) ? '' : nuevaRuta.distancia_km}
                  onChange={(e) => setNuevaRuta({ ...nuevaRuta, distancia_km: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all hover:border-purple-300"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Carga</label>
                <select
                  value={nuevaRuta.tipo_carga}
                  onChange={(e) => setNuevaRuta({ ...nuevaRuta, tipo_carga: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all hover:border-purple-300"
                >
                  <option value="">- Seleccionar -</option>
                  {TIPOS_CARGA.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button type="button" onClick={agregarRuta}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg flex items-center font-semibold"
              >
                <FaPlus className="h-5 w-5 mr-2" />
                Agregar Ruta
              </button>
            </div>
          </div>

          {/* Descuentos */}
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-green-100">
              <div className="flex items-center">
                <FaGift className="text-3xl mr-3 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Descuentos Especiales</h2>
                <span className="ml-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Opcional</span>
              </div>
              {isEdit && formData.descuentos.length > 0 && (
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  {formData.descuentos.filter(d => d.id).length} existentes • {formData.descuentos.filter(d => !d.id).length} nuevos
                </span>
              )}
            </div>

            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg text-green-700 flex items-center">
              <FaLightbulb className="text-2xl mr-3" />
              <span>Los descuentos se aplican por tipo de unidad (LIGERA, PESADA, CABEZAL). Úsalos para ofrecer tarifas especiales.</span>
            </div>

            {formData.descuentos.length > 0 && (
              <div className="mb-4 space-y-2">
                {formData.descuentos.map((descuento, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border-l-4 border-green-500">
                    <div>
                      <span className="font-medium">{getTipoUnidadLabel(descuento.tipo_unidad)}</span>
                      <span className="text-gray-500 ml-2">{getSimboloMoneda(formData.moneda_id)} {descuento.porcentaje_descuento}% desc.</span>
                      {descuento.observacion && <span className="text-gray-400 ml-2">- {descuento.observacion}</span>}
                      {descuento.id && <span className="text-xs text-green-600 ml-2">(Existente)</span>}
                      {!descuento.id && <span className="text-xs text-blue-600 ml-2">(Nuevo)</span>}
                    </div>
                    <button type="button" onClick={() => eliminarDescuento(index)} className="text-red-500 hover:text-red-700">
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tipo Unidad</label>
                <select
                  value={nuevoDescuento.tipo_unidad}
                  onChange={(e) => setNuevoDescuento({ ...nuevoDescuento, tipo_unidad: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all hover:border-green-300"
                >
                  <option value="">Seleccionar</option>
                  <option value="LIGERA">Ligera</option>
                  <option value="PESADA">Pesada</option>
                  <option value="CABEZAL">Cabezal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Porcentaje Descuento (%)</label>
                <input
                  type="number"
                  value={isNaN(nuevoDescuento.porcentaje_descuento) ? '' : nuevoDescuento.porcentaje_descuento}
                  onChange={(e) => setNuevoDescuento({ ...nuevoDescuento, porcentaje_descuento: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all hover:border-green-300"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Ej: 5.00"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Observación</label>
                <input
                  type="text"
                  value={nuevoDescuento.observacion}
                  onChange={(e) => setNuevoDescuento({ ...nuevoDescuento, observacion: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 transition-all hover:border-green-300"
                  placeholder="Motivo del descuento"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button type="button" onClick={agregarDescuento}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg flex items-center font-semibold"
              >
                <FaPlus className="h-5 w-5 mr-2" />
                Agregar Descuento
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-between items-center pt-8 border-t-2 border-gray-200">
            <button type="button" onClick={() => navigate('/logistico/contratos')}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center font-semibold text-lg"
            >
              <FaTimes className="h-5 w-5 mr-2" />
              Cancelar
            </button>
            <button type="submit" disabled={loading || loadingSubmit}
              className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl flex items-center disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
            >
              <FaSave className="h-5 w-5 mr-2" />
              {loading || loadingSubmit ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ContratoForm;
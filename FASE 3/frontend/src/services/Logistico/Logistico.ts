// src/services/Logistico/Logistico.ts
import apiService from '../api';
import type { 
  Contrato, 
  CrearContratoPayload,
  ValidacionCliente,
  DescuentoContrato,
  RutaAutorizada,
  Tarifario,
  RangosReferencia
} from '../api';

// ============ TIPOS ESPECÍFICOS PARA LOGÍSTICA ============

export type ClienteSimple = {
  id: number;
  nombre: string;
  nit: string;
  email: string;
  telefono?: string;
  pais?: string;
  tipo_usuario?: string;
};

export type TarifaNegociada = {
  tarifario_id: number;
  tipo_unidad: string;
  costo_km_negociado: number;
};

export type ContratoConDetalles = Contrato & {
  tarifas?: TarifaNegociada[];
  rutas?: RutaAutorizada[];
  descuentos?: DescuentoContrato[];
};

export type ResumenValidacion = {
  esValido: boolean;
  contratoId?: number;
  contratoNumero?: string;
  tarifaAplicable?: number;
  descuentoAplicable?: number;
  costoFinalPorKm?: number;
  mensaje?: string;
};

// Mapeo de tipos de unidad para mostrar en UI
export const TIPO_UNIDAD_MAP: Record<string, { label: string; color: string }> = {
  LIGERA:  { label: 'Ligera',  color: 'bg-green-100 text-green-800'  },
  PESADA:  { label: 'Pesada',  color: 'bg-orange-100 text-orange-800' },
  CABEZAL: { label: 'Cabezal', color: 'bg-purple-100 text-purple-800' }
};

// ============ SERVICIOS DE CONTRATOS ============

export const ContratoService = {

  crear: async (payload: CrearContratoPayload): Promise<Contrato> => {
    const response = await apiService.crearContrato(payload);
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al crear contrato');
    }
    return response.data;
  },

  obtener: async (id: number): Promise<ContratoConDetalles> => {
    const response = await apiService.obtenerContrato(id);
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al obtener contrato');
    }
    return response.data as ContratoConDetalles;
  },

  listarPorCliente: async (clienteId: number): Promise<Contrato[]> => {
    const response = await apiService.listarContratosPorCliente(clienteId);
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al listar contratos');
    }
    return response.data;
  },

  // CORRECCIÓN — modificarContrato usa PUT en lugar de POST
  actualizar: async (id: number, payload: Partial<CrearContratoPayload>): Promise<Contrato> => {
    const response = await apiService.modificarContrato(id, payload);
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al actualizar contrato');
    }
    return response.data;
  },

  listarTodos: async (params?: { limit?: number; estado?: string }): Promise<Contrato[]> => {
    const response = await apiService.listarTodosContratos(params);
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al listar contratos');
    }
    return response.data;
  },

  validarServicio: async (
    clienteId: number,
    origen: string,
    destino: string,
    tipoUnidad: string
  ): Promise<ResumenValidacion> => {
    const response = await apiService.validarCliente(clienteId, { origen, destino, tipo_unidad: tipoUnidad });

    if (!response.ok) {
      return { esValido: false, mensaje: response.mensaje || 'Error al validar cliente' };
    }

    const data = response.data as ValidacionCliente;

    if (!data.valido) {
      return { esValido: false, mensaje: data.mensaje || 'Cliente no autorizado para este servicio' };
    }

    let costoFinal = data.tarifa_negociada?.costo_km_negociado || 0;
    if (data.descuento && data.descuento.porcentaje_descuento > 0) {
      costoFinal = costoFinal * (1 - data.descuento.porcentaje_descuento / 100);
    }

    return {
      esValido:           true,
      contratoId:         data.contrato?.id,
      contratoNumero:     data.contrato?.numero_contrato,
      tarifaAplicable:    data.tarifa_negociada?.costo_km_negociado,
      descuentoAplicable: data.descuento?.porcentaje_descuento,
      costoFinalPorKm:    costoFinal,
      mensaje:            'Cliente autorizado para el servicio'
    };
  },

  agregarDescuento: async (contratoId: number, descuento: DescuentoContrato): Promise<any> => {
    const response = await apiService.agregarDescuento(contratoId, descuento);
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al agregar descuento');
    }
    return response.data;
  },

  agregarRuta: async (contratoId: number, ruta: RutaAutorizada): Promise<any> => {
    const response = await apiService.agregarRuta(contratoId, ruta);
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al agregar ruta');
    }
    return response.data;
  },

  obtenerTarifarios: async (): Promise<Tarifario[]> => {
    const response = await apiService.obtenerTarifarios();
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al obtener tarifarios');
    }
    return response.data;
  },

  obtenerRangosReferencia: async (): Promise<RangosReferencia> => {
    const response = await apiService.obtenerRangosReferencia();
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al obtener rangos de referencia');
    }
    return response.data;
  }
};

// ============ UTILIDADES ============

export const formatMoney = (value: number, currencyCode: string = 'GTQ'): string => {
  // Mapeo de códigos de moneda a la configuración correcta de Intl
  const currencyConfigs: Record<string, { locale: string; code: string }> = {
    'GTQ': { locale: 'es-GT', code: 'GTQ' },  // Quetzal Guatemalteco
    'USD': { locale: 'en-US', code: 'USD' },  // Dólar Estadounidense
    'HNL': { locale: 'es-HN', code: 'HNL' },  // Lempira Hondureño
    'SVC': { locale: 'es-SV', code: 'SVC' },  // Colón Salvadoreño
  };

  const config = currencyConfigs[currencyCode] || currencyConfigs['GTQ'];

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 2
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// CORRECCIÓN — agregado EXPIRADO y SUSPENDIDO que usa tu BD
export const getContratoEstadoInfo = (estado: string) => {
  const estados: Record<string, { label: string; color: string; bg: string }> = {
    VIGENTE:    { label: 'Vigente',    color: 'text-green-800',  bg: 'bg-green-100'  },
    EXPIRADO:   { label: 'Expirado',   color: 'text-red-800',    bg: 'bg-red-100'    },
    SUSPENDIDO: { label: 'Suspendido', color: 'text-yellow-800', bg: 'bg-yellow-100' }
  };
  return estados[estado] || { label: estado, color: 'text-gray-800', bg: 'bg-gray-100' };
};

export const getTipoUnidadLabel = (tipo: string): string => {
  return TIPO_UNIDAD_MAP[tipo]?.label || tipo;
};

export const getTipoUnidadColor = (tipo: string): string => {
  return TIPO_UNIDAD_MAP[tipo]?.color || 'bg-gray-100 text-gray-800';
};
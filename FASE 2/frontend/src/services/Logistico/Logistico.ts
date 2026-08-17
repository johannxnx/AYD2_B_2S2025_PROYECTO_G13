// src/services/Logistico/Logistico.ts
import apiService from '../api';
import type { 
  ApiResponse, 
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
  tipo_usuario?: string;
};

export type TarifaNegociada = {
  tarifario_id: number;
  tipo_unidad: string;
  costo_km_negociado: number;
};

export type ContratoConDetalles = Contrato & {
  tarifas_negociadas?: TarifaNegociada[];
  rutas_autorizadas?: RutaAutorizada[];
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
  LIGERA: { label: 'Ligera', color: 'bg-green-100 text-green-800' },
  PESADA: { label: 'Pesada', color: 'bg-orange-100 text-orange-800' },
  CABEZAL: { label: 'Cabezal', color: 'bg-purple-100 text-purple-800' }
};

// ============ SERVICIOS DE CONTRATOS ============

export const ContratoService = {
  /**
   * Crear un nuevo contrato
   */
  crear: async (payload: CrearContratoPayload): Promise<Contrato> => {
    const response = await apiService.crearContrato(payload);
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al crear contrato');
    }
    return response.data;
  },

  /**
   * Obtener contrato por ID
   */
  obtener: async (id: number): Promise<ContratoConDetalles> => {
    const response = await apiService.obtenerContrato(id);
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al obtener contrato');
    }
    return response.data as ContratoConDetalles;
  },

  /**
   * Listar contratos de un cliente
   */
  listarPorCliente: async (clienteId: number): Promise<Contrato[]> => {
    const response = await apiService.listarContratosPorCliente(clienteId);
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al listar contratos');
    }
    return response.data;
  },

  /**
   * Actualizar contrato
   */
  actualizar: async (id: number, payload: Partial<CrearContratoPayload>): Promise<Contrato> => {
    const response = await apiService.modificarContrato(id, payload);
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al actualizar contrato');
    }
    return response.data;
  },

  /**
   * Validar si un cliente puede realizar un servicio
   */
  validarServicio: async (
    clienteId: number,
    origen: string,
    destino: string,
    tipoUnidad: string
  ): Promise<ResumenValidacion> => {
    const response = await apiService.validarCliente(clienteId, { origen, destino, tipo_unidad: tipoUnidad });
    
    if (!response.ok) {
      return {
        esValido: false,
        mensaje: response.mensaje || 'Error al validar cliente'
      };
    }

    const data = response.data as ValidacionCliente;
    
    if (!data.valido) {
      return {
        esValido: false,
        mensaje: data.mensaje || 'Cliente no autorizado para este servicio'
      };
    }

    // Calcular costo final con descuento si aplica
    let costoFinal = data.tarifa_negociada?.costo_km_negociado || 0;
    if (data.descuento && data.descuento.porcentaje_descuento > 0) {
      costoFinal = costoFinal * (1 - data.descuento.porcentaje_descuento / 100);
    }

    return {
      esValido: true,
      contratoId: data.contrato?.id,
      contratoNumero: data.contrato?.numero_contrato,
      tarifaAplicable: data.tarifa_negociada?.costo_km_negociado,
      descuentoAplicable: data.descuento?.porcentaje_descuento,
      costoFinalPorKm: costoFinal,
      mensaje: 'Cliente autorizado para el servicio'
    };
  },

  
  // src/services/Logistico/Logistico.ts
// Agregar esta función al objeto ContratoService

/**
 * Listar todos los contratos del sistema
 */
listarTodos: async (params?: { limit?: number; estado?: string }): Promise<Contrato[]> => {
  const response = await apiService.listarTodosContratos(params);
  if (!response.ok) {
    throw new Error(response.mensaje || 'Error al listar contratos');
  }
  return response.data;
},
  /**
   * Agregar descuento a un contrato
   */
  agregarDescuento: async (contratoId: number, descuento: DescuentoContrato): Promise<any> => {
    const response = await apiService.agregarDescuento(contratoId, descuento);
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al agregar descuento');
    }
    return response.data;
  },

  /**
   * Agregar ruta autorizada a un contrato
   */
  agregarRuta: async (contratoId: number, ruta: RutaAutorizada): Promise<any> => {
    const response = await apiService.agregarRuta(contratoId, ruta);
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al agregar ruta');
    }
    return response.data;
  },

  /**
   * Obtener lista de tarifarios disponibles
   */
  obtenerTarifarios: async (): Promise<Tarifario[]> => {
    const response = await apiService.obtenerTarifarios();
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al obtener tarifarios');
    }
    return response.data;
  },

  /**
   * Obtener rangos de referencia
   */
  obtenerRangosReferencia: async (): Promise<RangosReferencia> => {
    const response = await apiService.obtenerRangosReferencia();
    if (!response.ok) {
      throw new Error(response.mensaje || 'Error al obtener rangos de referencia');
    }
    return response.data;
  }
};

// ============ UTILIDADES ============

export const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
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

export const getContratoEstadoInfo = (estado: string) => {
  const estados: Record<string, { label: string; color: string; bg: string }> = {
    VIGENTE: { label: 'Vigente', color: 'text-green-800', bg: 'bg-green-100' },
    VENCIDO: { label: 'Vencido', color: 'text-red-800', bg: 'bg-red-100' },
    CANCELADO: { label: 'Cancelado', color: 'text-gray-800', bg: 'bg-gray-100' },
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
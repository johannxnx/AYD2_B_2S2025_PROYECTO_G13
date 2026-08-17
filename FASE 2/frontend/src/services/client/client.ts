// src/services/client/client.ts
import apiService from '../api';
import type { Contrato } from '../api';

// tipos especificos del cliente

export type DashboardStats = {
  activeContracts: number;
  pendingOrders: number;
  pendingInvoices: number;
  availableCredit: number;
  totalCreditLimit: number;
  usedCredit: number;
};

export type ContratoCliente = Contrato & {
  tarifas_negociadas?: Array<{
    tarifario_id: number;
    tipo_unidad: string;
    costo_km_negociado: number;
  }>;
  rutas_autorizadas?: Array<{
    origen: string;
    destino: string;
    distancia_km?: number;
    tipo_carga?: string;
  }>;
  descuentos?: Array<{
    tipo_unidad: string;
    porcentaje_descuento: number;
    observacion?: string;
  }>;
};

export type ActividadReciente = {
  id: number;
  tipo: 'contrato' | 'orden' | 'pago';
  descripcion: string;
  fecha: string;
  estado: string;
};

// servicios del cliente

export const ClientService = {
  /**
   * Obtener contratos del cliente autenticado
   */
  obtenerMisContratos: async (clienteId: number): Promise<ContratoCliente[]> => {
    console.log('[ClientService] obtenerMisContratos - clienteId:', clienteId);
    try {
      const response = await apiService.listarContratosPorCliente(clienteId);
      console.log('[ClientService] obtenerMisContratos - response:', response);
      if (!response.ok) {
        throw new Error(response.mensaje || 'Error al obtener contratos');
      }
      return response.data as ContratoCliente[];
    } catch (error) {
      console.error('[ClientService] obtenerMisContratos error:', error);
      throw error;
    }
  },

  /**
   * Obtener detalle de un contrato específico
   */
  obtenerDetalleContrato: async (contratoId: number): Promise<ContratoCliente> => {
    console.log('[ClientService] obtenerDetalleContrato - contratoId:', contratoId);
    try {
      const response = await apiService.obtenerContrato(contratoId);
      if (!response.ok) {
        throw new Error(response.mensaje || 'Error al obtener detalle del contrato');
      }
      return response.data as ContratoCliente;
    } catch (error) {
      console.error('[ClientService] obtenerDetalleContrato error:', error);
      throw error;
    }
  },

  /**
   * Calcular estadísticas del dashboard a partir de los contratos
   */
  calcularEstadisticas: (contratos: ContratoCliente[]): DashboardStats => {
    const contratosActivos = contratos.filter(c => c.estado === 'VIGENTE');
    const totalCredito = contratosActivos.reduce((sum, c) => sum + (c.limite_credito || 0), 0);
    const totalUsado = contratosActivos.reduce((sum, c) => sum + (c.saldo_usado || 0), 0);
    const creditoDisponible = totalCredito - totalUsado;

    return {
      activeContracts: contratosActivos.length,
      pendingOrders: 0,
      pendingInvoices: 0,
      availableCredit: creditoDisponible,
      totalCreditLimit: totalCredito,
      usedCredit: totalUsado
    };
  },

  /**
   * Obtener el contrato activo más reciente
   */
  obtenerContratoActivo: (contratos: ContratoCliente[]): ContratoCliente | null => {
    const contratosActivos = contratos.filter(c => c.estado === 'VIGENTE');
    if (contratosActivos.length === 0) return null;
    
    return contratosActivos.sort((a, b) => 
      new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime()
    )[0];
  },

  /**
   * Generar actividades recientes a partir de los contratos
   */
  generarActividadesRecientes: (contratos: ContratoCliente[]): ActividadReciente[] => {
    const actividades: ActividadReciente[] = [];
    
    contratos.slice(0, 5).forEach(contrato => {
      actividades.push({
        id: contrato.id,
        tipo: 'contrato',
        descripcion: `Contrato ${contrato.numero_contrato} creado`,
        fecha: contrato.fecha_creacion,
        estado: contrato.estado === 'VIGENTE' ? 'Activo' : 'Finalizado'
      });
    });
    
    return actividades;
  }
};

// utilidades

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
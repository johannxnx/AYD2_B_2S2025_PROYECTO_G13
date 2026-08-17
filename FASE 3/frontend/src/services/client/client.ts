// src/services/client/client.ts
import apiService from "../api";
import type { Contrato, RutaAutorizada } from "../api";

// ============ TIPOS ESPECÍFICOS PARA CLIENTE ==========

export type DashboardStats = {
  activeContracts: number;
  pendingOrders: number; // Órdenes que no han sido entregadas o canceladas
  completedOrders: number; // Órdenes entregadas
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
  rutas_autorizadas?: Array<RutaAutorizada>;
  descuentos?: Array<{
    tipo_unidad: string;
    porcentaje_descuento: number;
    observacion?: string;
  }>;
};

export type OrdenCliente = {
  id: number;
  numero_orden: string;
  origen: string;
  destino: string;
  tipo_mercancia: string;
  peso_estimado: number;
  peso_real?: number;
  costo: number;
  estado: string;
  fecha_creacion: string;
  fecha_despacho?: string;
  fecha_entrega?: string;
};
export type ActividadReciente = {
  id: number;
  tipo: "contrato" | "orden" | "pago";
  descripcion: string;
  fecha: string;
  estado: string;
};

// ============ SERVICIOS DEL CLIENTE ==========

export const ClientService = {
  /**
   * Obtener contratos del cliente autenticado
   */
  obtenerMisContratos: async (
    clienteId: number,
  ): Promise<ContratoCliente[]> => {
    try {
      const response = await apiService.listarContratosPorCliente(clienteId);
      if (!response.ok) {
        throw new Error(response.mensaje || "Error al obtener contratos");
      }
      return response.data as ContratoCliente[];
    } catch (error) {
      console.error("[ClientService] obtenerMisContratos error:", error);
      throw error;
    }
  },

  /**
   * Obtener detalle de un contrato específico
   */
  obtenerDetalleContrato: async (
    contratoId: number,
  ): Promise<ContratoCliente> => {
    try {
      const response = await apiService.obtenerContrato(contratoId);
      if (!response.ok) {
        throw new Error(
          response.mensaje || "Error al obtener detalle del contrato",
        );
      }
      return response.data as ContratoCliente;
    } catch (error) {
      console.error("[ClientService] obtenerDetalleContrato error:", error);
      throw error;
    }
  },

  /**
   * Obtener órdenes del cliente
   */
  obtenerMisOrdenes: async (usuarioId: number): Promise<OrdenCliente[]> => {
    try {
      const response = await apiService.listarOrdenesPorUsuario(usuarioId);
      if (!response.ok) {
        throw new Error(response.mensaje || "Error al obtener órdenes");
      }
      return response.data as OrdenCliente[];
    } catch (error) {
      console.error("[ClientService] obtenerMisOrdenes error:", error);
      throw error;
    }
  },

  /**
   * Obtener rutas autorizadas para el cliente
   */
  obtenerRutasAutorizadas: async (
    usuarioId: number,
  ): Promise<RutaAutorizada[]> => {
    try {
      const response = await apiService.obtenerRutasAutorizadas(usuarioId);
      if (!response.ok) {
        throw new Error(
          response.mensaje || "Error al obtener rutas autorizadas",
        );
      }
      return response.data as RutaAutorizada[];
    } catch (error) {
      console.error("[ClientService] obtenerRutasAutorizadas error:", error);
      throw error;
    }
  },

  /**
   * Calcular estadísticas globales mezclando contratos y órdenes
   */
  calcularEstadisticas: (
    contratos: ContratoCliente[],
    ordenes: OrdenCliente[] = [],
  ): DashboardStats => {
    const contratosActivos = contratos.filter((c) => c.estado === "VIGENTE");

    const totalCredito = contratosActivos.reduce(
      (sum, c) => sum + (c.limite_credito || 0),
      0,
    );
    const totalUsado = contratosActivos.reduce(
      (sum, c) => sum + (c.saldo_usado || 0),
      0,
    );

    const pendientes = ordenes.filter(
      (o) => !["ENTREGADA", "CANCELADA"].includes(o.estado),
    ).length;

    const completadas = ordenes.filter((o) => o.estado === "ENTREGADA").length;

    return {
      activeContracts: contratosActivos.length,
      pendingOrders: pendientes,
      completedOrders: completadas,
      pendingInvoices: 0,
      availableCredit: totalCredito - totalUsado,
      totalCreditLimit: totalCredito,
      usedCredit: totalUsado,
    };
  },

  /**
   * Obtener el contrato activo más reciente
   */
  obtenerContratoActivo: (
    contratos: ContratoCliente[],
  ): ContratoCliente | null => {
    const contratosActivos = contratos.filter((c) => c.estado === "VIGENTE");
    if (contratosActivos.length === 0) return null;

    return contratosActivos.sort(
      (a, b) =>
        new Date(b.fecha_creacion).getTime() -
        new Date(a.fecha_creacion).getTime(),
    )[0];
  },

  /**
   * Generar feed de actividades (mezcla contratos y órdenes si se desea)
   */
  generarActividadesRecientes: (
    contratos: ContratoCliente[],
    ordenes: OrdenCliente[] = [],
  ): ActividadReciente[] => {
    const actividades: ActividadReciente[] = [];

    // Agregar contratos a actividades
    contratos.slice(0, 3).forEach((c) => {
      actividades.push({
        id: c.id,
        tipo: "contrato",
        descripcion: `Contrato ${c.numero_contrato} registrado`,
        fecha: c.fecha_creacion,
        estado: c.estado,
      });
    });

    // Agregar órdenes a actividades
    ordenes.slice(0, 3).forEach((o) => {
      actividades.push({
        id: o.id,
        tipo: "orden",
        descripcion: `Orden ${o.numero_orden} - ${o.destino}`,
        fecha: o.fecha_creacion,
        estado: o.estado,
      });
    });

    // Ordenar por fecha descendente
    return actividades.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
  },

  /**
   * Info visual para estados de Órdenes
   */
  getOrdenEstadoInfo: (estado: string) => {
    const estados: Record<
      string,
      { label: string; color: string; bg: string }
    > = {
      PENDIENTE_PLANIFICACION: {
        label: "Pendiente",
        color: "text-blue-800",
        bg: "bg-blue-100",
      },
      EN_TRANSITO: {
        label: "En Ruta",
        color: "text-amber-800",
        bg: "bg-amber-100",
      },
      ENTREGADA: {
        label: "Entregada",
        color: "text-green-800",
        bg: "bg-green-100",
      },
      CANCELADA: {
        label: "Cancelada",
        color: "text-red-800",
        bg: "bg-red-100",
      },
    };
    return (
      estados[estado] || {
        label: estado,
        color: "text-gray-800",
        bg: "bg-gray-100",
      }
    );
  },
};

// ============ UTILIDADES ==========

export const formatMoney = (value: number, monedaCode?: string): string => {
  // Mapeo de códigos a monedas soportadas por Intl.NumberFormat
  const monedaMap: Record<string, string> = {
    'GTQ': 'GTQ',  // Quetzal Guatemalteco
    'USD': 'USD',  // Dólar Estadounidense
    'HNL': 'HNL',  // Lempira Hondureño
    'SVC': 'SVC',  // Colón Salvadoreño - se formatea manualmente
  };
  
  const codigoMoneda = monedaMap[monedaCode || 'GTQ'] || 'GTQ';
  
  // Especial para SVC: construir manualmente el formato
  if (codigoMoneda === 'SVC') {
    const numero = value.toLocaleString("es-GT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `₡ ${numero}`;
  }
  
  // Para otras monedas, usar Intl.NumberFormat
  const formatter = new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: codigoMoneda,
    minimumFractionDigits: 2,
  });
  
  return formatter.format(value);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("es-GT", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const getContratoEstadoInfo = (estado: string) => {
  const estados: Record<string, { label: string; color: string; bg: string }> =
    {
      VIGENTE: {
        label: "Vigente",
        color: "text-green-800",
        bg: "bg-green-100",
      },
      VENCIDO: { label: "Vencido", color: "text-red-800", bg: "bg-red-100" },
      CANCELADO: {
        label: "Cancelado",
        color: "text-gray-800",
        bg: "bg-gray-100",
      },
      SUSPENDIDO: {
        label: "Suspendido",
        color: "text-yellow-800",
        bg: "bg-yellow-100",
      },
    };
  return (
    estados[estado] || {
      label: estado,
      color: "text-gray-800",
      bg: "bg-gray-100",
    }
  );
};

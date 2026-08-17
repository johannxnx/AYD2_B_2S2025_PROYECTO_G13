// src/services/patio/patioApi.ts
import apiService from '../api';
import type { ApiResponse } from '../api';

// Tipos para órdenes planificadas
export type OrdenPlanificada = {
  id: number;
  numero_orden: string;
  origen: string;
  destino: string;
  tipo_mercancia: string;
  peso_estimado: number;
};

// Tipos para respuesta de salida de patio
export type SalidaPatioResponse = {
  id: number;
  numero_orden: string;
  estado: string;
  peso_real: number;
  costo: number;
  fecha_despacho: string;
};

// Tipos para el payload de salida de patio
export type SalidaPatioPayload = {
  codigo_orden: string;
  peso_real: number;
  asegurada: boolean;
  estibada: boolean;
};

// Servicio de patio
export const patioApi = {
  /**
   * Obtener órdenes planificadas (para patio)
   * GET /orden/planificada
   */
  getOrdenesPlanificadas: async (): Promise<OrdenPlanificada[]> => {
    const response = await apiService.request<OrdenPlanificada[]>('/orden/planificada', {
      method: 'GET',
    });
    return response.data;
  },

  /**
   * Registrar salida de patio (actualizar orden a LISTO_DESPACHO)
   * PUT /orden/logistica/:id
   */
  registrarSalidaPatio: async (ordenId: number, payload: SalidaPatioPayload): Promise<SalidaPatioResponse> => {
    const response = await apiService.request<SalidaPatioResponse>(`/orden/logistica/${ordenId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.data;
  },
};
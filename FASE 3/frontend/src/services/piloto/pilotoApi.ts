// src/services/piloto/pilotoApi.ts
import apiService from '../api';

export type OrdenAsignada = {
  id: number;
  numero_orden: string;
  origen: string;
  destino: string;
  tipo_mercancia: string;
  peso_estimado: number;
  peso_real?: number;
  estado: string;
  tiempo_estimado?: number;
};

export type EventoBitacora = {
  orden_id: number;
  piloto_id: number;
  tipo_evento: 'NORMAL' | 'INCIDENTE' | 'RETRASO' | 'CRITICO';
  descripcion: string;
  genera_retraso?: boolean;
};

const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = apiService.getToken();
  const baseUrl = apiService.getBaseUrl();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    Object.assign(headers, existingHeaders);
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data?.mensaje || `Error en la petición a ${endpoint}`);
  }
  
  return data;
};

export const pilotoApi = {
  // Obtener órdenes asignadas al piloto
  getMisOrdenes: async (pilotoId: number): Promise<OrdenAsignada[]> => {
    const response = await fetchWithAuth(`/orden/piloto/${pilotoId}`, {
      method: 'GET',
    });
    return response.data;
  },

  // Iniciar tránsito - SOLO el ID de la orden, sin payload adicional
  iniciarTransito: async (ordenId: number): Promise<any> => {
    const response = await fetchWithAuth(`/orden/trasito/inicio/${ordenId}`, {
      method: 'PUT',
    });
    return response.data;
  },

  // Registrar evento en bitácora
  registrarEvento: async (payload: EventoBitacora): Promise<any> => {
    const response = await fetchWithAuth('/orden/eventos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  // Finalizar entrega con evidencias
  finalizarEntrega: async (ordenId: number, evidencias: File[]): Promise<any> => {
    const token = apiService.getToken();
    const baseUrl = apiService.getBaseUrl();
    
    const formData = new FormData();
    evidencias.forEach((file) => {
      formData.append('evidencias', file);
    });
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${baseUrl}/orden/trasito/fin/${ordenId}`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.mensaje || 'Error al finalizar la entrega');
    }
    
    return data;
  }
};
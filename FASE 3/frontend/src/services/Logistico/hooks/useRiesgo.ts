import { useState } from 'react';
import { apiService } from '../../api';

export interface RiesgoCliente {
  id: number;
  usuario_id: number;
  riesgo_capacidad_pago: 'BAJO' | 'MEDIO' | 'ALTO';
  riesgo_lavado_dinero: 'BAJO' | 'MEDIO' | 'ALTO';
  riesgo_aduanas: 'BAJO' | 'MEDIO' | 'ALTO';
  riesgo_mercancia: 'BAJO' | 'MEDIO' | 'ALTO';
  evaluado_por: number;
  evaluado_por_nombre?: string;
  fecha_evaluacion: string;
}

export const useRiesgo = () => {
  const [riesgo, setRiesgo] = useState<RiesgoCliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const obtenerRiesgo = async (clienteId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.request<RiesgoCliente>(`/usuarios/${clienteId}/riesgo`, {
        method: 'GET',
      });
      if (response.ok) {
        setRiesgo(response.data);
        return response.data;
      }
      setRiesgo(null);
      return null;
    } catch (err: any) {
      // 404 significa que no hay evaluación de riesgo aún - esto es normal
      // Solo silenciosamente retorna null sin lanzar error
      if (err.message?.includes('404') || err.status === 404) {
        setRiesgo(null);
        setError(null);
        return null;
      }
      const mensaje = err.message || 'Error al obtener evaluacion de riesgo';
      setError(mensaje);
      setRiesgo(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const crearRiesgo = async (clienteId: number, datos: Omit<RiesgoCliente, 'id' | 'usuario_id' | 'evaluado_por' | 'fecha_evaluacion' | 'evaluado_por_nombre'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.request<RiesgoCliente>(`/usuarios/${clienteId}/riesgo`, {
        method: 'POST',
        body: JSON.stringify(datos),
      });
      if (response.ok) {
        setRiesgo(response.data);
        return response.data;
      }
      throw new Error(response.mensaje || 'Error al crear evaluacion');
    } catch (err: any) {
      const mensaje = err.message || 'Error al crear evaluacion de riesgo';
      setError(mensaje);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const actualizarRiesgo = async (clienteId: number, datos: Omit<RiesgoCliente, 'id' | 'usuario_id' | 'evaluado_por' | 'fecha_evaluacion' | 'evaluado_por_nombre'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.request<RiesgoCliente>(`/usuarios/${clienteId}/riesgo`, {
        method: 'PUT',
        body: JSON.stringify(datos),
      });
      if (response.ok) {
        setRiesgo(response.data);
        return response.data;
      }
      throw new Error(response.mensaje || 'Error al actualizar evaluacion');
    } catch (err: any) {
      const mensaje = err.message || 'Error al actualizar evaluacion de riesgo';
      setError(mensaje);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const limpiarError = () => setError(null);

  return {
    riesgo,
    setRiesgo,
    loading,
    error,
    limpiarError,
    obtenerRiesgo,
    crearRiesgo,
    actualizarRiesgo,
  };
};

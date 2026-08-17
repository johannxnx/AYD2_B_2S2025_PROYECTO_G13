// src/services/client/hooks/useClientContracts.ts
import { useState, useCallback } from 'react';
import { ClientService } from '../client';
import type { ContratoCliente, DashboardStats, ActividadReciente } from '../client';

interface UseClientContractsReturn {
  loading: boolean;
  error: string | null;
  contratos: ContratoCliente[];
  contratoActivo: ContratoCliente | null;
  estadisticas: DashboardStats;
  actividadesRecientes: ActividadReciente[];
  cargarContratos: (clienteId: number) => Promise<void>;
  obtenerContrato: (contratoId: number) => Promise<ContratoCliente | null>;
  limpiarError: () => void;
}

export const useClientContracts = (): UseClientContractsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contratos, setContratos] = useState<ContratoCliente[]>([]);
  const [contratoActivo, setContratoActivo] = useState<ContratoCliente | null>(null);
  const [estadisticas, setEstadisticas] = useState<DashboardStats>({
    activeContracts: 0,
    pendingOrders: 0,
    pendingInvoices: 0,
    availableCredit: 0,
    totalCreditLimit: 0,
    usedCredit: 0
  });
  const [actividadesRecientes, setActividadesRecientes] = useState<ActividadReciente[]>([]);

  const limpiarError = () => setError(null);

  const cargarContratos = useCallback(async (clienteId: number) => {
    console.log('[useClientContracts] cargarContratos - clienteId:', clienteId);
    setLoading(true);
    setError(null);
    
    try {
      const data = await ClientService.obtenerMisContratos(clienteId);
      console.log('[useClientContracts] Contratos recibidos:', data);
      setContratos(data);
      
      const stats = ClientService.calcularEstadisticas(data);
      setEstadisticas(stats);
      
      const activo = ClientService.obtenerContratoActivo(data);
      setContratoActivo(activo);
      
      const actividades = ClientService.generarActividadesRecientes(data);
      setActividadesRecientes(actividades);
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar contratos';
      console.error('[useClientContracts] Error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerContrato = useCallback(async (contratoId: number): Promise<ContratoCliente | null> => {
    console.log('[useClientContracts] obtenerContrato - contratoId:', contratoId);
    setLoading(true);
    setError(null);
    
    try {
      const contrato = await ClientService.obtenerDetalleContrato(contratoId);
      return contrato;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener contrato';
      console.error('[useClientContracts] Error:', message);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    contratos,
    contratoActivo,
    estadisticas,
    actividadesRecientes,
    cargarContratos,
    obtenerContrato,
    limpiarError
  };
};

export default useClientContracts;
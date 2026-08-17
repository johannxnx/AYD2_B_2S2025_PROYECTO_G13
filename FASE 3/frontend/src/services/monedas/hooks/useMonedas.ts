// src/services/monedas/hooks/useMonedas.ts
import { useState, useEffect, useCallback } from 'react';
import MonedaService, { type Moneda, type ConversionResult } from '../monedaService';

interface UseMonedosReturn {
  monedas: Moneda[];
  monedasLoading: boolean;
  monedasError: string | null;
  obtenerMonedaById: (id: number) => Moneda | undefined;
  obtenerSimboloMoneda: (id: number) => string;
  convertir: (monto: number, origenId: number, destinoId: number) => Promise<ConversionResult | null>;
  recargarMonedas: () => Promise<void>;
}

/**
 * Hook para gestionar monedas en componentes React
 * Proporciona acceso a monedas, símbolos y conversiones
 */
export const useMonedas = (): UseMonedosReturn => {
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [monedasLoading, setMonedasLoading] = useState(true);
  const [monedasError, setMonedasError] = useState<string | null>(null);

  // Cargar monedas al montar el componente
  useEffect(() => {
    cargarMonedas();
  }, []);

  const cargarMonedas = useCallback(async () => {
    try {
      setMonedasLoading(true);
      setMonedasError(null);
      const monedas = await MonedaService.obtenerMonedas();
      setMonedas(monedas);
    } catch (error) {
      setMonedasError('Error al cargar monedas');
      console.error(error);
    } finally {
      setMonedasLoading(false);
    }
  }, []);

  const recargarMonedas = useCallback(async () => {
    await cargarMonedas();
  }, [cargarMonedas]);

  const obtenerMonedaById = useCallback((id: number): Moneda | undefined => {
    return monedas.find(m => m.id === id);
  }, [monedas]);

  const obtenerSimboloMoneda = useCallback((id: number): string => {
    const moneda = monedas.find(m => m.id === id);
    return moneda?.simbolo || '$';
  }, [monedas]);

  const convertir = useCallback(async (
    monto: number,
    origenId: number,
    destinoId: number
  ): Promise<ConversionResult | null> => {
    return await MonedaService.convertir(monto, origenId, destinoId);
  }, []);

  return {
    monedas,
    monedasLoading,
    monedasError,
    obtenerMonedaById,
    obtenerSimboloMoneda,
    convertir,
    recargarMonedas
  };
};

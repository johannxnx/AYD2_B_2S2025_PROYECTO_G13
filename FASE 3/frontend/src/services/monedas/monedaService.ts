// src/services/monedas/monedaService.ts
import { API_BASE_URL } from '../api';

export type Moneda = {
  id: number;
  nombre: string;
  simbolo: string;
  cambio: number;
}

export type ConversionResult = {
  monto_original: number;
  moneda_origen: {
    id: number;
    nombre: string;
    simbolo: string;
  };
  monto_convertido: number;
  moneda_destino: {
    id: number;
    nombre: string;
    simbolo: string;
  };
  tipo_cambio_efectivo: number;
  fecha_conversion: string;
}

export type TotalMultimoneda = {
  total_en_gtq: number;
  total_en_moneda_factura: number;
  moneda_factura: string;
  simbolo: string;
  tipo_cambio_aplicado: number;
  requiere_conversion: boolean;
}

class MonedaService {
  /**
   * Obtiene todas las monedas disponibles
   */
  static async obtenerMonedas(): Promise<Moneda[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/monedas`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      throw new Error(data.mensaje || 'Error al obtener monedas');
    } catch (error) {
      console.error('Error en obtenerMonedas:', error);
      return [];
    }
  }

  /**
   * Obtiene una moneda por ID
   */
  static async obtenerMonedaById(id: number): Promise<Moneda | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/monedas/${id}`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Error en obtenerMonedaById:', error);
      return null;
    }
  }

  /**
   * Obtiene una moneda por código (GTQ, USD, etc.)
   */
  static async obtenerMonedaPorCodigo(codigo: string): Promise<Moneda | null> {
    try {
      const monedas = await this.obtenerMonedas();
      return monedas.find(m => m.nombre === codigo) || null;
    } catch (error) {
      console.error('Error en obtenerMonedaPorCodigo:', error);
      return null;
    }
  }

  /**
   * Convierte un monto entre dos monedas
   */
  static async convertir(
    monto: number,
    monedaOrigenId: number,
    monedaDestinoId: number
  ): Promise<ConversionResult | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/monedas/convertir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto,
          moneda_origen_id: monedaOrigenId,
          moneda_destino_id: monedaDestinoId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      throw new Error(data.mensaje);
    } catch (error) {
      console.error('Error en convertir:', error);
      return null;
    }
  }

  /**
   * Obtiene los tipos de cambio actuales
   */
  static async obtenerTiposCambio(): Promise<Moneda[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/monedas/tipos-cambio/todos`);
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error en obtenerTiposCambio:', error);
      return [];
    }
  }

  /**
   * Calcula el total en múltiples monedas
   */
  static async calcularTotalMultimoneda(
    totalGTQ: number,
    monedaId: number
  ): Promise<TotalMultimoneda | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/monedas/calcular-total`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_gtq: totalGTQ,
          moneda_id: monedaId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Error en calcularTotalMultimoneda:', error);
      return null;
    }
  }

  /**
   * Obtiene el símbolo de una moneda
   */
  static async obtenerSimboloMoneda(monedaId: number): Promise<string> {
    const moneda = await this.obtenerMonedaById(monedaId);
    return moneda?.simbolo || '$';
  }

  /**
   * Mapea países a IDs de monedas
   * Según la BD actual de LogiTrans
   */
  static obtenerMonedaPorPais(pais: string): number {
    const mapeo: { [key: string]: number } = {
      'Guatemala': 1,      // QUETZAL
      'Honduras': 6,       // LEMPIRA
      'El Salvador': 7,    // COLÓN
      'Belice': 10,        // DÓLAR BLZ
      'Panamá': 9,         // BALBOA
      'Nicaragua': 8,      // CÓRDOBA
      'México': 5,         // PESO MEXICANO
    };

    return mapeo[pais] || 1; // Defecto: GTQ
  }
}

export default MonedaService;

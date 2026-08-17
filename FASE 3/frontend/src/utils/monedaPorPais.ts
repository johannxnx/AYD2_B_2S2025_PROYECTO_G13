/**
 * @file monedaPorPais.ts
 * @description SEGÚN ENUNCIADO DEL PROYECTO LogiTrans:
 * 
 * Mapeo de países a monedas para SUGERENCIAS automáticas
 * Las 4 monedas del proyecto son: GTQ (1), USD (2), HNL (6), SVC (7)
 *
 * FLUJO DE SELECCIÓN DE MONEDA EN CONTRATOS:
 * 1. Si usuario envía moneda_id → usar esa moneda (override)
 * 2. Si NO envía moneda_id → SUGERIR basada en país del cliente
 * 3. Si país es desconocido → DEFAULT a GTQ (Quetzal)
 */

export const PAIS_MONEDA_MAP: Record<string, number> = {
  // Según enunciado del proyecto LogiTrans: GTQ, USD, HNL, SVC
  // Centro América
  'GUATEMALA': 1,        // GTQ - QUETZAL
  'HONDURAS': 6,         // HNL - LEMPIRA
  'EL SALVADOR': 7,      // SVC - COLÓN (moneda local de El Salvador)
  
  // USA - respaldo
  'USA': 2,              // USD - DÓLAR
  'UNITED STATES': 2,
};

/**
 * Obtiene la moneda recomendada basada en el país del cliente
 * @param pais - País del cliente (puede tener espacios/mayúsculas)
 * @returns ID de la moneda (default: 1 = QUETZAL si no encuentra coincidencia)
 */
export const obtenerMonedaPorPais = (pais: string | null | undefined): number => {
  if (!pais) return 1; // Default QUETZAL

  // Normalizar entrada: trim y mayúsculas para búsqueda
  const paisNormalizado = pais.trim().toUpperCase();

  // Buscar coincidencia exacta
  if (PAIS_MONEDA_MAP[paisNormalizado]) {
    return PAIS_MONEDA_MAP[paisNormalizado];
  }

  // Buscar coincidencia parcial (por si está con coma o espacios extra)
  for (const [key, value] of Object.entries(PAIS_MONEDA_MAP)) {
    if (paisNormalizado.includes(key.toUpperCase()) || key.toUpperCase().includes(paisNormalizado)) {
      return value;
    }
  }

  // Default a QUETZAL si no encuentra
  return 1;
};

/**
 * Obtiene el nombre de la moneda asociada al país
 * @param pais - País del cliente
 * @returns Nombre de la moneda (ej: "QUETZAL", "LEMPIRA")
 */
export const obtenerNombreMonedaPorPais = (pais: string | null | undefined): string => {
  const monedaId = obtenerMonedaPorPais(pais);
  const monedas: Record<number, string> = {
    1: 'QUETZAL',
    2: 'DÓLAR',
    3: 'EURO',
    4: 'LIBRA',
    5: 'PESO MEXICANO',
    6: 'LEMPIRA',
    7: 'COLÓN',
    8: 'CÓRDOBA',
    9: 'BALBOA',
    10: 'DÓLAR BLZ'
  };
  return monedas[monedaId] || 'QUETZAL';
};

/**
 * Obtiene el símbolo de la moneda asociada al país
 * @param pais - País del cliente
 * @returns Símbolo (ej: "Q", "$", "€")
 */
export const obtenerSimboloMonedaPorPais = (pais: string | null | undefined): string => {
  const monedaId = obtenerMonedaPorPais(pais);
  const simbolos: Record<number, string> = {
    1: 'Q',
    2: '$',
    3: '€',
    4: '£',
    5: '₱',
    6: 'L',
    7: '₡',
    8: 'C$',
    9: 'B/.',
    10: 'BZ$'
  };
  return simbolos[monedaId] || 'Q';
};

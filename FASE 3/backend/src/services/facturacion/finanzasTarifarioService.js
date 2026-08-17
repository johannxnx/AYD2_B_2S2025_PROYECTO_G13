"use strict";

/**
 * @file finanzasTarifarioService.js
 * @description Lógica de negocio del módulo Finanzas → Parametrización de Tarifario.
 *
 * Actor:  AREA_CONTABLE  (CDU001.9 — Parametrizar Tarifario)
 *
 * Este servicio es el responsable de:
 *   - Validar los rangos permitidos de peso y costo (FA1 del CDU001.9).
 *   - Delegar la persistencia al modelo Tarifario.js (ya existente, no se toca).
 *   - Registrar cada cambio en auditoría con fecha, hora y usuario
 *     (Regla de Calidad del CDU001.9).
 *
 * Límites máximos de peso por tipo de unidad (definidos por el proyecto):
 *   LIGERA  -> hasta  9.90 Ton
 *   PESADA  -> hasta 21.90 Ton
 *   CABEZAL -> hasta 50.00 Ton
 *
 * Nota sobre separación de responsabilidades:
 *   Este servicio reutiliza el modelo Tarifario.js del módulo de tarifario
 *   ya existente. NO duplica queries SQL. Solo agrega la capa de validación
 *   de negocio propia del módulo de finanzas.
 *
 * @requires models/tarifario/Tarifario
 * @requires models/auditoria/Auditoria
 */

const Tarifario = require("../../models/tarifario/Tarifario");
const Auditoria = require("../../models/auditoria/Auditoria");

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTES DE NEGOCIO
   ═══════════════════════════════════════════════════════════════════════════ */

/** Tipos de unidad válidos del sistema */
const TIPOS_UNIDAD = ["LIGERA", "PESADA", "CABEZAL"];

/**
 * Límites máximos de peso por tipo de unidad.
 * Origen: acuerdo del proyecto LogiTrans Guatemala S.A.
 *
 *   LIGERA  -> Vehículos de carga ligera, tope en  9.90 Ton
 *   PESADA  -> Camiones pesados,          tope en 21.90 Ton
 *   CABEZAL -> Cabezales / tráileres,     tope en 50.00 Ton
 */
const LIMITE_PESO_MAX = {
  LIGERA:  9.90,
  PESADA:  21.90,
  CABEZAL: 50.00,
};

/**
 * Rangos de referencia completos para el frontend.
 * Incluye el costo sugerido como punto de partida antes de la negociación.
 *
 * El frontend los usa para mostrar tooltips y placeholders (FA1 del CDU001.9).
 */
const RANGOS_REFERENCIA = {
  LIGERA: {
    limite_peso_ton_max:        9.90,
    costo_base_km_sugerido:     8.00,
    descripcion:                "Vehículo de carga ligera (hasta 9.90 Ton)",
  },
  PESADA: {
    limite_peso_ton_max:        21.90,
    costo_base_km_sugerido:     12.50,
    descripcion:                "Camión pesado (hasta 21.90 Ton)",
  },
  CABEZAL: {
    limite_peso_ton_max:        50.00,
    costo_base_km_sugerido:     18.00,
    descripcion:                "Cabezal / tráiler (hasta 50.00 Ton)",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   FUNCIONES DE SERVICIO
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Lista todas las tarifas activas del sistema.
 * (CDU001.9 — paso 1: el área contable accede al módulo y ve el estado actual)
 *
 * @async
 * @returns {Promise<Array>} Lista de tarifas activas
 */
const listarTarifas = async () => {
  return await Tarifario.listarTarifario();
};

/**
 * Obtiene la tarifa vigente de un tipo de unidad junto con su límite máximo.
 * (CDU001.9 — paso 2: selecciona el tipo de unidad a configurar)
 *
 * @async
 * @param {string} tipo_unidad  LIGERA | PESADA | CABEZAL
 * @returns {Promise<Object>}   { tarifa, limitePermitido, descripcion }
 * @throws {{ status: 400 }}   Si tipo_unidad no es válido
 * @throws {{ status: 404 }}   Si no existe tarifa activa para ese tipo
 */
const obtenerTarifa = async (tipo_unidad) => {
  if (!TIPOS_UNIDAD.includes(tipo_unidad)) {
    throw {
      status:  400,
      mensaje: `Tipo de unidad inválido: "${tipo_unidad}". Los tipos válidos son: ${TIPOS_UNIDAD.join(", ")}.`,
    };
  }

  const tarifa = await Tarifario.buscarPorTipo(tipo_unidad);

  if (!tarifa) {
    throw {
      status:  404,
      mensaje: `No se encontró tarifa activa para el tipo: ${tipo_unidad}.`,
    };
  }

  return {
    tarifa,
    limitePermitido: LIMITE_PESO_MAX[tipo_unidad],
    descripcion:     RANGOS_REFERENCIA[tipo_unidad].descripcion,
  };
};

/**
 * Devuelve los rangos de referencia del sistema (sin consultar la DB).
 * (CDU001.9 — apoyo al FA1: el frontend muestra el rango válido)
 *
 * @returns {Object}  Objeto con los rangos por tipo de unidad
 */
const obtenerRangosReferencia = () => {
  return RANGOS_REFERENCIA;
};

/**
 * Actualiza los parámetros de una tarifa base.
 * (CDU001.9 — Flujo Principal pasos 3–8)
 *
 * Validaciones aplicadas (en orden):
 *   1. tipo_unidad válido (FA1.1 / FA2.1)
 *   2. limite_peso_ton > 0  (FA2 — campo obligatorio)
 *   3. costo_base_km > 0    (FA2 — campo obligatorio)
 *   4. limite_peso_ton dentro del límite máximo del tipo (FA1 — rango permitido)
 *   5. costo_base_km > 0 (ya cubierto en paso 3, guard extra)
 *
 * Tras la actualización registra en auditoría:
 *   tabla_afectada, acción UPDATE, usuario, IP, valores anteriores y nuevos.
 *
 * @async
 * @param {string} tipo_unidad           LIGERA | PESADA | CABEZAL
 * @param {Object} datos
 * @param {number} datos.limite_peso_ton Nuevo límite de peso en Ton (> 0, ≤ límite del tipo)
 * @param {number} datos.costo_base_km   Nuevo costo por km en Q    (> 0)
 * @param {number} usuario_id            ID del usuario AREA_CONTABLE (del JWT)
 * @param {string} ip                    IP de origen para auditoría
 * @returns {Promise<Object>}            { tarifaAnterior, tarifaActualizada }
 * @throws {{ status: 400 }}             Si alguna validación falla
 * @throws {{ status: 404 }}             Si no existe la tarifa para ese tipo
 */
const parametrizarTarifa = async (tipo_unidad, datos, usuario_id, ip) => {
  const { limite_peso_ton, costo_base_km } = datos;

  /* ── Validación 1: tipo_unidad ─────────────────────────────────────────── */
  if (!TIPOS_UNIDAD.includes(tipo_unidad)) {
    throw {
      status:  400,
      mensaje: `Tipo de unidad inválido: "${tipo_unidad}". Los tipos válidos son: ${TIPOS_UNIDAD.join(", ")}.`,
    };
  }

  /* ── Validación 2: campos > 0 (FA2 — obligatorios con valor positivo) ──── */
  if (isNaN(limite_peso_ton) || limite_peso_ton <= 0) {
    throw {
      status:  400,
      mensaje: "El límite de peso (limite_peso_ton) debe ser un número mayor a 0.",
    };
  }

  if (isNaN(costo_base_km) || costo_base_km <= 0) {
    throw {
      status:  400,
      mensaje: "El costo por kilómetro (costo_base_km) debe ser un número mayor a 0.",
    };
  }

  /* ── Validación 3: límite de peso dentro del rango del tipo (FA1) ───────
   *
   * Límites máximos según el proyecto LogiTrans Guatemala S.A.:
   *   LIGERA  -> 9.90 Ton
   *   PESADA  -> 21.90 Ton
   *   CABEZAL -> 50.00 Ton
   *
   * Si el valor supera el máximo, se activa FA1: el sistema muestra el rango
   * válido para que el usuario corrija.
   */
  const limiteMax = LIMITE_PESO_MAX[tipo_unidad];

  if (limite_peso_ton > limiteMax) {
    throw {
      status:  400,
      mensaje: `El límite de peso para ${tipo_unidad} no puede superar ${limiteMax} Ton. ` +
               `Valor ingresado: ${limite_peso_ton} Ton.`,
    };
  }

  /* ── Obtener tarifa actual (necesaria para auditoría y para verificar existencia) */
  const tarifaAnterior = await Tarifario.buscarPorTipo(tipo_unidad);

  if (!tarifaAnterior) {
    throw {
      status:  404,
      mensaje: `No se encontró tarifa activa para el tipo: ${tipo_unidad}. ` +
               `Verifique que el tarifario base esté inicializado en el sistema.`,
    };
  }

  /* ── Persistir los cambios ──────────────────────────────────────────────── */
  const tarifaActualizada = await Tarifario.actualizarTarifa(tipo_unidad, {
    limite_peso_ton,
    costo_base_km,
    actualizado_por: usuario_id,
  });

  /* ── Registro en auditoría (Regla de Calidad CDU001.9) ──────────────────
   *
   * Cada cambio al tarifario queda registrado con:
   *   - Tabla afectada
   *   - Acción realizada
   *   - ID del registro modificado
   *   - Usuario que ejecutó el cambio (trazabilidad)
   *   - IP de origen
   *   - Datos anteriores y nuevos (para rollback manual si se necesita)
   */
  await Auditoria.registrar({
    tabla_afectada:   "tarifario",
    accion:           "UPDATE",
    registro_id:      tarifaActualizada.id,
    usuario_id:       usuario_id,
    descripcion:      `[Finanzas] Parametrización de tarifario para tipo: ${tipo_unidad}. ` +
                      `Peso: ${tarifaAnterior.limite_peso_ton} → ${limite_peso_ton} Ton. ` +
                      `Costo/km: Q${tarifaAnterior.costo_base_km} → Q${costo_base_km}.`,
    datos_anteriores: {
      limite_peso_ton: tarifaAnterior.limite_peso_ton,
      costo_base_km:   tarifaAnterior.costo_base_km,
    },
    datos_nuevos: {
      limite_peso_ton,
      costo_base_km,
    },
    ip_origen: ip,
  });

  return {
    tarifaAnterior: {
      limite_peso_ton: tarifaAnterior.limite_peso_ton,
      costo_base_km:   tarifaAnterior.costo_base_km,
    },
    tarifaActualizada,
  };
};

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════════════════════════════ */

module.exports = {
  listarTarifas,
  obtenerTarifa,
  obtenerRangosReferencia,
  parametrizarTarifa,
};

/**
 * @file Servicio de Tarifario
 * @description Lógica de negocio para gestión de costos base de transporte
 * Mantiene y actualiza tarifas por tipo de unidad (LIGERA, PESADA, CABEZAL)
 * Proporciona rangos de referencia y validaciones
 * @module services/tarifario/tarifarioService
 * @version 1.0.0
 * @requires models/tarifario/Tarifario - modelo de tarifas
 * @requires models/auditoria/Auditoria - registro de cambios
 */

const Tarifario = require('../../models/tarifario/Tarifario');
const Auditoria = require('../../models/auditoria/Auditoria');

const TIPOS_UNIDAD = ['LIGERA', 'PESADA', 'CABEZAL'];

const RANGOS_REFERENCIA = {
  LIGERA:  { limite_peso_ton: 3.5,  costo_base_km: 8.00  },
  PESADA:  { limite_peso_ton: 12.0, costo_base_km: 12.50 },
  CABEZAL: { limite_peso_ton: 22.0, costo_base_km: 18.00 }
};

/**
 * @async
 * @function obtenerTarifario
 * @description Obtiene todas las tarifas base del sistema
 * Retorna tarifas para los tres tipos de unidad
 * @returns {Promise<Array>} Lista de todas las tarifas activas
 */
const obtenerTarifario = async () => {
  return await Tarifario.listarTarifario();
};

/**
 * @async
 * @function obtenerTarifaPorTipo
 * @description Obtiene la tarifa base para un tipo de unidad específico
 * @param {string} tipo_unidad - Tipo de unidad: LIGERA, PESADA o CABEZAL
 * @returns {Promise<Object>} Tarifa con costo por km y límite de peso
 * @throws {Error} Si tipo de unidad es inválido (400) o no existe tarifa (404)
 */
const obtenerTarifaPorTipo = async (tipo_unidad) => {
  if (!TIPOS_UNIDAD.includes(tipo_unidad)) {
    throw { status: 400, mensaje: `Tipo de unidad inválido. Los tipos válidos son: ${TIPOS_UNIDAD.join(', ')}` };
  }
  const tarifa = await Tarifario.buscarPorTipo(tipo_unidad);
  if (!tarifa) throw { status: 404, mensaje: `No se encontró tarifa para el tipo: ${tipo_unidad}` };
  return tarifa;
};

/**
 * @async
 * @function actualizarTarifa
 * @description Actualiza la tarifa base de un tipo de transporte
 * Solo autoridades de área contable pueden realizar esta acción
 * @param {string} tipo_unidad - Tipo de unidad: LIGERA, PESADA o CABEZAL
 * @param {Object} datos - Nuevos valores de tarifa
 * @param {number} datos.limite_peso_ton - Límite de peso en toneladas (debe ser > 0)
 * @param {number} datos.costo_base_km - Costo por kilómetro (debe ser > 0)
 * @param {number} usuario_ejecutor - ID del usuario que actualiza (para auditoría)
 * @param {string} ip - Dirección IP del cliente (para auditoría)
 * @returns {Promise<Object>} Tarifa actualizada
 * @throws {Error} Si tipo de unidad es inválido, valores negativos, o tarifa no existe
 */
const actualizarTarifa = async (tipo_unidad, datos, usuario_ejecutor, ip) => {
  const { limite_peso_ton, costo_base_km } = datos;

  if (!TIPOS_UNIDAD.includes(tipo_unidad)) {
    throw { status: 400, mensaje: `Tipo de unidad inválido. Los tipos válidos son: ${TIPOS_UNIDAD.join(', ')}` };
  }
  if (limite_peso_ton <= 0) throw { status: 400, mensaje: 'El límite de peso debe ser mayor a 0' };
  if (costo_base_km   <= 0) throw { status: 400, mensaje: 'El costo por km debe ser mayor a 0' };

  const tarifaActual = await Tarifario.buscarPorTipo(tipo_unidad);

  const tarifaActualizada = await Tarifario.actualizarTarifa(tipo_unidad, {
    limite_peso_ton,
    costo_base_km,
    actualizado_por: usuario_ejecutor
  });

  await Auditoria.registrar({
    tabla_afectada:   'tarifario',
    accion:           'UPDATE',
    registro_id:      tarifaActualizada.id,
    usuario_id:       usuario_ejecutor,
    descripcion:      `Tarifa actualizada para tipo de unidad: ${tipo_unidad}`,
    datos_anteriores: tarifaActual,
    datos_nuevos:     tarifaActualizada,
    ip_origen:        ip
  });

  return tarifaActualizada;
};

/**
 * @function obtenerRangosReferencia
 * @description Retorna los rangos de referencia de costos por tipo de unidad
 * Estos son los valores base del sistema antes de negociaciones específicas de contrato
 * @returns {Object} Objeto con LIGERA, PESADA, CABEZAL con sus límites y costos
 */
const obtenerRangosReferencia = () => {
  return RANGOS_REFERENCIA;
};

module.exports = {
  obtenerTarifario,
  obtenerTarifaPorTipo,
  actualizarTarifa,
  obtenerRangosReferencia
};
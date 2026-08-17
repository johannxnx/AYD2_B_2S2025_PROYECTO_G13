/**
 * @file monedaController.js
 * @description Controlador para endpoints de gestión de monedas
 * Maneja solicitudes de tipos de cambio, conversiones y gestión de monedas
 * @module controllers/monedas/monedaController
 */

const monedaService = require('../../services/monedas/monedaService');

/**
 * Obtiene todas las monedas disponibles
 * @async
 * @function obtenerTodasLasMonedas
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {void} JSON con lista de monedas
 * @example
 * GET /api/monedas
 */
const obtenerTodasLasMonedas = async (req, res) => {
  try {
    const monedas = await monedaService.obtenerMonedas();
    
    res.status(200).json({
      success: true,
      mensaje: 'Monedas obtenidas exitosamente',
      data: monedas,
      total: monedas.length
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      mensaje: error.mensaje || 'Error al obtener monedas',
      error: error.message
    });
  }
};

/**
 * Obtiene el detalle de una moneda específica
 * @async
 * @function obtenerMonedaDetalle
 * @param {Object} req - Request object
 * @param {number} req.params.id - ID de la moneda
 * @param {Object} res - Response object
 * @returns {void} JSON con datos de la moneda
 * @example
 * GET /api/monedas/:id
 */
const obtenerMonedaDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de moneda inválido'
      });
    }
    
    const moneda = await monedaService.obtenerMonedaById(parseInt(id));
    
    if (!moneda) {
      return res.status(404).json({
        success: false,
        mensaje: `Moneda con ID ${id} no encontrada`
      });
    }
    
    res.status(200).json({
      success: true,
      mensaje: 'Moneda obtenida exitosamente',
      data: moneda
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      mensaje: error.mensaje || 'Error al obtener moneda',
      error: error.message
    });
  }
};

/**
 * Convierte un monto entre dos monedas
 * @async
 * @function convertir
 * @param {Object} req - Request object
 * @param {number} req.body.monto - Monto a convertir
 * @param {number} req.body.moneda_origen_id - ID moneda origen
 * @param {number} req.body.moneda_destino_id - ID moneda destino
 * @param {Object} res - Response object
 * @returns {void} JSON con conversión realizada
 * @example
 * POST /api/monedas/convertir
 * {
 *   "monto": 1000,
 *   "moneda_origen_id": 2,
 *   "moneda_destino_id": 1
 * }
 */
const convertir = async (req, res) => {
  try {
    const { monto, moneda_origen_id, moneda_destino_id } = req.body;
    
    // Validaciones básicas
    if (!monto || isNaN(monto) || monto <= 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Monto inválido o no proporcionado'
      });
    }
    
    if (!moneda_origen_id || isNaN(moneda_origen_id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de moneda de origen inválido'
      });
    }
    
    if (!moneda_destino_id || isNaN(moneda_destino_id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de moneda destino inválido'
      });
    }
    
    const resultado = await monedaService.convertirMoneda(
      parseFloat(monto),
      parseInt(moneda_origen_id),
      parseInt(moneda_destino_id)
    );
    
    res.status(200).json({
      success: true,
      mensaje: 'Conversión realizada exitosamente',
      data: resultado
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      mensaje: error.mensaje || 'Error al convertir moneda',
      error: error.message
    });
  }
};

/**
 * Obtiene los tipos de cambio actuales de todas las monedas
 * @async
 * @function obtenerTiposCambio
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {void} JSON con tipos de cambio
 * @example
 * GET /api/monedas/tipos-cambio
 */
const obtenerTiposCambio = async (req, res) => {
  try {
    const tiposCambio = await monedaService.obtenerTodosTipoCambio();
    
    res.status(200).json({
      success: true,
      mensaje: 'Tipos de cambio obtenidos exitosamente',
      data: tiposCambio,
      fecha_consulta: new Date(),
      base_moneda: 'GTQ'
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      mensaje: error.mensaje || 'Error al obtener tipos de cambio',
      error: error.message
    });
  }
};

/**
 * Actualiza el tipo de cambio de una moneda
 * Requiere autenticación y permisos de administrador
 * @async
 * @function actualizarTipoCambio
 * @param {Object} req - Request object
 * @param {number} req.params.id - ID de la moneda
 * @param {number} req.body.nuevo_cambio - Nuevo tipo de cambio
 * @param {Object} res - Response object
 * @returns {void} JSON con moneda actualizada
 * @example
 * PUT /api/monedas/:id/tipo-cambio
 * {
 *   "nuevo_cambio": 8.25
 * }
 */
const actualizarTipoCambio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevo_cambio } = req.body;
    const usuario_id = req.usuario?.id; // Asume que el middleware de auth proporciona esto
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de moneda inválido'
      });
    }
    
    if (!nuevo_cambio || isNaN(nuevo_cambio) || nuevo_cambio <= 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Tipo de cambio inválido'
      });
    }
    
    if (!usuario_id) {
      return res.status(401).json({
        success: false,
        mensaje: 'Usuario no autenticado'
      });
    }
    
    const resultado = await monedaService.actualizarTipoCambio(
      parseInt(id),
      parseFloat(nuevo_cambio),
      usuario_id
    );
    
    res.status(200).json({
      success: true,
      mensaje: 'Tipo de cambio actualizado exitosamente',
      data: resultado
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      mensaje: error.mensaje || 'Error al actualizar tipo de cambio',
      error: error.message
    });
  }
};

/**
 * Calcula el total de una transacción en múltiples monedas
 * @async
 * @function calcularTotalMultimoneda
 * @param {Object} req - Request object
 * @param {number} req.body.total_gtq - Total en GTQ
 * @param {number} req.body.moneda_id - ID de moneda destino
 * @param {Object} res - Response object
 * @returns {void} JSON con cálculo de totales
 * @example
 * POST /api/monedas/calcular-total
 * {
 *   "total_gtq": 1000,
 *   "moneda_id": 2
 * }
 */
const calcularTotalMultimoneda = async (req, res) => {
  try {
    const { total_gtq, moneda_id } = req.body;
    
    if (!total_gtq || isNaN(total_gtq) || total_gtq <= 0) {
      return res.status(400).json({
        success: false,
        mensaje: 'Total en GTQ inválido'
      });
    }
    
    if (!moneda_id || isNaN(moneda_id)) {
      return res.status(400).json({
        success: false,
        mensaje: 'ID de moneda inválido'
      });
    }
    
    const resultado = await monedaService.calcularTotalMultimoneda(
      parseFloat(total_gtq),
      parseInt(moneda_id)
    );
    
    res.status(200).json({
      success: true,
      mensaje: 'Total calculado exitosamente',
      data: resultado
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      mensaje: error.mensaje || 'Error al calcular total',
      error: error.message
    });
  }
};

module.exports = {
  obtenerTodasLasMonedas,
  obtenerMonedaDetalle,
  convertir,
  obtenerTiposCambio,
  actualizarTipoCambio,
  calcularTotalMultimoneda
};

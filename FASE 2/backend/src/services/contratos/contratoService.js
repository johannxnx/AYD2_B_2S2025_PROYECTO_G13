/**
 * @file Servicio de Contratos
 * @description Lógica de negocio para gestión completa de contratos de transporte
 * Incluye creación, modificación, validación, asignación de tarifas, descuentos y rutas
 * Genera registros de auditoría para todas las operaciones
 * @module services/contratos/contratoService
 * @version 1.0.0
 * @requires models/contratos/Contrato - modelo de contrato
 * @requires models/contratos/ContratoTarifa - tipos de unidad por contrato
 * @requires models/contratos/Descuento - descuentos especiales
 * @requires models/contratos/RutaAutorizada - rutas permitidas
 * @requires models/usuarios/Usuario - validaciones de cliente
 * @requires models/auditoria/Auditoria - registro de cambios
 */

const Contrato       = require('../../models/contratos/Contrato');
const ContratoTarifa = require('../../models/contratos/ContratoTarifa');
const Descuento      = require('../../models/contratos/Descuento');
const RutaAutorizada = require('../../models/contratos/RutaAutorizada');
const Usuario        = require('../../models/usuarios/Usuario');
const Auditoria      = require('../../models/auditoria/Auditoria');

/**
 * @async
 * @function crearContrato
 * @description Crea un nuevo contrato de transporte para un cliente corporativo
 * Valida cliente activo, plazo de pago, fechas, y crea tarifas/rutas si se proporcionan
 * @param {Object} datos - Datos del contrato
 * @param {string} datos.numero_contrato - Número identificador único del contrato
 * @param {number} datos.cliente_id - ID del cliente corporativo
 * @param {string} datos.fecha_inicio - Fecha de inicio (YYYY-MM-DD)
 * @param {string} datos.fecha_fin - Fecha de finalización (debe ser > fecha_inicio)
 * @param {number} datos.limite_credito - Límite de crédito permitido en soles
 * @param {number} datos.plazo_pago - Plazo de pago: 15, 30 o 45 días
 * @param {Array} [datos.tarifas] - Tarifas del contrato por tipo de unidad
 * @param {Array} [datos.rutas] - Rutas autorizadas del contrato
 * @param {number} usuario_ejecutor - ID del usuario que crea el contrato (para auditoría)
 * @param {string} ip - Dirección IP del cliente (para auditoría)
 * @returns {Promise<Object>} Contrato creado con todos sus datos
 * @throws {Error} Si cliente no existe, no es corporativo, inactivo o datos inválidos
 */
const crearContrato = async (datos, usuario_ejecutor, ip) => {
  const { numero_contrato, cliente_id, fecha_inicio, fecha_fin, limite_credito, plazo_pago, tarifas, rutas } = datos;

  const cliente = await Usuario.buscarPorId(cliente_id);
  if (!cliente) throw { status: 404, mensaje: 'Cliente no encontrado' };
  if (cliente.tipo_usuario !== 'CLIENTE_CORPORATIVO') {
    throw { status: 400, mensaje: 'Solo se pueden crear contratos para clientes corporativos' };
  }
  if (cliente.estado !== 'ACTIVO') {
    throw { status: 400, mensaje: 'No se puede crear un contrato para un cliente bloqueado o inactivo' };
  }

  const plazosValidos = [15, 30, 45];
  if (!plazosValidos.includes(plazo_pago)) {
    throw { status: 400, mensaje: 'El plazo de pago debe ser 15, 30 o 45 días' };
  }
  if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
    throw { status: 400, mensaje: 'La fecha de fin debe ser mayor a la fecha de inicio' };
  }

  const contrato = await Contrato.crearContrato({
    numero_contrato, cliente_id, fecha_inicio, fecha_fin,
    limite_credito, plazo_pago, creado_por: usuario_ejecutor
  });

  if (tarifas && tarifas.length > 0) {
    for (const tarifa of tarifas) {
      await ContratoTarifa.crearContratoTarifa({ contrato_id: contrato.id, ...tarifa });
    }
  }

  if (rutas && rutas.length > 0) {
    for (const ruta of rutas) {
      await RutaAutorizada.crearRuta({ contrato_id: contrato.id, ...ruta });
    }
  }

  await Auditoria.registrar({
    tabla_afectada: 'contratos',
    accion:         'CREATE',
    registro_id:    contrato.id,
    usuario_id:     usuario_ejecutor,
    descripcion:    `Contrato ${numero_contrato} creado para cliente: ${cliente.nombre}`,
    datos_nuevos:   contrato,
    ip_origen:      ip
  });

  return contrato;
};

const listarTodosContratos = async ({ limit, estado } = {}) => {
  return await Contrato.listarTodos(limit, estado);
};


/**
 * @async
 * @function obtenerContrato
 * @description Obtiene los detalles completos de un contrato
 * Retorna contrato con sus tarifas, rutas autorizadas y descuentos especiales
 * @param {number} id - ID del contrato a obtener
 * @returns {Promise<Object>} Contrato con tarifas, rutas y descuentos embebidos
 * @throws {Error} Si contrato no existe (404)
 */
const obtenerContrato = async (id) => {
  const contrato = await Contrato.buscarPorId(id);
  if (!contrato) throw { status: 404, mensaje: 'Contrato no encontrado' };

  contrato.tarifas    = await ContratoTarifa.listarPorContrato(id);
  contrato.rutas      = await RutaAutorizada.listarPorContrato(id);
  contrato.descuentos = await Descuento.listarPorContrato(id);

  return contrato;
};

/**
 * @async
 * @function listarContratosPorCliente
 * @description Lista todos los contratos de un cliente específico
 * @param {number} cliente_id - ID del cliente
 * @returns {Promise<Array>} Lista de contratos del cliente
 * @throws {Error} Si cliente no existe (404)
 */
// backend/src/services/contratos/contratoService.js
const listarContratosPorCliente = async (clienteId) => {
  console.log('[contratoService] listarContratosPorCliente - clienteId:', clienteId);
  const result = await Contrato.listarPorCliente(clienteId);
  console.log('[contratoService] Resultado:', result);
  return result;
};

/**
 * @async
 * @function modificarContrato
 * @description Actualiza los términos de un contrato vigente
 * Solo se pueden modificar contratos en estado VIGENTE
 * @param {number} id - ID del contrato a modificar
 * @param {Object} datos - Nuevos datos del contrato (fecha_fin, limite_credito, plazo_pago, etc.)
 * @param {number} usuario_ejecutor - ID del usuario que modifica (para auditoría)
 * @param {string} ip - Dirección IP del cliente (para auditoría)
 * @returns {Promise<Object>} Contrato actualizado
 * @throws {Error} Si contrato no existe, no está vigente, o plazo_pago es inválido
 */
const modificarContrato = async (id, datos, usuario_ejecutor, ip) => {
  const contratoActual = await Contrato.buscarPorId(id);
  if (!contratoActual) throw { status: 404, mensaje: 'Contrato no encontrado' };
  if (contratoActual.estado !== 'VIGENTE') {
    throw { status: 400, mensaje: 'Solo se pueden modificar contratos vigentes' };
  }

  if (datos.plazo_pago) {
    const plazosValidos = [15, 30, 45];
    if (!plazosValidos.includes(datos.plazo_pago)) {
      throw { status: 400, mensaje: 'El plazo de pago debe ser 15, 30 o 45 días' };
    }
  }

  const contratoActualizado = await Contrato.actualizarContrato(id, {
    ...datos,
    modificado_por: usuario_ejecutor
  });

  await Auditoria.registrar({
    tabla_afectada:   'contratos',
    accion:           'UPDATE',
    registro_id:      id,
    usuario_id:       usuario_ejecutor,
    descripcion:      `Contrato ${contratoActual.numero_contrato} modificado`,
    datos_anteriores: contratoActual,
    datos_nuevos:     contratoActualizado,
    ip_origen:        ip
  });

  return contratoActualizado;
};

/**
 * @async
 * @function validarCliente
 * @description Valida si un cliente puede realizar transporte
 * Verifica estado, contrato vigente, límite de crédito, ruta autorizada y tarifa aplicable
 * @param {number} cliente_id - ID del cliente a validar
 * @param {string} [origen] - Ciudad/punto de origen del transporte
 * @param {string} [destino] - Ciudad/punto de destino del transporte
 * @param {string} [tipo_unidad] - Tipo de unidad (LIGERA, PESADA, CABEZAL)
 * @returns {Promise<Object>} Objeto con habilitado (boolean), motivo si está deshabilitado, y detalles de cliente/contrato/tarifa si está habilitado
 * @note Si cliente excede límite de crédito, es bloqueado automáticamente
 */
const validarCliente = async (cliente_id, origen, destino, tipo_unidad) => {
  const cliente = await Usuario.buscarPorId(cliente_id);
  if (!cliente) return { habilitado: false, motivo: 'Cliente no encontrado' };
  if (cliente.estado === 'BLOQUEADO') return { habilitado: false, motivo: 'Cliente bloqueado' };
  if (cliente.estado === 'INACTIVO')  return { habilitado: false, motivo: 'Cliente inactivo' };

  const contrato = await Contrato.buscarVigentePorCliente(cliente_id);
  if (!contrato) return { habilitado: false, motivo: 'El cliente no tiene un contrato vigente' };

  if (contrato.saldo_usado >= contrato.limite_credito) {
    await Usuario.cambiarEstado(cliente_id, 'BLOQUEADO');
    return { habilitado: false, motivo: 'Límite de crédito excedido. Cliente bloqueado automáticamente' };
  }

  if (origen && destino) {
    const ruta = await RutaAutorizada.verificarRuta(contrato.id, origen, destino);
    if (!ruta) return { habilitado: false, motivo: `La ruta ${origen} → ${destino} no está autorizada en el contrato` };
  }

  let tarifa   = null;
  let descuento = null;
  if (tipo_unidad) {
    tarifa    = await ContratoTarifa.buscarPorContratoYTipo(contrato.id, tipo_unidad);
    descuento = await Descuento.buscarPorContratoYTipo(contrato.id, tipo_unidad);
  }

  return {
    habilitado: true,
    cliente: { id: cliente.id, nombre: cliente.nombre, estado: cliente.estado },
    contrato: {
      id:               contrato.id,
      numero_contrato:  contrato.numero_contrato,
      limite_credito:   contrato.limite_credito,
      saldo_usado:      contrato.saldo_usado,
      saldo_disponible: contrato.limite_credito - contrato.saldo_usado,
      plazo_pago:       contrato.plazo_pago
    },
    tarifa:    tarifa    ? { tipo_unidad: tarifa.tipo_unidad, costo_km_negociado: tarifa.costo_km_negociado, limite_peso_ton: tarifa.limite_peso_ton } : null,
    descuento: descuento ? { porcentaje_descuento: descuento.porcentaje_descuento } : null
  };
};

/**
 * @async
 * @function agregarDescuento
 * @description Agrega un descuento especial a un contrato vigente
 * Descuentos especiales se aplican por tipo de unidad
 * @param {number} contrato_id - ID del contrato
 * @param {Object} datos - Datos del descuento
 * @param {string} datos.tipo_unidad - Tipo de unidad: LIGERA, PESADA, CABEZAL
 * @param {number} datos.porcentaje_descuento - Porcentaje de descuento (0-100)
 * @param {number} usuario_ejecutor - ID del usuario que autoriza (para auditoría)
 * @param {string} ip - Dirección IP del cliente (para auditoría)
 * @returns {Promise<Object>} Descuento creado
 * @throws {Error} Si contrato no existe o no está vigente
 */
const agregarDescuento = async (contrato_id, datos, usuario_ejecutor, ip) => {
  const contrato = await Contrato.buscarPorId(contrato_id);
  if (!contrato) throw { status: 404, mensaje: 'Contrato no encontrado' };
  if (contrato.estado !== 'VIGENTE') {
    throw { status: 400, mensaje: 'Solo se pueden agregar descuentos a contratos vigentes' };
  }

  const descuento = await Descuento.crearDescuento({ contrato_id, ...datos, autorizado_por: usuario_ejecutor });

  await Auditoria.registrar({
    tabla_afectada: 'descuentos_contrato',
    accion:         'CREATE',
    registro_id:    descuento.id,
    usuario_id:     usuario_ejecutor,
    descripcion:    `Descuento especial agregado al contrato ${contrato.numero_contrato}`,
    datos_nuevos:   descuento,
    ip_origen:      ip
  });

  return descuento;
};

/**
 * @async
 * @function agregarRuta
 * @description Agrega una ruta autorizada a un contrato vigente
 * Las rutas definen los corredores origen-destino permitidos para transporte
 * @param {number} contrato_id - ID del contrato
 * @param {Object} datos - Datos de la ruta
 * @param {string} datos.origen - Ciudad/punto de origen
 * @param {string} datos.destino - Ciudad/punto de destino
 * @param {number} usuario_ejecutor - ID del usuario que autoriza (para auditoría)
 * @param {string} ip - Dirección IP del cliente (para auditoría)
 * @returns {Promise<Object>} Ruta creada
 * @throws {Error} Si contrato no existe o no está vigente
 */
const agregarRuta = async (contrato_id, datos, usuario_ejecutor, ip) => {
  const contrato = await Contrato.buscarPorId(contrato_id);
  if (!contrato) throw { status: 404, mensaje: 'Contrato no encontrado' };
  if (contrato.estado !== 'VIGENTE') {
    throw { status: 400, mensaje: 'Solo se pueden agregar rutas a contratos vigentes' };
  }

  const ruta = await RutaAutorizada.crearRuta({ contrato_id, ...datos });

  await Auditoria.registrar({
    tabla_afectada: 'rutas_autorizadas',
    accion:         'CREATE',
    registro_id:    ruta.id,
    usuario_id:     usuario_ejecutor,
    descripcion:    `Ruta ${datos.origen} → ${datos.destino} agregada al contrato ${contrato.numero_contrato}`,
    datos_nuevos:   ruta,
    ip_origen:      ip
  });

  return ruta;
};

module.exports = {
  crearContrato,
  obtenerContrato,
  listarContratosPorCliente,
  listarTodosContratos,  // NUEVO
  modificarContrato,
  validarCliente,
  agregarDescuento,
  agregarRuta
};
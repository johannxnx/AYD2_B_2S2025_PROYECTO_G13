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

const Contrato           = require('../../models/contratos/Contrato');
const ContratoTarifa     = require('../../models/contratos/ContratoTarifa');
const Descuento          = require('../../models/contratos/Descuento');
const RutaAutorizada     = require('../../models/contratos/RutaAutorizada');
const Usuario            = require('../../models/usuarios/Usuario');
const Auditoria          = require('../../models/auditoria/Auditoria');
const FacturaFEL         = require('../../models/contratos/FacturaFEL');
const CuentasPorCobrar   = require('../../models/contratos/CuentasPorCobrar');
const { notificarBloqueoPorCredito } = require('../../utils/notificaciones');

/**
 * @async
 * @function generarNumeroContrato
 * @description Genera automáticamente un número único de contrato con formato CTR-YYYY-NNNNN
 * @returns {Promise<string>} Número de contrato generado (ej: CTR-2026-00001)
 * @throws {Error} Si hay error al buscar el último contrato
 */
const generarNumeroContrato = async () => {
  const year = new Date().getFullYear();
  const ultimoContrato = await Contrato.obtenerUltimoContrato();
  
  let secuencial = 1;
  if (ultimoContrato && ultimoContrato.numero_contrato) {
    const parte = ultimoContrato.numero_contrato.split('-');
    if (parte[1] === String(year)) {
      secuencial = parseInt(parte[2]) + 1;
    }
  }
  
  return `CTR-${year}-${String(secuencial).padStart(5, '0')}`;
};

/**
 * @async
 * @function crearContrato
 * @description Crea nuevo contrato multimoneda. SEGÚN ENUNCIADO:
 * - Moneda "pactada" al crear contrato: GTQ (1), USD (2), HNL (6), SVC (7)
 * - Si no se especifica moneda_id → se sugiere automáticamente por país del cliente
 * - Usuario puede override: enviar moneda_id diferente a la sugerida
 * @param {Object} datos - Datos del contrato
 * @param {string} [datos.numero_contrato] - Número único (auto-generado)
 * @param {number} datos.cliente_id - ID cliente corporativo (OBLIGATORIO)
 * @param {string} datos.fecha_inicio - Inicio vigencia YYYY-MM-DD (OBLIGATORIO)
 * @param {string} datos.fecha_fin - Fin vigencia > fecha_inicio (OBLIGATORIO)
 * @param {number} datos.limite_credito - Límite crédito en moneda pactada (OBLIGATORIO)\n * @param {number} datos.plazo_pago - 15, 30 o 45 días (OBLIGATORIO)
 * @param {number} [datos.moneda_id] - 1=GTQ, 2=USD, 6=HNL, 7=SVC (OPCIONAL, sugerida por país)
 * @param {string} [datos.pais] - País cliente (para sugerir moneda si moneda_id omitido)
 * @param {Array} [datos.tarifas] - Tarifas por tipo de unidad
 * @param {Array} [datos.rutas] - Rutas autorizadas
 * @param {Array} [datos.descuentos] - Descuentos especiales
 * @param {number} usuario_ejecutor - ID usuario creador (auditoría)
 * @param {string} ip - IP origen (auditoría)
 * @returns {Promise<Object>} Contrato con id, numero_contrato, moneda_id, fecha_creacion
 * @throws {Error} Cliente inválido, moneda inválida, o datos inconsistentes
 * @example
 * // Crear contrato con moneda explícita
 * POST /api/contratos
 * { cliente_id: 5, fecha_inicio: \"2026-04-20\", fecha_fin: \"2027-04-20\",
 *   limite_credito: 50000, plazo_pago: 30, moneda_id: 2 }
 * // Crear contrato, moneda sugerida por país (GUATEMALA→GTQ)
 * POST /api/contratos
 * { cliente_id: 6, fecha_inicio: \"2026-04-20\", fecha_fin: \"2027-04-20\",
 *   limite_credito: 30000, plazo_pago: 15, pais: \"HONDURAS\" }
 *  // → Se sugiere moneda_id: 6 (HNL - Lempira)
 */
const crearContrato = async (datos, usuario_ejecutor, ip) => {
  const { obtenerMonedaPorPais } = require('../../utils/monedaPorPais');
  
  // Validar que el usuario esté presente
  if (!usuario_ejecutor) {
    throw { status: 401, mensaje: 'Usuario no autenticado. Debe iniciar sesión para crear contratos.' };
  }

  try {
    let { numero_contrato, cliente_id, fecha_inicio, fecha_fin, limite_credito, plazo_pago, tarifas, rutas, descuentos, moneda_id, pais } = datos;

    // Generar número de contrato automáticamente si no se proporciona
    if (!numero_contrato) {
      numero_contrato = await generarNumeroContrato();
    }

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

    // SEGÚN ENUNCIADO: Moneda pactada al crear contrato
    // Si no se proporciona moneda_id, sugerir basada en país del cliente
    if (!moneda_id) {
      const paisCliente = pais || cliente.pais;
      moneda_id = obtenerMonedaPorPais(paisCliente);
    }

    // Validar que la moneda sea una de las 4 del proyecto (GTQ, USD, HNL, SVC)
    const MONEDAS_PERMITIDAS = [1, 2, 6, 7];
    if (!MONEDAS_PERMITIDAS.includes(moneda_id)) {
      throw { status: 400, mensaje: 'Moneda inválida. Monedas permitidas: 1=GTQ, 2=USD, 6=HNL, 7=SVC' };
    }

    console.log('[contratoService.crearContrato] Creando contrato con datos:', {
      numero_contrato,
      cliente_id,
      moneda_id,
      fecha_inicio,
      fecha_fin,
      limite_credito,
      plazo_pago,
      creado_por: usuario_ejecutor
    });

    const contrato = await Contrato.crearContrato({
      numero_contrato, cliente_id, fecha_inicio, fecha_fin,
      limite_credito, plazo_pago, creado_por: usuario_ejecutor, moneda_id
    });

    console.log('[contratoService.crearContrato] Contrato creado exitosamente:', contrato.id);

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

    if (descuentos && descuentos.length > 0) {
      for (const descuento of descuentos) {
        await Descuento.crearDescuento({
          contrato_id: contrato.id,
          tipo_unidad: descuento.tipo_unidad.toUpperCase(),
          porcentaje_descuento: descuento.porcentaje_descuento,
          observacion: descuento.observacion || null,
          autorizado_por: usuario_ejecutor
        });
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
  } catch (error) {
    console.error('[contratoService.crearContrato] Error:', error);
    
    // Si es un error lanzado por nosotros, propagarlo
    if (error.status && error.mensaje) {
      throw error;
    }
    
    // Si es un error de base de datos u otro, convertirlo a nuestro formato
    throw {
      status: error.status || 500,
      mensaje: error.mensaje || error.message || 'Error al crear contrato'
    };
  }
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
const listarContratosPorCliente = async (cliente_id) => {
  const cliente = await Usuario.buscarPorId(cliente_id);
  if (!cliente) throw { status: 404, mensaje: 'Cliente no encontrado' };
  return await Contrato.listarPorCliente(cliente_id);
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
  // Validar autenticación
  if (!usuario_ejecutor) {
    throw { status: 401, mensaje: 'Usuario no autenticado. Debe iniciar sesión para modificar contratos.' };
  }

  try {
    const contratoActual = await Contrato.buscarPorId(id);
    if (!contratoActual) {
      throw { status: 404, mensaje: 'Contrato no encontrado' };
    }
    
    if (contratoActual.estado !== 'VIGENTE') {
      throw { status: 400, mensaje: 'Solo se pueden modificar contratos vigentes' };
    }

    // Validar plazo_pago si se proporciona
    if (datos.plazo_pago) {
      const plazosValidos = [15, 30, 45];
      if (!plazosValidos.includes(datos.plazo_pago)) {
        throw { status: 400, mensaje: 'El plazo de pago debe ser 15, 30 o 45 días' };
      }
    }

    // Validar moneda_id si se proporciona
    if (datos.moneda_id) {
      const MONEDAS_PERMITIDAS = [1, 2, 6, 7];
      if (!MONEDAS_PERMITIDAS.includes(datos.moneda_id)) {
        throw { status: 400, mensaje: 'Moneda inválida. Monedas permitidas: 1=GTQ, 2=USD, 6=HNL, 7=SVC' };
      }
    }

    console.log('[contratoService.modificarContrato] Actualizando contrato:', {
      id,
      numero_contrato: contratoActual.numero_contrato,
      modificado_por: usuario_ejecutor,
      cambios: datos
    });

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

    console.log('[contratoService.modificarContrato] Contrato actualizado exitosamente:', contratoActualizado.id);

    return contratoActualizado;
  } catch (error) {
    console.error('[contratoService.modificarContrato] Error:', error);
    
    // Si es un error lanzado por nosotros, propagarlo
    if (error.status && error.mensaje) {
      throw error;
    }
    
    // Si es un error de base de datos u otro, convertirlo a nuestro formato
    throw {
      status: error.status || 500,
      mensaje: error.mensaje || error.message || 'Error al modificar contrato'
    };
  }
};

/**
 * @async
 * @function validarCliente
 * @description Valida si un cliente puede realizar transporte (FILTRO COMERCIAL COMPLETO)
 * Verifica:
 *   1. Estado del cliente (BLOQUEADO/INACTIVO)
 *   2. Contrato vigente y NO expirado
 *   3. Facturas certificadas sin pagar
 *   4. Cuentas por cobrar vencidas
 *   5. Límite de crédito no excedido
 *   6. Ruta autorizada en contrato
 *   7. Tarifa y descuento aplicables
 * 
 * BLOQUEO AUTOMÁTICO: Si cliente excede límite de crédito, es bloqueado automáticamente
 * @param {number} cliente_id - ID del cliente a validar
 * @param {string} [origen] - Ciudad/punto de origen del transporte
 * @param {string} [destino] - Ciudad/punto de destino del transporte
 * @param {string} [tipo_unidad] - Tipo de unidad (LIGERA, PESADA, CABEZAL)
 * @returns {Promise<Object>} Objeto con habilitado (boolean), motivo si está deshabilitado, y detalles de cliente/contrato/tarifa si está habilitado
 */
const validarCliente = async (cliente_id, origen, destino, tipo_unidad) => {
  // ============================================================
  // VALIDACIÓN 1: Estado del cliente
  // ============================================================
  const cliente = await Usuario.buscarPorId(cliente_id);
  if (!cliente) return { habilitado: false, motivo: 'Cliente no encontrado' };
  if (cliente.estado === 'BLOQUEADO') return { habilitado: false, motivo: 'Cliente bloqueado' };
  if (cliente.estado === 'INACTIVO')  return { habilitado: false, motivo: 'Cliente inactivo' };

  // VALIDACIÓN CRÍTICA: Solo CLIENTE_CORPORATIVO puede tener contratos
  // (CA-04: Solo corporativos tienen contratos y pueden ser validados)
  if (cliente.tipo_usuario !== 'CLIENTE_CORPORATIVO') {
    return { habilitado: false, motivo: 'Solo clientes corporativos pueden tener contratos' };
  }

  // ============================================================
  // VALIDACIÓN 2: TODOS los contratos vigentes y no expirados
  // ============================================================
  const contratos = await Contrato.buscarTodosPorCliente(cliente_id);
  if (!contratos || contratos.length === 0) {
    return { habilitado: false, motivo: 'El cliente no tiene un contrato vigente' };
  }

  // Validar que al menos UNO de los contratos no esté expirado y actualizar estados si es necesario
  const contratosActivos = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  for (const contrato of contratos) {
    const fechaFin = new Date(contrato.fecha_fin);
    if (fechaFin < hoy) {
      // Contrato expiró, cambiar estado
      await Contrato.cambiarEstado(contrato.id, 'EXPIRADO');
    } else {
      contratosActivos.push(contrato);
    }
  }

  if (contratosActivos.length === 0) {
    return { habilitado: false, motivo: 'Todos los contratos del cliente han expirado' };
  }

  // Usar el contrato más reciente para mostrar en respuesta
  const contratoActual = contratosActivos[0];

  // ============================================================
  // VALIDACIÓN 3: Facturas certificadas sin pagar (Bloqueo Automático)
  // ============================================================
  const facturasVencidas = await FacturaFEL.traerFacturasCertificadas(cliente_id);
  if (facturasVencidas && facturasVencidas.length > 0) {
    return { 
      habilitado: false, 
      motivo: `Cliente tiene ${facturasVencidas.length} factura(s) certificada(s) sin pagar`,
      facturas_pendientes: facturasVencidas
    };
  }

  // ============================================================
  // VALIDACIÓN 4: Cuentas por cobrar vencidas (Bloqueo Automático)
  // ============================================================
  const cuentasVencidas = await CuentasPorCobrar.traerCuentasVencidas(cliente_id);
  if (cuentasVencidas && cuentasVencidas.length > 0) {
    return { 
      habilitado: false, 
      motivo: `Cliente tiene ${cuentasVencidas.length} cuenta(s) por cobrar vencida(s)`,
      cuentas_vencidas: cuentasVencidas
    };
  }

  // ============================================================
  // VALIDACIÓN 5: Límite de crédito NO EXCEDIDO EN TODOS LOS CONTRATOS (Bloqueo Automático)
  // ============================================================
  // Calcular totales de TODOS los contratos activos
  const totalLimiteCredito = contratosActivos.reduce((sum, c) => sum + (c.limite_credito || 0), 0);
  const totalSaldoUsado = contratosActivos.reduce((sum, c) => sum + (c.saldo_usado || 0), 0);
  const totalCreditoDisponible = totalLimiteCredito - totalSaldoUsado;

  if (totalSaldoUsado >= totalLimiteCredito) {
    // Doble validación: Solo CLIENTE_CORPORATIVO puede ser bloqueado (CA-04)
    if (cliente.tipo_usuario === 'CLIENTE_CORPORATIVO') {
      await Usuario.cambiarEstado(cliente_id, 'BLOQUEADO');
      
      // Enviar notificación de bloqueo automático
      try {
        await notificarBloqueoPorCredito(cliente, contratoActual);
      } catch (errorCorreo) {
        // No bloquear la operación si hay error en el correo
        console.error(`[validarCliente] Error al enviar notificación: ${errorCorreo.message}`);
      }
    }
    
    return { 
      habilitado: false, 
      motivo: `Límite de crédito excedido en suma de contratos (Total usado: Q${totalSaldoUsado.toFixed(2)} / Q${totalLimiteCredito.toFixed(2)}). Cliente bloqueado automáticamente`,
      contratos_resumen: contratosActivos.map(c => ({
        numero_contrato: c.numero_contrato,
        limite_credito: c.limite_credito,
        saldo_usado: c.saldo_usado,
        moneda_id: c.moneda_id,
        nombre_moneda: c.nombre_moneda,
        simbolo_moneda: c.simbolo_moneda
      }))
    };
  }

  // ============================================================
  // VALIDACIÓN 6: Ruta autorizada en contrato
  // ============================================================
  if (origen && destino) {
    const ruta = await RutaAutorizada.verificarRuta(contratoActual.id, origen, destino);
    if (!ruta) return { habilitado: false, motivo: `La ruta ${origen} → ${destino} no está autorizada en el contrato` };
  }

  // ============================================================
  // VALIDACIÓN 7: Tarifa y descuento aplicables
  // ============================================================
  let tarifa   = null;
  let descuento = null;
  if (tipo_unidad) {
    tarifa    = await ContratoTarifa.buscarPorContratoYTipo(contratoActual.id, tipo_unidad);
    descuento = await Descuento.buscarPorContratoYTipo(contratoActual.id, tipo_unidad);
  }

  // ============================================================
  // CLIENTE HABILITADO - Retornar detalles completos
  // ============================================================
  return {
    habilitado: true,
    cliente: { id: cliente.id, nombre: cliente.nombre, estado: cliente.estado, tipo_usuario: cliente.tipo_usuario },
    contrato: {
      id:               contratoActual.id,
      numero_contrato:  contratoActual.numero_contrato,
      fecha_fin:        contratoActual.fecha_fin,
      limite_credito:   contratoActual.limite_credito,
      saldo_usado:      contratoActual.saldo_usado,
      saldo_disponible: contratoActual.limite_credito - contratoActual.saldo_usado,
      plazo_pago:       contratoActual.plazo_pago,
      moneda_id:        contratoActual.moneda_id,
      nombre_moneda:    contratoActual.nombre_moneda,
      simbolo_moneda:   contratoActual.simbolo_moneda
    },
    contratos_resumen: {
      total_limite_credito: totalLimiteCredito,
      total_saldo_usado: totalSaldoUsado,
      total_saldo_disponible: totalCreditoDisponible,
      cantidad_contratos: contratosActivos.length,
      contratos: contratosActivos.map(c => ({
        numero_contrato: c.numero_contrato,
        limite_credito: c.limite_credito,
        saldo_usado: c.saldo_usado,
        saldo_disponible: c.limite_credito - c.saldo_usado,
        fecha_fin: c.fecha_fin,
        plazo_pago: c.plazo_pago,
        moneda_id: c.moneda_id,
        nombre_moneda: c.nombre_moneda,
        simbolo_moneda: c.simbolo_moneda
      }))
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
 * @param {string} [datos.observacion] - Observación o razón del descuento
 * @param {number} usuario_ejecutor - ID del usuario que autoriza (para auditoría)
 * @param {string} ip - Dirección IP del cliente (para auditoría)
 * @returns {Promise<Object>} Descuento creado
 * @throws {Error} Si contrato no existe, no está vigente, o datos son inválidos
 */
const agregarDescuento = async (contrato_id, datos, usuario_ejecutor, ip) => {
  const { tipo_unidad, porcentaje_descuento } = datos;

  // Validar contrato
  const contrato = await Contrato.buscarPorId(contrato_id);
  if (!contrato) throw { status: 404, mensaje: 'Contrato no encontrado' };
  if (contrato.estado !== 'VIGENTE') {
    throw { status: 400, mensaje: 'Solo se pueden agregar descuentos a contratos vigentes' };
  }

  // Validar tipo de unidad
  const tiposValidos = ['LIGERA', 'PESADA', 'CABEZAL'];
  const tipoNormalizado = tipo_unidad.toUpperCase();
  if (!tiposValidos.includes(tipoNormalizado)) {
    throw { status: 400, mensaje: `Tipo de unidad inválido. Debe ser: ${tiposValidos.join(', ')}` };
  }

  // Validar rango de descuento
  if (porcentaje_descuento < 0 || porcentaje_descuento > 100) {
    throw { status: 400, mensaje: 'El descuento debe estar entre 0 y 100%' };
  }

  // Verificar que no exista descuento duplicado
  const descuentoExistente = await Descuento.buscarPorContratoYTipo(contrato_id, tipoNormalizado);
  if (descuentoExistente) {
    throw { 
      status: 409, 
      mensaje: `Ya existe un descuento para ${tipoNormalizado} en este contrato. Puedes actualizar el existente.` 
    };
  }

  const descuento = await Descuento.crearDescuento({ 
    contrato_id, 
    tipo_unidad: tipoNormalizado,
    porcentaje_descuento,
    observacion: datos.observacion || null,
    autorizado_por: usuario_ejecutor 
  });

  await Auditoria.registrar({
    tabla_afectada: 'descuentos_contrato',
    accion:         'CREATE',
    registro_id:    descuento.id,
    usuario_id:     usuario_ejecutor,
    descripcion:    `Descuento especial de ${porcentaje_descuento}% para ${tipoNormalizado} agregado al contrato ${contrato.numero_contrato}`,
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

/**
 * @async
 * @function obtenerProxNumeroContrato
 * @description Obtiene el próximo número de contrato a generar
 * @returns {Promise<Object>} Objeto con el próximo número
 */
const obtenerProxNumeroContrato = async () => {
  const numeroContrato = await generarNumeroContrato();
  return { numero_contrato: numeroContrato };
};

/**
 * Obtiene estadísticas del dashboard logístico
 * @async
 * @returns {Promise<Object>} Estadísticas consolidadas
 */
const obtenerEstadisticasDashboard = async () => {
  try {
    const totalContratosResult = await Contrato.listarTodos();
    const totalContratos = totalContratosResult.length;

    const vigentes = totalContratosResult.filter(c => c.estado === 'VIGENTE').length;
    const vencidos = totalContratosResult.filter(c => c.estado === 'VENCIDO').length;
    const cancelados = totalContratosResult.filter(c => c.estado === 'CANCELADO').length;

    const contratosVigentes = totalContratosResult.filter(c => c.estado === 'VIGENTE');
    const totalCredito = contratosVigentes.reduce((sum, c) => sum + (c.limite_credito || 0), 0);
    const totalUsado = contratosVigentes.reduce((sum, c) => sum + (c.saldo_usado || 0), 0);
    const creditoDisponible = totalCredito - totalUsado;

    const { getConnection } = require('../../config/db');
    const pool = await getConnection();
    
    const resultQuery = await pool.request()
      .query(`SELECT COUNT(*) as cantidad FROM usuarios WHERE estado = 'ACTIVO' AND tipo_usuario = 'CLIENTE_CORPORATIVO'`);
    
    console.log('[Dashboard] Query ejecutada exitosamente');
    console.log('[Dashboard] Recordset recibido:', resultQuery.recordset);
    
    let totalClientesActivos = 0;
    if (resultQuery.recordset && resultQuery.recordset.length > 0) {
      totalClientesActivos = resultQuery.recordset[0].cantidad || 0;
      console.log('[Dashboard] Cantidad de clientes activos extraída:', totalClientesActivos);
    } else {
      console.log('[Dashboard] Recordset vacío o sin datos');
    }

    console.log('[Dashboard] Retornando estadísticas:', {
      totalContratos,
      contratosVigentes: vigentes,
      clientesActivos: totalClientesActivos
    });

    return {
      totalContratos,
      contratosVigentes: vigentes,
      contratosVencidos: vencidos,
      contratosCancelados: cancelados,
      totalCreditoDisponible: creditoDisponible,
      totalCreditoUsado: totalUsado,
      clientesActivos: totalClientesActivos
    };
  } catch (error) {
    console.error('[Dashboard ERROR] Error al obtener estadísticas:', error);
    throw {
      status: 500,
      mensaje: 'Error al obtener estadísticas del dashboard'
    };
  }
};

module.exports = {
  crearContrato,
  obtenerContrato,
  listarContratosPorCliente,
  listarTodosContratos,  
  modificarContrato,
  validarCliente,
  agregarDescuento,
  agregarRuta,
  generarNumeroContrato,
  obtenerProxNumeroContrato,
  obtenerEstadisticasDashboard
};
/**
 * @file facturacionController.js
 * @description Controlador HTTP para el módulo de Facturación Electrónica y Pagos.
 *
 * Actores que usan estos endpoints:
 *   - AGENTE_FINANCIERO  -> genera borrador, valida, certifica, registra pagos, consulta
 *   - AREA_CONTABLE      -> consulta facturas, cuentas por cobrar, movimientos de crédito
 *
 * Este controlador es "thin": solo se encarga de:
 *   1. Leer el request (params, body, user del JWT)
 *   2. Llamar al servicio correspondiente
 *   3. Devolver la respuesta HTTP con el formato estándar { ok, mensaje, data }
 *
 * Toda la lógica de negocio vive en facturacion.service.js.
 */

"use strict";

const facturacionService = require("../../services/facturacion/Facturacion");
const FacturaFEL  = require("../../models/facturacion/FacturaFel");

/* ─── Helper de respuesta estándar ───────────────────── */
const ok  = (res, data, mensaje = "OK", status = 200) =>
  res.status(status).json({ ok: true, mensaje, data });

const err = (res, mensaje, status = 500, detalle = null) =>
  res.status(status).json({ ok: false, mensaje, ...(detalle ? { detalle } : {}) });


/**
 * Extrae el ID numérico del usuario desde el payload del JWT.
 * Soporta los campos: id, sub, usuario_id.
 * Lanza un error HTTP 401 si no puede resolver el ID.
 */
function resolverUserId(user) {
  if (!user) {
    throw Object.assign(
      new Error("Token inválido: no hay información de usuario."),
      { status: 401 }
    );
  }
 
  // Probar los campos en orden de prioridad
  const candidatos = [user.id, user.sub, user.usuario_id];
  for (const c of candidatos) {
    const n = parseInt(c);
    if (!isNaN(n) && n > 0) return n;
  }
 
  throw Object.assign(
    new Error(
      `Token inválido: no se pudo obtener el ID de usuario. ` +
      `Payload recibido: ${JSON.stringify(user)}`
    ),
    { status: 401 }
  );
}


/* 
   1. GENERAR BORRADOR (CDU003.1)
   POST /api/facturacion/borrador/:orden_id
    */

/**
 * Genera automáticamente el borrador de factura para una orden entregada.
 *
 * En el camino feliz, este endpoint es llamado internamente cuando
 * el piloto marca la orden como "ENTREGADA". Sin embargo, el agente
 * financiero también puede dispararla manualmente si el borrador no
 * se generó automáticamente (FA2 del CDU003.1).
 *
 POST /api/facturacion/borrador/:orden_id
 AGENTE_FINANCIERO | AREA_CONTABLE
 */
 const generarBorrador = async (req, res) => {
  try {
    const orden_id  = parseInt(req.params.orden_id);
    const usuarioId = resolverUserId(req.user);

    if (isNaN(orden_id)) {
      return err(res, "orden_id debe ser un número entero", 400);
    }

    // Recuperar la instancia de Socket.IO desde app
    const io = req.app.get("io");

    const resultado = await facturacionService.generarBorrador(orden_id, usuarioId, io);

    const mensaje = resultado.yaExistia
      ? "Ya existía una factura para esta orden. Se retorna la existente."
      : "Borrador de factura generado exitosamente.";

    return ok(res, resultado, mensaje, resultado.yaExistia ? 200 : 201);
  } catch (error) {
    return err(res, error.message, error.status || 500);
  }
};



/* 
   2. VALIDAR BORRADOR (CDU003.2)
   POST /api/facturacion/:factura_id/validar
    */

/**
 * Valida el borrador contra las reglas de la SAT (simuladas).
 * Si aprueba -> estado cambia a VALIDADA.
 * Si rechaza -> el borrador permanece, se registra el motivo.
 *
 *  POST /api/facturacion/:factura_id/validar
 * AGENTE_FINANCIERO
 */
const validarBorrador = async (req, res) => {
  try {
    const factura_id  = parseInt(req.params.factura_id);
    const validado_por = resolverUserId(req.user);    // ← FIX del NULL
 
    if (isNaN(factura_id)) {
      return err(res, "factura_id debe ser un número entero", 400);
    }
 
    const resultado = await facturacionService.validarFactura(factura_id, validado_por);
 
    const mensaje = resultado.resultado.aprobada
      ? "Factura validada correctamente. Lista para certificación FEL."
      : "Validación rechazada. Corrija los errores indicados.";
 
    return ok(res, resultado, mensaje, resultado.resultado.aprobada ? 200 : 422);
  } catch (error) {
    return err(res, error.message, error.status || 500);
  }
};



/* 
   3. CERTIFICAR FEL (CDU003.3)
   POST /api/facturacion/:factura_id/certificar
    */

/**
 * Certifica la factura ante el simulador FEL de la SAT.
 * Solo puede certificar facturas en estado VALIDADA.
 *
 * Al certificar:
 *   -> Se genera UUID de autorización (número SAT ficticio)
 *   -> Se genera XML DTE
 *   -> Se crea la Cuenta por Cobrar automáticamente
 *   -> Se carga el saldo_usado del contrato
 *   -> Se envía notificación al cliente (CDU003.4)
 *
 * @route POST /api/facturacion/:factura_id/certificar
 * @auth AGENTE_FINANCIERO
 */
const certificarFactura = async (req, res) => {
  try {
    const factura_id     = parseInt(req.params.factura_id);
    const certificadoPor = resolverUserId(req.user);
 
    if (isNaN(factura_id)) {
      return err(res, "factura_id debe ser un número entero", 400);
    }
 
    const resultado = await facturacionService.certificarFactura(factura_id, certificadoPor);
 
    return ok(res, resultado, `Factura certificada. UUID SAT: ${resultado.uuid}`, 200);
  } catch (error) {
    return err(res, error.message, error.status || 500, error.detallesSAT || null);
  }
};

/* 
   4. REGISTRAR PAGO (CDU003.6 / CDU003.9)
   POST /api/facturacion/:factura_id/pagos
    */

/**
 * Registra el pago de una factura certificada.
 * Libera el crédito del contrato automáticamente.
 *
 * @route POST /api/facturacion/:factura_id/pagos
 * @auth AGENTE_FINANCIERO
 * @body {
 *   cuenta_por_cobrar_id:         number  (requerido)
 *   forma_pago:                   string  CHEQUE | TRANSFERENCIA  (requerido)
 *   monto_pagado:                 number  (requerido)
 *   fecha_hora_pago:              string  ISO 8601  (requerido)
 *   banco_origen:                 string  (requerido)
 *   cuenta_origen:                string  (requerido)
 *   numero_autorizacion_bancaria: string  (requerido)
 *   observacion:                  string  (opcional)
 * }
 */
const registrarPago = async (req, res) => {
  try {
    const factura_id    = parseInt(req.params.factura_id);
    const registradoPor = resolverUserId(req.user);
 
    if (isNaN(factura_id)) {
      return err(res, "factura_id debe ser un número entero", 400);
    }
 
    const {
      cuenta_por_cobrar_id,
      forma_pago,
      monto_pagado,
      fecha_hora_pago,
      banco_origen,
      cuenta_origen,
      numero_autorizacion_bancaria,
      observacion,
    } = req.body;
 
    const requeridos = {
      cuenta_por_cobrar_id,
      forma_pago,
      monto_pagado,
      fecha_hora_pago,
      banco_origen,
      cuenta_origen,
      numero_autorizacion_bancaria,
    };
 
    const faltantes = Object.entries(requeridos)
      .filter(([, v]) => v === undefined || v === null || v === "")
      .map(([k]) => k);
 
    if (faltantes.length > 0) {
      return err(res, `Campos obligatorios faltantes: ${faltantes.join(", ")}`, 400);
    }
 
    if (!["CHEQUE", "TRANSFERENCIA"].includes(forma_pago)) {
      return err(res, "forma_pago debe ser CHEQUE o TRANSFERENCIA", 400);
    }
 
    if (isNaN(parseFloat(monto_pagado)) || parseFloat(monto_pagado) <= 0) {
      return err(res, "monto_pagado debe ser un número positivo", 400);
    }
 
    const resultado = await facturacionService.registrarPago(
      {
        factura_id,
        cuenta_por_cobrar_id: parseInt(cuenta_por_cobrar_id),
        forma_pago,
        monto_pagado,
        fecha_hora_pago,
        banco_origen,
        cuenta_origen,
        numero_autorizacion_bancaria,
        observacion,
      },
      registradoPor
    );
 
    return ok(
      res,
      resultado,
      `Pago de Q${monto_pagado} registrado. Crédito liberado: Q${resultado.creditoLiberado}`,
      201
    );
  } catch (error) {
    return err(res, error.message, error.status || 500);
  }
};

/* 
   5. CONSULTAR FACTURA COMPLETA (CDU003.7)
   GET /api/facturacion/:factura_id
    */

/**
 * Obtiene la factura con sus pagos y cuenta por cobrar.
 * Disponible para el cliente y el agente financiero.
 *
 * @route GET /api/facturacion/:factura_id
 * @auth AGENTE_FINANCIERO | AREA_CONTABLE
 */
const obtenerFactura = async (req, res) => {
  try {
    const factura_id = parseInt(req.params.factura_id);
    if (isNaN(factura_id)) {
      return err(res, "factura_id debe ser un número entero", 400);
    }
    const datos = await facturacionService.obtenerFacturaCompleta(factura_id);
    return ok(res, datos, "Factura obtenida exitosamente.");
  } catch (error) {
    return err(res, error.message, error.status || 500);
  }
};

/* 
   6. LISTAR FACTURAS (CDU003.7)
   GET /api/facturacion
    */

/**
 * Lista facturas con filtros opcionales por query params.
 *
 * @route GET /api/facturacion
 * @auth AGENTE_FINANCIERO | AREA_CONTABLE
 * @query {
 *   cliente_id:   number (opcional)
 *   estado:       string BORRADOR|VALIDADA|CERTIFICADA|ANULADA (opcional)
 *   fecha_desde:  string YYYY-MM-DD (opcional)
 *   fecha_hasta:  string YYYY-MM-DD (opcional)
 *   limit:        number (opcional, default 50)
 * }
 */
const listarFacturas = async (req, res) => {
  try {
    const { cliente_id, estado, fecha_desde, fecha_hasta, limit } = req.query;
 
    const facturas = await FacturaFEL.listar({
      cliente_id:  cliente_id  ? parseInt(cliente_id)  : undefined,
      estado,
      fecha_desde,
      fecha_hasta,
      limit:       limit       ? parseInt(limit)       : 50,
    });
 
    return ok(res, { facturas, total: facturas.length }, "Facturas obtenidas exitosamente.");
  } catch (error) {
    return err(res, error.message);
  }
};


/* 
   7. LISTAR CUENTAS POR COBRAR (CDU003.7 / CDU003.8)
   GET /api/facturacion/cobros
    */

/**
 * Lista las cuentas por cobrar (módulo de cobros).
 * Filtra por estado y cliente.
 *
 *  GET /api/facturacion/cobros
 * AGENTE_FINANCIERO | AREA_CONTABLE
 *  {
 *   cliente_id:   number (opcional)
 *   estado_cobro: string PENDIENTE|PAGADA|VENCIDA|ANULADA (opcional)
 *   limit:        number (opcional, default 100)
 * }
 */
const listarCobros = async (req, res) => {
  try {
    const { cliente_id, estado_cobro, limit } = req.query;
 
    const cuentas = await FacturaFEL.listarCuentasPorCobrar({
      cliente_id:   cliente_id   ? parseInt(cliente_id) : undefined,
      estado_cobro: estado_cobro || undefined,
      limit:        limit        ? parseInt(limit)      : 100,
    });
 
    return ok(res, { cuentas, total: cuentas.length }, "Cuentas por cobrar obtenidas.");
  } catch (error) {
    return err(res, error.message);
  }
};

/* 
   8. LISTAR PAGOS DE UNA FACTURA
   GET /api/facturacion/:factura_id/pagos
    */

/**
 * Obtiene todos los pagos registrados contra una factura específica.
 *
 * @route GET /api/facturacion/:factura_id/pagos
 * @auth AGENTE_FINANCIERO | AREA_CONTABLE
 */
const listarPagos = async (req, res) => {
  try {
    const factura_id = parseInt(req.params.factura_id);
    if (isNaN(factura_id)) {
      return err(res, "factura_id debe ser un número entero", 400);
    }
    const pagos = await FacturaFEL.listarPagosPorFactura(factura_id);
    return ok(res, { pagos, total: pagos.length }, "Pagos obtenidos.");
  } catch (error) {
    return err(res, error.message);
  }
};

/* 
   9. OBTENER FACTURA POR ORDEN
   GET /api/facturacion/orden/:orden_id
    */

/**
 * Obtiene la factura vinculada a una orden específica.
 * Útil para que el piloto/operativo consulte sin conocer el ID de factura.
 *
 * -->  ----> tabla facturas_fel

 * 
 * GET /api/facturacion/orden/:orden_id
 *  AGENTE_FINANCIERO | AREA_CONTABLE
 */
const obtenerPorOrden = async (req, res) => {
  try {
    const orden_id = parseInt(req.params.orden_id);
    if (isNaN(orden_id)) {
      return err(res, "orden_id debe ser un número entero", 400);
    }
 
    const factura = await FacturaFEL.buscarPorOrden(orden_id);
    if (!factura) {
      return err(
        res,
        `No existe factura para la orden ${orden_id}. Verifique que la orden esté ENTREGADA/CERRADA y el borrador haya sido generado.`,
        404
      );
    }
 
    return ok(res, { factura }, "Factura de la orden obtenida.");
  } catch (error) {
    return err(res, error.message);
  }
};


module.exports = {
  generarBorrador,
  validarBorrador,
  certificarFactura,
  registrarPago,
  obtenerFactura,
  listarFacturas,
  listarCobros,
  listarPagos,
  obtenerPorOrden,
};
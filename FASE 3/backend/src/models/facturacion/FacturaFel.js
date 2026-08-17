/**
 * @file FacturaFEL.js
 * @description Modelo para la gestión de facturas electrónicas (FEL) de LogiTrans Guatemala.
 *
 * Tablas que utiliza este modelo:
 *   - facturas_fel         -> Documento principal de la factura
 *   - validacion_fel       -> Registro del proceso de validación SAT simulado
 *   - cuentas_por_cobrar   -> Deuda generada tras certificar la factura
 *   - pagos_factura        -> Pagos registrados contra una factura
 *   - movimientos_credito_contrato -> Trazabilidad del límite de crédito del contrato
 *   - ordenes              -> Para consultar datos de la orden al generar el borrador
 *   - contratos            -> Para calcular la tarifa y leer el plazo de pago
 *   - contrato_tarifas     -> Tarifa negociada del contrato
 *   - descuentos_contrato  -> Descuento especial pactado en el contrato
 *   - usuarios             -> Datos del cliente (nombre, NIT, email)
 */

"use strict";

const sql             = require("mssql");
const { getConnection } = require("../../config/db");

/* 
   SECCIÓN 1 — FACTURAS FEL
    */

/**
 * Crea el BORRADOR de una factura a partir de una orden entregada.
 *
 * Flujo del camino feliz (paso 6 -> 7):
 *   Orden marcada "Entregada"  ->  este método crea el borrador en estado BORRADOR.
 *
 * La fórmula aplicada es:
 *   subtotal  = (distancia_km * tarifa_aplicada) - descuento_aplicado
 *   iva       = subtotal * 0.12
 *   total     = subtotal + iva
 *
 * @async
 * @param {Object} datos
 * @param {number} datos.orden_id
 * @param {number} datos.cliente_id
 * @param {number} datos.contrato_id
 * @param {string} datos.numero_factura          - Número único generado por el servicio
 * @param {number} datos.distancia_km
 * @param {number} datos.tarifa_aplicada         - Q/km negociada del contrato
 * @param {number} datos.descuento_aplicado      - Monto absoluto de descuento
 * @param {number} datos.subtotal
 * @param {number} datos.iva
 * @param {number} datos.total_factura
 * @param {string} datos.nit_cliente
 * @param {string} datos.nombre_cliente_facturacion
 * @returns {Promise<Object>} Borrador creado
 */
const crearBorrador = async (datos) => {
  const {
    orden_id, cliente_id, contrato_id, moneda_id, numero_factura,
    distancia_km, tarifa_aplicada, descuento_aplicado,
    subtotal, iva, total_factura,
    nit_cliente, nombre_cliente_facturacion,
  } = datos;
 
  const pool   = await getConnection();
  const result = await pool.request()
  .input("orden_id", sql.Int, orden_id)
  .input("moneda_id", sql.Int, moneda_id)
  .input("cliente_id", sql.Int, cliente_id)
  .input("contrato_id", sql.Int, contrato_id)
  .input("numero_factura", sql.NVarChar(50), numero_factura)
  .input("distancia_km", sql.Decimal(10, 2), distancia_km)
  .input("tarifa_aplicada", sql.Decimal(10, 2), tarifa_aplicada)
  .input("descuento_aplicado", sql.Decimal(15, 2), descuento_aplicado)
  .input("subtotal", sql.Decimal(15, 2), subtotal)
  .input("iva", sql.Decimal(15, 2), iva)
  .input("total_factura", sql.Decimal(15, 2), total_factura)
  .input("nit_cliente", sql.NVarChar(13), nit_cliente)
  .input("nombre_cliente_facturacion", sql.NVarChar(255), nombre_cliente_facturacion)
  .query(`
    INSERT INTO facturas_fel (
      orden_id, cliente_id, contrato_id, moneda_id, numero_factura,
      estado,
      distancia_km, tarifa_aplicada, descuento_aplicado,
      subtotal, iva, total_factura,
      nit_cliente, nombre_cliente_facturacion,
      fecha_emision
    )
    VALUES (
      @orden_id, @cliente_id, @contrato_id, @moneda_id, @numero_factura,
      'BORRADOR',
      @distancia_km, @tarifa_aplicada, @descuento_aplicado,
      @subtotal, @iva, @total_factura,
      @nit_cliente, @nombre_cliente_facturacion,
      GETDATE()
    );

    SELECT SCOPE_IDENTITY() AS id;
  `);
 
    const id = result.recordset[0].id;

    const factura = await pool.request()
      .input("id", sql.Int, id)
      .query(`SELECT * FROM facturas_fel WHERE id = @id`);
    
    return factura.recordset[0];
  
  };

/**
 * Certifica una factura: la pasa de VALIDADA -> CERTIFICADA.
 * Registra el UUID de autorización, fecha de certificación y quién la certificó.
 *
 * @async
 * @param {number} factura_id
 * @param {number} certificado_por   - ID del agente financiero
 * @param {string} uuid_autorizacion - UUID generado por el simulador FEL
 * @param {string} xml_fel           - XML simulado de la SAT
 * @param {string} pdf_fel_url       - URL del PDF generado
 * @returns {Promise<Object>} Factura certificada
 */
const certificarFactura = async (factura_id, certificado_por, uuid_autorizacion, xml_fel, pdf_fel_url) => {
  const pool = await getConnection();

  await pool.request()
    .input("factura_id", sql.Int, factura_id)
    .input("certificado_por", sql.Int, certificado_por)
    .input("uuid_autorizacion", sql.NVarChar(100), uuid_autorizacion)
    .input("xml_fel", sql.NVarChar(sql.MAX), xml_fel)
    .input("pdf_fel_url", sql.NVarChar(500), pdf_fel_url)
    .query(`
      UPDATE facturas_fel
      SET estado              = 'CERTIFICADA',
          certificado_por     = @certificado_por,
          uuid_autorizacion   = @uuid_autorizacion,
          xml_fel             = @xml_fel,
          pdf_fel_url         = @pdf_fel_url,
          fecha_certificacion = GETDATE()
      WHERE id = @factura_id
        AND estado = 'VALIDADA'
    `);

  const result = await pool.request()
    .input("factura_id", sql.Int, factura_id)
    .query(`SELECT * FROM facturas_fel WHERE id = @factura_id`);

  return result.recordset[0];
};

/**
 * Actualiza el estado de una factura a cualquier valor permitido.
 * Uso interno del servicio de validación (BORRADOR -> VALIDADA / RECHAZADA).
 *
 * @async
 * @param {number} factura_id
 * @param {string} estado     - BORRADOR | VALIDADA | CERTIFICADA | ANULADA
 * @param {string} [observaciones]
 * @returns {Promise<Object>}
 */
const actualizarEstado = async (factura_id, estado, observaciones = null) => {
  const pool = await getConnection();

  await pool.request()
    .input("factura_id", sql.Int, factura_id)
    .input("estado", sql.NVarChar(15), estado)
    .input("observaciones", sql.NVarChar(1000), observaciones)
    .query(`
      UPDATE facturas_fel
      SET estado        = @estado,
          observaciones = COALESCE(@observaciones, observaciones)
      WHERE id = @factura_id
    `);

  const result = await pool.request()
    .input("factura_id", sql.Int, factura_id)
    .query(`SELECT * FROM facturas_fel WHERE id = @factura_id`);

  return result.recordset[0];
};

/**
 * Obtiene una factura por su ID con datos del cliente y contrato.
 *
 * @async
 * @param {number} factura_id
 * @returns {Promise<Object|undefined>}
 */
const buscarPorId = async (factura_id) => {
  const pool   = await getConnection();
  const result = await pool.request()
    .input("factura_id", sql.Int, factura_id)
    .query(`
      SELECT
        f.*,
        u.nombre   AS cliente_nombre,
        u.email    AS cliente_email,
        c.numero_contrato,
        c.plazo_pago,
        ag.nombre  AS certificado_por_nombre,
        o.origen,
        o.destino
      FROM facturas_fel f
      LEFT JOIN usuarios u  ON u.id  = f.cliente_id
      LEFT JOIN contratos c ON c.id  = f.contrato_id
      LEFT JOIN usuarios ag ON ag.id = f.certificado_por
      LEFT JOIN ordenes o   ON o.id  = f.orden_id
      WHERE f.id = @factura_id
    `);
 
  return result.recordset[0];
};


/**
 * Obtiene la factura vinculada a una orden específica.
 *
 *   ----> tabla facturas_fel
 * 
 */
const buscarPorOrden = async (orden_id) => {
  const pool   = await getConnection();
  const result = await pool.request()
    .input("orden_id", sql.Int, orden_id)
    .query(`
      SELECT f.*, u.nombre AS cliente_nombre, u.email AS cliente_email
      FROM facturas_fel f
      LEFT JOIN usuarios u ON u.id = f.cliente_id
      WHERE f.orden_id = @orden_id
    `);
 
  return result.recordset[0];
};


/**
 * Lista facturas con filtros opcionales.
 *
 *  sale de la tabla facturas_fel
 * 
 */
const listar = async (filtros = {}) => {
  const { cliente_id, estado, fecha_desde, fecha_hasta, limit = 50 } = filtros;
 
  const pool    = await getConnection();
  const request = pool.request();
 
  let where = "WHERE 1=1";
 
  if (cliente_id) {
    where += " AND f.cliente_id = @cliente_id";
    request.input("cliente_id", sql.Int, cliente_id);
  }
  if (estado) {
    where += " AND f.estado = @estado";
    request.input("estado", sql.NVarChar(15), estado);
  }
  if (fecha_desde) {
    where += " AND CAST(f.fecha_emision AS DATE) >= @fecha_desde";
    request.input("fecha_desde", sql.Date, fecha_desde);
  }
  if (fecha_hasta) {
    where += " AND CAST(f.fecha_emision AS DATE) <= @fecha_hasta";
    request.input("fecha_hasta", sql.Date, fecha_hasta);
  }
 
  request.input("limit", sql.Int, parseInt(limit));
 
  const result = await request.query(`
    SELECT
      f.id,
      f.orden_id,          -- CORRECCIÓN: estaba faltando
      f.numero_factura,
      f.estado,
      f.distancia_km,
      f.tarifa_aplicada,
      f.descuento_aplicado,
      f.subtotal,
      f.iva,
      f.total_factura,
      f.nit_cliente,
      f.nombre_cliente_facturacion,
      f.uuid_autorizacion,
      f.pdf_fel_url,
      f.fecha_emision,
      f.fecha_certificacion,
      u.nombre AS cliente_nombre,
      c.numero_contrato
    FROM facturas_fel f
    LEFT JOIN usuarios u  ON u.id  = f.cliente_id
    LEFT JOIN contratos c ON c.id  = f.contrato_id
    ${where}
    ORDER BY f.fecha_emision DESC
    OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY
  `);
 
  return result.recordset;
};

/* 
   SECCIÓN 2 — VALIDACIÓN FEL (simulador SAT)
    */

/**
 * Registra el resultado de la validación SAT simulada.
 *
 * @async
 * @param {Object} datos
 * @param {number} datos.factura_id
 * @param {string} datos.nit_validado
 * @param {boolean} datos.nit_valido
 * @param {boolean} datos.campos_obligatorios_completos
 * @param {string} datos.resultado_validacion   - APROBADA | RECHAZADA
 * @param {string} datos.mensaje_validacion
 * @param {string|null} datos.uuid_generado
 * @param {number} datos.validado_por
 * @returns {Promise<Object>}
 */
const registrarValidacion = async (datos) => {
  const {
    factura_id, nit_validado, nit_valido,
    campos_obligatorios_completos,
    resultado_validacion, mensaje_validacion,
    uuid_generado, validado_por,
  } = datos;
 
  const pool   = await getConnection();
  const result = await pool.request()
    .input("factura_id",                    sql.Int,          factura_id)
    .input("nit_validado",                  sql.NVarChar(13), nit_validado)
    .input("nit_valido",                    sql.Bit,          nit_valido ? 1 : 0)
    .input("campos_obligatorios_completos", sql.Bit,          campos_obligatorios_completos ? 1 : 0)
    .input("resultado_validacion",          sql.NVarChar(10), resultado_validacion)
    .input("mensaje_validacion",            sql.NVarChar(500), mensaje_validacion)
    .input("uuid_generado",                 sql.NVarChar(100), uuid_generado || null)
    .input("validado_por",                  sql.Int,          validado_por)
    .query(`
      INSERT INTO validacion_fel (
        factura_id, nit_validado, nit_valido,
        campos_obligatorios_completos,
        resultado_validacion, mensaje_validacion,
        uuid_generado, validado_por, fecha_validacion
      )
      VALUES (
        @factura_id, @nit_validado, @nit_valido,
        @campos_obligatorios_completos,
        @resultado_validacion, @mensaje_validacion,
        @uuid_generado, @validado_por, GETDATE()
      )
      SELECT SCOPE_IDENTITY() AS id;

    `);

    const id = result.recordset[0].id;

 
    const validacion = await pool.request()
    .input("id", sql.Int, id)
    .query(`SELECT * FROM validacion_fel WHERE id = @id`);

  return validacion.recordset[0];
};

/* 
   SECCIÓN 3 — CUENTAS POR COBRAR
    */

/**
 * Crea una cuenta por cobrar automáticamente al certificar la factura.
 * La fecha de vencimiento se calcula según el plazo de pago del contrato.
 *
 * @async
 * @param {Object} datos
 * @param {number} datos.factura_id
 * @param {number} datos.cliente_id
 * @param {number} datos.contrato_id
 * @param {number} datos.monto_original    - total_factura
 * @param {number} datos.plazo_pago        - 15 | 30 | 45 días
 * @returns {Promise<Object>}
 */
const crearCuentaPorCobrar = async (datos) => {
  const { factura_id, cliente_id, contrato_id, monto_original, plazo_pago } = datos;
 
  const pool   = await getConnection();
  const result = await pool.request()
    .input("factura_id",     sql.Int,            factura_id)
    .input("cliente_id",     sql.Int,            cliente_id)
    .input("contrato_id",    sql.Int,            contrato_id)
    .input("monto_original", sql.Decimal(15, 2), monto_original)
    .input("plazo_pago",     sql.Int,            plazo_pago)
    .query(`
      INSERT INTO cuentas_por_cobrar (
        factura_id, cliente_id, contrato_id,
        monto_original, saldo_pendiente,
        fecha_emision, fecha_vencimiento,
        estado_cobro, creado_automaticamente
      )
      VALUES (
        @factura_id, @cliente_id, @contrato_id,
        @monto_original, @monto_original,
        CAST(GETDATE() AS DATE),
        DATEADD(DAY, @plazo_pago, CAST(GETDATE() AS DATE)),
        'PENDIENTE', 1
      );

      SELECT SCOPE_IDENTITY() AS id;
    `);
 
    const id = result.recordset[0].id;

    const cuenta = await pool.request()
      .input("id", sql.Int, id)
      .query(`SELECT * FROM cuentas_por_cobrar WHERE id = @id`);
  

  return cuenta.recordset[0];
};

/**
 * Lista cuentas por cobrar con filtros opcionales.
 * Usado por el módulo de cobros (CDU003.8 / CDU003.7).
 *
 * utiliza la tabla --->  cuentas_por_cobrar
 *  
 */
const listarCuentasPorCobrar = async (filtros = {}) => {
  const { cliente_id, estado_cobro, limit = 100 } = filtros;
 
  const pool    = await getConnection();
  const request = pool.request();
 
  let where = "WHERE 1=1";
 
  if (cliente_id) {
    where += " AND cxc.cliente_id = @cliente_id";
    request.input("cliente_id", sql.Int, cliente_id);
  }
  if (estado_cobro) {
    where += " AND cxc.estado_cobro = @estado_cobro";
    request.input("estado_cobro", sql.NVarChar(10), estado_cobro);
  }
 
  request.input("limit", sql.Int, parseInt(limit));
 
  const result = await request.query(`
    SELECT
      cxc.*,
      f.numero_factura,
      f.uuid_autorizacion,
      u.nombre AS cliente_nombre,
      c.numero_contrato,
      c.plazo_pago
    FROM cuentas_por_cobrar cxc
    LEFT JOIN facturas_fel f ON f.id  = cxc.factura_id
    LEFT JOIN usuarios u     ON u.id  = cxc.cliente_id
    LEFT JOIN contratos c    ON c.id  = cxc.contrato_id
    ${where}
    ORDER BY cxc.fecha_vencimiento ASC
    OFFSET 0 ROWS FETCH NEXT @limit ROWS ONLY
  `);
 
  return result.recordset;
};

/**
 * Actualiza saldo y estado de una cuenta por cobrar tras un pago.
 *
 * @async
 * @param {number} cuenta_id
 * @param {number} nuevo_saldo
 * @returns {Promise<Object>}
 */
const actualizarCuentaPorCobrar = async (cuenta_id, nuevo_saldo) => {
  const pool   = await getConnection();
  const estado = nuevo_saldo <= 0 ? "PAGADA" : "PENDIENTE";
 
  await pool.request()
    .input("cuenta_id", sql.Int, cuenta_id)
    .input("nuevo_saldo", sql.Decimal(15, 2), nuevo_saldo)
    .input("estado_cobro", sql.NVarChar(10), estado)
    .query(`
      UPDATE cuentas_por_cobrar
      SET saldo_pendiente   = @nuevo_saldo,
          estado_cobro      = @estado_cobro,
          ultima_fecha_pago = CAST(GETDATE() AS DATE)
      WHERE id = @cuenta_id
    `);

  const result = await pool.request()
    .input("cuenta_id", sql.Int, cuenta_id)
    .query(`SELECT * FROM cuentas_por_cobrar WHERE id = @cuenta_id`);

  return result.recordset[0];
};


/* 
   SECCIÓN 4 — PAGOS
    */

/**
 * Registra un pago contra una factura certificada.
 * Tras el registro, el servicio libera el crédito del contrato.
 *
 * @async
 * @param {Object} datos
 * @param {number} datos.factura_id
 * @param {number} datos.cuenta_por_cobrar_id
 * @param {number} datos.cliente_id
 * @param {string} datos.forma_pago               - CHEQUE | TRANSFERENCIA
 * @param {number} datos.monto_pagado
 * @param {string} datos.fecha_hora_pago           - ISO string
 * @param {string} datos.banco_origen
 * @param {string} datos.cuenta_origen
 * @param {string} datos.numero_autorizacion_bancaria
 * @param {number} datos.registrado_por
 * @param {string} [datos.observacion]
 * @returns {Promise<Object>}
 */
const registrarPago = async (datos) => {
  const {
    factura_id, cuenta_por_cobrar_id, cliente_id,
    forma_pago, monto_pagado, fecha_hora_pago,
    banco_origen, cuenta_origen, numero_autorizacion_bancaria,
    registrado_por, observacion,
  } = datos;
 
  const pool   = await getConnection();
  const result = await pool.request()
    .input("factura_id",                   sql.Int,            factura_id)
    .input("cuenta_por_cobrar_id",         sql.Int,            cuenta_por_cobrar_id)
    .input("cliente_id",                   sql.Int,            cliente_id)
    .input("forma_pago",                   sql.NVarChar(15),   forma_pago)
    .input("monto_pagado",                 sql.Decimal(15, 2), monto_pagado)
    .input("fecha_hora_pago",              sql.DateTime2,      new Date(fecha_hora_pago))
    .input("banco_origen",                 sql.NVarChar(100),  banco_origen)
    .input("cuenta_origen",               sql.NVarChar(50),   cuenta_origen)
    .input("numero_autorizacion_bancaria", sql.NVarChar(100),  numero_autorizacion_bancaria)
    .input("registrado_por",              sql.Int,            registrado_por)
    .input("observacion",                 sql.NVarChar(500),  observacion || null)
    .query(`
      INSERT INTO pagos_factura (
        factura_id, cuenta_por_cobrar_id, cliente_id,
        forma_pago, monto_pagado, fecha_hora_pago,
        banco_origen, cuenta_origen, numero_autorizacion_bancaria,
        registrado_por, observacion, fecha_registro
      )
      VALUES (
        @factura_id, @cuenta_por_cobrar_id, @cliente_id,
        @forma_pago, @monto_pagado, @fecha_hora_pago,
        @banco_origen, @cuenta_origen, @numero_autorizacion_bancaria,
        @registrado_por, @observacion, GETDATE()
      );

      SELECT SCOPE_IDENTITY() AS id;
    `);
 
    const id = result.recordset[0].id;

    const pago = await pool.request()
      .input("id", sql.Int, id)
      .query(`SELECT * FROM pagos_factura WHERE id = @id`);
  
    return pago.recordset[0];
};

/**
 * Lista todos los pagos de una factura.
 *
 * @async
 * @param {number} factura_id
 * @returns {Promise<Array>}
 */
const listarPagosPorFactura = async (factura_id) => {
  const pool   = await getConnection();
  const result = await pool.request()
    .input("factura_id", sql.Int, factura_id)
    .query(`
      SELECT pf.*, u.nombre AS registrado_por_nombre
      FROM pagos_factura pf
      LEFT JOIN usuarios u ON u.id = pf.registrado_por
      WHERE pf.factura_id = @factura_id
      ORDER BY pf.fecha_hora_pago DESC
    `);

  return result.recordset;
};

/* 
   SECCIÓN 5 — MOVIMIENTOS DE CRÉDITO DEL CONTRATO
    */

/**
 * Registra un movimiento de CARGO o ABONO en el crédito del contrato.
 *
 * CARGO -> factura certificada (aumenta deuda del cliente)
 * ABONO -> pago registrado    (libera crédito del cliente)
 *
 * @async
 * @param {Object} datos
 * @param {number} datos.contrato_id
 * @param {number} datos.factura_id
 * @param {number|null} datos.pago_id
 * @param {string} datos.tipo_movimiento    - CARGO | ABONO
 * @param {number} datos.monto_movimiento
 * @param {number} datos.saldo_anterior     - saldo_usado antes del movimiento
 * @param {number} datos.saldo_nuevo        - saldo_usado después del movimiento
 * @param {string} datos.motivo
 * @param {number} datos.registrado_por
 * @returns {Promise<Object>}
 */
const registrarMovimientoCredito = async (datos) => {
  const {
    contrato_id, factura_id, pago_id,
    tipo_movimiento, monto_movimiento,
    saldo_anterior, saldo_nuevo,
    motivo, registrado_por,
  } = datos;

  const pool = await getConnection();

  const result = await pool.request()
    .input("contrato_id", sql.Int, contrato_id)
    .input("factura_id", sql.Int, factura_id)
    .input("pago_id", sql.Int, pago_id || null)
    .input("tipo_movimiento", sql.NVarChar(6), tipo_movimiento)
    .input("monto_movimiento", sql.Decimal(15, 2), monto_movimiento)
    .input("saldo_anterior", sql.Decimal(15, 2), saldo_anterior)
    .input("saldo_nuevo", sql.Decimal(15, 2), saldo_nuevo)
    .input("motivo", sql.NVarChar(500), motivo)
    .input("registrado_por", sql.Int, registrado_por)
    .query(`
      INSERT INTO movimientos_credito_contrato (
        contrato_id, factura_id, pago_id,
        tipo_movimiento, monto_movimiento,
        saldo_anterior, saldo_nuevo,
        motivo, registrado_por, fecha_movimiento
      )
      VALUES (
        @contrato_id, @factura_id, @pago_id,
        @tipo_movimiento, @monto_movimiento,
        @saldo_anterior, @saldo_nuevo,
        @motivo, @registrado_por, GETDATE()
      );

      SELECT SCOPE_IDENTITY() AS id;
    `);

  const id = result.recordset[0].id;

  const movimiento = await pool.request()
    .input("id", sql.Int, id)
    .query(`SELECT * FROM movimientos_credito_contrato WHERE id = @id`);

  return movimiento.recordset[0];
};

/* 
   SECCIÓN 6 — CONSULTAS DE SOPORTE (datos para el servicio)
    */

/**
 * obtenerDatosParaBorrador
 *
 * CORRECCIÓN PRINCIPAL (Bug 1 — "Invalid column name 'tipo_unidad'"):
 *
 * La query anterior intentaba hacer:
 *   JOIN tarifario t ON t.tipo_unidad = v.tipo_unidad
 * pero la tabla `tarifario` SÍ tiene tipo_unidad. El problema estaba en que
 * el JOIN de contrato_tarifas usaba AND ct.tarifario_id = t.id, creando una
 * cadena de JOINs que SQL Server no podía resolver cuando no existe una
 * tarifa negociada para ese tipo.
 *
 * Solución: la query se divide en dos pasos:
 *   1. Busca el tipo_unidad del vehículo de la orden.
 *   2. Busca la tarifa negociada del contrato para ese tipo.
 *      Si no existe tarifa negociada, usa el costo_base_km del tarifario global.
 *
 * También se acepta que la orden puede estar en estado "CERRADA" o "ENTREGADA"
 * (el estado "CERRADA" es el que usa tu módulo de órdenes al finalizar).
 */
const obtenerDatosParaBorrador = async (orden_id) => {
  const pool   = await getConnection();
  const result = await pool.request()
    .input("orden_id", sql.Int, orden_id)
    .query(`
      SELECT
        -- Orden
        o.id              AS orden_id,
        o.numero_orden,
        o.cliente_id,
        o.contrato_id,
        o.origen,
        o.destino,
        o.tipo_mercancia,
        o.peso_real,
        o.estado          AS estado_orden,
        o.vehiculo_id,
 
        -- Contrato
        c.numero_contrato,
        c.plazo_pago,
        c.saldo_usado     AS contrato_saldo_usado,
        c.limite_credito  AS contrato_limite_credito,
        c.moneda_id       AS moneda_id,
 
        -- Tipo de vehículo (para saber qué tarifa aplicar)
        tar.tipo_unidad,
 
        -- Tarifa negociada: si existe en contrato_tarifas se usa esa;
        -- si no, se cae al costo_base_km global del tarifario.
        COALESCE(ct.costo_km_negociado, tar.costo_base_km) AS tarifa_aplicada,
 
        -- Descuento especial del contrato para ese tipo de unidad (puede ser NULL)
        dc.porcentaje_descuento,
 
        -- Distancia de la ruta autorizada (puede ser NULL si no se configuró)
        ra.distancia_km,
 
        -- Datos del cliente
        u.nombre          AS cliente_nombre,
        u.nit             AS cliente_nit,
        u.email           AS cliente_email
 
      FROM ordenes o
      -- Contrato del cliente
      JOIN contratos c
        ON c.id = o.contrato_id
      -- Vehículo asignado a la orden
      JOIN vehiculos v
        ON v.id = o.vehiculo_id
      -- Tarifario global según el tipo de unidad del vehículo
      JOIN tarifario tar
        ON tar.id = v.tarifario_id
        AND tar.activo = 1
      -- Tarifa negociada en el contrato (LEFT: puede no existir)
      LEFT JOIN contrato_tarifas ct
        ON ct.contrato_id = o.contrato_id
        AND ct.tarifario_id = tar.id
      -- Descuento especial en el contrato para ese tipo (LEFT: puede no existir)
      LEFT JOIN descuentos_contrato dc
        ON dc.contrato_id = o.contrato_id
        AND dc.tipo_unidad = tar.tipo_unidad
      -- Ruta autorizada con distancia (LEFT: puede no tener distancia configurada)
      LEFT JOIN rutas_autorizadas ra
        ON ra.contrato_id = o.contrato_id
        AND ra.origen  = o.origen
        AND ra.destino = o.destino
        AND ra.activa  = 1
      -- Cliente
      JOIN usuarios u
        ON u.id = o.cliente_id
      WHERE o.id = @orden_id
    `);
 
  return result.recordset[0];
};


/**
 * Genera automáticamente un borrador de factura a partir de una orden cerrada.
 * Usa los métodos existentes del modelo.
 */
const generarBorradorDesdeOrden = async (orden_id) => {

  // 1. Verificar si ya existe factura (evitar duplicados)
  const existente = await buscarPorOrden(orden_id);
  if (existente) {
    console.log(`[FacturaFEL] Ya existe factura para orden ${orden_id}`);
    return existente;
  }

  // 2. Obtener datos base
  const datos = await obtenerDatosParaBorrador(orden_id);

  if (!datos.moneda_id) {
    throw new Error(`El contrato de la orden ${orden_id} no tiene moneda configurada`);
  }

  if (!datos) {
    throw new Error(`No se encontraron datos para generar factura de orden ${orden_id}`);
  }

  if (!datos.distancia_km) {
    throw new Error(`La orden ${orden_id} no tiene distancia configurada`);
  }

  // 3. Cálculos ( lógica de negocio)
  const bruto = datos.distancia_km * datos.tarifa_aplicada;

  const descuento = datos.porcentaje_descuento
    ? bruto * (datos.porcentaje_descuento / 100)
    : 0;

  const subtotal = bruto - descuento;
  const iva      = subtotal * 0.12;
  const total    = subtotal + iva;

  // 4. Generar número de factura simple
  const numeroFactura = `FEL-${Date.now()}`;

  // 5. Crear borrador
  const borrador = await crearBorrador({
    orden_id: datos.orden_id,
    cliente_id: datos.cliente_id,
    contrato_id: datos.contrato_id,
    moneda_id: datos.moneda_id,
    numero_factura: numeroFactura,
    distancia_km: datos.distancia_km,
    tarifa_aplicada: datos.tarifa_aplicada,
    descuento_aplicado: descuento,
    subtotal,
    iva,
    total_factura: total,
    nit_cliente: datos.cliente_nit,
    nombre_cliente_facturacion: datos.cliente_nombre,
  });

  console.log(`[FacturaFEL] Borrador creado para orden ${orden_id}`);

  return borrador;
};


module.exports = {
  // Facturas FEL
  crearBorrador,
  certificarFactura,
  actualizarEstado,
  buscarPorId,
  buscarPorOrden,
  listar,
  generarBorradorDesdeOrden,

  // Validación FEL
  registrarValidacion,

  // Cuentas por cobrar
  crearCuentaPorCobrar,
  listarCuentasPorCobrar,
  actualizarCuentaPorCobrar,

  // Pagos
  registrarPago,
  listarPagosPorFactura,

  // Movimientos de crédito
  registrarMovimientoCredito,

  // Soporte
  obtenerDatosParaBorrador,
};
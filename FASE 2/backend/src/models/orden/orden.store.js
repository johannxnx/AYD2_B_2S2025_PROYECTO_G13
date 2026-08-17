"use strict";
const { sql, getConnection } = require("../../config/db");

async function obtenerContextoValidacion(cliente_id, origen, destino, peso) {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input("cliente_id", sql.Int, cliente_id)
    .input("origen", sql.NVarChar, `%${origen}%`)
    .input("destino", sql.NVarChar, `%${destino}%`)
    .input("peso", sql.Decimal(10, 2), peso).query(`
      -- 1. Declarar y asignar la variable de forma aislada
      DECLARE @v_contrato_id INT;
      
      SET @v_contrato_id = (
          SELECT TOP 1 id 
          FROM contratos 
          WHERE cliente_id = @cliente_id 
            AND estado = 'VIGENTE' 
            AND fecha_fin >= GETDATE()
          ORDER BY fecha_inicio DESC
      );

      -- 2. Devolver los datos del contrato (Recordset 0)
      SELECT id, limite_credito, saldo_usado 
      FROM contratos 
      WHERE id = @v_contrato_id;

      -- 3. Facturas Vencidas (Recordset 1)
      SELECT COUNT(*) as vencidas 
      FROM cuentas_por_cobrar 
      WHERE cliente_id = @cliente_id AND estado_cobro = 'VENCIDA';

      -- 4. Ruta Autorizada (Recordset 2)
      SELECT TOP 1 distancia_km 
      FROM rutas_autorizadas 
      WHERE contrato_id = @v_contrato_id
        AND origen LIKE @origen 
        AND destino LIKE @destino;

      -- 5. Tarifa (Recordset 3)
      SELECT TOP 1 
          ISNULL(ct.costo_km_negociado, t.costo_base_km) AS costo_km
      FROM tarifario t
      LEFT JOIN contrato_tarifas ct ON ct.tarifario_id = t.id 
                                   AND ct.contrato_id = @v_contrato_id
      WHERE @peso <= t.limite_peso_ton
      ORDER BY t.limite_peso_ton ASC;
    `);

  return {
    contrato: result.recordsets[0][0] || null,
    facturasVencidas: result.recordsets[1][0]
      ? result.recordsets[1][0].vencidas
      : 0,
    ruta: result.recordsets[2][0] || null,
    tarifa: result.recordsets[3][0] || null,
  };
}

async function insertarOrden(datos) {
  const pool = await getConnection();

  const numeroOrden = `ORD-${Date.now()}`;

  const result = await pool
    .request()
    .input("numero_orden", sql.NVarChar, numeroOrden)
    .input("cliente_id", sql.Int, datos.cliente_id)
    .input("contrato_id", sql.Int, datos.contrato_id)
    .input("origen", sql.NVarChar, datos.origen)
    .input("destino", sql.NVarChar, datos.destino)
    .input("tipo_mercancia", sql.NVarChar, datos.tipo_mercancia)
    .input("peso_estimado", sql.Decimal(10, 2), datos.peso_estimado)
    .input("costo", sql.Decimal(10, 2), datos.costo)
    .input("creado_por", sql.Int, datos.creado_por).query(`
      BEGIN TRANSACTION;
      BEGIN TRY
        -- 1. Insertar la nueva orden
        INSERT INTO ordenes (
            numero_orden, cliente_id, contrato_id, origen, destino, 
            tipo_mercancia, peso_estimado, costo, creado_por, estado
        )
        VALUES (
            @numero_orden, @cliente_id, @contrato_id, @origen, @destino, 
            @tipo_mercancia, @peso_estimado, @costo, @creado_por, 'PENDIENTE_PLANIFICACION'
        );

        -- 2. Actualizar el saldo usado en el contrato
        UPDATE contratos
        SET saldo_usado = saldo_usado + @costo
        WHERE id = @contrato_id;

        COMMIT TRANSACTION;

        -- 3. Retornar la orden recién creada
        SELECT * FROM ordenes WHERE numero_orden = @numero_orden;
      END TRY
      BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
      END CATCH
    `);

  return result.recordset[0];
}

async function obtenerOrdenes() {
  const pool = await getConnection();
  const result = await pool.request().query(
    `select *
        from ordenes;`,
  );

  return result.recordset;
}

async function optenerOrdenPendiente() {
  const pool = await getConnection();
  const result = await pool.request().query(
    `select id, 
              numero_orden,
              (select nombre from usuarios where ordenes.cliente_id = usuarios.id), 
              origen, 
              destino, 
              tipo_mercancia, 
              peso_estimado, 
              costo
        from ordenes
        where estado like 'PENDIENTE_PLANIFICACION';`,
  );

  return result.recordset;
}

async function optenerOrdenPlanificada() {
  const pool = await getConnection();
  const result = await pool.request().query(
    `select id, 
              numero_orden,
              origen, 
              destino, 
              tipo_mercancia, 
              peso_estimado 
        from ordenes
        where estado like 'PLANIFICADA';`,
  );

  return result.recordset;
}

async function optenerOrdenPiloto(id_piloto) {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input("id_piloto", sql.Int, id_piloto)
    .query(
      `select id, 
              numero_orden
              origen, 
              destino, 
              tipo_mercancia, 
              peso_real, 
              estado,
              tiempo_estimado
        from ordenes
        where estado IN ('PLANIFICADA', 'LISTO_DESPACHO', 'EN_TRANSITO')
        and piloto_id = @id_piloto;`,
    );

  return result.recordset;
}

async function optenerOrdenUsuario(id_cliente) {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input("id_cliente", sql.Int, id_cliente)
    .query(
      `select id,
              numero_orden,
              origen,
              destino,
              tipo_mercancia,
              peso_estimado,
              peso_real,
              costo,
              estado,
              tiempo_estimado,
              fecha_despacho,
              fecha_entrega
        from ordenes
        where cliente_id =  @id_cliente;`,
    );

  return result.recordset;
}

async function vehiculoApto(vehiculo_id, peso_estimado) {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input("vehiculo_id", sql.Int, vehiculo_id)
    .input("peso_estimado", sql.Decimal(10, 2), peso_estimado)
    .query(
      `select top 1 1
      from vehiculos
      where (select limite_peso_ton from tarifario where vehiculos.tarifario_id = tarifario.id) >= @peso_estimado
      AND vehiculos.estado like 'DISPONIBLE'
      AND vehiculos.id = @vehiculo_id
      AND vehiculos.activo = 1;`,
    );
  return result.recordset[0];
}

async function conductorApto(piloto_id) {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input("piloto_id", sql.Int, piloto_id)
    .query(
      `select top 1 1
      from usuarios
      where id = @piloto_id
      AND tipo_usuario like 'PILOTO'
      AND estado like 'ACTIVO';`,
    );
  return result.recordset[0];
}

async function actualizarAsignacion(ordenId, datos) {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input("id", sql.Int, ordenId)
    .input("piloto_id", sql.Int, datos.piloto_id)
    .input("vehiculo_id", sql.Int, datos.vehiculo_id)
    .input("tiempo_estimado", sql.Numeric(16, 2), datos.tiempo_estimado).query(`
      BEGIN TRANSACTION;
      BEGIN TRY
        UPDATE ordenes
        SET vehiculo_id = @vehiculo_id, 
            piloto_id = @piloto_id,
            estado = 'PLANIFICADA',
            tiempo_estimado = @tiempo_estimado
        WHERE id = @id;

        UPDATE vehiculos
        SET estado = 'ASIGNADO'
        WHERE id = @vehiculo_id;

        COMMIT TRANSACTION;

        SELECT * FROM ordenes WHERE id = @id;
      END TRY
      BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
      END CATCH
    `);

  return result.recordset[0];
}

async function getVehiculos() {
  const pool = await getConnection();
  const result = await pool.request().query(`
    select id, placa, estado, tarifario_id
    from vehiculos
    where activo = 1
    and estado like 'DISPONIBLE';
    `);
  return result.recordset;
}

async function getPilotos() {
  const pool = await getConnection();
  const result = await pool.request().query(`
    select id, nombre, nit, email, telefono
    from usuarios
    where tipo_usuario like 'PILOTO'
    AND estado like 'ACTIVO';
    `);
  return result.recordset;
}

async function formalizarSalidaPatio(ordenId, datos) {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input("orden_id", sql.Int, ordenId)
    .input("codigo_verificacion", sql.NVarChar, datos.codigo_orden)
    .input("peso_real", sql.Decimal(10, 2), datos.peso_real).query(`
      BEGIN TRANSACTION;
      BEGIN TRY
        -- 1. Declarar variables
        DECLARE @v_contrato_id INT, @v_vehiculo_id INT, @v_distancia DECIMAL(10,2), 
                @v_costo_km DECIMAL(10,2), @v_capacidad_max DECIMAL(10,2),
                @v_costo_anterior DECIMAL(10,2), @v_peso_estimado DECIMAL(10,2),
                @v_estado_actual NVARCHAR(30); -- Variable para validar estado

        -- 2. Obtener contexto de la orden y estado actual
        SELECT 
            @v_contrato_id = o.contrato_id,
            @v_vehiculo_id = o.vehiculo_id,
            @v_costo_anterior = o.costo,
            @v_peso_estimado = o.peso_estimado,
            @v_estado_actual = o.estado, -- Capturamos el estado
            @v_distancia = r.distancia_km,
            @v_capacidad_max = t.limite_peso_ton
        FROM ordenes o
        INNER JOIN rutas_autorizadas r ON o.contrato_id = r.contrato_id 
            AND o.origen = r.origen AND o.destino = r.destino
        INNER JOIN vehiculos v ON o.vehiculo_id = v.id
        INNER JOIN tarifario t ON v.tarifario_id = t.id
        WHERE o.id = @orden_id AND o.numero_orden = @codigo_verificacion;

        -- Validación de existencia
        IF @v_contrato_id IS NULL 
            THROW 50001, 'El código de orden no coincide o la orden no existe.', 1;

        -- SEGURIDAD: Validar que la orden esté PLANIFICADA
        IF @v_estado_actual <> 'PLANIFICADA'
            THROW 50003, 'Transacción denegada: La orden debe estar en estado PLANIFICADA para salir de patio.', 1;

        -- 3. Validar peso real vs capacidad
        IF @peso_real > @v_capacidad_max 
            THROW 50002, 'Capacidad excedida: El peso real supera el límite permitido para esta unidad.', 1;

        -- 4. Recalcular costo
        DECLARE @v_tarifa_por_ton_km DECIMAL(10,4) = @v_costo_anterior / NULLIF(@v_distancia * @v_peso_estimado, 0);
        DECLARE @v_nuevo_costo DECIMAL(10,2) = @v_distancia * @v_tarifa_por_ton_km * @peso_real;
        DECLARE @v_diferencia DECIMAL(10,2) = @v_nuevo_costo - @v_costo_anterior;

        -- 5. Actualizar Orden
        UPDATE ordenes 
        SET peso_real = @peso_real,
            costo = @v_nuevo_costo,
            estado = 'LISTO_DESPACHO', 
            fecha_despacho = GETDATE() 
        WHERE id = @orden_id;

        -- 6. Sincronizar saldo de contrato
        UPDATE contratos 
        SET saldo_usado = saldo_usado + @v_diferencia
        WHERE id = @v_contrato_id;

        -- 7. Actualizar vehículo
        UPDATE vehiculos SET estado = 'ASIGNADO' WHERE id = @v_vehiculo_id;

        COMMIT TRANSACTION;
        
        SELECT * FROM ordenes WHERE id = @orden_id;

      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        -- Re-lanzar el error para que llegue al Service/Controller
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorNumber INT = ERROR_NUMBER();
        THROW @ErrorNumber, @ErrorMessage, 1;
      END CATCH
    `);
  return result.recordset[0];
}

async function actualizarRutaTransito(id) {
  const pool = await getConnection();
  const result = await pool.request().input("id", sql.Int, id).query(`
      update ordenes
      set estado = 'EN_TRANSITO'
      where id = @id
      And estado like 'LISTO_DESPACHO';
    `);
  return result.recordset;
}

async function registrarEventoBitacora(datos) {
  const pool = await getConnection();
  const result = await pool
    .request()
    .input("orden_id", sql.Int, datos.orden_id)
    .input("piloto_id", sql.Int, datos.piloto_id)
    .input("tipo_evento", sql.NVarChar, datos.tipo_evento)
    .input("descripcion", sql.NVarChar, datos.descripcion)
    .input("genera_retraso", sql.Bit, datos.genera_retraso || 0).query(`
      INSERT INTO orden_eventos (
          orden_id, piloto_id, tipo_evento, descripcion, genera_retraso, fecha_hora
      )
      OUTPUT INSERTED.* 
      VALUES (
          @orden_id, @piloto_id, @tipo_evento, @descripcion, @genera_retraso, GETDATE()
      );
    `);
  return result.recordset[0];
}

async function finalizarEntrega(ordenId, rutasArchivos) {
  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // 1. Validar estado actual y obtener datos necesarios (vehiculo y tiempo estimado)
    const infoOrden = await transaction.request().input("id", sql.Int, ordenId)
      .query(`
        SELECT vehiculo_id, estado, tiempo_estimado 
        FROM ordenes 
        WHERE id = @id
      `);

    const orden = infoOrden.recordset[0];

    // Validación de existencia y estado
    if (!orden) {
      throw new Error("La orden especificada no existe.");
    }

    if (orden.estado !== "EN_TRANSITO") {
      throw new Error(
        `No se puede finalizar la entrega: La orden se encuentra en estado '${orden.estado}' y debe estar en 'EN_TRANSITO'.`,
      );
    }

    const vehiculoId = orden.vehiculo_id;
    const tiempoEstimadoHoras = orden.tiempo_estimado || 0; // Usando tu nueva columna

    // 2. Actualizar Orden (Estado Final y Fecha de Entrega)
    // Pasamos a CERRADA directamente ya que el piloto documentó todo
    await transaction.request().input("orden_id", sql.Int, ordenId).query(`
        UPDATE ordenes 
        SET estado = 'CERRADA', 
            fecha_entrega = GETDATE() 
        WHERE id = @orden_id;
      `);

    // 3. Liberar Vehículo
    if (vehiculoId) {
      await transaction
        .request()
        .input("v_id", sql.Int, vehiculoId)
        .query("UPDATE vehiculos SET estado = 'DISPONIBLE' WHERE id = @v_id;");
    }

    // 4. Guardar Evidencias (Rutas de archivos)
    for (const ruta of rutasArchivos) {
      await transaction
        .request()
        .input("orden_id", sql.Int, ordenId)
        .input("url", sql.NVarChar, ruta)
        .query(
          "INSERT INTO orden_evidencias (orden_id, url_archivo) VALUES (@orden_id, @url);",
        );
    }

    // 5. Registro de KPI basado en tiempo_estimado (Cálculos en HORAS)
    await transaction
      .request()
      .input("orden_id", sql.Int, ordenId)
      .input("t_estimado_horas", sql.Numeric(16, 2), tiempoEstimadoHoras)
      .query(`
        INSERT INTO orden_kpi (orden_id, tiempo_planificado, tiempo_real, retraso, fecha_calculo)
        SELECT 
            id, 
            @t_estimado_horas, -- Tiempo que ya venía en horas
            -- Calculamos la diferencia en minutos y dividimos por 60.0 para obtener horas decimales
            CAST(DATEDIFF(MINUTE, fecha_despacho, fecha_entrega) / 60.0 AS NUMERIC(16,2)),
            -- Cálculo del retraso: Si el real es mayor al estimado, restamos; si no, es 0
            CASE 
                WHEN (DATEDIFF(MINUTE, fecha_despacho, fecha_entrega) / 60.0) > @t_estimado_horas 
                THEN CAST((DATEDIFF(MINUTE, fecha_despacho, fecha_entrega) / 60.0) - @t_estimado_horas AS NUMERIC(16,2))
                ELSE 0 
            END,
            GETDATE()
        FROM ordenes 
        WHERE id = @orden_id;
      `);

    await transaction.commit();
    return { ordenId, vehiculoLiberado: vehiculoId, estadoFinal: "CERRADA" };
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
}
module.exports = {
  insertarOrden,
  obtenerOrdenes,
  vehiculoApto,
  conductorApto,
  actualizarAsignacion,
  obtenerContextoValidacion,
  getVehiculos,
  getPilotos,
  formalizarSalidaPatio,
  actualizarRutaTransito,
  registrarEventoBitacora,
  finalizarEntrega,
  optenerOrdenPendiente,
  optenerOrdenPlanificada,
  optenerOrdenPiloto,
  optenerOrdenUsuario,
};

"use strict";
const fs = require("fs");
const path = require("path");

const { sql, getConnection } = require("../../config/db");

// Convierte un input de fecha en Date y valida formato.
function parseDateInput(dateText) {
  if (!dateText) return new Date();
  const parsedDate = new Date(dateText);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error("Fecha invalida. Use formato YYYY-MM-DD");
  }
  return parsedDate;
}

// Normaliza y valida la sede para filtros del dashboard.
function normalizeSede(sede) {
  if (!sede) return null;
  const value = String(sede)
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  const aliases = {
    GUATEMALA: "GUATEMALA",
    XELA: "XELA",
    QUETZALTENANGO: "XELA",
    "PUERTO BARRIOS": "PUERTO BARRIOS",
  };

  const normalized = aliases[value];
  if (!normalized) {
    throw new Error(
      "Sede invalida. Valores permitidos: GUATEMALA, XELA, PUERTO BARRIOS",
    );
  }

  return normalized;
}

// Mapeo de texto libre de origen/destino a las 3 sedes del enunciado.
function buildSedeCaseForOrders(alias) {
  return `
    CASE
      WHEN ${alias}.origen LIKE '%GUATEMALA%' OR ${alias}.destino LIKE '%GUATEMALA%' THEN 'GUATEMALA'
      WHEN ${alias}.origen LIKE '%QUETZALTENANGO%' OR ${alias}.destino LIKE '%QUETZALTENANGO%' OR ${alias}.origen LIKE '%XELA%' OR ${alias}.destino LIKE '%XELA%' THEN 'XELA'
      WHEN ${alias}.origen LIKE '%PUERTO BARRIOS%' OR ${alias}.destino LIKE '%PUERTO BARRIOS%' THEN 'PUERTO BARRIOS'
      ELSE 'OTRA'
    END
  `;
}

// 1) Corte diario: operaciones + facturación consolidada por sede.
async function getCorteDiario({ fecha, sede, moneda_id }) {
  const selectedDate = parseDateInput(fecha);
  const selectedSede = normalizeSede(sede);
  const selectedMoneda = moneda_id ? Number(moneda_id) : null;

  const pool = await getConnection();

  const sedeCaseOrders = buildSedeCaseForOrders("o");
  const sedeCaseInvoices = buildSedeCaseForOrders("o");

  // Operaciones del día por sede inferida desde origen/destino.
  const operationsQuery = `
    SELECT
      ${sedeCaseOrders} AS sede,
      COUNT(*) AS total_ordenes,
      SUM(CASE WHEN o.estado = 'ENTREGADA' THEN 1 ELSE 0 END) AS entregadas,
      SUM(CASE WHEN o.estado = 'EN_TRANSITO' THEN 1 ELSE 0 END) AS en_transito,
      SUM(CASE WHEN o.estado = 'CERRADA' THEN 1 ELSE 0 END) AS cerradas
    FROM ordenes o
    WHERE CAST(o.fecha_creacion AS DATE) = @fecha
    GROUP BY ${sedeCaseOrders}
  `;

  // Facturación del día con conversión de moneda, enlazada con orden para obtener sede y moneda.
  const invoicesQuery = `
    SELECT
      ${sedeCaseInvoices} AS sede,
      COUNT(*) AS total_facturas,
      SUM(ISNULL(f.total_factura, 0) * (ISNULL(m_origen.cambio, 1.0) / ISNULL(m_dest.cambio, 1.0))) AS total_facturado
    FROM facturas_fel f
    INNER JOIN ordenes o ON o.id = f.orden_id
    INNER JOIN contratos c ON c.id = o.contrato_id
    INNER JOIN monedas m_origen ON m_origen.id = c.moneda_id
    INNER JOIN monedas m_dest ON m_dest.id = ISNULL(@moneda_id, 1)
    WHERE CAST(f.fecha_emision AS DATE) = @fecha
    GROUP BY ${sedeCaseInvoices}
  `;

  const operationsResult = await pool
    .request()
    .input("fecha", sql.Date, selectedDate)
    .query(operationsQuery);

  const invoicesResult = await pool
    .request()
    .input("fecha", sql.Date, selectedDate)
    .input("moneda_id", sql.Int, selectedMoneda)
    .query(invoicesQuery);

  // Se combinan ambas consultas en una sola estructura por sede.
  const bySede = new Map();

  for (const row of operationsResult.recordset) {
    bySede.set(row.sede, {
      sede: row.sede,
      totalOrdenes: Number(row.total_ordenes || 0),
      entregadas: Number(row.entregadas || 0),
      enTransito: Number(row.en_transito || 0),
      cerradas: Number(row.cerradas || 0),
      totalFacturas: 0,
      totalFacturado: 0,
    });
  }

  for (const row of invoicesResult.recordset) {
    const current = bySede.get(row.sede) || {
      sede: row.sede,
      totalOrdenes: 0,
      entregadas: 0,
      enTransito: 0,
      cerradas: 0,
      totalFacturas: 0,
      totalFacturado: 0,
    };

    current.totalFacturas = Number(row.total_facturas || 0);
    current.totalFacturado = Number(row.total_facturado || 0);
    bySede.set(row.sede, current);
  }

  let data = Array.from(bySede.values()).filter((item) => item.sede !== "OTRA");

  if (selectedSede) {
    data = data.filter((item) => item.sede === selectedSede);
  }

  const resumen = data.reduce(
    (acc, item) => {
      acc.totalOrdenes += item.totalOrdenes;
      acc.totalFacturas += item.totalFacturas;
      acc.totalFacturado += item.totalFacturado;
      return acc;
    },
    { totalOrdenes: 0, totalFacturas: 0, totalFacturado: 0 },
  );

  return {
    fecha: selectedDate.toISOString().slice(0, 10),
    sede: selectedSede,
    modoActualizacion: "TIEMPO_REAL",
    actualizadoEn: new Date().toISOString(),
    resumen,
    porSede: data,
  };
}

// 2) KPIs: rentabilidad y cumplimiento por rango de fechas, sede y moneda.
async function getKpis({ desde, hasta, sede, moneda_id }) {
  const startDate = parseDateInput(desde);
  const endDate = parseDateInput(hasta || desde || new Date());
  const selectedSede = normalizeSede(sede);
  const selectedMoneda = moneda_id ? Number(moneda_id) : null;

  const pool = await getConnection();

  const sedeCase = buildSedeCaseForOrders("o");

  // Se usan ordenes + facturas_fel + orden_kpi + contratos + monedas para métricas con conversión de moneda.
  const kpiQuery = `
    WITH base AS (
      SELECT
        ${sedeCase} AS sede,
        -- Conversión de ingresos a la moneda seleccionada
        ISNULL(f.ingreso_total, 0) * (ISNULL(m_origen.cambio, 1.0) / ISNULL(m_dest.cambio, 1.0)) AS ingreso,
        -- Conversión de costos a la moneda seleccionada
        ISNULL(o.costo, 0) * (ISNULL(m_origen.cambio, 1.0) / ISNULL(m_dest.cambio, 1.0)) AS costo,
        ISNULL(o.tiempo_estimado, ISNULL(k.tiempo_planificado, 0)) AS tiempo_pactado,
        ISNULL(k.tiempo_real, 0) AS tiempo_real,
        ISNULL(k.retraso, 0) AS retraso
      FROM ordenes o
      INNER JOIN contratos c ON c.id = o.contrato_id
      INNER JOIN monedas m_origen ON m_origen.id = c.moneda_id
      INNER JOIN monedas m_dest ON m_dest.id = ISNULL(@moneda_id, 1)
      LEFT JOIN (
        SELECT orden_id, SUM(ISNULL(total_factura, 0)) AS ingreso_total
        FROM facturas_fel
        GROUP BY orden_id
      ) f ON f.orden_id = o.id
      LEFT JOIN orden_kpi k ON k.orden_id = o.id
      WHERE CAST(COALESCE(o.fecha_entrega, o.fecha_creacion) AS DATE) BETWEEN @desde AND @hasta
    )
    SELECT
      sede,
      SUM(ingreso) AS ingresos,
      SUM(costo) AS costos,
      SUM(ingreso) - SUM(costo) AS rentabilidad_monto,
      CASE WHEN SUM(ingreso) > 0 THEN ((SUM(ingreso) - SUM(costo)) / SUM(ingreso)) * 100 ELSE 0 END AS rentabilidad_porcentaje,
      AVG(CASE WHEN tiempo_pactado > 0 THEN CAST(tiempo_pactado AS FLOAT) END) AS tiempo_pactado_promedio,
      AVG(CASE WHEN tiempo_real > 0 THEN CAST(tiempo_real AS FLOAT) END) AS tiempo_real_promedio,
      SUM(CASE WHEN tiempo_pactado > 0 AND tiempo_real > 0 AND tiempo_real <= tiempo_pactado THEN 1 ELSE 0 END) AS ordenes_a_tiempo,
      SUM(CASE WHEN tiempo_pactado > 0 AND tiempo_real > 0 THEN 1 ELSE 0 END) AS ordenes_con_medicion,
      AVG(CASE WHEN retraso >= 0 THEN CAST(retraso AS FLOAT) END) AS retraso_promedio
    FROM base
    GROUP BY sede
  `;

  const result = await pool
    .request()
    .input("desde", sql.Date, startDate)
    .input("hasta", sql.Date, endDate)
    .input("moneda_id", sql.Int, selectedMoneda)
    .query(kpiQuery);

  let rows = result.recordset.filter((row) => row.sede !== "OTRA");

  if (selectedSede) {
    rows = rows.filter((row) => row.sede === selectedSede);
  }

  // Cálculo final de cumplimiento: ordenes a tiempo / ordenes con medición.
  const porSede = rows.map((row) => {
    const ordenesConMedicion = Number(row.ordenes_con_medicion || 0);
    const ordenesATiempo = Number(row.ordenes_a_tiempo || 0);
    const cumplimiento =
      ordenesConMedicion > 0 ? (ordenesATiempo / ordenesConMedicion) * 100 : 0;

    return {
      sede: row.sede,
      ingresos: Number(row.ingresos || 0),
      costos: Number(row.costos || 0),
      rentabilidadMonto: Number(row.rentabilidad_monto || 0),
      rentabilidadPorcentaje: Number(row.rentabilidad_porcentaje || 0),
      tiempoPactadoPromedio: Number(row.tiempo_pactado_promedio || 0),
      tiempoPlanificadoPromedio: Number(row.tiempo_pactado_promedio || 0),
      tiempoRealPromedio: Number(row.tiempo_real_promedio || 0),
      retrasoPromedio: Number(row.retraso_promedio || 0),
      ordenesConMedicion,
      ordenesATiempo,
      cumplimientoPorcentaje: Number(cumplimiento.toFixed(2)),
    };
  });

  const resumen = porSede.reduce(
    (acc, row) => {
      acc.ingresos += row.ingresos;
      acc.costos += row.costos;
      acc.rentabilidadMonto += row.rentabilidadMonto;
      acc.ordenesConMedicion += row.ordenesConMedicion;
      acc.ordenesATiempo += row.ordenesATiempo;
      return acc;
    },
    {
      ingresos: 0,
      costos: 0,
      rentabilidadMonto: 0,
      ordenesConMedicion: 0,
      ordenesATiempo: 0,
    },
  );

  const rentabilidadPorcentaje =
    resumen.ingresos > 0
      ? (resumen.rentabilidadMonto / resumen.ingresos) * 100
      : 0;

  const cumplimientoPorcentaje =
    resumen.ordenesConMedicion > 0
      ? (resumen.ordenesATiempo / resumen.ordenesConMedicion) * 100
      : 0;

  return {
    desde: startDate.toISOString().slice(0, 10),
    hasta: endDate.toISOString().slice(0, 10),
    sede: selectedSede,
    modoActualizacion: "TIEMPO_REAL",
    actualizadoEn: new Date().toISOString(),
    resumen: {
      ingresos: Number(resumen.ingresos.toFixed(2)),
      costos: Number(resumen.costos.toFixed(2)),
      rentabilidadMonto: Number(resumen.rentabilidadMonto.toFixed(2)),
      rentabilidadPorcentaje: Number(rentabilidadPorcentaje.toFixed(2)),
      cumplimientoPorcentaje: Number(cumplimientoPorcentaje.toFixed(2)),
    },
    porSede,
  };
}

// 3) Alertas: baja carga de clientes y rutas con exceso de consumo.
async function getAlertas({ desde, hasta }) {
  const startDate = parseDateInput(
    desde || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  );
  const endDate = parseDateInput(hasta || new Date());

  const pool = await getConnection();

  // Detecta clientes con caída > 30% de carga en semana actual vs semana previa.
  const bajaCargaQuery = `
    WITH carga_actual AS (
      SELECT
        o.cliente_id,
        SUM(COALESCE(NULLIF(o.peso_real, 0), o.peso_estimado, 0)) AS carga_actual
      FROM ordenes o
      WHERE CAST(COALESCE(o.fecha_entrega, o.fecha_creacion) AS DATE) BETWEEN DATEADD(DAY, -7, @hasta) AND @hasta
      GROUP BY o.cliente_id
    ),
    carga_previa AS (
      SELECT
        o.cliente_id,
        SUM(COALESCE(NULLIF(o.peso_real, 0), o.peso_estimado, 0)) AS carga_previa
      FROM ordenes o
      WHERE CAST(COALESCE(o.fecha_entrega, o.fecha_creacion) AS DATE) BETWEEN DATEADD(DAY, -14, @hasta) AND DATEADD(DAY, -8, @hasta)
      GROUP BY o.cliente_id
    )
    SELECT
      u.id AS cliente_id,
      u.nombre AS cliente_nombre,
      ISNULL(a.carga_actual, 0) AS carga_actual,
      ISNULL(p.carga_previa, 0) AS carga_previa
    FROM usuarios u
    LEFT JOIN carga_actual a ON a.cliente_id = u.id
    LEFT JOIN carga_previa p ON p.cliente_id = u.id
    WHERE u.tipo_usuario = 'CLIENTE_CORPORATIVO'
      AND ISNULL(p.carga_previa, 0) > 0
      AND ISNULL(a.carga_actual, 0) < ISNULL(p.carga_previa, 0) * 0.7
  `;

  // Detecta rutas con costo por tonelada > 20% del promedio global.
  const excesoConsumoQuery = `
    WITH rutas AS (
      SELECT
        CONCAT(o.origen, ' -> ', o.destino) AS ruta,
        SUM(ISNULL(o.costo, 0)) AS gasto_total,
        SUM(COALESCE(NULLIF(o.peso_real, 0), o.peso_estimado, 0)) AS volumen_total
      FROM ordenes o
      WHERE CAST(COALESCE(o.fecha_entrega, o.fecha_creacion) AS DATE) BETWEEN @desde AND @hasta
      GROUP BY CONCAT(o.origen, ' -> ', o.destino)
    ),
    metricas AS (
      SELECT
        ruta,
        gasto_total,
        volumen_total,
        CASE WHEN volumen_total > 0 THEN gasto_total / volumen_total ELSE 0 END AS costo_por_ton
      FROM rutas
      WHERE volumen_total > 0
    ),
    promedio_global AS (
      SELECT AVG(costo_por_ton) AS promedio_costo_por_ton FROM metricas
    )
    SELECT
      m.ruta,
      m.costo_por_ton,
      p.promedio_costo_por_ton
    FROM metricas m
    CROSS JOIN promedio_global p
    WHERE m.costo_por_ton > p.promedio_costo_por_ton * 1.2
  `;

  // Ambas alertas se calculan en paralelo para mejorar tiempo de respuesta.
  const [bajaCargaResult, excesoConsumoResult] = await Promise.all([
    pool.request().input("hasta", sql.Date, endDate).query(bajaCargaQuery),
    pool
      .request()
      .input("desde", sql.Date, startDate)
      .input("hasta", sql.Date, endDate)
      .query(excesoConsumoQuery),
  ]);

  const alertasClientes = bajaCargaResult.recordset.map((row) => {
    const cargaPrevia = Number(row.carga_previa || 0);
    const cargaActual = Number(row.carga_actual || 0);
    const caida =
      cargaPrevia > 0 ? ((cargaPrevia - cargaActual) / cargaPrevia) * 100 : 0;

    return {
      tipo: "BAJA_CARGA_CLIENTE",
      severidad: caida >= 50 ? "ALTA" : "MEDIA",
      clienteId: row.cliente_id,
      cliente: row.cliente_nombre,
      cargaActualTon: cargaActual,
      cargaPreviaTon: cargaPrevia,
      caidaPorcentaje: Number(caida.toFixed(2)),
      mensaje: `Cliente con caída de carga de ${caida.toFixed(2)}% en la última semana.`,
    };
  });

  const alertasRutas = excesoConsumoResult.recordset.map((row) => ({
    tipo: "EXCESO_CONSUMO_RUTA",
    severidad: "MEDIA",
    ruta: row.ruta,
    costoPorTon: Number(row.costo_por_ton || 0),
    promedioGlobal: Number(row.promedio_costo_por_ton || 0),
    mensaje:
      "Ruta con costo operativo por tonelada superior al promedio global.",
  }));

  return {
    desde: startDate.toISOString().slice(0, 10),
    hasta: endDate.toISOString().slice(0, 10),
    modoActualizacion: "TIEMPO_REAL",
    actualizadoEn: new Date().toISOString(),
    totalAlertas: alertasClientes.length + alertasRutas.length,
    clientesBajaCarga: alertasClientes,
    rutasExcesoConsumo: alertasRutas,
  };
}

// 3) Eventos de órdenes: bitácora de anomalías con soporte para evidencias en Base64
async function getEventosOrdenes({
  desde,
  hasta,
  sede,
  tipo_evento,
  limite = 100,
}) {
  try {
    const startDate = parseDateInput(desde);
    const endDate = parseDateInput(hasta || desde || new Date());
    const limiteNumero = Math.min(Number(limite) || 100, 1000);

    const pool = await getConnection();

    // Query optimizada: Traemos los datos del evento y concatenamos las rutas de evidencias
    let eventosQuery = `
      SELECT TOP ${limiteNumero}
        oe.id AS evento_id,
        oe.orden_id,
        oe.piloto_id,
        oe.tipo_evento,
        oe.descripcion,
        oe.genera_retraso,
        oe.fecha_hora,
        o.numero_orden,
        o.origen,
        o.destino,
        ISNULL(u.nombre, 'No asignado') AS piloto_nombre,
        ISNULL(cli.nombre, 'N/A') AS cliente_nombre,
        (
            SELECT url_archivo + '|' 
            FROM orden_evidencias 
            WHERE orden_id = o.id 
            FOR XML PATH('')
        ) AS rutas_evidencias
      FROM orden_eventos oe
      INNER JOIN ordenes o ON o.id = oe.orden_id
      LEFT JOIN usuarios u ON u.id = oe.piloto_id
      LEFT JOIN usuarios cli ON cli.id = o.cliente_id
      WHERE CAST(oe.fecha_hora AS DATE) BETWEEN @desde AND @hasta
    `;

    const request = pool
      .request()
      .input("desde", sql.Date, startDate)
      .input("hasta", sql.Date, endDate);

    if (
      tipo_evento &&
      typeof tipo_evento === "string" &&
      ["NORMAL", "INCIDENTE", "RETRASO", "CRITICO"].includes(
        tipo_evento.toUpperCase(),
      )
    ) {
      eventosQuery += ` AND oe.tipo_evento = @tipo_evento`;
      request.input("tipo_evento", sql.NVarChar(15), tipo_evento.toUpperCase());
    }

    if (sede && typeof sede === "string" && sede.trim()) {
      try {
        const selectedSede = normalizeSede(sede);
        const sedeCase = buildSedeCaseForOrders("o");
        eventosQuery += ` AND (${sedeCase}) = @sede`;
        request.input("sede", sql.NVarChar(50), selectedSede);
      } catch (e) {
        console.warn("Sede inválida ignorada");
      }
    }

    eventosQuery += ` ORDER BY oe.fecha_hora DESC`;
    const result = await request.query(eventosQuery);

    const eventos = result.recordset.map((row) => {
      // --- PROCESAMIENTO DE IMÁGENES A BASE64 ---
      let imagenesBase64 = [];
      if (row.rutas_evidencias) {
        // Separamos las rutas usando el pipe '|' y limpiamos vacíos
        const rutas = row.rutas_evidencias
          .split("|")
          .filter((r) => r.trim().length > 0);

        imagenesBase64 = rutas
          .map((rutaRelativa) => {
            try {
              // Construimos la ruta física (Retrocediendo según tu config de Multer)
              const rutaAbsoluta = path.join(
                __dirname,
                "../../../",
                rutaRelativa,
              );

              // AGREGA ESTO PARA DEPURAR:
              console.log("DEBUG: Buscando imagen en:", rutaAbsoluta);
              console.log("DEBUG: ¿Existe?:", fs.existsSync(rutaAbsoluta));

              if (fs.existsSync(rutaAbsoluta)) {
                const bitmap = fs.readFileSync(rutaAbsoluta);
                const ext = path
                  .extname(rutaAbsoluta)
                  .toLowerCase()
                  .replace(".", "");
                // Solo procesamos si es imagen
                if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
                  return `data:image/${ext};base64,${bitmap.toString("base64")}`;
                }
              }
            } catch (err) {
              console.error(
                `Error procesando imagen ${rutaRelativa}:`,
                err.message,
              );
            }
            return null;
          })
          .filter((img) => img !== null);
      }

      return {
        eventoId: row.evento_id,
        ordenId: row.orden_id,
        numeroOrden: row.numero_orden,
        pilotoNombre: row.piloto_nombre,
        clienteNombre: row.cliente_nombre,
        tipoEvento: row.tipo_evento,
        descripcion: row.descripcion,
        generaRetraso: row.genera_retraso === 1,
        fechaHora: row.fecha_hora,
        ruta: `${row.origen} → ${row.destino}`,
        imagenes: imagenesBase64,
      };
    });

    // Conteos para el dashboard
    const conteoTipos = {
      NORMAL: eventos.filter((e) => e.tipoEvento === "NORMAL").length,
      INCIDENTE: eventos.filter((e) => e.tipoEvento === "INCIDENTE").length,
      RETRASO: eventos.filter((e) => e.tipoEvento === "RETRASO").length,
      CRITICO: eventos.filter((e) => e.tipoEvento === "CRITICO").length,
    };

    return {
      desde: startDate.toISOString().slice(0, 10),
      hasta: endDate.toISOString().slice(0, 10),
      total: eventos.length,
      conteoTipos,
      actualizadoEn: new Date().toISOString(),
      eventos,
    };
  } catch (error) {
    console.error("[getEventosOrdenes] Error crítico:", error);
    throw new Error(`Error al obtener bitácora: ${error.message}`);
  }
}

module.exports = {
  getCorteDiario,
  getKpis,
  getAlertas,
  getEventosOrdenes,
  __testables: {
    parseDateInput,
    normalizeSede,
    buildSedeCaseForOrders,
  },
};

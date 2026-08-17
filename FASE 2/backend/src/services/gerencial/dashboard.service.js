"use strict";

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
  const value = String(sede).trim().toUpperCase();
  const allowed = ["GUATEMALA", "XELA", "PUERTO BARRIOS"];
  if (!allowed.includes(value)) {
    throw new Error("Sede invalida. Valores permitidos: GUATEMALA, XELA, PUERTO BARRIOS");
  }
  return value;
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
async function getCorteDiario({ fecha, sede }) {
  const selectedDate = parseDateInput(fecha);
  const selectedSede = normalizeSede(sede);

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

  // Facturación del día, enlazada con orden para obtener sede.
  const invoicesQuery = `
    SELECT
      ${sedeCaseInvoices} AS sede,
      COUNT(*) AS total_facturas,
      SUM(ISNULL(f.total_factura, 0)) AS total_facturado
    FROM facturas_fel f
    INNER JOIN ordenes o ON o.id = f.orden_id
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
    { totalOrdenes: 0, totalFacturas: 0, totalFacturado: 0 }
  );

  return {
    fecha: selectedDate.toISOString().slice(0, 10),
    sede: selectedSede,
    resumen,
    porSede: data,
  };
}

// 2) KPIs: rentabilidad y cumplimiento por rango de fechas y sede.
async function getKpis({ desde, hasta, sede }) {
  const startDate = parseDateInput(desde);
  const endDate = parseDateInput(hasta || desde || new Date());
  const selectedSede = normalizeSede(sede);

  const pool = await getConnection();

  const sedeCase = buildSedeCaseForOrders("o");

  // Se usa historial_cliente + orden_kpi para métricas financieras y operativas.
  const kpiQuery = `
    WITH base AS (
      SELECT
        ${sedeCase} AS sede,
        ISNULL(h.monto_facturado, 0) AS ingreso,
        ISNULL(h.gasto_operativo, 0) AS costo,
        ISNULL(k.tiempo_planificado, 0) AS tiempo_planificado,
        ISNULL(k.tiempo_real, 0) AS tiempo_real,
        ISNULL(k.retraso, 0) AS retraso
      FROM historial_cliente h
      INNER JOIN ordenes o ON o.id = h.orden_id
      LEFT JOIN orden_kpi k ON k.orden_id = o.id
      WHERE CAST(h.fecha_registro AS DATE) BETWEEN @desde AND @hasta
    )
    SELECT
      sede,
      SUM(ingreso) AS ingresos,
      SUM(costo) AS costos,
      SUM(ingreso) - SUM(costo) AS rentabilidad_monto,
      CASE WHEN SUM(ingreso) > 0 THEN ((SUM(ingreso) - SUM(costo)) / SUM(ingreso)) * 100 ELSE 0 END AS rentabilidad_porcentaje,
      AVG(CASE WHEN tiempo_planificado > 0 THEN CAST(tiempo_planificado AS FLOAT) END) AS tiempo_planificado_promedio,
      AVG(CASE WHEN tiempo_real > 0 THEN CAST(tiempo_real AS FLOAT) END) AS tiempo_real_promedio,
      SUM(CASE WHEN tiempo_planificado > 0 AND tiempo_real <= tiempo_planificado THEN 1 ELSE 0 END) AS ordenes_a_tiempo,
      SUM(CASE WHEN tiempo_planificado > 0 THEN 1 ELSE 0 END) AS ordenes_con_medicion,
      AVG(CASE WHEN retraso >= 0 THEN CAST(retraso AS FLOAT) END) AS retraso_promedio
    FROM base
    GROUP BY sede
  `;

  const result = await pool
    .request()
    .input("desde", sql.Date, startDate)
    .input("hasta", sql.Date, endDate)
    .query(kpiQuery);

  let rows = result.recordset.filter((row) => row.sede !== "OTRA");

  if (selectedSede) {
    rows = rows.filter((row) => row.sede === selectedSede);
  }

  // Cálculo final de cumplimiento: ordenes a tiempo / ordenes con medición.
  const porSede = rows.map((row) => {
    const ordenesConMedicion = Number(row.ordenes_con_medicion || 0);
    const ordenesATiempo = Number(row.ordenes_a_tiempo || 0);
    const cumplimiento = ordenesConMedicion > 0 ? (ordenesATiempo / ordenesConMedicion) * 100 : 0;

    return {
      sede: row.sede,
      ingresos: Number(row.ingresos || 0),
      costos: Number(row.costos || 0),
      rentabilidadMonto: Number(row.rentabilidad_monto || 0),
      rentabilidadPorcentaje: Number(row.rentabilidad_porcentaje || 0),
      tiempoPlanificadoPromedio: Number(row.tiempo_planificado_promedio || 0),
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
    { ingresos: 0, costos: 0, rentabilidadMonto: 0, ordenesConMedicion: 0, ordenesATiempo: 0 }
  );

  const rentabilidadPorcentaje = resumen.ingresos > 0
    ? (resumen.rentabilidadMonto / resumen.ingresos) * 100
    : 0;

  const cumplimientoPorcentaje = resumen.ordenesConMedicion > 0
    ? (resumen.ordenesATiempo / resumen.ordenesConMedicion) * 100
    : 0;

  return {
    desde: startDate.toISOString().slice(0, 10),
    hasta: endDate.toISOString().slice(0, 10),
    sede: selectedSede,
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
  const startDate = parseDateInput(desde || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const endDate = parseDateInput(hasta || new Date());

  const pool = await getConnection();

  // Detecta clientes con caída > 30% de carga en semana actual vs semana previa.
  const bajaCargaQuery = `
    WITH carga_actual AS (
      SELECT h.cliente_id, SUM(ISNULL(h.volumen_carga_ton, 0)) AS carga_actual
      FROM historial_cliente h
      WHERE CAST(h.fecha_registro AS DATE) BETWEEN DATEADD(DAY, -7, @hasta) AND @hasta
      GROUP BY h.cliente_id
    ),
    carga_previa AS (
      SELECT h.cliente_id, SUM(ISNULL(h.volumen_carga_ton, 0)) AS carga_previa
      FROM historial_cliente h
      WHERE CAST(h.fecha_registro AS DATE) BETWEEN DATEADD(DAY, -14, @hasta) AND DATEADD(DAY, -8, @hasta)
      GROUP BY h.cliente_id
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
        SUM(ISNULL(h.gasto_operativo, 0)) AS gasto_total,
        SUM(NULLIF(h.volumen_carga_ton, 0)) AS volumen_total
      FROM historial_cliente h
      INNER JOIN ordenes o ON o.id = h.orden_id
      WHERE CAST(h.fecha_registro AS DATE) BETWEEN @desde AND @hasta
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
    pool
      .request()
      .input("hasta", sql.Date, endDate)
      .query(bajaCargaQuery),
    pool
      .request()
      .input("desde", sql.Date, startDate)
      .input("hasta", sql.Date, endDate)
      .query(excesoConsumoQuery),
  ]);

  const alertasClientes = bajaCargaResult.recordset.map((row) => {
    const cargaPrevia = Number(row.carga_previa || 0);
    const cargaActual = Number(row.carga_actual || 0);
    const caida = cargaPrevia > 0 ? ((cargaPrevia - cargaActual) / cargaPrevia) * 100 : 0;

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
    mensaje: "Ruta con costo operativo por tonelada superior al promedio global.",
  }));

  return {
    desde: startDate.toISOString().slice(0, 10),
    hasta: endDate.toISOString().slice(0, 10),
    totalAlertas: alertasClientes.length + alertasRutas.length,
    clientesBajaCarga: alertasClientes,
    rutasExcesoConsumo: alertasRutas,
  };
}

module.exports = {
  getCorteDiario,
  getKpis,
  getAlertas,
};

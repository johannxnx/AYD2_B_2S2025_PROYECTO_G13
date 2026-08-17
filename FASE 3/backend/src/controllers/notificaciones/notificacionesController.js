/**
 * @file Controlador de Notificaciones
 * @description Maneja la obtención de notificaciones pendientes del usuario
 * @module controllers/notificaciones
 */

const { getConnection } = require('../../config/db');

/**
 * Obtiene las notificaciones pendientes del usuario autenticado
 * @param {Object} req - Objeto de request de Express
 * @param {Object} req.user - Usuario autenticado (desde JWT)
 * @param {number} req.user.id - ID del usuario
 * @param {Object} res - Objeto de response de Express
 * @returns {Object} {notificaciones: Array, total: number}
 * @status 200 - Notificaciones obtenidas correctamente
 * @status 500 - Error en el servidor
 */
async function obtenerNotificaciones(req, res) {
  try {
    const usuarioId = req.user.sub;
    const notificaciones = [];

    const pool = await getConnection();

    // 1. Contar clientes pendientes de aceptación (PENDIENTE_ACEPTACION)
    const clientesPendientesResult = await pool.request()
      .query(`
        SELECT COUNT(*) as cantidad 
        FROM usuarios 
        WHERE tipo_usuario = 'CLIENTE_CORPORATIVO' 
        AND estado = 'PENDIENTE_ACEPTACION'
      `);

    const clientesPendientes = clientesPendientesResult.recordset[0].cantidad;
    if (clientesPendientes > 0) {
      notificaciones.push({
        tipo: 'clientes',
        titulo: 'Clientes Pendientes',
        cantidad: clientesPendientes,
        icono: '(i)'
      });
    }

    // 2. Contar contratos próximos a expirar (en los próximos 30 días)
    const contratosProximosResult = await pool.request()
      .query(`
        SELECT COUNT(*) as cantidad 
        FROM contratos 
        WHERE fecha_fin BETWEEN GETDATE() AND DATEADD(DAY, 30, GETDATE())
        AND estado = 'VIGENTE'
      `);

    const contratosProximos = contratosProximosResult.recordset[0].cantidad;
    if (contratosProximos > 0) {
      notificaciones.push({
        tipo: 'contratos',
        titulo: 'Contratos Proximos a Vencer',
        cantidad: contratosProximos,
        icono: '[!]'
      });
    }

    // 3. Contar clientes bloqueados
    const clientesBloqueadosResult = await pool.request()
      .query(`
        SELECT COUNT(*) as cantidad 
        FROM usuarios 
        WHERE estado = 'BLOQUEADO'
        AND tipo_usuario = 'CLIENTE_CORPORATIVO'
      `);

    const clientesBloqueados = clientesBloqueadosResult.recordset[0].cantidad;
    if (clientesBloqueados > 0) {
      notificaciones.push({
        tipo: 'bloqueados',
        titulo: 'Clientes Bloqueados',
        cantidad: clientesBloqueados,
        icono: '[x]'
      });
    }

    // 4. Contar órdenes en tránsito (cuando exista la tabla)
    let ordenesEnTransito = 0;
    try {
      const ordenesResult = await pool.request()
        .query(`
          SELECT COUNT(*) as cantidad 
          FROM ordenes 
          WHERE estado = 'EN_TRANSITO'
        `);
      ordenesEnTransito = ordenesResult.recordset[0].cantidad;
      if (ordenesEnTransito > 0) {
        notificaciones.push({
          tipo: 'ordenes',
          titulo: 'Ordenes en Transito',
          cantidad: ordenesEnTransito,
          icono: '[o]'
        });
      }
    } catch (error) {
      // Tabla ordenes puede no existir aún
      console.log('Tabla ordenes no existe o no tiene datos');
    }

    const totalNotificaciones = notificaciones.reduce((sum, n) => sum + n.cantidad, 0);

    return res.status(200).json({
      ok: true,
      notificaciones: notificaciones,
      total: totalNotificaciones
    });

  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    return res.status(500).json({
      ok: false,
      error: 'Error al obtener notificaciones',
      message: error.message
    });
  }
}

module.exports = {
  obtenerNotificaciones
};

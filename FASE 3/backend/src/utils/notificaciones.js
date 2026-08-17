/**
 * @file notificaciones.js
 * @description Módulo de notificaciones por correo para eventos críticos del sistema
 * Centraliza el envío de correos para bloqueos, advertencias y cambios importantes
 * @requires utils/mailer - Sistema de envío de correos
 */

const { notificarIncorrecto, notificarInformativo } = require('./mailer');

/**
 * Notifica al cliente que su cuenta ha sido bloqueada por límite de crédito excedido
 * @async
 * @function notificarBloqueoPorCredito
 * @param {Object} cliente - Objeto con datos del cliente { email, nombre }
 * @param {Object} contrato - Objeto con datos del contrato { saldo_usado, limite_credito, numero_contrato }
 * @returns {Promise<void>}
 * @example
 * await notificarBloqueoPorCredito(
 *   { email: 'cliente@empresa.com', nombre: 'Juan Pérez' },
 *   { saldo_usado: 50000, limite_credito: 50000, numero_contrato: 'CTR-2025-00001' }
 * );
 */
const notificarBloqueoPorCredito = async (cliente, contrato) => {
  try {
    const motivo = `Su cuenta ha sido bloqueada automáticamente por exceder el límite de crédito asignado de Q${contrato.limite_credito.toLocaleString('es-GT')}.`;
    const detalleDeuda = `Saldo utilizado: Q${contrato.saldo_usado.toLocaleString('es-GT')} / Límite: Q${contrato.limite_credito.toLocaleString('es-GT')}`;
    
    await notificarIncorrecto(
      cliente.email,
      cliente.nombre,
      motivo,
      {
        titulo: '⚠️ Cuenta Bloqueada - Límite de Crédito Excedido',
        detalle: detalleDeuda,
        codigo: 'BLOQUEO-AUTO-001',
        datos: [
          { etiqueta: 'Contrato', valor: contrato.numero_contrato },
          { etiqueta: 'Saldo Utilizado', valor: `Q${contrato.saldo_usado.toLocaleString('es-GT')}` },
          { etiqueta: 'Límite de Crédito', valor: `Q${contrato.limite_credito.toLocaleString('es-GT')}` }
        ]
      }
    );
    console.log(`[notificaciones] Correo de bloqueo enviado a ${cliente.email}`);
  } catch (error) {
    console.error(`[notificaciones] Error al enviar correo de bloqueo: ${error.message}`);
    throw error;
  }
};

/**
 * Notifica al cliente que su contrato ha expirado
 * @async
 * @function notificarContratoExpirado
 * @param {Object} cliente - Objeto con datos del cliente { email, nombre }
 * @param {Object} contrato - Objeto con datos del contrato { numero_contrato, fecha_fin }
 * @returns {Promise<void>}
 */
const notificarContratoExpirado = async (cliente, contrato) => {
  try {
    const motivo = `Su contrato de transporte ha expirado. No podrá crear nuevas órdenes hasta renovarlo.`;
    
    await notificarIncorrecto(
      cliente.email,
      cliente.nombre,
      motivo,
      {
        titulo: '📋 Contrato Expirado',
        detalle: `Fecha de vencimiento: ${new Date(contrato.fecha_fin).toLocaleDateString('es-GT')}`,
        codigo: 'CONTRATO-EXP-001',
        datos: [
          { etiqueta: 'Número de Contrato', valor: contrato.numero_contrato },
          { etiqueta: 'Fecha de Expiración', valor: new Date(contrato.fecha_fin).toLocaleDateString('es-GT') }
        ]
      }
    );
    console.log(`[notificaciones] Correo de expiración enviado a ${cliente.email}`);
  } catch (error) {
    console.error(`[notificaciones] Error al enviar correo de expiración: ${error.message}`);
    throw error;
  }
};

/**
 * Notifica al cliente que tiene facturas vencidas sin pagar
 * @async
 * @function notificarFacturasVencidas
 * @param {Object} cliente - Objeto con datos del cliente { email, nombre }
 * @param {Array} facturas - Array de facturas vencidas
 * @returns {Promise<void>}
 */
const notificarFacturasVencidas = async (cliente, facturas) => {
  try {
    const cantidad = facturas.length;
    const motivo = `Tiene ${cantidad} factura(s) certificada(s) sin pagar. Debe regularizar el pago para continuar realizando órdenes.`;
    
    const totalDeuda = facturas.reduce((sum, f) => sum + (f.total_factura || 0), 0);
    
    await notificarIncorrecto(
      cliente.email,
      cliente.nombre,
      motivo,
      {
        titulo: '💰 Facturas Pendientes de Pago',
        detalle: `Total a pagar: Q${totalDeuda.toLocaleString('es-GT')}`,
        codigo: 'FACTURAS-VENCIDAS-001',
        datos: [
          { etiqueta: 'Cantidad de Facturas', valor: cantidad },
          { etiqueta: 'Total Deuda', valor: `Q${totalDeuda.toLocaleString('es-GT')}` }
        ]
      }
    );
    console.log(`[notificaciones] Correo de facturas vencidas enviado a ${cliente.email}`);
  } catch (error) {
    console.error(`[notificaciones] Error al enviar correo de facturas: ${error.message}`);
    throw error;
  }
};

/**
 * Notifica al cliente que tiene cuentas por cobrar vencidas
 * @async
 * @function notificarCuentasVencidas
 * @param {Object} cliente - Objeto con datos del cliente { email, nombre }
 * @param {Array} cuentas - Array de cuentas por cobrar vencidas
 * @returns {Promise<void>}
 */
const notificarCuentasVencidas = async (cliente, cuentas) => {
  try {
    const cantidad = cuentas.length;
    const motivo = `Le informamos que tiene ${cantidad} cuenta(s) por cobrar vencida(s) en el sistema.`;
    
    const totalDeuda = cuentas.reduce((sum, c) => sum + (c.saldo_pendiente || 0), 0);
    
    await notificarIncorrecto(
      cliente.email,
      cliente.nombre,
      motivo,
      {
        titulo: '📌 Cuentas por Cobrar Vencidas',
        detalle: `Total pendiente: Q${totalDeuda.toLocaleString('es-GT')}`,
        codigo: 'CUENTAS-VENCIDAS-001',
        datos: [
          { etiqueta: 'Cantidad de Cuentas', valor: cantidad },
          { etiqueta: 'Total Pendiente', valor: `Q${totalDeuda.toLocaleString('es-GT')}` }
        ]
      }
    );
    console.log(`[notificaciones] Correo de cuentas vencidas enviado a ${cliente.email}`);
  } catch (error) {
    console.error(`[notificaciones] Error al enviar correo de cuentas: ${error.message}`);
    throw error;
  }
};

/**
 * Notifica al cliente que su cuenta ha sido aceptada después de evaluación de riesgo
 * Se usa específicamente para clientes corporativos nuevos que pasan de PENDIENTE_ACEPTACION a ACTIVO
 * @async
 * @function notificarClienteAceptado
 * @param {Object} usuario - Objeto con datos del usuario { email, nombre }
 * @returns {Promise<void>}
 */
const notificarClienteAceptado = async (usuario) => {
  try {
    const textoMotivo = `¡Felicitaciones! Su solicitud ha sido evaluada y aceptada. Su cuenta está lista para usar. Ya puede acceder a la plataforma de LogiTrans y crear órdenes de transporte.`;
    
    await notificarInformativo(
      usuario.email,
      usuario.nombre,
      textoMotivo,
      {
        titulo: '✅ ¡Bienvenido a LogiTrans!',
        detalle: 'Tu cuenta ha sido aceptada exitosamente',
        codigo: 'CLIENTE-ACEPTADO-001',
        datos: [
          { etiqueta: 'Estado', valor: 'ACTIVO' },
          { etiqueta: 'Acceso', valor: 'Disponible' },
          { etiqueta: 'Tipo de Cuenta', valor: 'Cliente Corporativo' }
        ]
      }
    );
    console.log(`[notificaciones] Correo de aceptación enviado a ${usuario.email}`);
  } catch (error) {
    console.error(`[notificaciones] Error al enviar correo de aceptación: ${error.message}`);
    throw error;
  }
};

/**
 * Notifica al usuario que su cuenta ha sido marcada como inactiva
 * @async
 * @function notificarCuentaInactiva
 * @param {Object} usuario - Objeto con datos del usuario { email, nombre }
 * @returns {Promise<void>}
 */
const notificarCuentaInactiva = async (usuario) => {
  try {
    const textoMotivo = `Su cuenta ha sido desactivada por temas de administración. No podrá acceder al sistema ni crear órdenes de transporte hasta que la cuenta sea reactivada.`;
    
    await notificarIncorrecto(
      usuario.email,
      usuario.nombre,
      textoMotivo,
      {
        titulo: 'Cuenta Desactivada',
        detalle: 'Su cuenta ha sido desactivada',
        codigo: 'CUENTA-INACTIVA-001',
        datos: [
          { etiqueta: 'Estado', valor: 'INACTIVO' },
          { etiqueta: 'Acción Requerida', valor: 'Contacte con soporte' }
        ]
      }
    );
    console.log(`[notificaciones] Correo de desactivación enviado a ${usuario.email}`);
  } catch (error) {
    console.error(`[notificaciones] Error al enviar correo de desactivación: ${error.message}`);
    throw error;
  }
};

/**
 * Notifica al usuario que su cuenta ha sido reactivada
 * @async
 * @function notificarCuentaActivada
 * @param {Object} usuario - Objeto con datos del usuario { email, nombre }
 * @returns {Promise<void>}
 */
const notificarCuentaActivada = async (usuario) => {
  try {
    const textoMotivo = `Su cuenta ha sido reactivada por temas de administración. Ya puede acceder al sistema y crear órdenes de transporte nuevamente.`;
    
    await notificarInformativo(
      usuario.email,
      usuario.nombre,
      textoMotivo,
      {
        titulo: 'Cuenta Reactivada',
        detalle: 'Su cuenta ha sido activada y está lista para usar',
        codigo: 'CUENTA-ACTIVA-001',
        datos: [
          { etiqueta: 'Estado', valor: 'ACTIVO' },
          { etiqueta: 'Acceso', valor: 'Disponible' }
        ]
      }
    );
    console.log(`[notificaciones] Correo de reactivación enviado a ${usuario.email}`);
  } catch (error) {
    console.error(`[notificaciones] Error al enviar correo de reactivación: ${error.message}`);
    throw error;
  }
};

module.exports = {
  notificarBloqueoPorCredito,
  notificarContratoExpirado,
  notificarFacturasVencidas,
  notificarCuentasVencidas,
  notificarCuentaInactiva,
  notificarCuentaActivada,
  notificarClienteAceptado
};

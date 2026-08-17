/**
 * utils/mailer.js
 * Módulo central de envío de correos para LogiTrans Guatemala, S.A.
 * Responsabilidades:
 *   1. Crear y mantener el transporter SMTP de nodemailer.
 *   2. Verificar la conexión al arranque (modo desarrollo).
 *   3. Exponer tres funciones de alto nivel: notificarCorrecto,
 *      notificarIncorrecto, notificarInformativo.
 */

"use strict";

const path = require("path");
const nodemailer = require("nodemailer");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const correcto    = require("./formato_correo/correcto");
const incorrecto  = require("./formato_correo/incorrecto");
const informativo = require("./formato_correo/informativo");

// Se crea una sola vez (singleton) para reutilizar la conexión SMTP.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Tiempo máximo de espera por respuesta del servidor SMTP
  connectionTimeout: 10_000,
  greetingTimeout:   5_000,
});

// ── Verificación de conexión (solo en desarrollo) 
if (process.env.NODE_ENV !== "production") {
  transporter.verify((error) => {
    if (error) {
      console.error("[mailer] No se pudo conectar con el servidor SMTP:", error.message);
    } else {
      console.info("[mailer] Conexión SMTP lista. Correos habilitados.");
    }
  });
}

// ── Helper interno 
/**
 * Envía un correo usando el transporter compartido.
 * @param {string} to          Dirección de destino (ej. "cliente@empresa.com")
 * @param {string} subject     Asunto del correo
 * @param {string} text        Cuerpo en texto plano
 * @param {string} html        Cuerpo en HTML
 * @returns {Promise<object>}  Información del mensaje enviado por nodemailer
 */
async function _enviar(to, subject, text, html) {
  const from = `"${process.env.EMAIL_FROM || "LogiTrans Guatemala, S.A."}" <${process.env.EMAIL_USER}>`;

  const info = await transporter.sendMail({ from, to, subject, text, html });
  console.info(`[mailer] Correo enviado a ${to} | ID: ${info.messageId}`);
  return info;
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Envía una notificación de ÉXITO (fondo verde).
 *
 * @param {string} to             Correo destino
 * @param {string} destinatario   Nombre del destinatario para el saludo
 * @param {string} aviso          Mensaje principal de éxito
 * @param {object} [opciones]     Ver formato_correo/correcto.js para opciones disponibles
 * @returns {Promise<object>}
 *
 * @example
 * await notificarCorrecto(
 *   "piloto@logitrans.gt",
 *   "Juan López",
 *   "La orden #ORD-2024-00123 ha sido marcada como entregada exitosamente.",
 *   { titulo: "Entrega Confirmada", icono: "🚛" }
 * );
 */
async function notificarCorrecto(to, destinatario, aviso, opciones = {}) {
  const { subject, text, html } = correcto(destinatario, aviso, opciones);
  return _enviar(to, subject, text, html);
}

/**
 * Envía una notificación de ERROR (fondo rojo).
 *
 * @param {string} to             Correo destino
 * @param {string} destinatario   Nombre del destinatario para el saludo
 * @param {string} aviso          Descripción del problema detectado
 * @param {object} [opciones]     Ver formato_correo/incorrecto.js para opciones disponibles
 * @returns {Promise<object>}
 *
 * @example
 * await notificarIncorrecto(
 *   "finanzas@logitrans.gt",
 *   "Ana García",
 *   "La certificación FEL de la factura #F-0045 fue rechazada por la SAT.",
 *   {
 *     titulo: "Error en Certificación FEL",
 *     codigo: "ERR-FEL-SAT-422",
 *     detalle: "Verifique que el NIT del cliente sea válido y vuelva a intentarlo."
 *   }
 * );
 */
async function notificarIncorrecto(to, destinatario, aviso, opciones = {}) {
  const { subject, text, html } = incorrecto(destinatario, aviso, opciones);
  return _enviar(to, subject, text, html);
}

/**
 * Envía una notificación INFORMATIVA (fondo azul).
 *
 * @param {string} to             Correo destino
 * @param {string} destinatario   Nombre del destinatario para el saludo
 * @param {string} aviso          Mensaje informativo principal
 * @param {object} [opciones]     Ver formato_correo/informativo.js para opciones disponibles
 * @returns {Promise<object>}
 *
 * @example
 * await notificarInformativo(
 *   "cliente@empresa.gt",
 *   "Comercial El Éxito",
 *   "Su orden de servicio ha cambiado de estado.",
 *   {
 *     titulo: "Actualización de Orden",
 *     datos: [
 *       { etiqueta: "Orden",   valor: "ORD-2024-00123" },
 *       { etiqueta: "Estado",  valor: "En Tránsito"    },
 *       { etiqueta: "Ruta",    valor: "Puerto Barrios → Ciudad de Guatemala" },
 *     ]
 *   }
 * );
 */
async function notificarInformativo(to, destinatario, aviso, opciones = {}) {
  const { subject, text, html } = informativo(destinatario, aviso, opciones);
  return _enviar(to, subject, text, html);
}

module.exports = {
  notificarCorrecto,
  notificarIncorrecto,
  notificarInformativo,
};
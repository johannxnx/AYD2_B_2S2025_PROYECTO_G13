/**
 * formato_correo/correcto.js
 * Plantilla HTML para notificaciones de ÉXITO / OPERACIÓN CORRECTA.
 * Paleta visual: verde esmeralda — transmite confirmación y confianza.
 *
 * @param {string} destinatario   Nombre del destinatario (ej. "Carlos Pérez")
 * @param {string} aviso          Mensaje principal que se mostrará en el cuerpo
 * @param {object} [opciones]     Configuración opcional
 * @param {string} [opciones.titulo]    Título del encabezado (por defecto "Operación Exitosa")
 * @param {string} [opciones.detalle]   Párrafo secundario de detalle adicional
 * @param {string} [opciones.icono]     Emoji/icono del encabezado (por defecto " :) ")
 * @returns {{ subject: string, text: string, html: string }}
 */
function correcto(destinatario, aviso, opciones = {}) {
    const {
      titulo  = "Operación Exitosa",
      detalle = null,
      icono   = " :) ",
    } = opciones;
  
    const anio    = new Date().getFullYear();
    const empresa = "LogiTrans Guatemala, S.A.";
  
    // ── Texto plano (fallback para clientes sin soporte HTML) ────────────────
    const text =
      `Hola, ${destinatario}.\n\n` +
      `${aviso}\n\n` +
      (detalle ? `${detalle}\n\n` : "") +
      `Este correo fue generado automáticamente. Por favor no responder.\n` +
      `© ${anio} ${empresa}`;
  
    // ── Plantilla HTML ───────────────────────────────────────────────────────
    const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${titulo}</title>
  </head>
  <body style="
    margin:0;padding:0;
    background:linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%);
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;
  ">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:50px 20px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="
            max-width:560px;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 20px 60px rgba(5,150,105,0.18);
          ">
  
            <!-- ── ENCABEZADO ── -->
            <tr>
              <td style="
                padding:40px 30px 35px;
                text-align:center;
                background:linear-gradient(135deg,#059669 0%,#047857 100%);
              ">
                <div style="
                  display:inline-block;
                  width:72px;height:72px;
                  background:rgba(255,255,255,0.2);
                  border-radius:50%;
                  margin:0 auto 20px;
                  line-height:72px;
                ">
                  <span style="font-size:38px;">${icono}</span>
                </div>
                <h1 style="
                  margin:0 0 8px 0;
                  color:#ffffff;
                  font-size:26px;
                  font-weight:700;
                  letter-spacing:-0.4px;
                ">${titulo}</h1>
                <p style="
                  margin:0;
                  color:rgba(255,255,255,0.88);
                  font-size:14px;
                ">${empresa}</p>
              </td>
            </tr>
  
            <!-- ── CUERPO ── -->
            <tr>
              <td style="padding:42px 38px 36px;">
  
                <p style="
                  margin:0 0 6px 0;
                  color:#064e3b;
                  font-size:16px;
                  font-weight:600;
                ">Hola, ${destinatario}</p>
  
                <!-- Burbuja del aviso principal -->
                <div style="
                  background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);
                  border-left:4px solid #059669;
                  border-radius:12px;
                  padding:22px 24px;
                  margin:20px 0;
                ">
                  <p style="
                    margin:0;
                    color:#065f46;
                    font-size:15px;
                    line-height:1.75;
                  ">${aviso}</p>
                </div>
  
                ${detalle ? `
                <p style="
                  margin:0;
                  color:#6b7280;
                  font-size:14px;
                  line-height:1.7;
                ">${detalle}</p>
                ` : ""}
  
              </td>
            </tr>
  
            <!-- ── SEPARADOR ── -->
            <tr>
              <td style="padding:0 38px;">
                <div style="
                  height:1px;
                  background:linear-gradient(to right,transparent,#d1fae5,transparent);
                "></div>
              </td>
            </tr>
  
            <!-- ── PIE ── -->
            <tr>
              <td style="padding:28px 38px;text-align:center;">
                <p style="margin:0 0 6px 0;color:#9ca3af;font-size:13px;">
                  Este es un correo automático, por favor no responder.
                </p>
                <p style="margin:0;color:#d1d5db;font-size:12px;">
                  © ${anio} ${empresa} — Todos los derechos reservados
                </p>
              </td>
            </tr>
  
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
    `.trim();
  
    return {
      subject: ` :)  ${titulo} — ${empresa}`,
      text,
      html,
    };
  }
  
  module.exports = correcto;
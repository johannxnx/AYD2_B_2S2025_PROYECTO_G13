/**
 * formato_correo/incorrecto.js
\ * Plantilla HTML para notificaciones de ERROR / ALGO SALIÓ MAL.
 * Paleta visual: rojo rubí — comunica alerta sin generar pánico.
 *
 * @param {string} destinatario   Nombre del destinatario (ej. "Carlos Pérez")
 * @param {string} aviso          Descripción del problema ocurrido
 * @param {object} [opciones]     Configuración opcional
 * @param {string} [opciones.titulo]    Título del encabezado (por defecto "Algo salió mal")
 * @param {string} [opciones.detalle]   Instrucciones o pasos de solución adicionales
 * @param {string} [opciones.icono]     Emoji/icono del encabezado (por defecto " :( ")
 * @param {string} [opciones.codigo]    Código de error técnico (ej. "ERR-FEL-001")
 * @returns {{ subject: string, text: string, html: string }}
\ */
function incorrecto(destinatario, aviso, opciones = {}) {
    const {
      titulo  = "Algo salió mal",
      detalle = null,
      icono   = " :( ",
      codigo  = null,
    } = opciones;
  
    const anio    = new Date().getFullYear();
    const empresa = "LogiTrans Guatemala, S.A.";
  
    // ── Texto plano ──────────────────────────────────────────────────────────
    const text =
      `Hola, ${destinatario}.\n\n` +
      `Se ha detectado un problema:\n\n${aviso}\n\n` +
      (codigo  ? `Código de referencia: ${codigo}\n\n` : "") +
      (detalle ? `${detalle}\n\n` : "") +
      `Si el problema persiste, comuníquese con el área de soporte.\n\n` +
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
    background:linear-gradient(135deg,#fee2e2 0%,#fecaca 100%);
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
            box-shadow:0 20px 60px rgba(185,28,28,0.18);
          ">
  
            <!-- ── ENCABEZADO ── -->
            <tr>
              <td style="
                padding:40px 30px 35px;
                text-align:center;
                background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);
              ">
                <div style="
                  display:inline-block;
                  width:72px;height:72px;
                  background:rgba(255,255,255,0.18);
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
                  color:#7f1d1d;
                  font-size:16px;
                  font-weight:600;
                ">Hola, ${destinatario}</p>
  
                <p style="
                  margin:0 0 20px 0;
                  color:#6b7280;
                  font-size:14px;
                  line-height:1.65;
                ">
                  Le informamos que se ha detectado un problema en el sistema que requiere su atención.
                </p>
  
                <!-- Burbuja del aviso de error -->
                <div style="
                  background:linear-gradient(135deg,#fff1f2 0%,#ffe4e6 100%);
                  border-left:4px solid #dc2626;
                  border-radius:12px;
                  padding:22px 24px;
                  margin-bottom:20px;
                ">
                  <p style="
                    margin:0;
                    color:#991b1b;
                    font-size:15px;
                    line-height:1.75;
                  ">${aviso}</p>
                </div>
  
                ${codigo ? `
                <!-- Código de referencia -->
                <div style="
                  background:#fef2f2;
                  border:1px solid #fca5a5;
                  border-radius:8px;
                  padding:12px 18px;
                  margin-bottom:20px;
                  text-align:center;
                ">
                  <span style="
                    font-size:13px;
                    color:#9ca3af;
                    display:block;
                    margin-bottom:4px;
                  ">Código de referencia</span>
                  <span style="
                    font-size:15px;
                    font-weight:700;
                    color:#dc2626;
                    font-family:'Courier New',Courier,monospace;
                    letter-spacing:2px;
                  ">${codigo}</span>
                </div>
                ` : ""}
  
                ${detalle ? `
                <div style="
                  background:#f9fafb;
                  border-left:4px solid #d1d5db;
                  border-radius:12px;
                  padding:18px 22px;
                ">
                  <p style="
                    margin:0 0 6px 0;
                    color:#374151;
                    font-size:14px;
                    font-weight:600;
                  ">Pasos sugeridos</p>
                  <p style="
                    margin:0;
                    color:#6b7280;
                    font-size:14px;
                    line-height:1.7;
                  ">${detalle}</p>
                </div>
                ` : ""}
  
              </td>
            </tr>
  
            <!-- ── SEPARADOR ── -->
            <tr>
              <td style="padding:0 38px;">
                <div style="
                  height:1px;
                  background:linear-gradient(to right,transparent,#fee2e2,transparent);
                "></div>
              </td>
            </tr>
  
            <!-- ── PIE ── -->
            <tr>
              <td style="padding:28px 38px;text-align:center;">
                <p style="margin:0 0 6px 0;color:#9ca3af;font-size:13px;">
                  Si el problema persiste, comuníquese con el área de soporte técnico.
                </p>
                <p style="margin:0;color:#d1d5db;font-size:12px;">
                  © ${anio} ${empresa} — Correo automático
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
      subject: ` :(  ${titulo} — ${empresa}`,
      text,
      html,
    };
  }
  
  module.exports = incorrecto;
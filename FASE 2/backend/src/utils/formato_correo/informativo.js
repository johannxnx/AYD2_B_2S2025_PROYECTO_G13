/**
 * formato_correo/informativo.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Plantilla HTML para notificaciones INFORMATIVAS / ESTADO / ACTUALIZACIÓN.
 * Paleta visual: azul cielo — neutral, profesional, institucional.
 *
 * @param {string} destinatario   Nombre del destinatario (ej. "Carlos Pérez")
 * @param {string} aviso          Mensaje informativo principal
 * @param {object} [opciones]     Configuración opcional
 * @param {string} [opciones.titulo]    Título del encabezado (por defecto "Aviso Informativo")
 * @param {string} [opciones.detalle]   Párrafo de contexto adicional
 * @param {string} [opciones.icono]     Emoji/icono del encabezado (por defecto " ._. ")
 * @param {Array}  [opciones.datos]     Lista de pares [{etiqueta, valor}] para tabla de datos
 * @returns {{ subject: string, text: string, html: string }}
 * ─────────────────────────────────────────────────────────────────────────────
 */
function informativo(destinatario, aviso, opciones = {}) {
    const {
      titulo  = "Aviso Informativo",
      detalle = null,
      icono   = " ._. ",
      datos   = [],
    } = opciones;
  
    const anio    = new Date().getFullYear();
    const empresa = "LogiTrans Guatemala, S.A.";
  
    // ── Texto plano ──────────────────────────────────────────────────────────
    const textoDatos = datos.length
      ? "\n" + datos.map(d => `• ${d.etiqueta}: ${d.valor}`).join("\n") + "\n"
      : "";
  
    const text =
      `Hola, ${destinatario}.\n\n` +
      `${aviso}\n` +
      textoDatos +
      (detalle ? `\n${detalle}\n` : "") +
      `\nEste correo fue generado automáticamente. Por favor no responder.\n` +
      `© ${anio} ${empresa}`;
  
    // ── Tabla de datos opcionales ────────────────────────────────────────────
    const tablaHtml = datos.length ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="
      margin:24px 0;
      border-collapse:collapse;
      border-radius:10px;
      overflow:hidden;
      font-size:14px;
    ">
      ${datos.map((d, i) => `
      <tr style="background:${i % 2 === 0 ? "#f0f9ff" : "#e0f2fe"};">
        <td style="
          padding:12px 16px;
          color:#0c4a6e;
          font-weight:600;
          width:45%;
          border-bottom:1px solid #bae6fd;
        ">${d.etiqueta}</td>
        <td style="
          padding:12px 16px;
          color:#1e3a5f;
          border-bottom:1px solid #bae6fd;
        ">${d.valor}</td>
      </tr>
      `).join("")}
    </table>
    ` : "";
  
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
    background:linear-gradient(135deg,#e0f2fe 0%,#dbeafe 100%);
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
            box-shadow:0 20px 60px rgba(2,132,199,0.18);
          ">
  
            <!-- ── ENCABEZADO ── -->
            <tr>
              <td style="
                padding:40px 30px 35px;
                text-align:center;
                background:linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%);
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
                  color:#0c4a6e;
                  font-size:16px;
                  font-weight:600;
                ">Hola, ${destinatario}</p>
  
                <!-- Burbuja del aviso informativo -->
                <div style="
                  background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%);
                  border-left:4px solid #0ea5e9;
                  border-radius:12px;
                  padding:22px 24px;
                  margin:18px 0;
                ">
                  <p style="
                    margin:0;
                    color:#075985;
                    font-size:15px;
                    line-height:1.75;
                  ">${aviso}</p>
                </div>
  
                ${tablaHtml}
  
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
                  background:linear-gradient(to right,transparent,#bae6fd,transparent);
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
      subject: ` ._.  ${titulo} — ${empresa}`,
      text,
      html,
    };
  }
  
  module.exports = informativo;
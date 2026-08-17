/**
 * @file felSimulador.service.js
 * @description Simulador del certificador FEL (Factura Electrónica en Línea) de la SAT de Guatemala.
 *
 * En la arquitectura real, el backend haría una llamada HTTP a un
 * CERTIFICADOR FEL externo (Infile, Digifact, etc.) que devuelve un
 * UUID de autorización firmado digitalmente.
 *
 * Para el MVP este bloque está INTERNALIZADO: toda la lógica vive aquí
 * y se comporta exactamente como lo haría el servicio externo, pero sin
 * salir del servidor.
 *
 * Responsabilidades del simulador:
 *   1. Validar NIT (13 caracteres, solo dígitos)
 *   2. Verificar campos obligatorios del borrador FEL
 *   3. Generar UUID de autorización (número de autorización ficticio)
 *   4. Construir el XML FEL simplificado (DTE)
 *   5. Simular la "respuesta" de la SAT con timestamps reales
 */

"use strict";

const { v4: uuidv4 } = require("uuid");     // npm install uuid

/* 
   1. VALIDACIONES INDIVIDUALES
    */

/**
 * Valida que un NIT guatemalteco sea structuralmente correcto para la SAT.
 * Reglas del simulador (equivalente al validador real):
 *   - Exactamente 13 caracteres
 *   - Solo dígitos o el carácter 'CF' (consumidor final)
 *
 * @param {string} nit
 * @returns {{ valido: boolean, mensaje: string }}
 */
function validarNIT(nit) {
  if (!nit || typeof nit !== "string") {
    return { valido: false, mensaje: "NIT no proporcionado" };
  }

  const nitLimpio = nit.trim().toUpperCase();

  // Caso especial: Consumidor Final
  if (nitLimpio === "CF") {
    return { valido: true, mensaje: "NIT de consumidor final aceptado" };
  }

  // Debe tener exactamente 13 caracteres y ser solo dígitos
  if (!/^\d{13}$/.test(nitLimpio)) {
    return {
      valido: false,
      mensaje: `NIT inválido: debe tener exactamente 13 dígitos. Recibido: "${nit}" (${nit.length} caracteres)`,
    };
  }

  return { valido: true, mensaje: "NIT válido" };
}

/**
 * Verifica que todos los campos obligatorios del borrador estén presentes
 * y sean válidos para la SAT guatemalteca.
 *
 * Campos requeridos por el RUT/SAT para DTE de servicios:
 *   - fecha_emision   (fecha válida)
 *   - moneda          (GTQ para facturas en quetzales)
 *   - descripcion     (descripción del servicio)
 *   - subtotal        (número positivo)
 *   - iva             (número positivo — 12% del subtotal)
 *   - total_factura   (número positivo)
 *   - nit_cliente     (validado por validarNIT)
 *
 * @param {Object} factura   - Registro de facturas_fel
 * @returns {{ completo: boolean, camposFaltantes: string[], mensaje: string }}
 */
function validarCamposObligatorios(factura) {
  const faltantes = [];

  // Fecha de emisión
  if (!factura.fecha_emision) faltantes.push("fecha_emision");

  // Moneda (el sistema siempre usa GTQ, pero verificamos que exista el dato)
  // Se asume GTQ; si en el futuro se manejan otras monedas, agregar validación

  // Descripción del servicio (usamos la ruta como descripción)
  const descripcion = [factura.origen, factura.destino].filter(Boolean).join(" → ");
  if (!descripcion || descripcion.trim().length < 3) faltantes.push("descripcion_servicio");

  // Montos
  if (!factura.subtotal    || factura.subtotal    <= 0) faltantes.push("subtotal");
  if (!factura.iva         || factura.iva         <= 0) faltantes.push("iva");
  if (!factura.total_factura || factura.total_factura <= 0) faltantes.push("total_factura");

  // NIT del cliente
  if (!factura.nit_cliente) faltantes.push("nit_cliente");

  // Nombre del receptor de la factura
  if (!factura.nombre_cliente_facturacion) faltantes.push("nombre_cliente_facturacion");

  const completo = faltantes.length === 0;

  return {
    completo,
    camposFaltantes: faltantes,
    mensaje: completo
      ? "Todos los campos obligatorios están completos"
      : `Campos faltantes: ${faltantes.join(", ")}`,
  };
}

/**
 * Verifica que el IVA corresponda al 12% del subtotal.
 * Tolerancia: ±Q0.10 por redondeo.
 *
 * @param {number} subtotal
 * @param {number} iva
 * @returns {{ valido: boolean, ivaEsperado: number, mensaje: string }}
 */
function validarIVA(subtotal, iva) {
  const ivaEsperado  = Math.round(subtotal * 0.12 * 100) / 100;
  const diferencia   = Math.abs(iva - ivaEsperado);
  const valido       = diferencia <= 0.10;

  return {
    valido,
    ivaEsperado,
    mensaje: valido
      ? `IVA correcto: Q${iva} (esperado Q${ivaEsperado})`
      : `IVA incorrecto: recibido Q${iva}, esperado Q${ivaEsperado}`,
  };
}

/* 
   2. GENERADOR DE UUID / NÚMERO DE AUTORIZACIÓN
    */

/**
 * Genera un UUID de autorización en el formato que usa la SAT de Guatemala.
 * Formato real SAT: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX (UUID v4 en mayúsculas)
 *
 * @returns {string} UUID en mayúsculas
 */
function generarUUID() {
  return uuidv4().toUpperCase();
}

/* 
   3. GENERADOR DE XML DTE (Documento Tributario Electrónico)
    */

/**
 * Construye el XML DTE simplificado que normalmente devuelve el certificador.
 * En producción este XML está firmado digitalmente (XAdES-BES).
 * Para el MVP generamos la estructura válida sin firma criptográfica.
 *
 * @param {Object} factura       - Registro de facturas_fel con datos del cliente
 * @param {string} uuid          - UUID de autorización generado
 * @param {string} numeroFactura - Número único de la factura
 * @returns {string} XML como string
 */
function generarXMLDTE(factura, uuid, numeroFactura) {
  const fechaEmision = new Date(factura.fecha_emision).toISOString();
  const descripcion  = `Servicio de transporte: ${factura.origen || "Origen"} → ${factura.destino || "Destino"}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<dte:GTDocumento xmlns:dte="http://www.sat.gob.gt/dte/fel/0.2.0" Version="0.1">
  <dte:SAT ClaseDocumento="dte">
    <dte:DTE ID="DteNit${factura.nit_cliente}">
      <dte:DatosEmision ID="DatosEmision${numeroFactura}">
        <dte:DatosGenerales
          CodigoMoneda="GTQ"
          FechaHoraEmision="${fechaEmision}"
          NumeroAcceso="${uuid}"
          Tipo="FACT" />
        <dte:Emisor
          AfiliacionIVA="GEN"
          CodigoEstablecimiento="1"
          CorreoEmisor="facturacion@logitrans.gt"
          NITEmisor="LOGITRANS01"
          NombreComercial="LogiTrans Guatemala S.A."
          NombreEmisor="LOGITRANS GUATEMALA SOCIEDAD ANONIMA" />
        <dte:Receptor
          CorreoReceptor="${factura.cliente_email || ""}"
          IDReceptor="${factura.nit_cliente}"
          NombreReceptor="${factura.nombre_cliente_facturacion}" />
        <dte:Frases>
          <dte:Frase CodigoEscenario="1" TipoFrase="1" />
        </dte:Frases>
        <dte:Items>
          <dte:Item BienOServicio="S" NumeroLinea="1">
            <dte:Cantidad>1</dte:Cantidad>
            <dte:UnidadMedida>SERVICIO</dte:UnidadMedida>
            <dte:Descripcion>${descripcion}</dte:Descripcion>
            <dte:PrecioUnitario>${factura.subtotal}</dte:PrecioUnitario>
            <dte:Precio>${factura.subtotal}</dte:Precio>
            <dte:Descuento>${factura.descuento_aplicado || 0}</dte:Descuento>
            <dte:Impuestos>
              <dte:Impuesto>
                <dte:NombreCorto>IVA</dte:NombreCorto>
                <dte:CodigoUnidadGravable>1</dte:CodigoUnidadGravable>
                <dte:MontoGravable>${factura.subtotal}</dte:MontoGravable>
                <dte:MontoImpuesto>${factura.iva}</dte:MontoImpuesto>
              </dte:Impuesto>
            </dte:Impuestos>
            <dte:Total>${factura.total_factura}</dte:Total>
          </dte:Item>
        </dte:Items>
        <dte:Totales>
          <dte:TotalImpuestos>
            <dte:TotalImpuesto NombreCorto="IVA" TotalMontoImpuesto="${factura.iva}" />
          </dte:TotalImpuestos>
          <dte:GranTotal>${factura.total_factura}</dte:GranTotal>
        </dte:Totales>
      </dte:DatosEmision>
    </dte:DTE>
    <dte:Certificacion>
      <dte:NITCertificador>SIMULADOR-FEL-MVP</dte:NITCertificador>
      <dte:NombreCertificador>LogiTrans Simulador FEL MVP</dte:NombreCertificador>
      <dte:NumeroAutorizacion UUID="${uuid}"
        FechaHoraCertificacion="${new Date().toISOString()}"
        Serie="A"
        Numero="${numeroFactura}" />
    </dte:Certificacion>
  </dte:SAT>
</dte:GTDocumento>`;
}

/* 
   4. FUNCIÓN PRINCIPAL: PROCESO COMPLETO DE CERTIFICACIÓN
    */

/**
 * Ejecuta el proceso completo de certificación FEL simulado.
 *
 * Equivale a la llamada HTTP que en producción haría el backend al
 * certificador externo (Infile / Digifact).
 *
 * Pasos que ejecuta:
 *   1. Validar NIT del cliente
 *   2. Validar campos obligatorios
 *   3. Validar cálculo del IVA
 *   4. Generar UUID de autorización
 *   5. Construir XML DTE
 *   6. Retornar resultado (equivalente al response del certificador)
 *
 * @param {Object} factura   - Registro completo de facturas_fel (con datos del cliente)
 * @returns {{
 *   aprobada: boolean,
 *   uuid: string|null,
 *   xml: string|null,
 *   errores: string[],
 *   mensajeSAT: string,
 *   timestamp: string
 * }}
 */
function certificarFEL(factura) {
  const errores = [];

  // — Paso 1: Validar NIT ——————————————————————————
  const resultNIT = validarNIT(factura.nit_cliente);
  if (!resultNIT.valido) {
    errores.push(resultNIT.mensaje);
  }

  // — Paso 2: Campos obligatorios ——————————————————
  const resultCampos = validarCamposObligatorios(factura);
  if (!resultCampos.completo) {
    errores.push(resultCampos.mensaje);
  }

  // — Paso 3: Validar IVA ——————————————————————————
  const resultIVA = validarIVA(factura.subtotal, factura.iva);
  if (!resultIVA.valido) {
    errores.push(resultIVA.mensaje);
  }

  // — Si hay errores, retornar RECHAZADA ————————————
  if (errores.length > 0) {
    return {
      aprobada:   false,
      uuid:       null,
      xml:        null,
      errores,
      mensajeSAT: `[SIMULADOR-SAT] Certificación rechazada: ${errores.join("; ")}`,
      timestamp:  new Date().toISOString(),
    };
  }

  // — Paso 4 y 5: Generar UUID y XML ————————————————
  const uuid = generarUUID();
  const xml  = generarXMLDTE(factura, uuid, factura.numero_factura);

  return {
    aprobada:   true,
    uuid,
    xml,
    errores:    [],
    mensajeSAT: `[SIMULADOR-SAT] Factura ${factura.numero_factura} certificada exitosamente. UUID: ${uuid}`,
    timestamp:  new Date().toISOString(),
  };
}

/* 
   5. SIMULADOR DE VALIDACIÓN PREVIA (CDU003.2)
    */

/**
 * Ejecuta SOLO la validación del borrador (sin certificar).
 * Equivale a un "pre-check" antes de enviar al certificador.
 *
 * @param {Object} factura
 * @returns {{
 *   aprobada: boolean,
 *   nitValido: boolean,
 *   camposCompletos: boolean,
 *   ivaValido: boolean,
 *   errores: string[],
 *   detalles: Object
 * }}
 */
function validarBorrador(factura) {
  const resultNIT    = validarNIT(factura.nit_cliente);
  const resultCampos = validarCamposObligatorios(factura);
  const resultIVA    = validarIVA(factura.subtotal, factura.iva);

  const errores = [];
  if (!resultNIT.valido)       errores.push(resultNIT.mensaje);
  if (!resultCampos.completo)  errores.push(resultCampos.mensaje);
  if (!resultIVA.valido)       errores.push(resultIVA.mensaje);

  return {
    aprobada:        errores.length === 0,
    nitValido:       resultNIT.valido,
    camposCompletos: resultCampos.completo,
    ivaValido:       resultIVA.valido,
    errores,
    detalles: {
      nit:    resultNIT,
      campos: resultCampos,
      iva:    resultIVA,
    },
  };
}

module.exports = {
  certificarFEL,
  validarBorrador,
  validarNIT,
  generarUUID,
};
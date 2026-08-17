# Módulo de Facturación Electrónica — LogiTrans Guatemala S.A.
## Guía completa de arquitectura, flujo y endpoints

---

## 1. Dónde va cada archivo en tu proyecto

```
FASE 2/backend/src/
│
├── models/
│   └── facturacion/
│       └── FacturaFEL.js               <- Todas las queries SQL del módulo
│
├── services/
│   └── facturacion/
│       ├── facturacion.service.js      <- Lógica de negocio principal
│       └── felSimulador.service.js     <- Simulador del certificador FEL/SAT
│
├── controllers/
│   └── facturacion/
│       └── facturacionController.js    <- Capa HTTP (thin controller)
│
└── routes/
    └── facturacion/
        └── facturacionRoutes.js        <- Definición de endpoints + docs inline
```

### Registro en el router principal

En tu `src/routes/index_routes.js` agrega:

```javascript
const facturacionRoutes = require('./facturacion/facturacionRoutes');
router.use('/facturacion', facturacionRoutes);
```

### Dependencia extra requerida

```bash
npm install uuid
```

El módulo `uuid` es necesario para generar el UUID de autorización SAT.
`nodemailer` ya estaba instalado (lo usa el mailer existente).

---

## 2. Tablas de la BD que usa este módulo

| Tabla | Para qué |
|---|---|
| `facturas_fel` | Documento principal de la factura en todos sus estados |
| `validacion_fel` | Registro del proceso de validación SAT simulada |
| `cuentas_por_cobrar` | Deuda del cliente generada tras certificar |
| `pagos_factura` | Pagos bancarios registrados contra una factura |
| `movimientos_credito_contrato` | Auditoría del límite de crédito (CARGOs y ABONOs) |
| `ordenes` | Datos del servicio para calcular el borrador |
| `contratos` | Tarifas, plazos de pago, límite de crédito |
| `contrato_tarifas` | Tarifa Q/km negociada para el tipo de unidad |
| `descuentos_contrato` | Porcentaje de descuento especial pactado |
| `rutas_autorizadas` | `distancia_km` para el cálculo de la factura |
| `usuarios` | NIT, nombre, email del cliente |
| `vehiculos` + `tarifario` | Tipo de unidad para saber qué tarifa aplicar |

---

## 3. Flujo completo (pasos 6 -> 8 del camino feliz)

```
PASO 6  Orden marcada "ENTREGADA" (otro módulo)
           │
           ▼
POST /api/facturacion/borrador/:orden_id
           │
           │  El sistema calcula:
           │    bruto     = distancia_km × tarifa_km_negociada
           │    descuento = bruto × (porcentaje_descuento / 100)
           │    subtotal  = bruto - descuento
           │    iva       = subtotal × 0.12
           │    total     = subtotal + iva
           │
           ▼
    [BORRADOR creado en BD]
           │
           │  Agente financiero revisa el borrador
           ▼
POST /api/facturacion/:id/validar
           │
           │  Simulador SAT verifica:
           │    ✔ NIT tiene exactamente 13 dígitos
           │    ✔ Campos obligatorios completos (fecha, moneda, servicio, IVA)
           │    ✔ IVA = subtotal × 0.12  (tolerancia ±Q0.10)
           │
           ▼
    [Estado -> VALIDADA]
           │
           │  Agente financiero certifica
           ▼
POST /api/facturacion/:id/certificar
           │
           │  El simulador FEL genera:
           │    -> UUID de autorización (formato SAT real)
           │    -> XML DTE (estructura oficial simplificada)
           │
           │  El sistema hace automáticamente:
           │    -> Crea Cuenta por Cobrar (fecha_vencimiento = hoy + plazo_pago)
           │    -> CARGO al contrato: saldo_usado += total_factura
           │    -> Registra movimiento CARGO en movimientos_credito_contrato
           │    -> Envía correo al cliente con los datos de la factura
           │
           ▼
    [Estado -> CERTIFICADA]
    [CXC creada -> estado PENDIENTE]
    [Crédito del cliente CARGADO]
           │
           │  Cliente paga -> Agente registra
           ▼
POST /api/facturacion/:id/pagos
           │
           │  El sistema hace automáticamente:
           │    -> Registra el pago en pagos_factura
           │    -> Reduce saldo_pendiente en cuentas_por_cobrar
           │    -> Si saldo = 0 -> estado CXC = PAGADA
           │    -> ABONO al contrato: saldo_usado -= monto_pagado
           │    -> Registra movimiento ABONO
           │    -> Envía correo de confirmación al cliente
           │
           ▼
    [Crédito del cliente LIBERADO]
    [CXC -> PAGADA]
```

---

## 4. El simulador FEL explicado

### ¿Por qué está internalizado?

En la arquitectura de despliegue del proyecto se mencionan "sistemas externos":
- Certificador FEL/SAT (Infile, Digifact, etc.)
- Sistema aduanal
- Pasarela bancaria

Como el MVP usa un solo backend, estos tres sistemas están **simulados dentro
del mismo servidor**. La simulación está diseñada para que en producción solo
necesites cambiar el archivo `felSimulador.service.js` por una llamada HTTP real
al certificador, sin tocar nada más.

### Lo que hace el simulador (en `felSimulador.service.js`)

```
certificarFEL(factura)
     │
     ├── validarNIT(nit)
     │     └── exactamente 13 dígitos numéricos (o "CF" para consumidor final)
     │
     ├── validarCamposObligatorios(factura)
     │     └── fecha_emision, servicio, subtotal, iva, total, nit, nombre
     │
     ├── validarIVA(subtotal, iva)
     │     └── iva debe ser subtotal × 0.12 (tolerancia ±Q0.10)
     │
     ├── Si hay errores -> retorna { aprobada: false, errores: [...] }
     │
     └── Si todo OK:
           -> uuid = uuidv4().toUpperCase()     (formato real de la SAT)
           -> xml  = generarXMLDTE(...)         (estructura DTE real simplificada)
           -> retorna { aprobada: true, uuid, xml }
```

### Migración a producción (cuando haya presupuesto)

Reemplaza `felSimulador.service.js` por algo así:

```javascript
// felSimulador.service.js  — versión producción
const axios = require('axios');

async function certificarFEL(factura) {
  const response = await axios.post(
    process.env.FEL_CERTIFICADOR_URL,   // https://api.infile.com.gt/...
    { dte: buildDTE(factura) },
    { headers: { Authorization: `Bearer ${process.env.FEL_API_KEY}` } }
  );
  return {
    aprobada: true,
    uuid:     response.data.uuid,
    xml:      response.data.xml,
  };
}
```

El resto del código (servicio, controlador, rutas) no cambia.

---

## 5. Endpoints completos

### Resumen rápido

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| `POST` | `/api/facturacion/borrador/:orden_id` | AGENTE_FINANCIERO | Genera borrador (paso 6) |
| `POST` | `/api/facturacion/:id/validar` | AGENTE_FINANCIERO | Valida ante SAT simulada |
| `POST` | `/api/facturacion/:id/certificar` | AGENTE_FINANCIERO | Certifica FEL (paso 7) |
| `POST` | `/api/facturacion/:id/pagos` | AGENTE_FINANCIERO | Registra pago (paso 8) |
| `GET`  | `/api/facturacion` | AF \| AC | Lista facturas (con filtros) |
| `GET`  | `/api/facturacion/cobros` | AF \| AC | Cuentas por cobrar |
| `GET`  | `/api/facturacion/orden/:orden_id` | AF \| AC | Factura de una orden |
| `GET`  | `/api/facturacion/:id` | AF \| AC | Detalle completo |
| `GET`  | `/api/facturacion/:id/pagos` | AF \| AC | Pagos de una factura |

**AF** = AGENTE_FINANCIERO | **AC** = AREA_CONTABLE

---

### Ejemplo completo del ciclo en Postman / curl

#### Paso 1: Generar borrador (la orden 42 ya fue entregada)
```http
POST /api/facturacion/borrador/42
Authorization: Bearer <JWT del agente financiero>
```

**Respuesta 201:**
```json
{
  "ok": true,
  "mensaje": "Borrador de factura generado exitosamente.",
  "data": {
    "borrador": {
      "id": 7,
      "numero_factura": "F-20260324-45821",
      "estado": "BORRADOR",
      "distancia_km": 350,
      "tarifa_aplicada": 8.00,
      "descuento_aplicado": 280.00,
      "subtotal": 2520.00,
      "iva": 302.40,
      "total_factura": 2822.40,
      "nit_cliente": "1234567890123",
      "nombre_cliente_facturacion": "Distribuidora Norte S.A."
    },
    "calculoDetallado": {
      "distancia_km": 350,
      "tarifa_aplicada": 8.00,
      "tipo_unidad": "LIGERA",
      "bruto": 2800.00,
      "porcentaje_descuento": 10,
      "descuento_aplicado": 280.00,
      "subtotal": 2520.00,
      "iva_porcentaje": 12,
      "iva": 302.40,
      "total_factura": 2822.40
    },
    "yaExistia": false
  }
}
```

---

#### Paso 2: Validar borrador
```http
POST /api/facturacion/7/validar
Authorization: Bearer <JWT>
```

**Respuesta 200 (aprobada):**
```json
{
  "ok": true,
  "mensaje": "Factura validada correctamente. Lista para certificación FEL.",
  "data": {
    "resultado": {
      "aprobada": true,
      "nitValido": true,
      "camposCompletos": true,
      "ivaValido": true,
      "errores": []
    },
    "factura": { "id": 7, "estado": "VALIDADA", "..." : "..." },
    "validacion": { "resultado_validacion": "APROBADA", "uuid_generado": null }
  }
}
```

**Respuesta 422 (rechazada por NIT inválido):**
```json
{
  "ok": false,
  "mensaje": "Validación rechazada. Corrija los errores indicados antes de reintentar.",
  "data": {
    "resultado": {
      "aprobada": false,
      "nitValido": false,
      "errores": ["NIT inválido: debe tener exactamente 13 dígitos. Recibido: \"123\" (3 caracteres)"]
    }
  }
}
```

---

#### Paso 3: Certificar FEL
```http
POST /api/facturacion/7/certificar
Authorization: Bearer <JWT>
```

**Respuesta 200:**
```json
{
  "ok": true,
  "mensaje": "Factura certificada exitosamente. UUID SAT: A3F7B2C1-...",
  "data": {
    "factura": {
      "id": 7,
      "estado": "CERTIFICADA",
      "uuid_autorizacion": "A3F7B2C1-8D4E-4F5A-9B6C-1234567890AB",
      "fecha_certificacion": "2026-03-24T14:35:00"
    },
    "cuentaPorCobrar": {
      "id": 3,
      "monto_original": 2822.40,
      "saldo_pendiente": 2822.40,
      "fecha_vencimiento": "2026-04-23",
      "estado_cobro": "PENDIENTE"
    },
    "movimiento": {
      "tipo_movimiento": "CARGO",
      "monto_movimiento": 2822.40,
      "saldo_anterior": 15000.00,
      "saldo_nuevo": 17822.40
    },
    "uuid": "A3F7B2C1-8D4E-4F5A-9B6C-1234567890AB",
    "mensajeSAT": "[SIMULADOR-SAT] Factura F-20260324-45821 certificada exitosamente."
  }
}
```

---

#### Paso 4: Registrar pago
```http
POST /api/facturacion/7/pagos
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "cuenta_por_cobrar_id": 3,
  "forma_pago": "TRANSFERENCIA",
  "monto_pagado": 2822.40,
  "fecha_hora_pago": "2026-03-24T16:00:00",
  "banco_origen": "Banco Industrial",
  "cuenta_origen": "012-345678-9",
  "numero_autorizacion_bancaria": "BI-2026-00789456",
  "observacion": "Pago total de la factura"
}
```

**Respuesta 201:**
```json
{
  "ok": true,
  "mensaje": "Pago de Q2822.40 registrado. Crédito liberado: Q2822.40",
  "data": {
    "pago": {
      "id": 5,
      "forma_pago": "TRANSFERENCIA",
      "monto_pagado": 2822.40,
      "banco_origen": "Banco Industrial",
      "numero_autorizacion_bancaria": "BI-2026-00789456"
    },
    "cuentaActualizada": {
      "saldo_pendiente": 0.00,
      "estado_cobro": "PAGADA"
    },
    "movimiento": {
      "tipo_movimiento": "ABONO",
      "monto_movimiento": 2822.40,
      "saldo_anterior": 17822.40,
      "saldo_nuevo": 15000.00
    },
    "creditoLiberado": 2822.40,
    "saldoContratoAnterior": 17822.40,
    "saldoContratoNuevo": 15000.00
  }
}
```

---

## 6. Separación de responsabilidades (MVC)

```
facturacionRoutes.js         -> Solo routing. Verifica auth y roles.
      │
      ▼
facturacionController.js     -> Solo HTTP. Lee params/body, llama al servicio,
      │                         formatea la respuesta.
      ▼
facturacion.service.js       -> Lógica de negocio. Orquesta múltiples modelos.
      │                         Calcula montos. Llama al simulador.
      │                         Envía correos. NO sabe nada de Express.
      ├── FacturaFEL.js       -> SQL de facturas, CXC, pagos, movimientos.
      ├── Contrato.js         -> SQL de contratos (modelo existente).
      ├── felSimulador.js     -> Simulador SAT. Valida NIT, genera UUID/XML.
      └── mailer.js           -> Envío de correos (utilidad existente).
```

---

## 7. Integración con el módulo de órdenes

Cuando el módulo de órdenes cambia una orden a `ENTREGADA`, puede llamar
automáticamente al servicio de facturación para generar el borrador:

```javascript
// En el controlador/servicio de órdenes, al marcar como ENTREGADA:
const facturacionService = require('../facturacion/facturacion.service');

// Después de actualizar el estado de la orden:
try {
  await facturacionService.generarBorrador(orden_id, usuario_id);
  console.log(`[ordenes] Borrador generado automáticamente para orden ${orden_id}`);
} catch (error) {
  // No bloquea el cambio de estado de la orden
  console.error(`[ordenes] Error generando borrador (FA2 CDU003.1):`, error.message);
  // El agente financiero puede generarlo manualmente con POST /borrador/:orden_id
}
```

---

## 8. Reglas de negocio clave implementadas

| Regla | Dónde se aplica |
|---|---|
| Solo facturas ENTREGADAS generan borrador | `facturacion.service.js -> generarBorrador()` |
| NIT de 13 dígitos exactos | `felSimulador.service.js -> validarNIT()` |
| IVA = 12% del subtotal (tolerancia ±Q0.10) | `felSimulador.service.js -> validarIVA()` |
| Solo BORRADOR puede validarse | `facturacion.service.js -> validarFactura()` |
| Solo VALIDADA puede certificarse | `facturacion.service.js -> certificarFactura()` |
| Solo CERTIFICADA puede recibir pagos | `facturacion.service.js -> registrarPago()` |
| El pago no puede superar el saldo pendiente | `facturacion.service.js -> registrarPago()` |
| Certificación crea CXC automáticamente | `facturacion.service.js -> certificarFactura()` |
| Certificación carga el saldo del contrato | `facturacion.service.js -> certificarFactura()` |
| Pago libera el crédito del contrato | `facturacion.service.js -> registrarPago()` |
| Borrador idempotente (no duplica) | `facturacion.service.js -> generarBorrador()` |
| Correo no bloquea la operación principal | try/catch silencioso en el servicio |
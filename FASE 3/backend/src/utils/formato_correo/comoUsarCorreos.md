# Guía de Uso — Sistema de Notificaciones por Correo

### LogiTrans Guatemala, S.A. — Fase 2 MVP

---

## 1. Estructura de archivos

```
backend/
└── src/
    └── utils/
        ├── mailer.js                    <- Punto de entrada. Importar SOLO este archivo.
        └── formato_correo/
            ├── correcto.js              <- Plantilla verde  (éxito)
            ├── incorrecto.js            <- Plantilla roja   (error)
            └── informativo.js           <- Plantilla azul   (informativo)
```

---

## 2. Prerrequisitos

### 2.1 Dependencia

```bash
npm install nodemailer
```

### 2.2 Variables de entorno (`.env`)

```properties
EMAIL_USER=correo@gmail.com
EMAIL_PASS="la contrasenia"
EMAIL_FROM="LogiTrans Guatemala, S.A."
NODE_ENV=development
```

---

## 3. API — Las tres funciones

### `notificarCorrecto(to, destinatario, aviso, opciones?)`

Correo verde. Úsalo cuando **una operación se completó con éxito**.

| Parámetro          | Tipo     | Requerido | Descripción                                            |
| ------------------ | -------- | --------- | ------------------------------------------------------ |
| `to`               | `string` | si        | Correo destino                                         |
| `destinatario`     | `string` | si        | Nombre del receptor (para el saludo)                   |
| `aviso`            | `string` | si        | Mensaje principal                                      |
| `opciones.titulo`  | `string` | no        | Título del encabezado (default: `"Operación Exitosa"`) |
| `opciones.detalle` | `string` | no        | Párrafo secundario debajo del aviso                    |
| `opciones.icono`   | `string` | no        |                                                        |

---

### `notificarIncorrecto(to, destinatario, aviso, opciones?)`

Correo rojo. Úsalo cuando **algo falló o requiere atención urgente**.

| Parámetro          | Tipo     | Requerido | Descripción                                          |
| ------------------ | -------- | --------- | ---------------------------------------------------- |
| `to`               | `string` | si        | Correo destino                                       |
| `destinatario`     | `string` | si        | Nombre del receptor                                  |
| `aviso`            | `string` | si        | Descripción del problema                             |
| `opciones.titulo`  | `string` | no        | Título (default: `"Algo salió mal"`)                 |
| `opciones.detalle` | `string` | no        | Pasos sugeridos para resolver el error               |
| `opciones.icono`   | `string` | no        | Emoji (default: `" :( "`)                            |
| `opciones.codigo`  | `string` | no        | Código de referencia del error (ej. `"ERR-FEL-001"`) |

---

### `notificarInformativo(to, destinatario, aviso, opciones?)`

Correo azul. Úsalo para **actualizaciones de estado, cambios de datos o avisos**.

| Parámetro          | Tipo                       | Requerido | Descripción                             |
| ------------------ | -------------------------- | --------- | --------------------------------------- |
| `to`               | `string`                   | si        | Correo destino                          |
| `destinatario`     | `string`                   | si        | Nombre del receptor                     |
| `aviso`            | `string`                   | si        | Mensaje informativo                     |
| `opciones.titulo`  | `string`                   | no        | Título (default: `"Aviso Informativo"`) |
| `opciones.detalle` | `string`                   | no        | Contexto adicional                      |
| `opciones.icono`   | `string`                   | no        | Emoji (default: `" ._. "`)              |
| `opciones.datos`   | `Array<{etiqueta, valor}>` | no        | Tabla de datos clave-valor              |

---

## 4. Ejemplos de uso en el proyecto

```js
const {
  notificarCorrecto,
  notificarIncorrecto,
  notificarInformativo,
} = require("../utils/mailer");
```

### Orden entregada exitosamente

```js
await notificarCorrecto(
  "cliente@empresa.gt",
  "Comercial El Éxito",
  "Su orden #ORD-2024-00123 ha sido entregada correctamente en Ciudad de Guatemala.",
  {
    titulo: "Entrega Confirmada",
    detalle: "Puede consultar la evidencia de entrega en el portal LogiTrans.",
  },
);
```

### Factura FEL generada

```js
await notificarCorrecto(
  "finanzas@cliente.gt",
  "Ana García",
  "La Factura Electrónica #F-0089 ha sido certificada ante la SAT exitosamente.",
  {
    titulo: "Factura FEL Certificada",
    detalle:
      "El número de autorización es: UUID-XXXXXXXX-XXXX. Guárdelo para sus registros.",
  },
);
```

### Error en peso de carga

```js
await notificarIncorrecto(
  "operaciones@logitrans.gt",
  "Equipo de Patio",
  "La carga registrada (4.2 Ton) excede la capacidad máxima de la Unidad Ligera asignada (3.5 Ton).",
  {
    titulo: "Validación de Peso Fallida",
    icono: "⚖️",
    codigo: "ERR-PESO-001",
    detalle:
      "Asigne una unidad de mayor capacidad o reduzca el peso de la carga antes de despachar.",
  },
);
```

### Cliente bloqueado por crédito vencido

```js
await notificarIncorrecto(
  "ventas@logitrans.gt",
  "Equipo Comercial",
  "No se puede generar la orden de servicio. El cliente 'Importadora XYZ' tiene facturas vencidas por Q18,500.00.",
  {
    titulo: "Generación de Orden Bloqueada",
    codigo: "ERR-CRED-VENCIDO",
    detalle:
      "Coordine con el área de cobros para regularizar la cuenta antes de continuar.",
  },
);
```

### Cambio de estado de orden

```js
await notificarInformativo(
  "cliente@empresa.gt",
  "Comercial El Éxito",
  "Su orden de servicio ha cambiado de estado.",
  {
    titulo: "Actualización de Orden",
    datos: [
      { etiqueta: "Número de Orden", valor: "ORD-2024-00123" },
      { etiqueta: "Estado Anterior", valor: "Listo para Despacho" },
      { etiqueta: "Estado Actual", valor: "En Tránsito" },
      { etiqueta: "Ruta", valor: "Puerto Barrios → Ciudad de Guatemala" },
      { etiqueta: "Piloto", valor: "Mario Pérez" },
    ],
  },
);
```

### Notificación de factura al cliente (punto 12 del MVP)

```js
await notificarInformativo(
  "cliente@empresa.gt",
  "Comercial El Éxito",
  "Se ha generado y certificado su factura electrónica correspondiente a la orden finalizada.",
  {
    titulo: "Factura Electrónica Disponible",
    datos: [
      { etiqueta: "N° Factura", valor: "F-0089" },
      { etiqueta: "N° Autorización", valor: "UUID-XXXXXXXX-XXXX" },
      { etiqueta: "Orden asociada", valor: "ORD-2024-00123" },
      { etiqueta: "Subtotal", valor: "Q 2,450.00" },
      { etiqueta: "IVA (12%)", valor: "Q   294.00" },
      { etiqueta: "Total", valor: "Q 2,744.00" },
      { etiqueta: "Plazo de pago", valor: "30 días (15 Ene 2025)" },
    ],
  },
);
```

---

## 5. Manejo de errores

Siempre envuelve las llamadas en `try/catch`:

```js
try {
  await notificarCorrecto(correo, nombre, mensaje, opciones);
} catch (error) {
  // El envío del correo NO debe detener la operación principal
  console.error("[mailer] Error al enviar notificación:", error.message);
}
```

---

## 7. Dependencias del proyecto

```json
{
  "dependencies": {
    "nodemailer": "^6.9.x",
    "dotenv": "^16.x.x"
  }
}
```

Asegúrate de que `dotenv` se cargue **antes** de cualquier `require` de `mailer.js`:

```js
// En tu archivo de entrada (app.js / index.js / server.js)
require("dotenv").config(); // <- PRIMERO
const app = require("./app"); // <- DESPUÉS
```

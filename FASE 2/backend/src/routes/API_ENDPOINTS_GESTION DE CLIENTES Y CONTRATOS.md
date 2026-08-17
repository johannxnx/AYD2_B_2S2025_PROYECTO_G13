# Guía de Endpoints - Módulo Clientes y Contratos
## LogiTrans Guatemala, S.A.
---
## Tabla de Contenidos
1. [Autenticación](#autenticación)
2. [Contratos](#contratos)
3. [Tarifario](#tarifario)
4. [Usuarios](#usuarios)
5. [Manejo de Errores](#manejo-de-errores)
---
## Autenticación
Todos los endpoints requieren autenticación mediante JWT.
### Login
**Endpoint:** `POST /api/auth/login`
**Body (JSON):**
```json
{
  "email": "usuario@logitrans.gt",
  "password": "tu_contraseña"
}
```
**Respuesta (200):**
```json
{
  "ok": true,
  "mensaje": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "usuario@logitrans.gt",
      "role": "operativo"
    }
  }
}
```
### Enviar Token en cada Request
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
---
## Contratos
### 1. Crear Contrato
**Endpoint:** `POST /api/contratos`
**Autenticación:** Requerida (JWT)
**Body (JSON):**
```json
{
  "numero_contrato": "CONT-2026-001",
  "cliente_id": 1,
  "fecha_inicio": "2026-03-24",
  "fecha_fin": "2027-03-24",
  "limite_credito": 50000.00,
  "plazo_pago": 30,
  "tarifas": [
    {
      "tarifario_id": 1,
      "costo_km_negociado": 7.50
    },
    {
      "tarifario_id": 2,
      "costo_km_negociado": 12.00
    }
  ],
  "rutas": [
    {
      "origen": "Puerto Barrios",
      "destino": "Guatemala",
      "distancia_km": 320,
      "tipo_carga": "General"
    }
  ]
}
```
> **Nota:** `tarifario_id` hace referencia al ID del tarifario base.
> - 1 = LIGERA
> - 2 = PESADA
> - 3 = CABEZAL
**Respuesta (201):**
```json
{
  "ok": true,
  "mensaje": "Contrato creado correctamente",
  "data": {
    "id": 1,
    "numero_contrato": "CONT-2026-001",
    "cliente_id": 1,
    "fecha_inicio": "2026-03-24T00:00:00.000Z",
    "fecha_fin": "2027-03-24T00:00:00.000Z",
    "estado": "VIGENTE",
    "limite_credito": 50000,
    "saldo_usado": 0,
    "plazo_pago": 30,
    "creado_por": 3,
    "fecha_creacion": "2026-03-24T02:24:29.703Z",
    "modificado_por": null,
    "fecha_modificacion": null
  }
}
```
**Errores:**
- `404` - Cliente no encontrado
- `400` - Cliente no es CLIENTE_CORPORATIVO
- `400` - Cliente está BLOQUEADO o INACTIVO
- `400` - Plazo de pago inválido (debe ser 15, 30 o 45)
- `400` - Fecha fin debe ser mayor a fecha inicio
---
### 2. Validar Cliente (Endpoint principal)
**Endpoint:** `GET /api/contratos/validar/:cliente_id`
> **Esta ruta debe ir antes de** `GET /api/contratos/:id` en el router.
**Descripción:** Valida si un cliente puede crear una orden de servicio. Verifica estado del cliente, contrato vigente, límite de crédito, ruta autorizada y retorna la tarifa aplicable. Es el endpoint que consume el módulo de Órdenes.
**Autenticación:** Requerida (JWT)
**Parámetros de ruta:**
- `cliente_id` (number) - ID del cliente
**Parámetros de query (opcionales):**
- `origen` (string) - Ciudad de origen
- `destino` (string) - Ciudad de destino
- `tipo_unidad` (string) - LIGERA, PESADA o CABEZAL
**Ejemplo:**
```
GET /api/contratos/validar/1?origen=Puerto Barrios&destino=Guatemala&tipo_unidad=LIGERA
```
**Respuesta exitosa (200):**
```json
{
  "ok": true,
  "data": {
    "habilitado": true,
    "cliente": {
      "id": 1,
      "nombre": "Johan Cardona",
      "estado": "ACTIVO"
    },
    "contrato": {
      "id": 2,
      "numero_contrato": "CONT-2026-001",
      "limite_credito": 50000,
      "saldo_usado": 0,
      "saldo_disponible": 50000,
      "plazo_pago": 30
    },
    "tarifa": {
      "tipo_unidad": "LIGERA",
      "costo_km_negociado": 7.50,
      "limite_peso_ton": 3.5
    },
    "descuento": {
      "porcentaje_descuento": 5.00
    }
  }
}
```
**Respuesta fallida (200):**
```json
{
  "ok": true,
  "data": {
    "habilitado": false,
    "motivo": "Cliente bloqueado"
  }
}
```
**Posibles motivos de rechazo:**
- `"Cliente no encontrado"`
- `"Cliente bloqueado"`
- `"Cliente inactivo"`
- `"El contrato del cliente ha expirado o no tiene un contrato vigente"`
- `"Límite de crédito excedido. Cliente bloqueado automáticamente"`
- `"La ruta X → Y no está autorizada en el contrato"`
---
### 3. Listar Contratos por Cliente
**Endpoint:** `GET /api/contratos/cliente/:cliente_id`
> **Esta ruta debe ir antes de** `GET /api/contratos/:id` en el router.
**Autenticación:** Requerida (JWT)
**Respuesta (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": 2,
      "numero_contrato": "CONT-2026-001",
      "fecha_inicio": "2026-03-24T00:00:00.000Z",
      "fecha_fin": "2027-03-24T00:00:00.000Z",
      "estado": "VIGENTE",
      "limite_credito": 50000,
      "saldo_usado": 0,
      "plazo_pago": 30,
      "fecha_creacion": "2026-03-24T02:24:29.703Z"
    }
  ]
}
```
---
### 4. Obtener Contrato
**Endpoint:** `GET /api/contratos/:id`
**Autenticación:** Requerida (JWT)
**Respuesta (200):**
```json
{
  "ok": true,
  "data": {
    "id": 2,
    "numero_contrato": "CONT-2026-001",
    "cliente_id": 1,
    "fecha_inicio": "2026-03-24T00:00:00.000Z",
    "fecha_fin": "2027-03-24T00:00:00.000Z",
    "estado": "VIGENTE",
    "limite_credito": 50000,
    "saldo_usado": 0,
    "plazo_pago": 30,
    "cliente_nombre": "Johan Cardona",
    "cliente_nit": "123456",
    "creado_por_nombre": "Admin LogiTrans",
    "tarifas": [
      {
        "id": 1,
        "contrato_id": 2,
        "costo_km_negociado": 7.5,
        "tipo_unidad": "LIGERA",
        "limite_peso_ton": 3.5,
        "costo_base_km": 8
      }
    ],
    "rutas": [
      {
        "id": 1,
        "contrato_id": 2,
        "origen": "Puerto Barrios",
        "destino": "Guatemala",
        "distancia_km": 320,
        "tipo_carga": null,
        "activa": true
      }
    ],
    "descuentos": [
      {
        "id": 1,
        "contrato_id": 2,
        "tipo_unidad": "LIGERA",
        "porcentaje_descuento": 5,
        "observacion": "Descuento por volumen negociado",
        "autorizado_por_nombre": "Admin LogiTrans"
      }
    ]
  }
}
```
**Errores:**
- `404` - Contrato no encontrado
---
### 5. Modificar Contrato
**Endpoint:** `PUT /api/contratos/:id`
**Autenticación:** Requerida (JWT)
**Body (JSON):**
```json
{
  "fecha_inicio": "2026-03-24",
  "fecha_fin": "2027-06-24",
  "limite_credito": 75000.00,
  "plazo_pago": 45,
  "estado": "VIGENTE"
}
```
**Respuesta (200):**
```json
{
  "ok": true,
  "mensaje": "Contrato actualizado correctamente",
  "data": {
    "id": 2,
    "numero_contrato": "CONT-2026-001",
    "limite_credito": 75000,
    "plazo_pago": 45,
    "modificado_por": 3,
    "fecha_modificacion": "2026-03-24T03:00:00.000Z"
  }
}
```
**Errores:**
- `404` - Contrato no encontrado
- `400` - Solo se pueden modificar contratos VIGENTES
- `400` - Plazo de pago inválido (debe ser 15, 30 o 45)
---
### 6. Agregar Descuento
**Endpoint:** `POST /api/contratos/:id/descuentos`
**Autenticación:** Requerida (JWT)
**Body (JSON):**
```json
{
  "tipo_unidad": "LIGERA",
  "porcentaje_descuento": 5.00,
  "observacion": "Descuento por volumen negociado"
}
```
**Respuesta (201):**
```json
{
  "ok": true,
  "mensaje": "Descuento agregado correctamente",
  "data": {
    "id": 1,
    "contrato_id": 2,
    "tipo_unidad": "LIGERA",
    "porcentaje_descuento": 5,
    "autorizado_por": 3,
    "fecha_autorizacion": "2026-03-24T02:37:05.466Z",
    "observacion": "Descuento por volumen negociado"
  }
}
```
**Errores:**
- `404` - Contrato no encontrado
- `400` - Solo se pueden agregar descuentos a contratos VIGENTES
- `400` - tipo_unidad y porcentaje_descuento son obligatorios
---
### 7. Agregar Ruta
**Endpoint:** `POST /api/contratos/:id/rutas`
**Autenticación:** Requerida (JWT)
**Body (JSON):**
```json
{
  "origen": "Xela",
  "destino": "Puerto Barrios",
  "distancia_km": 450,
  "tipo_carga": "General"
}
```
**Respuesta (201):**
```json
{
  "ok": true,
  "mensaje": "Ruta autorizada agregada correctamente",
  "data": {
    "id": 3,
    "contrato_id": 2,
    "origen": "Xela",
    "destino": "Puerto Barrios",
    "distancia_km": 450,
    "tipo_carga": "General",
    "activa": true
  }
}
```
**Errores:**
- `404` - Contrato no encontrado
- `400` - Solo se pueden agregar rutas a contratos VIGENTES
- `400` - origen y destino son obligatorios
---
## Tarifario
### 1. Listar Tarifario
**Endpoint:** `GET /api/tarifario`
**Autenticación:** Requerida (JWT)
**Respuesta (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": 3,
      "tipo_unidad": "CABEZAL",
      "limite_peso_ton": 22,
      "costo_base_km": 18,
      "activo": true,
      "fecha_actualizacion": "2026-03-24T02:17:48.056Z",
      "actualizado_por_nombre": "Admin LogiTrans"
    },
    {
      "id": 1,
      "tipo_unidad": "LIGERA",
      "limite_peso_ton": 3.5,
      "costo_base_km": 8,
      "activo": true,
      "fecha_actualizacion": "2026-03-24T02:16:24.833Z",
      "actualizado_por_nombre": "Admin LogiTrans"
    },
    {
      "id": 2,
      "tipo_unidad": "PESADA",
      "limite_peso_ton": 12,
      "costo_base_km": 12.5,
      "activo": true,
      "fecha_actualizacion": "2026-03-24T02:17:17.920Z",
      "actualizado_por_nombre": "Admin LogiTrans"
    }
  ]
}
```
---
### 2. Obtener Rangos de Referencia
**Endpoint:** `GET /api/tarifario/referencia`
> **Esta ruta debe ir antes de** `GET /api/tarifario/:tipo_unidad` en el router.
**Autenticación:** Requerida (JWT)
**Respuesta (200):**
```json
{
  "ok": true,
  "data": {
    "LIGERA":  { "limite_peso_ton": 3.5,  "costo_base_km": 8.00  },
    "PESADA":  { "limite_peso_ton": 12.0, "costo_base_km": 12.50 },
    "CABEZAL": { "limite_peso_ton": 22.0, "costo_base_km": 18.00 }
  }
}
```
---
### 3. Obtener Tarifa por Tipo
**Endpoint:** `GET /api/tarifario/:tipo_unidad`
**Autenticación:** Requerida (JWT)
**Parámetros de ruta:**
- `tipo_unidad` (string) - LIGERA, PESADA o CABEZAL
**Respuesta (200):**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "tipo_unidad": "LIGERA",
    "limite_peso_ton": 3.5,
    "costo_base_km": 8,
    "activo": true
  }
}
```
**Errores:**
- `400` - Tipo de unidad inválido (debe ser LIGERA, PESADA o CABEZAL)
- `404` - Tarifa no encontrada
---
### 4. Actualizar Tarifa
**Endpoint:** `PUT /api/tarifario/:tipo_unidad`
> **Solo el Área Contable debe realizar esta acción.**
**Autenticación:** Requerida (JWT)
**Body (JSON):**
```json
{
  "limite_peso_ton": 3.5,
  "costo_base_km": 8.00
}
```
**Respuesta (200):**
```json
{
  "ok": true,
  "mensaje": "Tarifa de LIGERA actualizada correctamente",
  "data": {
    "id": 1,
    "tipo_unidad": "LIGERA",
    "limite_peso_ton": 3.5,
    "costo_base_km": 8,
    "activo": true,
    "actualizado_por": 3,
    "fecha_actualizacion": "2026-03-24T02:16:24.833Z"
  }
}
```
**Errores:**
- `400` - Tipo de unidad inválido (debe ser LIGERA, PESADA o CABEZAL)
- `400` - limite_peso_ton y costo_base_km son obligatorios
- `400` - Los valores deben ser mayores a 0
---
## Usuarios
### 1. Listar Usuarios
**Endpoint:** `GET /api/usuarios`
**Autenticación:** Requerida (JWT)
**Parámetros de query (opcionales):**
- `tipo_usuario` - CLIENTE_CORPORATIVO, AGENTE_OPERATIVO, AGENTE_LOGISTICO, AGENTE_FINANCIERO, ENCARGADO_PATIO, AREA_CONTABLE, GERENCIA, PILOTO
- `estado` - ACTIVO, INACTIVO, BLOQUEADO
- `nombre` - Búsqueda parcial por nombre
**Respuesta (200):**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "nit": "123456",
      "nombre": "Johan Cardona",
      "email": "jmcr3108@gmail.com",
      "telefono": "33422023",
      "tipo_usuario": "CLIENTE_CORPORATIVO",
      "estado": "ACTIVO",
      "fecha_registro": "2026-03-23T20:02:17.846Z"
    }
  ]
}
```
---
### 2. Obtener Usuario
**Endpoint:** `GET /api/usuarios/:id`
**Autenticación:** Requerida (JWT)
**Respuesta (200):**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "nit": "123456",
    "nombre": "Johan Cardona",
    "email": "jmcr3108@gmail.com",
    "tipo_usuario": "CLIENTE_CORPORATIVO",
    "estado": "ACTIVO",
    "riesgo": {
      "id": 1,
      "riesgo_capacidad_pago": "BAJO",
      "riesgo_lavado_dinero": "BAJO",
      "riesgo_aduanas": "MEDIO",
      "riesgo_mercancia": "BAJO",
      "evaluado_por": 3,
      "fecha_evaluacion": "2026-03-24T02:36:38.700Z"
    }
  }
}
```
**Errores:**
- `404` - Usuario no encontrado
---
### 3. Modificar Usuario
**Endpoint:** `PUT /api/usuarios/:id`
**Autenticación:** Requerida (JWT)
**Body (JSON):**
```json
{
  "nombre": "Johan Cardona Actualizado",
  "email": "nuevo@email.com",
  "telefono": "55551234"
}
```
**Respuesta (200):**
```json
{
  "ok": true,
  "mensaje": "Usuario actualizado correctamente",
  "data": {
    "id": 1,
    "nombre": "Johan Cardona Actualizado",
    "email": "nuevo@email.com",
    "telefono": "55551234"
  }
}
```
**Errores:**
- `404` - Usuario no encontrado
- `400` - No se puede modificar el NIT si tiene contratos u órdenes asociadas
---
### 4. Cambiar Estado de Usuario
**Endpoint:** `PATCH /api/usuarios/:id/estado`
**Autenticación:** Requerida (JWT)
**Body (JSON):**
```json
{
  "estado": "BLOQUEADO",
  "motivo": "Cliente con facturas vencidas"
}
```
**Estados válidos:** ACTIVO, INACTIVO, BLOQUEADO
**Respuesta (200):**
```json
{
  "ok": true,
  "mensaje": "Estado del usuario actualizado a BLOQUEADO",
  "data": {
    "id": 1,
    "nombre": "Johan Cardona",
    "estado": "BLOQUEADO"
  }
}
```
**Errores:**
- `404` - Usuario no encontrado
- `400` - Estado inválido (debe ser ACTIVO, INACTIVO o BLOQUEADO)
- `400` - motivo es obligatorio
---
### 5. Crear Evaluación de Riesgo
**Endpoint:** `POST /api/usuarios/:id/riesgo`
**Autenticación:** Requerida (JWT)
**Body (JSON):**
```json
{
  "riesgo_capacidad_pago": "BAJO",
  "riesgo_lavado_dinero": "BAJO",
  "riesgo_aduanas": "MEDIO",
  "riesgo_mercancia": "BAJO"
}
```
**Niveles válidos:** BAJO, MEDIO, ALTO
**Respuesta (201):**
```json
{
  "ok": true,
  "mensaje": "Evaluación de riesgo creada correctamente",
  "data": {
    "id": 1,
    "usuario_id": 1,
    "riesgo_capacidad_pago": "BAJO",
    "riesgo_lavado_dinero": "BAJO",
    "riesgo_aduanas": "MEDIO",
    "riesgo_mercancia": "BAJO",
    "evaluado_por": 3,
    "fecha_evaluacion": "2026-03-24T02:36:38.700Z"
  }
}
```
**Errores:**
- `404` - Usuario no encontrado
- `400` - El usuario no es CLIENTE_CORPORATIVO
- `400` - Niveles de riesgo inválidos (deben ser BAJO, MEDIO o ALTO)
---
### 6. Obtener Evaluación de Riesgo
**Endpoint:** `GET /api/usuarios/:id/riesgo`
**Autenticación:** Requerida (JWT)
**Respuesta (200):**
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "usuario_id": 1,
    "riesgo_capacidad_pago": "BAJO",
    "riesgo_lavado_dinero": "BAJO",
    "riesgo_aduanas": "MEDIO",
    "riesgo_mercancia": "BAJO",
    "evaluado_por": 3,
    "fecha_evaluacion": "2026-03-24T02:36:38.700Z"
  }
}
```
**Errores:**
- `404` - Usuario no encontrado o no tiene evaluación de riesgo
- `400` - El usuario no es CLIENTE_CORPORATIVO
---
## Manejo de Errores
| Código | Significado |
|--------|-------------|
| `200`  | OK - Solicitud exitosa |
| `201`  | Created - Recurso creado |
| `400`  | Bad Request - Datos inválidos |
| `401`  | Unauthorized - Token inválido o expirado |
| `404`  | Not Found - Recurso no encontrado |
| `500`  | Server Error - Error interno |
**Estructura de error:**
```json
{
  "ok": false,
  "mensaje": "Descripción del error"
}
```
---
## Estados del Sistema
**Usuarios:**
```
ACTIVO    → puede operar normalmente
INACTIVO  → desactivado manualmente
BLOQUEADO → bloqueado por deuda o manualmente
```
**Contratos:**
```
VIGENTE   → activo y dentro de fechas
EXPIRADO  → pasó la fecha de vencimiento
SUSPENDIDO → suspendido manualmente
```
---
## Notas Importantes
1. El endpoint `/contratos/validar/:id` es el más importante — lo usa el módulo de Órdenes para verificar si un cliente puede crear una orden.
2. El bloqueo de cliente es **automático** cuando excede su límite de crédito.
3. La expiración del contrato es **automática** cuando se detecta en la validación.
4. Todas las acciones quedan registradas en la tabla de auditoría.
5. Las rutas con parámetros estáticos (`/validar`, `/cliente`, `/referencia`) deben ir **antes** de las rutas dinámicas (`/:id`, `/:tipo_unidad`) para evitar conflictos.
---
**Versión:** 1.0.0
**Módulo:** Gestión de Clientes y Contratos
**Proyecto:** LogiTrans Guatemala, S.A. - Fase 2
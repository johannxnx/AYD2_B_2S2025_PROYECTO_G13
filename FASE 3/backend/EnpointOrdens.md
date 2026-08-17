# Documentación de API: Módulo de Órdenes y Logística

Esta API gestiona el ciclo de vida completo de una orden de transporte, desde su creación y asignación de recursos hasta la entrega final con evidencias físicas.

Ruta Base: [http://localhost:3000/api/orden](http://localhost:3000/api/orden)

## Seguridad y Autenticación

Tipo de Autenticación: JSON Web Token (JWT).

Header Requerido: Authorization: Bearer <tu_token_aquí>

Middleware Global: requireAuth (Todas las rutas requieren una sesión activa).

## 1. Gestión Administrativa y Consultas

Endpoints orientados al Agente Logístico para la planificación inicial.

### Obtener Todas las Órdenes

Ruta: GET /

Descripción: Recupera el listado completo de órdenes en el sistema.

### Obtener Órdenes Pendientes

Ruta: GET /pendiente

Descripción: Lista las órdenes que han sido creadas pero no tienen vehículo ni piloto asignado.

### Generar Nueva Orden

Ruta: POST /

Middleware: validarGenerarOrden

Cuerpo (JSON):

```
{
    "cliente_id": 1,
    "origen": "Puerto Barrios",
    "destino": "Guatemala",
    "tipo_mercancia": "Repuestos Automotrices",
    "peso_estimado": 8,
    "creado_por": 1
}
```

### Asignar Recursos

Ruta: PUT /:id

Descripción: Vincula un vehículo y un piloto a la orden. Cambia el estado a PLANIFICADA.

Middleware: valAsignacionRecursos

Cuerpo (JSON):

```
{
    "vehiculo_id": 7,
    "piloto_id": 6,
    "peso_estimado": 8,
    "tiempo_estimado": 100
}
```

## 2. Control de Patio (Báscula y Despacho)

Gestión del pesaje real y formalización de la salida.

### Obtener Órdenes Planificadas

Ruta: GET /planificada

Descripción: Lista las órdenes listas para entrar a báscula y salir de patio.

### Registrar Salida de Patio

Ruta: PUT /logistica/:id

Descripción: Valida peso real, recalcula costos según tarifa y autoriza el despacho.

Middleware: valSalidaPatio

Cuerpo (JSON):

```
{
    "codigo_orden": "ORD-1774452441996",
    "peso_real": 8,
    "asegurada": true,
    "estibada": true
}
```

## 3. Ejecución en Ruta (App Piloto)

Endpoints para el seguimiento del viaje en tiempo real.

### Obtener Órdenes por Piloto

Ruta: GET /piloto/:id

Descripción: Consulta las rutas asignadas al ID del piloto especificado.

### Iniciar Tránsito

Ruta: PUT /trasito/inicio/:id

Descripción: El piloto confirma que ha iniciado el movimiento. Cambia estado a EN_TRANSITO.

Middleware: valInicioTransito

Registrar Evento de Bitácora

### Ruta: POST /eventos

Descripción: Reporta incidentes (tráfico, accidentes, fallas mecánicas).

Middleware: valEventosTransito

Cuerpo (JSON):

```
{
  "orden_id": 13,
  "piloto_id": 6,
  "tipo_evento": "NORMAL",
  "descripcion": "Unidad pasando por Aduana de Tecún Umán. Sin novedades.",
  "genera_retraso": false
}
```

## 4. Finalización y Evidencias

Cierre del ciclo logístico y liberación de activos.

Finalizar Entrega (Con Evidencias)

Ruta: POST /trasito/fin/:id

Descripción: Finaliza la orden, libera el vehículo (estado DISPONIBLE), calcula el KPI de tiempo en horas y guarda fotos localmente.

Content-Type: multipart/form-data

Parámetros:

evidencias: Archivos de imagen (Máximo 5).

Middleware: upload.array, valFinalizarEntrega

## 🛠️ 5. Endpoints de Soporte (Auxiliares)

Método Ruta Descripción

GET /vehiculos Lista vehículos disponibles para asignación.

GET /pilotos Lista pilotos libres de servicios.

GET /usuario/:id Historial de órdenes creadas por un usuario específico.
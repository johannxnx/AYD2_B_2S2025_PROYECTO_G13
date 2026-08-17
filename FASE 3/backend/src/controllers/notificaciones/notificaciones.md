# Sistema de Notificaciones - Documentación

## Descripción General
Se implementó un sistema de notificaciones dinámico que muestra alertas en tiempo real sobre eventos pendientes en el sistema LogiTrans.

## Componentes Implementados

### Frontend (LogisticHeader.tsx)
- **Icono de Campana**: Botón interactivo con FaBell de react-icons
- **Badge Dinámico**: Muestra el total de notificaciones (máximo 9+)
- **Dropdown de Notificaciones**: Panel desplegable con lista de alertas categorizadas
- **Actualización Automática**: Se refreshean cada 30 segundos
- **Navegación Contextual**: Cada notificación navega a su sección correspondiente

### Features del Dropdown
- Titulo de notificación
- Cantidad de elementos pendientes
- Icono de categoría (sin emojis, usando caracteres especiales)
- Click para navegar a la sección relevante
- Mensaje "Sin notificaciones" cuando no hay alertas

## Categorías de Notificaciones

| Tipo | Icono | Descripción | Query |
|------|-------|-------------|-------|
| Clientes | (i) | Clientes Corporativos pendientes de aceptar | PENDIENTE_ACEPTACION |
| Contratos | [!] | Contratos próximos a vencer (30 días) | fecha_vencimiento BETWEEN GETDATE() AND +30 días |
| Bloqueados | [x] | Clientes bloqueados por crédito | estado = BLOQUEADO |
| Órdenes | [o] | Órdenes en tránsito | estado = EN_TRANSITO (cuando exista) |

## Endpoints API

### GET /api/notificaciones
- **Autenticación**: Requiere JWT token
- **Middleware**: requireAuth
- **Response**: 
```json
{
  "ok": true,
  "notificaciones": [
    {
      "tipo": "clientes",
      "titulo": "Clientes Pendientes",
      "cantidad": 5,
      "icono": "(i)"
    }
  ],
  "total": 5
}
```

## Archivos Modificados

### Backend
1. **Nuevo Controlador**: `backend/src/controllers/notificaciones/notificacionesController.js`
   - Función: `obtenerNotificaciones(req, res)`
   - Consulta 4 tipos de notificaciones
   - Retorna cantidad total

2. **Nuevo Router**: `backend/src/routes/notificaciones/notificacionesRoutes.js`
   - Ruta: GET /api/notificaciones
   - Middleware de autenticación aplicado

3. **Actualizado**: `backend/src/routes/index_routes.js`
   - Agregó importación de notificacionesRoutes
   - Registró ruta en router

### Frontend
1. **Actualizado**: `frontend/src/components/logistico/LogisticHeader.tsx`
   - Agregó estados: showNotifications, notifications, notificationCount
   - Implementó useEffect para fetch automático cada 30 segundos
   - Agregó dropdown interactivo
   - Badge dinámico basado en total de notificaciones
   - Click en notificación navega a sección relevante

## Flujo de Ejecución

1. Usuario abre LogisticHeader
2. Al montar el componente, se ejecuta useEffect
3. Se hace fetch a GET /api/notificaciones con JWT token
4. Backend consulta BD y retorna array de notificaciones
5. Se actualiza el estado con notificaciones y total count
6. Badge muestra el total (máximo 9+)
7. Cada 30 segundos se actualiza automáticamente
8. Al hacer click en el icono, se abre/cierra el dropdown
9. Al hacer click en una notificación, navega a la sección y cierra dropdown

## Consideraciones Técnicas

### Sin Emojis
- Se utilizan caracteres especiales para los iconos:
  - (i) = Info/Clientes
  - [!] = Alerta/Contratos
  - [x] = Error/Bloqueados
  - [o] = Orden/Transito

### Seguridad
- Todas las consultas están protegidas con requireAuth
- No se expone información sensible
- Las negociaciones se hacen a nivel de BD

### Performance
- Las notificaciones se cuentan en la BD (no en memoria)
- Solo calcula lo necesario
- Actualización cada 30 segundos (configurable)
- Manejo de errores si la tabla de órdenes no existe

### Escalabilidad
- Fácil de agregar nuevas categorías
- Estructura modular
- Queries independientes por categoría

## Próximas Mejoras Sugeridas

1. Agregar persistencia de notificaciones leídas
2. Filtros por categoría en el dropdown
3. Sonido/notificación del navegador
4. WebSocket para actualizaciones en tiempo real
5. Marcar como leída
6. Historial de notificaciones
7. Configuración de preferencias de notificaciones

## Testing

Para verificar la funcionalidad:

1. **Backend**: 
   ```
   GET http://localhost:3000/api/notificaciones
   Headers: Authorization: Bearer <JWT_TOKEN>
   ```

2. **Frontend**: 
   - Navega a /logistico
   - Click en el icono de campana en la esquina superior derecha
   - Debe mostrar las notificaciones dinámicas
   - Cada 30 segundos debe actualizarse automáticamente

## Notas
- Los iconos no usan emojis como se solicitó
- El sistema es independiente de otros módulos
- Compatible con contratos, usuarios y órdenes futuras

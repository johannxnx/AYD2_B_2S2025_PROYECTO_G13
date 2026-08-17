# Documentación de Pruebas de Integración

## Ejecución de Pruebas

```bash
npm run test:int
```

## Resumen General

Se ejecutaron pruebas de integración sobre los principales flujos del
sistema, validando la interacción entre los distintos módulos del
backend.

### Resultado General

- Total de pruebas: 5
- Pruebas exitosas: 5
- Pruebas fallidas: 0
- Tiempo total aproximado: 7 segundos

Referencia de ejecución: fileciteturn4file0

---

## 1. Flujo: Cliente Corporativo

Archivo: fileciteturn4file1

### Escenario probado

- Autenticación del cliente
- Consulta de contratos asociados
- Consulta de órdenes del cliente
- Consulta de rutas autorizadas

### Resultado esperado

- Login exitoso
- Obtención de contratos del cliente
- Obtención de órdenes asociadas
- Obtención de rutas autorizadas

### Resultado obtenido

- Login exitoso con token válido
- Se obtuvo al menos un contrato (CTR-2026-00007)
- Se obtuvieron órdenes del cliente correctamente
- Se obtuvieron rutas autorizadas correctamente

---

## 2. Flujo: Gerencia

Archivo: fileciteturn4file2

### Escenario probado

- Autenticación de usuario con rol gerencia
- Acceso a endpoints del dashboard gerencial:
  - corte diario
  - KPIs
  - alertas
  - eventos

### Resultado esperado

- Login exitoso
- Acceso autorizado a endpoints gerenciales
- Respuesta correcta de cada endpoint

### Resultado obtenido

- Login exitoso
- Acceso permitido a todos los endpoints
- Respuestas correctas en todos los casos

---

## 3. Flujo: Agente Logístico

Archivo: fileciteturn4file3

### Escenario probado

- Autenticación del agente logístico
- Consulta de contratos
- Consulta de usuarios del sistema

### Resultado esperado

- Login exitoso
- Obtención de contratos disponibles
- Obtención de usuarios registrados

### Resultado obtenido

- Login exitoso
- Se obtuvo al menos un contrato vigente
- Se obtuvo listado de usuarios correctamente

---

## 4. Flujo: Agente Operativo

Archivo: fileciteturn4file4

### Escenario probado

- Autenticación del agente operativo
- Consulta de órdenes pendientes
- Consulta de vehículos disponibles
- Consulta de pilotos disponibles

### Resultado esperado

- Login exitoso
- Obtención de órdenes pendientes
- Obtención de vehículos disponibles
- Obtención de pilotos disponibles

### Resultado obtenido

- Login exitoso
- Se obtuvo al menos una orden pendiente
- Se obtuvo listado de vehículos disponibles
- Se obtuvo listado de pilotos disponibles

---

## 5. Flujo: Piloto

Archivo: fileciteturn4file5

### Escenario probado

- Autenticación del piloto
- Consulta de órdenes asignadas

### Resultado esperado

- Login exitoso
- Obtención de órdenes del piloto

### Resultado obtenido

- Login exitoso
- El endpoint respondió correctamente
- Se obtuvo lista de órdenes (vacía en este caso, comportamiento
  válido)

---

## Conclusión

Las pruebas de integración validan correctamente los flujos principales
del sistema para cada tipo de usuario:

- Cliente corporativo
- Gerencia
- Agente logístico
- Agente operativo
- Piloto

Se comprobó que:

- Los procesos de autenticación funcionan correctamente
- Los endpoints responden de acuerdo al rol del usuario
- La comunicación entre módulos (auth, contratos, órdenes, usuarios,
  gerencial) es consistente
- El sistema se comporta de manera estable en escenarios reales de uso

El sistema se encuentra funcional y preparado para pruebas de aceptación
o despliegue.

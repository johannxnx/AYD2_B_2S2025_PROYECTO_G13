### C-01 — Escalabilidad Transaccional

| Campo | Detalle |
|-------|----------|
| ID | C-01 |
| Categoría | Escalabilidad |
| Escenario (EAC) | Si el volumen de órdenes aumenta en un 200%, el sistema debe mantener tiempos de respuesta aceptables sin degradación del servicio. |
| Fuente | Crecimiento del negocio |
| Estímulo | Incremento de 100 a 300 órdenes diarias |
| Entorno | Operación normal en horas pico |
| Artefacto | Backend, base de datos y servidor de aplicaciones |
| Respuesta esperada | El sistema procesa las solicitudes sin colapsar ni generar errores |
| Medida de respuesta | Tiempo de respuesta < 3 segundos por operación |
| Justificación | La meta estratégica es triplicar la operación en 3 años |
| Impacto arquitectónico | Arquitectura desacoplada, posibilidad de balanceador de carga y base de datos optimizada |

### C-02 — Alta Disponibilidad Operativa

| Campo | Detalle |
|-------|----------|
| ID | C-02 |
| Categoría | Disponibilidad |
| Escenario (EAC) | Si ocurre una falla del servidor principal, el sistema debe restaurar el servicio en menos de 10 minutos. |
| Fuente | Falla técnica |
| Estímulo | Caída del servidor o reinicio inesperado |
| Entorno | Operación en cualquiera de las tres sedes |
| Artefacto | Infraestructura y servidor de aplicaciones |
| Respuesta esperada | El servicio se restablece automáticamente |
| Medida de respuesta | Disponibilidad anual ≥ 99.5% y recuperación < 10 minutos |
| Justificación | Un minuto de sistema caído implica camiones detenidos y clientes insatisfechos |
| Impacto arquitectónico | Respaldo automático, reinicio rápido y posible replicación o servidor secundario |

### C-03 — Seguridad y Control de Acceso

| Campo | Detalle |
|-------|----------|
| ID | C-03 |
| Categoría | Seguridad |
| Escenario (EAC) | Si un usuario intenta acceder a información fuera de su rol, el sistema debe bloquear el acceso y registrar el intento. |
| Fuente | Usuario interno o externo |
| Estímulo | Intento de acceso no autorizado |
| Entorno | Operación normal |
| Artefacto | Módulo de autenticación y autorización |
| Respuesta esperada | Acceso denegado y registro en bitácora |
| Medida de respuesta | 100% de acciones sensibles registradas en auditoría |
| Justificación | Se manejan datos financieros y contratos confidenciales |
| Impacto arquitectónico | Implementación de RBAC, autenticación segura y bitácora centralizada |


### C-04 — Interoperabilidad Externa

| Campo | Detalle |
|-------|----------|
| ID | C-04 |
| Categoría | Interoperabilidad |
| Escenario (EAC) | Cuando el sistema envía una factura al certificador FEL, debe recibir confirmación en tiempo real. |
| Fuente | Evento de facturación |
| Estímulo | Certificación de factura |
| Entorno | Operación normal |
| Artefacto | API de integración |
| Respuesta esperada | Envío de datos estructurados y recepción de confirmación oficial |
| Medida de respuesta | Confirmación recibida en menos de 5 segundos |
| Justificación | La facturación electrónica es un requisito legal obligatorio |
| Impacto arquitectónico | Necesidad de API Gateway y manejo robusto de errores externos |

### C-05 — Modificabilidad y Evolución Regional

| Campo | Detalle |
|-------|----------|
| ID | C-05 |
| Categoría | Modificabilidad |
| Escenario (EAC) | Si se requiere agregar un módulo para operar en Guatemala o El Salvador, el sistema debe permitir su integración sin afectar módulos existentes. |
| Fuente | Expansión regional |
| Estímulo | Implementación de nuevas reglas o módulo adicional |
| Entorno | Sistema en producción |
| Artefacto | Arquitectura modular |
| Respuesta esperada | Nuevo módulo desplegado sin alterar contratos, órdenes ni facturación existentes |
| Medida de respuesta | Integración sin downtime mayor a 5 minutos |
| Justificación | La empresa planea expansión regional en los próximos 24 meses |
| Impacto arquitectónico | Diseño modular desacoplado o arquitectura basada en servicios |



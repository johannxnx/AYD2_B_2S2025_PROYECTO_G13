# Drivers de Calidad — LogiTrans Guatemala S.A.
## Escenarios de Atributos de Calidad (EAC) — Fase 2

---

### C-01 — Escalabilidad Transaccional

| Campo | Detalle |
|-------|----------|
| ID | C-01 |
| Categoría | Escalabilidad |
| Escenario (EAC) | Si el volumen de órdenes aumenta en un 200%, el sistema debe mantener tiempos de respuesta aceptables sin degradación del servicio. |
| Fuente | Crecimiento del negocio |
| Estímulo | Incremento de 100 a 300 órdenes diarias |
| Entorno | Operación normal en horas pico |
| Artefacto | Contenedor backend (`ayd2-g13-backend`), base de datos AWS |
| Respuesta esperada | El sistema procesa las solicitudes sin colapsar ni generar errores |
| Medida de respuesta | Tiempo de respuesta < 3 segundos por operación |
| Justificación | La meta estratégica es triplicar la operación en 3 años |
| Impacto arquitectónico | En la fase actual, la escalabilidad recae en el servicio de base de datos AWS (escalado vertical gestionado). El contenedor backend es una instancia única; para escalar horizontalmente se requerirá un Load Balancer y múltiples réplicas del contenedor en una fase posterior. La arquitectura con Docker Compose facilita esta transición sin reescritura de código. |
| Estado en Fase 2 | **Parcialmente cubierto.** La base de datos escala vía AWS. El backend es instancia única local; escalar horizontalmente requiere migración a orquestador (Docker Swarm / GKE). |

---

### C-02 — Alta Disponibilidad Operativa

| Campo | Detalle |
|-------|----------|
| ID | C-02 |
| Categoría | Disponibilidad |
| Escenario (EAC) | Si ocurre una falla del servidor o contenedor, el sistema debe restaurar el servicio en el menor tiempo posible. |
| Fuente | Falla técnica |
| Estímulo | Caída del contenedor, reinicio del host o error de software |
| Entorno | Operación en cualquiera de las tres sedes |
| Artefacto | Contenedores Docker (`ayd2-g13-backend`, `ayd2-g13-frontend`), base de datos AWS |
| Respuesta esperada | Los contenedores se reinician automáticamente ante fallas; la base de datos permanece disponible vía AWS |
| Medida de respuesta | Reinicio automático de contenedores gracias a `restart: unless-stopped` en `docker-compose.yml`. Disponibilidad de la BD garantizada por SLA de AWS. |
| Justificación | Un minuto de sistema caído implica camiones detenidos y clientes insatisfechos |
| Impacto arquitectónico | La política `restart: unless-stopped` en Docker Compose proporciona resiliencia básica ante crashes del proceso. No existe redundancia de instancias en esta fase; una falla del host detiene todo el sistema. La base de datos en AWS tiene alta disponibilidad gestionada independientemente del host local. |
| Estado en Fase 2 | **Cubierto de forma básica.** Reinicio automático de contenedores ante crash de proceso. Sin redundancia de host. La BD en AWS sí tiene alta disponibilidad garantizada. |

---

### C-03 — Seguridad y Control de Acceso

| Campo | Detalle |
|-------|----------|
| ID | C-03 |
| Categoría | Seguridad |
| Escenario (EAC) | Si un usuario intenta acceder a información fuera de su rol, el sistema debe bloquear el acceso y registrar el intento. |
| Fuente | Usuario interno o externo |
| Estímulo | Intento de acceso no autorizado |
| Entorno | Operación normal |
| Artefacto | Módulo JWT y RBAC dentro del contenedor `ayd2-g13-backend` |
| Respuesta esperada | Acceso denegado y registro en bitácora de auditoría |
| Medida de respuesta | 100% de acciones sensibles registradas en auditoría; tokens JWT validados en cada solicitud |
| Justificación | Se manejan datos financieros y contratos confidenciales |
| Impacto arquitectónico | El módulo JWT valida la identidad y el módulo RBAC restringe el acceso por rol (cliente, operativo, financiero, supervisor) en cada solicitud al backend. Las credenciales de base de datos AWS se gestionan mediante variables de entorno en `.env` (no embebidas en el código). El usuario del contenedor es no-root (`appuser`) por seguridad. El puerto del backend (3001) no está expuesto al host; solo es accesible dentro de la red interna `app_network`. |
| Estado en Fase 2 | **Cubierto.** JWT, RBAC, auditoría, usuario no-root, puerto backend no expuesto, credenciales por `.env`. |

---

### C-04 — Interoperabilidad Externa

| Campo | Detalle |
|-------|----------|
| ID | C-04 |
| Categoría | Interoperabilidad |
| Escenario (EAC) | Cuando el sistema envía una factura al certificador FEL, debe recibir confirmación en tiempo real. |
| Fuente | Evento de facturación |
| Estímulo | Certificación de factura electrónica |
| Entorno | Operación normal |
| Artefacto | Módulo de stubs de integraciones externas dentro del contenedor `ayd2-g13-backend` |
| Respuesta esperada | Envío de datos estructurados y recepción de confirmación (simulada en esta fase) |
| Medida de respuesta | Confirmación recibida en menos de 5 segundos (respuesta de stub inmediata en Fase 2) |
| Justificación | La facturación electrónica es un requisito legal obligatorio |
| Impacto arquitectónico | En esta fase, todas las integraciones externas (FEL/SAT, Sistema Aduanal, Pasarela Bancaria, ERP externo) están implementadas como stubs internos dentro del contenedor backend. Los adaptadores por sistema exponen una interfaz interna uniforme, lo que permite activar la integración real en una fase posterior modificando únicamente el adaptador correspondiente, sin cambios en el resto del sistema. |
| Estado en Fase 2 | **Parcialmente cubierto.** Stubs funcionales con interfaz preparada para integración real. No hay conexión a sistemas externos reales. |

---

### C-05 — Modificabilidad y Evolución Regional

| Campo | Detalle |
|-------|----------|
| ID | C-05 |
| Categoría | Modificabilidad |
| Escenario (EAC) | Si se requiere agregar un módulo para operar en Honduras o El Salvador, el sistema debe permitir su integración sin afectar módulos existentes y con downtime no mayor a 5 minutos. |
| Fuente | Expansión regional |
| Estímulo | Implementación de nuevas reglas de negocio o módulo adicional |
| Entorno | Sistema en operación |
| Artefacto | Arquitectura modular del backend, esquemas separados en base de datos AWS, contenedores Docker |
| Respuesta esperada | Nuevo módulo desplegado sin alterar contratos, órdenes ni facturación existentes |
| Medida de respuesta | Rebuild y redeploy del contenedor afectado con `docker-compose up --build` sin afectar el otro contenedor. Downtime acotado al tiempo de rebuild. |
| Justificación | La empresa planea expansión regional en los próximos 24 meses |
| Impacto arquitectónico | La separación en contenedores independientes (`frontend` y `backend`) permite actualizar cada capa de forma independiente. El backend modular (servicios por dominio: comercial, operativo, financiero, integraciones) permite agregar funcionalidad nueva sin modificar módulos existentes. Los esquemas separados en la BD AWS (seguridad, comercial, operativo, financiero, analytics) permiten agregar tablas para nuevas regiones sin alterar esquemas existentes. La arquitectura Docker Compose es el punto de partida para migración futura a GKE u otro orquestador. |
| Estado en Fase 2 | **Cubierto estructuralmente.** Contenedores independientes, backend modular, esquemas separados. El paso a producción multi-región requerirá orquestador y CI/CD. |

---

### Resumen de Cobertura EAC — Fase 2

| EAC | Categoría | Estado en Fase 2 | Mecanismos Arquitectónicos Actuales |
|-----|-----------|------------------|-------------------------------------|
| C-01 | Escalabilidad | Parcialmente cubierto | BD escalable en AWS; backend instancia única (sin LB aún) |
| C-02 | Disponibilidad | Cubierto básico | `restart: unless-stopped`; BD con alta disponibilidad AWS |
| C-03 | Seguridad | Cubierto | JWT, RBAC, auditoría, usuario no-root, puerto backend no expuesto, `.env` |
| C-04 | Interoperabilidad | Parcialmente cubierto | Stubs con interfaz preparada para integración real |
| C-05 | Modificabilidad | Cubierto estructuralmente | Contenedores independientes, backend modular, esquemas separados en AWS |
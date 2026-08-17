# LogiTrans Guatemala S.A.
## Diagrama de Despliegue — Fase 2
---

## 1. Introducción y Propósito del Diagrama

El diagrama de despliegue UML de la Fase 2 de LogiTrans Guatemala S.A. representa la distribución real de los componentes de software sobre la infraestructura que los ejecuta en esta etapa del proyecto. A diferencia de la fase anterior, cuyo objetivo era mostrar una arquitectura orientada al futuro con múltiples instancias, load balancer y cloud-ready, este diagrama refleja fielmente la implementación actual: dos contenedores Docker orquestados localmente con Docker Compose, y una base de datos gestionada en AWS.

El diagrama organiza la infraestructura en tres zonas:

- **Zona Cliente**: los dispositivos de los usuarios (navegadores web), sin cambios respecto a la fase anterior.
- **Zona Local (Docker Compose)**: los dos contenedores Docker donde corren el frontend y el backend en el entorno local de despliegue.
- **Zona AWS**: la nube de Amazon donde vive la base de datos gestionada.

---

## 2. Diagrama:


![Diagrama de despliegue](./img/diagrama_despligue.png)

---

## 3. Descripción de Zonas de Infraestructura

### 3.1 Zona Cliente

Los usuarios acceden al sistema a través de un navegador web estándar en el puerto 5173 del host donde corre Docker Compose. El navegador descarga la aplicación React una sola vez desde el contenedor frontend y la ejecuta localmente, comunicándose con el backend mediante solicitudes HTTP con JWT adjunto.

Esta zona no tiene cambios respecto a la Fase 1.

---

### 3.2 Infraestructura Local (Docker Compose)

Toda la infraestructura de aplicación se levanta con un único comando `docker-compose up` a partir del archivo `FASE 2/docker-compose.yml`. Se crean dos contenedores interconectados por una red bridge interna llamada `app_network`.

#### Contenedor Frontend: `ayd2-g13-frontend`

Construido con un Dockerfile multi-stage: la primera etapa usa `node:20` para compilar el proyecto React con Vite (generando `/app/dist`), y la segunda etapa usa `nginx:1.27-alpine` para servir los archivos estáticos resultantes. El puerto 80 del contenedor se mapea al puerto 5173 del host (`5173:80`), siendo el único punto de entrada accesible desde fuera.

El archivo `nginx.conf` gestiona las rutas del frontend y dirige las solicitudes API hacia el contenedor backend por la red interna.

**Aspectos de seguridad notables:**
- Nginx sirve únicamente archivos estáticos; no ejecuta lógica de negocio.
- La imagen final no incluye Node.js ni dependencias de build, lo que reduce la superficie de ataque.

#### Contenedor Backend: `ayd2-g13-backend`

Construido con un Dockerfile multi-stage sobre `node:20-alpine`. La primera etapa instala solo dependencias de producción (`npm ci --omit=dev`). La segunda etapa crea un usuario no-root (`appuser`) y ejecuta `node index.js` en el puerto 3001.

**El puerto 3001 no está expuesto al host**: solo es accesible dentro de la red `app_network` desde el contenedor frontend. Las credenciales de la base de datos se cargan desde `./backend/.env` mediante `env_file`, sin estar embebidas en el código ni en la imagen Docker.

El backend contiene los siguientes módulos:

- **API REST (Node.js + Express)**: punto central que recibe solicitudes del frontend, ejecuta lógica de negocio y devuelve respuestas.
- **Módulo JWT**: valida el token en cada solicitud entrante y verifica rol con RBAC.
- **Módulo de Auditoría**: registra todas las acciones sensibles del sistema.
- **Stubs de integraciones externas**: simulaciones de FEL/SAT, Sistema Aduanal, Pasarela Bancaria y ERP externo. Cada stub implementa la misma interfaz interna que usará la integración real, lo que permite activarla sin cambios estructurales.
- **Directorio `evidencias/`**: las fotos y firmas de entrega se almacenan en el sistema de archivos interno del contenedor bajo la ruta `/app/evidencias/`. **Importante**: este almacenamiento es efímero; si el contenedor es recreado con `docker-compose up --build`, los archivos se pierden a menos que se configure un volumen Docker persistente. Este es un riesgo conocido y aceptado en esta fase.

---

### 3.3 Amazon Web Services (AWS)

La base de datos reside en un servicio gestionado de AWS. Es el único componente que vive en la nube en esta fase. No existe Cloud Storage externo: las evidencias digitales se almacenan localmente en el contenedor backend.

La conexión desde el backend hacia AWS se realiza mediante las credenciales definidas en `./backend/.env`, manteniendo la configuración fuera del código fuente y de las imágenes Docker.

Los cinco esquemas de la base de datos (seguridad, comercial, operativo, financiero, analytics) permiten evolucionar cada dominio de forma independiente.

---

## 4. Cambios Respecto a la Fase 1

| Componente | Fase 1 | Fase 2 |
|-----------|--------|--------|
| Load Balancer | Nginx / HAProxy | **No existe** (instancia única) |
| Rate Limiter | Teórico incluido | **No existe** en esta fase |
| Instancias Frontend | 2 instancias activas | **1 contenedor** Docker |
| Instancias Backend | 2 instancias activas | **1 contenedor** Docker |
| Proveedor de nube | GCP (Cloud SQL + Cloud Storage) | **AWS** (solo BD) |
| Almacenamiento de evidencias | Google Cloud Storage | **Sistema de archivos local** del contenedor backend (`/app/evidencias/`) |
| Protocolo cliente→servidor | HTTPS / TLS 1.3 | **HTTP** (entorno local, puerto 5173) |
| Conexión backend→BD | Cloud SQL Auth Proxy (GCP) | **TCP/SSL directo** vía credenciales `.env` (AWS) |
| Orquestación | Proyectada a GKE/Cloud Run | **Docker Compose** local |

---

## 5. Validación de EAC contra la Arquitectura de Fase 2

### EAC C-01: Escalabilidad Transaccional

**Estado: Parcialmente cubierto.**

En esta fase existe una única instancia del backend y una del frontend. El escalado horizontal no está disponible sin migrar a un orquestador. La base de datos en AWS sí permite escalado vertical gestionado. La arquitectura con Docker Compose es el punto de partida correcto para una futura migración a un entorno con múltiples réplicas.

---

### EAC C-02: Alta Disponibilidad Operativa

**Estado: Cubierto de forma básica.**

La política `restart: unless-stopped` en `docker-compose.yml` garantiza que los contenedores se reinicien automáticamente si el proceso falla. Sin embargo, no existe redundancia de host: una falla física o reinicio del servidor local detiene todo el sistema. La base de datos en AWS sí tiene alta disponibilidad gestionada independientemente del host local, lo que protege la durabilidad de los datos.

---

### EAC C-03: Seguridad y Control de Acceso

**Estado: Cubierto.**

El módulo JWT valida la identidad en cada solicitud. El módulo RBAC restringe acceso por rol. El módulo de auditoría registra el 100% de las acciones sensibles. El usuario del contenedor backend es no-root (`appuser`). El puerto 3001 del backend no está expuesto al host. Las credenciales de base de datos se gestionan por variables de entorno en `.env`.

---

### EAC C-04: Interoperabilidad Externa

**Estado: Parcialmente cubierto.**

Los stubs de integraciones (FEL/SAT, Aduana, Banco, ERP) están implementados con una interfaz interna unificada. Activar la integración real con cualquiera de estos sistemas requiere únicamente modificar el adaptador correspondiente, sin cambios en el resto del sistema. No hay conexión real a sistemas externos en esta fase.

---

### EAC C-05: Modificabilidad y Evolución Regional

**Estado: Cubierto estructuralmente.**

Los dos contenedores son independientes: actualizar el backend no requiere reconstruir el frontend y viceversa. El backend modular permite agregar funcionalidad nueva sin modificar módulos existentes. Los esquemas separados en AWS permiten agregar tablas para nuevas regiones sin alterar esquemas actuales. El paso a producción multi-región requerirá un orquestador y pipeline CI/CD, para lo cual la arquitectura de contenedores es el punto de partida natural.

---

### Resumen de Cobertura EAC — Fase 2

| EAC | Categoría | Estado | Mecanismos Arquitectónicos Actuales |
|-----|-----------|--------|-------------------------------------|
| C-01 | Escalabilidad | Parcialmente cubierto | BD escalable en AWS; backend instancia única sin LB |
| C-02 | Disponibilidad | Cubierto básico | `restart: unless-stopped`; BD con alta disponibilidad AWS |
| C-03 | Seguridad | Cubierto | JWT, RBAC, auditoría, usuario no-root, puerto backend no expuesto, `.env` |
| C-04 | Interoperabilidad | Parcialmente cubierto | Stubs con interfaz preparada para integración real |
| C-05 | Modificabilidad | Cubierto estructuralmente | Contenedores independientes, backend modular, esquemas separados en AWS |
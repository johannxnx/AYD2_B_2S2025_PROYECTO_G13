# Drivers de Restricción — LogiTrans Guatemala, S.A.


## Categoría 1: Restricciones Técnicas

### R-01 — La solución debe ser una aplicación web

| Campo | Detalle |
|---|---|
| **ID** | R-01 |
| **Categoría** | Técnica |
| **Restricción** | La solución debe ser una aplicación web accesible desde navegador |
| **Origen** | Inferido de los requisitos operativos del sistema |
| **Justificación** | El sistema debe ser accesible simultáneamente desde las tres sedes (Ciudad de Guatemala, Quetzaltenango y Puerto Barrios), por clientes corporativos externos y por pilotos en campo. Una aplicación de escritorio (.exe) o exclusivamente móvil no satisface este requisito de acceso distribuido y multiplataforma. |
| **Impacto arquitectónico** | La arquitectura debe contemplar un servidor web, un frontend desacoplado del backend y comunicación mediante protocolos HTTP/HTTPS. |
| **Lo que NO es** |  Aplicación de escritorio (.exe)  Aplicación móvil nativa exclusiva  Sistema instalado localmente por sede |

---

### R-02 — El despliegue inicial debe ser on-premise reutilizando servidores existentes

| Campo | Detalle |
|---|---|
| **ID** | R-02 |
| **Categoría** | Técnica / Infraestructura |
| **Restricción** | La primera versión del sistema debe desplegarse en los servidores físicos que LogiTrans ya posee, sin requerir inversión inmediata en nuevo hardware |
| **Origen** | Gerencia General y Área Financiera |
| **Justificación** | El documento establece explícitamente: "Solicitamos que la arquitectura propuesta respete el presupuesto ajustado, demostrando que se ha hecho un esfuerzo real por reutilizar nuestros servidores actuales antes de proponer nuevas inversiones en hardware." Esto limita directamente las opciones de infraestructura disponibles para el despliegue inicial. |
| **Impacto arquitectónico** | El diagrama de despliegue debe mostrar los nodos físicos existentes como base. La arquitectura debe ser liviana y eficiente para operar dentro de las capacidades del hardware actual. |
| **Lo que NO es** |  Compra inmediata de nuevos servidores  Despliegue inicial en la nube  Infraestructura que requiera inversión de hardware para funcionar |

---

### R-03 — La arquitectura debe ser cloud-ready desde su diseño inicial

| Campo | Detalle |
|---|---|
| **ID** | R-03 |
| **Categoría** | Técnica / Infraestructura |
| **Restricción** | Aunque el despliegue inicial sea on-premise, el diseño arquitectónico debe estar preparado para ser migrado a la nube sin rediseño estructural |
| **Origen** | Gerencia General |
| **Justificación** | El documento establece: "Aunque el despliegue inicial sea en sitio (on-premise), exigimos que el diseño nazca listo para ser migrado a la nube. No aceptaremos una solución que nos encadene a servidores físicos de forma permanente." La expansión a El Salvador y Honduras en 24 meses hace inevitable una migración a nube para soportar operaciones regionales. |
| **Impacto arquitectónico** | La arquitectura debe evitar dependencias fuertemente acopladas al hardware físico. Se deben usar contenedores (Docker), separación de servicios y configuraciones externalizadas que permitan migrar a AWS, Azure o GCP sin reescribir el sistema. |
| **Lo que NO es** |  Arquitectura atada a rutas absolutas de servidores físicos  Configuraciones hardcodeadas en el servidor  Soluciones que requieran reescritura total para migrar a nube |

---

### R-04 — El sistema debe exponer APIs para integrarse con sistemas externos

| Campo | Detalle |
|---|---|
| **ID** | R-04 |
| **Categoría** | Técnica / Integración |
| **Restricción** | El sistema debe contar con interfaces de integración (APIs) que permitan conectarse con sistemas externos como el certificador FEL de la SAT, ERPs de clientes y sistemas de aduanas |
| **Origen** | Requisitos de facturación electrónica (SAT) y visión de interoperabilidad de la Gerencia General |
| **Justificación** | El documento establece: "La plataforma debe estar lista para conectarse con el mundo exterior: desde los sistemas de aduanas para agilizar el paso por fronteras, hasta los ERPs." Adicionalmente, la facturación electrónica FEL es un requisito legal en Guatemala que obliga a comunicarse con el certificador autorizado por la SAT. |
| **Impacto arquitectónico** | La arquitectura debe contemplar una capa de integración o API Gateway que gestione las comunicaciones con sistemas externos. Los módulos de facturación y órdenes deben estar diseñados para enviar y recibir datos en formatos estándar (JSON/XML). |
| **Lo que NO es** |  Sistema cerrado sin capacidad de integración  Procesos manuales de exportación/importación de datos  Módulo de facturación que no se comunique con el certificador FEL |

---

### R-05 — La solución no debe depender de tecnologías con licenciamiento costoso

| Campo | Detalle |
|---|---|
| **ID** | R-05 |
| **Categoría** | Técnica / Presupuestal |
| **Restricción** | La arquitectura debe basarse en tecnologías de código abierto o con licenciamiento de bajo costo, evitando productos comerciales que impliquen pagos de licencia significativos |
| **Origen** | Área Financiera |
| **Justificación** | El documento establece que el Área Financiera "tienen un interés estricto en evitar sobrecostos y son detractores naturales de tecnologías o licenciamientos costosos. Exigen que la solución sea austera y aproveche al máximo lo que la empresa ya posee." |
| **Impacto arquitectónico** | Se deben priorizar tecnologías open source para el stack tecnológico: bases de datos (PostgreSQL, MySQL), frameworks de desarrollo (Spring Boot, Laravel, Node.js), servidores web (Nginx, Apache) y herramientas de contenedores (Docker). |
| **Lo que NO es** |  Bases de datos con licencia comercial costosa (Oracle, SQL Server Enterprise)  Plataformas SaaS con costos mensuales elevados  Frameworks o herramientas que requieran licencias por usuario |

---

### R-06 — La arquitectura debe soportar la operación de las tres sedes simultáneamente

| Campo | Detalle |
|---|---|
| **ID** | R-06 |
| **Categoría** | Técnica / Disponibilidad |
| **Restricción** | El sistema debe estar diseñado para que las tres sedes operativas (Ciudad de Guatemala, Quetzaltenango y Puerto Barrios) accedan y operen de forma simultánea sin degradación del servicio |
| **Origen** | Jefe de Operaciones y Clientes Corporativos |
| **Justificación** | LogiTrans opera actualmente en tres sedes con procesos interdependientes (órdenes, asignación de recursos, despacho). Un sistema que no soporte operación simultánea multi-sede replicaría el problema actual de silos informativos que se busca eliminar. |
| **Impacto arquitectónico** | La arquitectura debe contemplar una base de datos centralizada accesible desde las tres sedes, con mecanismos de concurrencia y control de acceso por sede. El diagrama de despliegue debe reflejar la conectividad entre las tres ubicaciones geográficas. |
| **Lo que NO es** |  Sistema instalado de forma independiente en cada sede  Sincronización manual de datos entre sedes  Sistema que solo opere desde la sede central |

---
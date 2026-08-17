# Listado de Stakeholders 

## Stakeholders Principales

| # | Stakeholder | Rol | Interés Principal | Preocupación Arquitectónica | Influencia en el Sistema |
|---|---|---|---|---|---|
| 1 | Gerente General | Patrocinador del proyecto | Minimizar costos iniciales y asegurar el retorno de inversión en el menor tiempo posible | Que se propongan soluciones costosas sin un beneficio directo e inmediato en la expansión regional | **Alta** — Aprueba o rechaza la propuesta completa. Toda decisión técnica costosa debe justificarse en términos de negocio |
| 2 | Gerente de TI | Guardián de la infraestructura tecnológica | Heredar una arquitectura robusta, mantenible y escalable que no genere deuda técnica | Que se implementen soluciones "parche" que resuelvan el presente pero fallen a mediano plazo | **Alta** — Define y valida los estándares técnicos. Puede vetar cualquier diseño que comprometa la calidad estructural del sistema |
| 3 | Jefe de Operaciones | Representante de los usuarios en sedes y puertos | Que el sistema sea rápido y simple de operar para despachadores y pilotos en campo | Que la plataforma sea lenta o compleja, convirtiendo la adopción en un fracaso operativo | **Media-Alta** — Si el sistema no es usable en campo, se considera un fracaso independientemente de su nivel técnico |
| 4 | Área Financiera | Control y blindaje presupuestal | Evitar sobrecostos y aprovechar al máximo la infraestructura que la empresa ya posee | El uso de tecnologías con licenciamientos costosos o inversiones en hardware innecesario | **Media** — Restringe directamente las opciones tecnológicas disponibles. Son detractores naturales de soluciones comerciales costosas |
| 5 | Clientes Corporativos | Usuarios externos de la plataforma | Confianza total en el sistema: disponibilidad 24/7 y trazabilidad completa de sus órdenes | Que el sistema no esté disponible o que no puedan rastrear su carga en tiempo real | **Alta** — Su fidelidad depende de la confianza. Condicionan directamente los atributos de disponibilidad e interoperabilidad del sistema |
| 6 | Equipo de Desarrollo | Constructores de la solución tecnológica | Utilizar tecnologías conocidas que representen bajo riesgo técnico dentro del plazo de 4 semanas | Que se exijan innovaciones experimentales que pongan en riesgo la fecha de entrega final | **Media-Alta** — Condicionan la selección de tecnologías y patrones de diseño. Tienen un plazo máximo e inamovible de 4 semanas |

---

## Stakeholders Implícitos


| # | Stakeholder | Rol | Interés Principal | Preocupación Arquitectónica | Influencia en el Sistema |
|---|---|---|---|---|---|
| 7 | SAT (Superintendencia de Administración Tributaria) | Ente regulador externo | Que toda facturación electrónica cumpla con los estándares fiscales vigentes de Guatemala | Que el sistema emita documentos FEL con errores: NIT inválido, IVA incorrecto o campos faltantes | **Alta** — Determina obligatoriamente los requisitos del módulo de facturación. Su incumplimiento tiene consecuencias legales directas para LogiTrans |
| 8 | Agente Logístico / Operativo | Usuario interno del módulo de órdenes | Asignar vehículos y pilotos de forma eficiente y sin fricciones en el sistema | Procesos lentos o poco intuitivos que retrasen la planificación y asignación de recursos | **Media** — Usuario directo del módulo de órdenes de servicio. Su experiencia impacta la eficiencia operativa diaria |
| 9 | Piloto de Transporte | Usuario de campo del sistema | Registrar eventos de ruta (salida, puntos de control, entrega) de forma simple y rápida | Interfaces complejas o lentas que no funcionen bien desde dispositivos en campo | **Media** — Usuario principal del módulo de monitoreo en ruta. Su adopción determina la calidad de los datos de trazabilidad |
| 10 | Encargado de Patio | Usuario operativo en bodega | Validar identidad de la orden, peso de la carga y confirmar estiba antes del despacho | Procesos de validación lentos o complejos que retrasen la salida de las unidades | **Baja-Media** — Usuario del sub-proceso de carga de mercancía. Impacta directamente el tiempo de despacho en las tres sedes |

---

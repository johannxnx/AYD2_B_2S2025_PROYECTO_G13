# Diagrama de Bloques

![alt text](img/Diagrama%20de%20Bloques.png)

El presente diagrama de bloques representa la arquitectura general del sistema de gestión logística propuesto para LogiTrans Guatemala, S.A. La estructura del sistema se encuentra organizada bajo un enfoque modular funcional, implementado sobre un modelo de arquitectura Cliente–Servidor y estructurado bajo un estilo arquitectónico en capas.

El sistema se concibe como una plataforma centralizada que integra los procesos comerciales, operativos, financieros y estratégicos de la organización, permitiendo la digitalización completa del ciclo contractual y logístico, desde la creación del contrato hasta la certificación y cobro de la factura.

## **Enfoque Arquitectónico**

La arquitectura adopta dos principios fundamentales:

1. Arquitectura Cliente–Servidor

- El sistema opera bajo un modelo Cliente–Servidor, donde:
- Los usuarios (clientes y personal interno) acceden mediante una aplicación web.
- Las reglas de negocio, validaciones, procesos automáticos y almacenamiento de datos se ejecutan en un servidor central.
- La base de datos se encuentra centralizada y es gestionada por el servidor de aplicación.

Este enfoque permite:

- Control centralizado de la información.
- Seguridad mediante autenticación y autorización por roles.
- Escalabilidad futura.
- Mantenimiento simplificado.
- Integración con servicios externos como la validación de facturación electrónica.

2. Arquitectura Modular Funcional (Orientada a Dominios del Negocio)

El sistema está organizado en módulos funcionales alineados a los dominios del negocio, los cuales son consumidos por los diferentes actores según sus roles y permisos.

Esto significa que:

- Los módulos no pertenecen a un actor específico.
- Los actores interactúan con el sistema según sus responsabilidades organizacionales.
- El acceso está controlado mediante roles y permisos.

Esta organización garantiza:

- Separación clara de responsabilidades.
- Bajo acoplamiento entre procesos.
- Mayor mantenibilidad.
- Mejor trazabilidad de extremo a extremo.
- Alineación directa con los procesos reales de LogiTrans.

---

## **Descripción de los Módulos Funcionales**

### Módulo de Gestión Comercial

Responsable de administrar la relación contractual con los clientes.

Incluye:

- Registro y gestión centralizada de clientes.
- Creación, modificación y consulta de contratos.
- Configuración de condiciones comerciales.
- Validación automática de vigencia contractual y límite de crédito.

Este módulo regula las reglas bajo las cuales se pueden generar órdenes de servicio.

Actores que lo consumen según rol:
Agente Operativo, Área Contable, Gerencia.

### Módulo de Gestión Operativa

Administra el ciclo de vida completo de la orden de servicio.

Incluye:

- Generación de órdenes.
- Asignación de unidad y piloto.
- Validación de disponibilidad de recursos.
- Proceso de carga y despacho.
- Monitoreo en ruta.
- Confirmación de entrega con evidencia digital.

Este módulo conecta la planificación con la ejecución física del servicio.

Actores que lo consumen según rol:
Agente Logístico, Encargado de Patio, Piloto, Supervisor Operativo, Cliente Corporativo (consulta).

### Módulo de Facturación Electrónica

Gestiona la transformación de órdenes completadas en documentos fiscales válidos.

Incluye:

- Generación automática de borrador de factura.
- Validación de datos fiscales.
- Envío a certificador autorizado.
- Recepción de factura electrónica certificada.
- Almacenamiento y disponibilidad para descarga.

Este módulo cumple con los requisitos regulatorios obligatorios.

Actores que lo consumen según rol:
Agente Financiero, Departamento de Cobros, Cliente Corporativo.

### Módulo de Gestión de Pagos y Cuentas por Cobrar

Administra el control financiero posterior a la facturación.

Incluye:

- Registro de pagos recibidos.
- Asociación de pagos a facturas.
- Control de saldos pendientes.
- Seguimiento de cuentas por cobrar.
- Actualización del estado financiero del cliente.

Permite la visibilidad clara del ciclo de monetización del servicio.

Actores que lo consumen según rol:
Agente Financiero, Departamento de Cobros, Gerencia.

### Módulo de Reportes y Analítica

Consolida información operativa y financiera para la toma de decisiones.

Incluye:

- KPIs operativos.
- Análisis de rentabilidad.
- Alertas de desviaciones.
- Reportes consolidados por sede.
- Planificación de capacidad.

Transforma datos transaccionales en información estratégica.

Actores que lo consumen según rol:
Supervisor Operativo, Gerencia.

### Módulo de Gestión de Identidad y Acceso

Módulo transversal encargado de:

- Creación y administración de usuarios.
- Asignación de roles.
- Control de acceso basado en permisos.
- Autenticación y autorización.

Es utilizado por todos los módulos del sistema y garantiza seguridad y trazabilidad.

### Integración con Servicios Externos

El sistema contempla integración mediante APIs para:

- Validación y certificación de facturación electrónica.
- Interoperabilidad futura con sistemas externos (aduanas, ERPs).
- Sincronización contable.

Esto asegura cumplimiento normativo e interoperabilidad futura.

### Flujo General del Sistema

El flujo representado en el diagrama sigue una secuencia funcional:

- El módulo comercial establece las reglas contractuales.
- El módulo operativo genera y ejecuta la orden.
- El módulo operativo confirma la entrega.
- El módulo de facturación genera y certifica la factura.
- El módulo financiero registra el pago.
- El módulo de reportes consolida la información para análisis estratégico.

Esto demuestra que el sistema integra de forma continua los dominios:

- Comercial
- Operativo
- Financiero
- Estratégico

## Conclusión Arquitectónica

El diagrama de bloques evidencia que el sistema está estructurado como una plataforma cliente–servidor modular, organizada por dominios funcionales del negocio y no por actores individuales.

Los actores consumen los módulos según sus roles y permisos, garantizando:

- Control centralizado
- Consistencia de la información
- Seguridad basada en roles
- Trazabilidad completa del ciclo logístico
- Escalabilidad futura
- Preparación para integración externa

Esta arquitectura refleja fielmente los procesos reales de LogiTrans Guatemala, S.A. y se encuentra alineada con los requerimientos funcionales y no funcionales establecidos en el proyecto.

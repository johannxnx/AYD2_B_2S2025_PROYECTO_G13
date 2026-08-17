# Características del Sistema Priorizadas

La priorización de características del sistema para LogiTrans Guatemala, S.A. responde a un análisis cuidadoso de las necesidades del negocio, las restricciones técnicas y operativas, así como las expectativas de los stakeholders identificados en el DDA. El objetivo de esta sección es establecer un orden claro de importancia sobre los diferentes aspectos que deberá cubrir la nueva plataforma, asegurando que el diseño arquitectónico se enfoque en resolver primero los problemas críticos que hoy afectan la operación de la empresa.

La priorización se ha realizado considerando tres criterios fundamentales:

**Impacto en la continuidad operativa**: Qué tan crítico es el proceso para que LogiTrans pueda seguir operando sin interrupciones

**Valor de negocio**: Qué características generan mayor beneficio directo para la empresa y sus clientes

**Dependencias técnicas**: Qué funcionalidades deben existir primero para que otras puedan construirse sobre ellas

A continuación se presentan las características priorizadas del sistema, clasificadas en tres niveles de prioridad.

###  Prioridad Alta — Imprescindibles para la operación

Estas características son el núcleo del negocio de LogiTrans. Sin ellas, la plataforma no cumpliría su propósito fundamental de reemplazar los sistemas heredados y centralizar la información. Deben ser consideradas en la primera fase de construcción.

| # | Característica | Descripción | Proceso de negocio asociado | Justificación de la prioridad |
|---|---------------|------------|----------------------------|------------------------------|
| CA-01 | Gestión centralizada de clientes | Registro único de clientes con información fiscal, contactos, categoría de riesgo y credenciales de acceso a la plataforma | Gestión de Clientes y Contratos | Actualmente la información de clientes está dispersa en múltiples hojas de cálculo. Esta característica elimina la duplicidad y asegura que todos los departamentos vean la misma información. Es la base sobre la cual se construyen los contratos y las órdenes. |
| CA-02 | Formalización de contratos digitales | Registro estructurado de acuerdos comerciales incluyendo condiciones financieras (límite de crédito, plazos de pago), rutas autorizadas y tipos de carga permitidos | Gestión de Clientes y Contratos | Los contratos definen las reglas de operación con cada cliente. Sin esta característica, no es posible validar automáticamente qué servicios pueden prestarse y bajo qué condiciones tarifarias. |
| CA-03 | Parametrización de tarifarios | Configuración y gestión de tarifas por tipo de unidad (Ligera, Pesado, Tráiler) incluyendo montos base por kilómetro, límites de tonelaje y descuentos especiales | Gestión de Clientes y Contratos / Facturación | El área de contabilidad debe poder ajustar las tarifas según las necesidades del mercado. Esta característica es crítica porque impacta directamente la facturación y la rentabilidad de cada servicio. |
| CA-04 | Validación automática de vigencia y crédito | Verificación en tiempo real de contratos vigentes, límite de crédito no excedido y plazos de pago al día antes de autorizar nuevas órdenes | Gestión de Clientes y Contratos | Previene la prestación de servicios sin respaldo legal o a clientes con deudas vencidas. Activa bloqueos automáticos cuando corresponde, protegiendo la cartera de la empresa. |
| CA-05 | Generación de órdenes de servicio | Captura de datos de origen, destino, tipo de mercancía y peso, con asignación automática de tarifa según contrato vigente | Registro y Seguimiento de Órdenes | Es el proceso operativo central de LogiTrans. Cada servicio prestado comienza con una orden. Sin esta característica, el sistema no podría dar trazabilidad a las operaciones. |
| CA-06 | Asignación de recursos (unidad + piloto) | Asignación de vehículos y pilotos disponibles a cada orden, validando requisitos técnicos del vehículo y documentos vigentes del piloto | Registro y Seguimiento de Órdenes | Garantiza que cada orden tenga los recursos necesarios para ejecutarse. Es especialmente crítico para rutas internacionales futuras (El Salvador, Honduras). |
| CA-07 | Proceso de carga formalizado | Validación de identidad de la orden, registro de pesaje inicial, confirmación de estiba y checklist de seguridad antes del despacho | Registro y Seguimiento de Órdenes | Este sub-proceso asegura que la carga sale correctamente configurada y dentro de los límites permitidos para la unidad asignada. Previene multas por sobrepeso y problemas de seguridad. |
| CA-08 | Monitoreo en ruta | Registro de eventos clave por parte del piloto (salida, puntos de control, aduanas) durante el trayecto | Registro y Seguimiento de Órdenes | Sustituye las llamadas telefónicas constantes y permite que la empresa y el cliente conozcan la ubicación exacta de la carga en tiempo real. |
| CA-09 | Confirmación de entrega | Registro de finalización del servicio con evidencia digital (firma, fotografías) | Registro y Seguimiento de Órdenes | Activa automáticamente el proceso de facturación y elimina el retraso de esperar documentos físicos. |
| CA-10 | Borrador automático de factura | Preparación automática de borrador de factura al marcar la orden como entregada, reuniendo los datos del servicio | Facturación Electrónica | Elimina errores de escritura manual y acelera el ciclo de cobro. Es el primer paso del proceso de facturación. |
| CA-11 | Validación y certificación FEL | Envío de datos al certificador autorizado por la SAT, validación de NIT, formato, IVA y recepción del documento oficial con número de autorización | Facturación Electrónica | Es un requisito legal obligatorio en Guatemala. Sin esta característica, la empresa no puede emitir facturas válidas fiscalmente. |

---

### Prioridad Media — Mejoras operativas significativas

Estas características aumentan la eficiencia, proporcionan control y mejoran la experiencia de usuarios internos y externos.

| # | Característica | Descripción | Proceso de negocio asociado | Justificación de la prioridad |
|---|---------------|------------|----------------------------|------------------------------|
| CM-01 | Portal de clientes | Acceso para que los clientes puedan gestionar sus datos, crear órdenes de servicio y dar seguimiento a sus envíos | Gestión de Clientes y Contratos | Mejora la experiencia del cliente y reduce la carga operativa del personal de LogiTrans al permitir autogestión. |
| CM-02 | Historial y desempeño del cliente | Actualización automática del historial del cliente (volumen movido, puntualidad en pagos, siniestralidad) al cierre de cada servicio | Gestión de Clientes y Contratos | Proporciona a la gerencia información valiosa para renegociar contratos y evaluar rentabilidad por cliente. |
| CM-03 | Notificaciones automáticas | Disparo de notificaciones al departamento de facturación cuando una orden es entregada | Registro y Seguimiento de Órdenes / Facturación | Elimina el retraso administrativo y acelera el inicio del proceso de facturación. |
| CM-04 | Cierre y evaluación de servicio | Consolidación de tiempos reales vs planificados para alimentar indicadores de rendimiento (KPIs) | Registro y Seguimiento de Órdenes | Permite identificar cuellos de botella en rutas y mejorar la puntualidad del servicio. |
| CM-05 | Envío automático de facturas al cliente | Factura certificada enviada automáticamente al correo electrónico del cliente y almacenada en su expediente digital | Facturación Electrónica | Sustituye el envío físico de documentos y mejora la experiencia del cliente. |
| CM-06 | Módulo de pagos | Registro de pagos recibidos (forma de pago, fecha, monto, información bancaria) asociados a facturas específicas | Facturación Electrónica | Permite tener visibilidad clara de las cuentas por cobrar sin revisar archivos manuales. |
| CM-07 | Dashboard de reportes operativos | Visualización de corte de operaciones diario, medición de cumplimiento y análisis de rentabilidad | Reportes Operativos y Gerenciales | Transforma la actividad diaria en información útil para supervisores y gerencia. |
| CM-08 | Alertas de desviaciones | Detección de anomalías como rutas con exceso de consumo o clientes con baja repentina en volumen de carga | Reportes Operativos y Gerenciales | Permite actuar proactivamente antes de que un problema afecte las finanzas del mes. |

---

#  Prioridad Baja — Valor agregado y preparación futura

Estas características son importantes para la expansión regional y la evolución a largo plazo del sistema.

| # | Característica | Descripción | Proceso de negocio asociado | Justificación de la prioridad |
|---|---------------|------------|----------------------------|------------------------------|
| CB-01 | Planificación de capacidad | Proyección de camiones y pilotos adicionales necesarios basada en volumen histórico de carga | Reportes Operativos y Gerenciales | Dicta el ritmo de inversión para los próximos dos años. Importante para la expansión pero no urgente para el día 1. |
| CB-02 | APIs para integración con ERPs y aduanas | Interfaces formales para conectarse con sistemas de clientes, ERPs y sistemas de aduanas de la región | Integración Externa | Necesario para la visión de interoperabilidad, pero puede implementarse progresivamente después de la operación base. |
| CB-03 | Trazabilidad total para clientes externos | Visibilidad completa del estado de las órdenes para clientes corporativos a través del portal | Gestión de Clientes / Órdenes | Altamente valorado por los clientes, pero depende de que el monitoreo en ruta (CA-08) esté funcionando correctamente. |
| CB-04 | Configuración multi-moneda / multi-país | Preparación del sistema para manejar operaciones en El Salvador y Honduras (diferentes monedas, regulaciones, impuestos) | Expansión Regional | Requerido para la expansión en 24 meses, pero no para la operación inicial en Guatemala. |
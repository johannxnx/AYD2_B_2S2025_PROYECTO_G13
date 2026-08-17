

# Documento de decisión de Arquitectura

### Resumen Ejecutivo

El presente Documento de Decisión Arquitectónica establece los fundamentos técnicos y estratégicos que guiarán el diseño de la nueva plataforma tecnológica para LogiTrans Guatemala, S.A. Como equipo de arquitectos de software, hemos realizado un análisis profundo de las necesidades operativas, las restricciones impuestas y las expectativas de los stakeholders clave, con el objetivo de proponer una solución robusta que reemplace el actual ecosistema de sistemas heredados y herramientas aisladas.

El análisis presentado en este documento identifica las restricciones técnicas fundamentales que condicionan directamente las decisiones de diseño: la solución debe ser una aplicación web accesible desde navegador, con despliegue inicial on-premise reutilizando los servidores existentes de LogiTrans pero diseñada desde su concepción para ser cloud-ready y permitir la futura expansión regional. Adicionalmente, el sistema debe exponer APIs para integración con entes externos como la SAT y aduanas, basarse en tecnologías de código abierto para evitar licenciamientos costosos y soportar la operación simultánea de las tres sedes siendo estas; Guatemala, Quetzaltenango y Puerto Barrios sin degradación del servicio.

El documento también identifica y caracteriza a los stakeholders que ejercen influencia sobre el sistema, desde el Gerente General  y el Gerente de TI , hasta actores externos como la SAT  y usuarios operativos como pilotos y encargados de patio. Esta visión integral de los interesados asegura que las decisiones arquitectónicas respondan a un equilibrio entre las necesidades técnicas, operativas, financieras y regulatorias del proyecto, considerando además los atributos de calidad que determinarán el comportamiento del sistema ante situaciones críticas como picos de carga, fallos operativos o intentos de intrusión.

Como resultado, el DDA sienta las bases para la construcción de una plataforma centralizada que eliminará los silos informativos actuales, automatizará procesos críticos y proporcionará la escalabilidad necesaria para que LogiTrans pueda cumplir su ambicioso plan de expansión hacia El Salvador y Honduras en los próximos 24 meses. Las decisiones documentadas en este informe serán validadas mediante los diagramas arquitectónicos como el diagrama de despliegue, de bloques, entre otros y la matriz de trazabilidad correspondiente, garantizando que cada elemento del diseño responda a una necesidad debidamente justificada.


### Objetivo General

Establecer y justificar formalmente la base arquitectónica del sistema integral para LogiTrans Guatemala, S.A. Este documento tiene como propósito documentar el proceso de análisis y selección de los estilos, patrones y decisiones técnicas más críticas, asegurando que la arquitectura propuesta no solo satisfaga los requerimientos funcionales actuales, sino que esté fundamentalmente orientada a cumplir con los drivers arquitectónicos de escalabilidad, disponibilidad y seguridad. A través de este registro, se busca crear una fuente de verdad que comunique la intención del diseño a todos los stakeholders, alineando la visión estratégica del negocio con la realidad técnica de la implementación.

### Objetivos Específicos

Los objetivos específicos que guían la elaboración de este documento y, por ende, las decisiones arquitectónicas del proyecto son:

**Capturar y Priorizar los Drivers Arquitectónicos**: Identificar, analizar y documentar de manera explícita los Requisitos Funcionales (RF), los Escenarios de Atributos de Calidad (EAC) y las Restricciones técnicas y de negocio que ejercen la mayor influencia sobre la estructura del sistema de LogiTrans.

**Definir la Estrategia de Integración y Comunicación**: Documentar las decisiones relativas a cómo los futuros componentes del sistema como la Gestión de Clientes, Órdenes, Facturación, entre otros,  se comunicarán entre sí y con sistemas externos como el certificador de la SAT o futuras integraciones con aduanas, garantizando la integridad de los datos y la interoperabilidad




**Establecer las Bases para los Diagramas Arquitectónicos**: Proveer el marco conceptual y las justificaciones necesarias que serán representadas visualmente en los diagramas de Contexto, Componentes, Despliegue y Bloques, asegurando que cada elemento gráfico tenga un sustento documentado en este DDA.




**Gestionar el Riesgo Arquitectónico y los Trade-offs**: Identificar los principales riesgos técnicos (ej. puntos únicos de fallo, cuellos de botella en la base de datos) y documentar las decisiones que los mitigan. Asimismo, explicar los trade-offs o compensaciones asumidas (por ejemplo, entre el costo inicial de infraestructura y la escalabilidad futura) y cómo se alinean con las prioridades del negocio establecidas por la gerencia

**Servir como Guía para la Implementación Ágil**: Actuar como un "backlog arquitectónico" de alto nivel que oriente la creación de Historias de Usuario Técnicas en el tablero Kanban, asegurando que el desarrollo incremental no desvíe el cumplimiento de los atributos de calidad (EAC) definidos para LogiTrans
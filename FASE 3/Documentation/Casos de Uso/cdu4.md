## CDU004 Reportes Operativos y Gerenciales

Sus expandidos serían:

- CDU004.1 Corte de Operación Diario
- CDU004.2 Medición de Cumplimiento (KPIs)
- CDU004.3 Análisis de Rentabilidad
- CDU004.4 Alertas de Desviaciones
- CDU004.5 Planificación de Capacidad

### Diagrama de expandidos
 
![CDU004.png](../images/DCU_4/CDU004.png)

| **CAMPO**         | **DETALLE**                                                                                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre            | Corte de Operación Diario                                                                                                                                                                                                                   |
| Código            | CDU004.1                                                                                                                                                                                                                                    |
| Actores           | Supervisor Operativo                                                                                                                                                                                                                        |
| Descripción       | Permite consolidar todas las operaciones realizadas durante el día en las distintas sedes para obtener una visión general del rendimiento diario.                                                                                           |
| Precondiciones    | Deben existir órdenes de servicio finalizadas y facturas generadas durante el día.                                                                                                                                                          |
| Post Condiciones  | Se genera un reporte consolidado de operaciones diarias.                                                                                                                                                                                    |
| Flujo principal   | 1 El supervisor accede al módulo de reportes<br>2 El sistema agrupa todas las operaciones del día<br>3 Se muestran servicios completados, facturas emitidas e incidentes registrados                                                        |
| Flujos alternos   | FA1: No existen operaciones registradas para el día consultado<br>FA1.1 El sistema notifica que no hay registros disponibles<br>FA1.2 El supervisor selecciona una fecha distinta o cierra el módulo<br>FA1.3 Vuelve al flujo principal     |
| Reglas de negocio | El reporte debe incluir todas las sedes operativas (Guatemala, Quetzaltenango y Puerto Barrios).<br>Solo el Supervisor Operativo tiene acceso a la generación del corte diario.                                                             |
| Reglas de calidad | El reporte debe generarse en menos de 3 segundos.<br>La información mostrada debe corresponder únicamente al día consultado.                                                                                                                |

| **CAMPO**         | **DETALLE**                                                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre            | Medición de Cumplimiento (KPIs)                                                                                                                                                                                                                               |
| Código            | CDU004.2                                                                                                                                                                                                                                                      |
| Actores           | Supervisor Operativo                                                                                                                                                                                                                                          |
| Descripción       | Permite analizar los indicadores clave de rendimiento comparando los tiempos reales de entrega con los tiempos prometidos al cliente en el contrato.                                                                                                          |
| Precondiciones    | Deben existir registros de órdenes completadas con tiempos de entrega registrados.                                                                                                                                                                            |
| Post Condiciones  | Se generan indicadores de rendimiento para análisis operativo.                                                                                                                                                                                                |
| Flujo principal   | 1 El supervisor accede al panel de indicadores<br>2 El sistema calcula los tiempos reales de entrega por orden<br>3 Se comparan con los tiempos establecidos en los contratos<br>4 Se presentan los KPIs en gráficos                                          |
| Flujos alternos   | FA1: Existen órdenes con datos incompletos<br>FA1.1 El sistema muestra advertencia sobre la información faltante<br>FA1.2 El supervisor notifica al área operativa para completar los registros<br>FA1.3 Vuelve al flujo principal                            |
| Reglas de negocio | Los indicadores deben calcularse usando información histórica validada.<br>Se deben identificar rutas o aduanas con retrasos constantes.                                                                                                                      |
| Reglas de calidad | Los indicadores deben presentarse en gráficos claros y comprensibles.<br>Los datos deben actualizarse en tiempo real conforme se cierren órdenes.                                                                                                             |

| **CAMPO**         | **DETALLE**                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nombre            | Análisis de Rentabilidad                                                                                                                                                                                                                                           |
| Código            | CDU004.3                                                                                                                                                                                                                                                           |
| Actores           | Gerencia                                                                                                                                                                                                                                                           |
| Descripción       | Permite evaluar la rentabilidad de cada cliente o contrato comparando los ingresos generados contra los costos operativos asociados.                                                                                                                               |
| Precondiciones    | Deben existir facturas registradas y costos operativos (combustible, viáticos, mantenimiento) asociados a cada contrato.                                                                                                                                           |
| Post Condiciones  | Se genera un reporte financiero de rentabilidad por cliente o contrato.                                                                                                                                                                                            |
| Flujo principal   | 1 La gerencia accede al módulo de análisis de rentabilidad<br>2 El sistema cruza ingresos con gastos operativos por contrato<br>3 Se calculan los márgenes de beneficio<br>4 Se presentan los resultados por cliente o contrato                                    |
| Flujos alternos   | FA1: No existen datos de costos operativos registrados<br>FA1.1 El sistema indica que no es posible generar el análisis completo<br>FA1.2 La gerencia solicita al área correspondiente el registro de costos faltantes<br>FA1.3 Vuelve al flujo principal          |
| Reglas de negocio | El análisis debe incluir todos los gastos operativos: combustible, mantenimiento y viáticos.<br>Los resultados deben servir de base para decisiones de expansión regional.                                                                                         |
| Reglas de calidad | El reporte debe permitir exportación a formatos digitales.<br>Los datos financieros deben presentarse de forma clara y desglosada por contrato.                                                                                                                    |

| **CAMPO**         | **DETALLE**                                                                                                                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre            | Alertas de Desviaciones                                                                                                                                                                                                                             |
| Código            | CDU004.4                                                                                                                                                                                                                                            |
| Actores           | Gerencia                                                                                                                                                                                                                                            |
| Descripción       | Detecta anomalías en la operación, como retrasos constantes en rutas, exceso de consumo de combustible o reducción repentina en el volumen de carga de un cliente.                                                                                 |
| Precondiciones    | Deben existir datos históricos de operaciones y umbrales configurados en el sistema.                                                                                                                                                                |
| Post Condiciones  | Se generan alertas automáticas para revisión gerencial.                                                                                                                                                                                             |
| Flujo principal   | 1 El sistema analiza patrones operativos de forma automática<br>2 Identifica desviaciones respecto a los umbrales configurados<br>3 Genera alertas y las notifica a la gerencia en tiempo real                                                      |
| Flujos alternos   | FA1: No se detectan desviaciones en el período analizado<br>FA1.1 El sistema indica que la operación se encuentra dentro de parámetros normales<br>FA1.2 La gerencia cierra el módulo de alertas sin acción requerida                               |
| Reglas de negocio | Las alertas deben basarse en umbrales configurables por la gerencia.<br>El sistema debe diferenciar entre alertas críticas y advertencias menores.                                                                                                  |
| Reglas de calidad | Las alertas deben notificarse en tiempo real.<br>El historial de alertas debe quedar registrado para auditoría posterior.                                                                                                                            |

| **CAMPO**         | **DETALLE**                                                                                                                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nombre            | Planificación de Capacidad                                                                                                                                                                                                                      |
| Código            | CDU004.5                                                                                                                                                                                                                                        |
| Actores           | Gerencia                                                                                                                                                                                                                                        |
| Descripción       | Permite proyectar la demanda futura de transporte con base en el volumen histórico, para planificar la adquisición de recursos como camiones y pilotos adicionales.                                                                             |
| Precondiciones    | Deben existir datos históricos suficientes de transporte y carga movida en los últimos meses.                                                                                                                                                   |
| Post Condiciones  | Se genera una proyección de capacidad operativa para los próximos períodos.                                                                                                                                                                     |
| Flujo principal   | 1 El gerente accede al módulo de planificación de capacidad<br>2 El sistema analiza el volumen de carga histórico<br>3 Se calculan proyecciones de demanda futura<br>4 Se presentan los resultados mediante gráficos predictivos                |
| Flujos alternos   | FA1: Los datos históricos son insuficientes para generar una proyección confiable<br>FA1.1 El sistema notifica que se requiere mayor información histórica<br>FA1.2 El gerente ajusta el rango de fechas o cierra el módulo                     |
| Reglas de negocio | Las proyecciones deben considerar tendencias históricas y estacionalidad.<br>Los resultados deben servir como base para el plan de inversión de los próximos dos años.                                                                          |
| Reglas de calidad | Los resultados deben presentarse mediante gráficos predictivos claros.<br>Las proyecciones deben poder exportarse en formato digital para su análisis externo.                                                                                  |

### Matrices de trazabilidad

|                      | CDU004.1 | CDU004.2 | CDU004.3 | CDU004.4 | CDU004.5 |
| -------------------- | -------- | -------- | -------- | -------- | -------- |
| Supervisor Operativo | X        | X        |          |          |          |
| Gerencia             |          |          | X        | X        | X        |

| **Stakeholder**      | **Descripción**                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| Supervisor Operativo | Responsable de monitorear el rendimiento diario de las operaciones logísticas en las distintas sedes.   |
| Gerencia             | Utiliza la información generada por los reportes para tomar decisiones estratégicas y de inversión.     |
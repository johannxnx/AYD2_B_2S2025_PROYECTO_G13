# Documentación General de Pruebas de Carga

## LogiTrans Guatemala, S.A. - Fase 3

---

## 1. ¿Qué son las Pruebas de Carga?

Las **pruebas de carga** son un tipo de prueba de rendimiento de software que evalúa el comportamiento de una aplicación cuando se somete a una carga específica de usuarios, transacciones o peticiones simultáneas.

### 1.1 Objetivos de las Pruebas de Carga

| Objetivo | Descripción |
|----------|-------------|
| **Medir tiempos de respuesta** | Evaluar la latencia de los endpoints bajo demanda |
| **Identificar cuellos de botella** | Detectar componentes que limitan el rendimiento |
| **Validar umbrales de rendimiento** | Verificar que el sistema cumple con los SLA establecidos |
| **Determinar capacidad máxima** | Conocer el límite de usuarios/transacciones que soporta el sistema |
| **Evaluar estabilidad** | Verificar que el sistema se comporta consistentemente bajo carga |

### 1.2 Tipos de Pruebas de Rendimiento

| Tipo | Descripción | Aplicación en el Proyecto |
|------|-------------|---------------------------|
| **Prueba de Carga** | Evalúa el sistema bajo demanda esperada | Creación de pilotos, contratos, órdenes |
| **Prueba de Estrés** | Evalúa el sistema bajo condiciones extremas | Picos de 300 TPS |
| **Prueba de Resistencia** | Evalúa el sistema durante períodos prolongados | Simulación de 1,000 operaciones |

---

## 2. Framework Utilizado: K6

### 2.1 ¿Qué es K6?

**K6** es una herramienta de prueba de carga de código abierto desarrollada por Grafana Labs. Está diseñada para ser fácil de usar, extensible y orientada a DevOps.

### 2.2 Características Principales

| Característica | Descripción |
|----------------|-------------|
| **Código abierto** | Gratuito y con comunidad activa |
| **Scripts en JavaScript** | Fácil de aprender y escribir |
| **Alto rendimiento** | Escrito en Go, puede generar millones de peticiones |
| **Métricas detalladas** | Tiempos de respuesta, percentiles, tasas de error |
| **Arquitectura basada en VUs** | Virtual Users para simular concurrencia real |

### 2.3 Ventajas de K6 para el Proyecto

| Ventaja | Beneficio |
|---------|-----------|
| **Simulación sin base de datos** | Permite probar sin ensuciar datos reales |
| **Scripts reutilizables** | Misma estructura para diferentes pruebas |
| **Métricas personalizadas** | Adaptadas a las necesidades de LogiTrans |
| **Generación de JSON** | Fácil integración con reportes |
| **Ejecución local** | No requiere infraestructura en la nube |

---

## 3. Instalación y Configuración

### 3.1 Instalación de K6

#### Windows (PowerShell como Administrador) o ubuntu
```powershell

EN WINDOWS

winget install k6


EN LINUX 

sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 4. Estructuracion de Pruebas 

```bash
Proyecto/
├── Prueba1/
│   ├── load-test-create-pilotos.js      # Prueba 1: Creación de pilotos
│   └── resultados/
│       ├── pilotos-1000-generados.json
│       └── resumen-pilotos-1000.json
│
├── Prueba2/
│   ├── contratos-generator-1000.js      # Prueba 2: Generación de contratos
│   └── resultados/
│       ├── contratos-1000-generados.json
│       └── resumen-contratos-1000.json
│
├── Prueba3/
│   ├── ordenes-load-test.js             # Prueba 3: Órdenes con control de crédito
│   └── resultados/
│       └── ordenes-resultado.json
│
├── Prueba4/
│   ├── flujo-completo-simulado.js       # Prueba 4: Flujo Cliente + Operativo
│   └── resultados/
│       ├── flujo-simulado-resultado.json
│       └── resumen-flujo-simulado.json
│
└── Prueba5/
    ├── piloto-flujo-simulado.js         # Prueba 5: Flujo del Piloto
    └── resultados/
        ├── piloto-flujo-resultado.json
        └── resumen-piloto-flujo.json
```


# Flujo completo del sistema

Este es el flujo real.

---

# FASE 1 — CONFIGURACIÓN

Finanzas define tarifas base.

Ejemplo:

```
Ligero = Q8/km
Pesado = Q12.5/km
Cabezal = Q18/km
```

Esto es **solo configuración del sistema**.

---

# FASE 2 — REGISTRAR CLIENTE

Se registra empresa.

Ejemplo:

```
Empresa: Distribuidora Norte
NIT: 1234567890123
Riesgo: Medio
```

---

# FASE 3 — CREAR CONTRATO

El operario crea contrato.

El contrato define:

```
tarifas
rutas
peso máximo
crédito
descuentos
vigencia
```

Ejemplo:

```
cliente: Distribuidora Norte
ruta: Puerto Barrios → Xela
camión: Ligero
peso máximo: 3.5 ton
descuento: 10%
crédito: Q50,000
vigencia: 1 año
```

---

# FASE 4 — CLIENTE PIDE UN SERVICIO

Ahora sí el cliente pide transporte.

Ejemplo:

```
origen: Puerto Barrios
destino: Xela
peso: 2.5 ton
tipo camión: ligero
```

---

# VALIDACIONES DEL SISTEMA

Antes de aceptar el pedido el sistema verifica:

### 1 contrato vigente

```
fecha_actual < contrato_fin
```

---

### 2 crédito disponible

Ejemplo:

```
crédito = 50,000
deuda = 45,000
```

Solo puede pedir servicios por **5,000 más**.

---

### 3 ruta permitida

Debe estar en el contrato.

---

Si todo está bien:

Se crea una

```
ORDEN DE SERVICIO
```

---

# FASE 5 — VALIDACIÓN DE PESO

Cuando llega el camión al patio.

Se pesa la carga.

Regla:

```
peso_real <= capacidad_camión
```

Ejemplo:

```
camión ligero = 3.5 ton
peso = 2.8 ton
```

✔ permitido.

---

# FASE 6 — CAMBIO DE ESTADOS

La orden tiene estados.

```
Registrada
↓
Listo para despacho
↓
En tránsito
↓
Entregado
```

---

# FASE 7 — BITÁCORA

El piloto registra eventos.

Ejemplo:

```
10:00 salida
13:00 aduana
16:00 llegada
```

---

# FASE 8 — ENTREGA

Se registra:

```
firma cliente
foto
hora
```

---

# FASE 9 — FACTURA

El sistema crea factura automáticamente.

Fórmula:

```
(distancia * tarifa) - descuento + IVA
```

Ejemplo:

```
350 km * 8 = 2800
descuento 10% = 2520
IVA 12% = 2822.4
```

---

# FASE 10 — FEL

El sistema genera un

```
UUID
```

(simulación SAT).

---

# FASE 11 — PAGO

Finanzas registra pago.

```
transferencia
cheque
```

El sistema reduce deuda.

---

# FASE 12 — DASHBOARD

Gerencia ve:

```
ingresos
viajes
facturas
rentabilidad
```

---

# 6. Tipos de usuarios del sistema

Para el MVP yo usaría **4 usuarios**.

---

### 👤 Cliente

Puede:

```
pedir transporte
ver estado del envío
ver facturas
```

---

### 👨‍💼 Operador / Comercial

Puede:

```
crear clientes
crear contratos
crear órdenes
```

---

### 💰 Finanzas

Puede:

```
generar facturas
certificar FEL
registrar pagos
```

---

### 👨‍💻 Gerencia

Puede ver:

```
dashboard
KPIs
reportes
```

---

# 7. Flujo visual del sistema

Esto resume todo.

```
CONFIGURACIÓN TARIFAS
        ↓
REGISTRO CLIENTE
        ↓
CREAR CONTRATO
        ↓
CLIENTE PIDE SERVICIO
        ↓
VALIDACIÓN CONTRATO + CRÉDITO
        ↓
CREAR ORDEN
        ↓
PESAJE
        ↓
DESPACHO
        ↓
EN TRÁNSITO
        ↓
ENTREGA
        ↓
GENERAR FACTURA
        ↓
CERTIFICAR FEL
        ↓
PAGO
        ↓
DASHBOARD
```

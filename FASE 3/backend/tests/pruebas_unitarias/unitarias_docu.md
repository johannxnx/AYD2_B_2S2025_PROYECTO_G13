# Documentación de Pruebas Unitarias

## Ejecución de Pruebas

```bash
npm test
```

## Resumen General

Se ejecutaron pruebas unitarias sobre distintos módulos del sistema
backend utilizando **Mocha, Chai y Sinon**.

### Resultado General

- Total de pruebas: **13**
- Pruebas exitosas: **13**
- Pruebas fallidas: **0**
- Tiempo total: **1 segundo aprox.**

---

## 1. Contrato Controller

### Prueba 1: Validación de campos obligatorios

**Esperado:** Retornar error 400 si falta `cliente_id`.\
**Obtenido:** Se retorna correctamente status 400 y mensaje indicando
campo obligatorio.

### Prueba 2: Creación exitosa

**Esperado:** Retornar 201 con datos del contrato creado.\
**Obtenido:** Se retorna correctamente el contrato con ID esperado.

### Prueba 3: Error del servicio

**Esperado:** Retornar 500 si el servicio falla.\
**Obtenido:** Se maneja correctamente el error y se devuelve mensaje
adecuado.

---

## 2. Facturación Service

### Prueba 1: Factura inexistente

**Esperado:** Error 404.\
**Obtenido:** Se lanza correctamente el error con mensaje adecuado.

### Prueba 2: Estado inválido

**Esperado:** Error 422 si no está VALIDADA.\
**Obtenido:** Validación correcta del estado.

### Prueba 3: Certificación completa

**Esperado:** - Certificar factura - Crear cuenta por cobrar -
Actualizar saldo - Registrar movimiento

**Obtenido:** - UUID generado correctamente - Cuenta por cobrar
creada - Saldo actualizado (500 → 600) - Movimiento registrado

---

## 3. Auth Controller

### Prueba 1: Login exitoso

**Esperado:** Retornar token y datos del usuario.\
**Obtenido:** Respuesta correcta con token y estructura esperada.

### Prueba 2: Credenciales inválidas

**Esperado:** Error 401.\
**Obtenido:** Manejo correcto del error.

---

## 4. Orden Controller

### Prueba 1: Usuario con órdenes

**Esperado:** Lista de órdenes.\
**Obtenido:** Se devuelven correctamente 2 órdenes.

### Prueba 2: Usuario sin órdenes

**Esperado:** Lista vacía.\
**Obtenido:** Se maneja correctamente sin errores.

---

## 5. Usuario Controller

### Prueba 1: Actualización exitosa

**Esperado:** Status 200 y datos actualizados.\
**Obtenido:** Usuario actualizado correctamente.

### Prueba 2: Error del servicio

**Esperado:** Error controlado.\
**Obtenido:** Se retorna mensaje adecuado.

### Prueba 3: Usuario inexistente en request

**Esperado:** Manejo seguro con valor null.\
**Obtenido:** Se ejecuta correctamente sin fallos.

---

## Conclusión

Las pruebas unitarias validan correctamente:

- Validaciones de entrada
- Manejo de errores
- Integración entre controlador y servicio
- Lógica de negocio en facturación
- Seguridad en autenticación

El sistema presenta un comportamiento estable en todos los escenarios
evaluados.

---

## Estado del sistema

Sistema funcional\
 Pruebas completas\
 Listo para integración y despliegue

CREATE TABLE usuarios (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nit NVARCHAR(13) NOT NULL,
    nombre NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    telefono NVARCHAR(20) NULL,
    password_hash NVARCHAR(255) NOT NULL,
    tipo_usuario NVARCHAR(30) NOT NULL CHECK (tipo_usuario IN ('CLIENTE_CORPORATIVO','AGENTE_OPERATIVO','AGENTE_LOGISTICO','AGENTE_FINANCIERO','ENCARGADO_PATIO','AREA_CONTABLE','GERENCIA','PILOTO')),
    estado NVARCHAR(10) NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO','INACTIVO','BLOQUEADO')),
    fecha_registro DATETIME2 NOT NULL DEFAULT GETDATE(),
    creado_por INT NULL,
    CONSTRAINT FK_usuarios_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

CREATE TABLE riesgo_cliente (
    id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT NOT NULL,
    riesgo_capacidad_pago NVARCHAR(5) NOT NULL CHECK (riesgo_capacidad_pago IN ('BAJO','MEDIO','ALTO')),
    riesgo_lavado_dinero NVARCHAR(5) NOT NULL CHECK (riesgo_lavado_dinero IN ('BAJO','MEDIO','ALTO')),
    riesgo_aduanas NVARCHAR(5) NOT NULL CHECK (riesgo_aduanas IN ('BAJO','MEDIO','ALTO')),
    riesgo_mercancia NVARCHAR(5) NOT NULL CHECK (riesgo_mercancia IN ('BAJO','MEDIO','ALTO')),
    fecha_evaluacion DATETIME2 NOT NULL DEFAULT GETDATE(),
    evaluado_por INT NOT NULL,
    CONSTRAINT FK_riesgo_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    CONSTRAINT FK_riesgo_evaluado_por FOREIGN KEY (evaluado_por) REFERENCES usuarios(id)
);

CREATE TABLE tarifario (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tipo_unidad NVARCHAR(10) NOT NULL UNIQUE CHECK (tipo_unidad IN ('LIGERA','PESADA','CABEZAL')),
    limite_peso_ton DECIMAL(5,2) NOT NULL,
    costo_base_km DECIMAL(10,2) NOT NULL,
    activo BIT NOT NULL DEFAULT 1,
    actualizado_por INT NOT NULL,
    fecha_actualizacion DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_tarifario_actualizado_por FOREIGN KEY (actualizado_por) REFERENCES usuarios(id)
);

CREATE TABLE vehiculos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tarifario_id INT NULL, 
    placa NVARCHAR(20) NOT NULL UNIQUE,
    estado NVARCHAR(15) NOT NULL DEFAULT 'DISPONIBLE' CHECK (estado IN ('DISPONIBLE','ASIGNADO','MANTENIMIENTO')),
    activo BIT NOT NULL DEFAULT 1,
    creado_por INT NOT NULL,
    CONSTRAINT FK_tarifario_id FOREIGN KEY (tarifario_id) REFERENCES tarifario(id),
    CONSTRAINT FK_vehiculos_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

CREATE TABLE contratos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    numero_contrato NVARCHAR(50) NOT NULL UNIQUE,
    cliente_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado NVARCHAR(15) NOT NULL DEFAULT 'VIGENTE' CHECK (estado IN ('VIGENTE','EXPIRADO','SUSPENDIDO')),
    limite_credito DECIMAL(15,2) NOT NULL,
    saldo_usado DECIMAL(15,2) NOT NULL DEFAULT 0,
    plazo_pago INT NOT NULL CHECK (plazo_pago IN (15,30,45)),
    creado_por INT NOT NULL,
    fecha_creacion DATETIME2 NOT NULL DEFAULT GETDATE(),
    modificado_por INT NULL,
    fecha_modificacion DATETIME2 NULL,
    CONSTRAINT FK_contratos_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    CONSTRAINT FK_contratos_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id),
    CONSTRAINT FK_contratos_modificado_por FOREIGN KEY (modificado_por) REFERENCES usuarios(id)
);

CREATE TABLE contrato_tarifas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id INT NOT NULL,
    tarifario_id INT NOT NULL,
    costo_km_negociado DECIMAL(10,2) NOT NULL,
    CONSTRAINT FK_contrato_tarifas_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id),
    CONSTRAINT FK_contrato_tarifas_tarifario FOREIGN KEY (tarifario_id) REFERENCES tarifario(id),
    CONSTRAINT UQ_contrato_tarifas UNIQUE (contrato_id, tarifario_id)
);

CREATE TABLE descuentos_contrato (
    id INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id INT NOT NULL,
    tipo_unidad NVARCHAR(10) NOT NULL CHECK (tipo_unidad IN ('LIGERA','PESADA','CABEZAL')),
    porcentaje_descuento DECIMAL(5,2) NOT NULL,
    autorizado_por INT NOT NULL,
    fecha_autorizacion DATETIME2 NOT NULL DEFAULT GETDATE(),
    observacion NVARCHAR(500) NULL,
    CONSTRAINT FK_descuentos_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id),
    CONSTRAINT FK_descuentos_autorizado_por FOREIGN KEY (autorizado_por) REFERENCES usuarios(id)
);

CREATE TABLE rutas_autorizadas (
    id INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id INT NOT NULL,
    origen NVARCHAR(100) NOT NULL,
    destino NVARCHAR(100) NOT NULL,
    distancia_km DECIMAL(10,2) NULL,
    tipo_carga NVARCHAR(100) NULL,
    activa BIT NOT NULL DEFAULT 1,
    CONSTRAINT FK_rutas_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id)
);

CREATE TABLE ordenes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    numero_orden NVARCHAR(50) NOT NULL UNIQUE,
    cliente_id INT NOT NULL,
    contrato_id INT NOT NULL,
    origen NVARCHAR(100) NOT NULL,
    destino NVARCHAR(100) NOT NULL,
    tipo_mercancia NVARCHAR(100) NOT NULL,
    peso_estimado DECIMAL(10,2) NOT NULL,
    tiempo_estimado DECIMAL(16,2) NOT NULL,
    peso_real DECIMAL(10,2) NULL,
    tarifa_aplicada DECIMAL(10,2) NULL,
    costo numeric(10,2) NOT NULL,
    estado NVARCHAR(30) NOT NULL DEFAULT 'PENDIENTE_PLANIFICACION' CHECK (estado IN ('PENDIENTE_PLANIFICACION','PLANIFICADA','LISTO_DESPACHO','EN_TRANSITO','ENTREGADA','CERRADA')),
    vehiculo_id INT NULL,
    piloto_id INT NULL,
    fecha_creacion DATETIME2 NOT NULL DEFAULT GETDATE(),
    fecha_despacho DATETIME2 NULL,
    fecha_entrega DATETIME2 NULL,
    creado_por INT NOT NULL,
    CONSTRAINT FK_ordenes_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    CONSTRAINT FK_ordenes_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id),
    CONSTRAINT FK_ordenes_vehiculo FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
    CONSTRAINT FK_ordenes_piloto FOREIGN KEY (piloto_id) REFERENCES usuarios(id),
    CONSTRAINT FK_ordenes_creado_por FOREIGN KEY (creado_por) REFERENCES usuarios(id)
);

CREATE TABLE orden_checklist (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orden_id INT NOT NULL,
    item NVARCHAR(255) NOT NULL,
    completado BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_checklist_orden FOREIGN KEY (orden_id) REFERENCES ordenes(id)
);

CREATE TABLE orden_eventos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orden_id INT NOT NULL,
    piloto_id INT NULL,
    tipo_evento NVARCHAR(15) NOT NULL CHECK (tipo_evento IN ('NORMAL','INCIDENTE','RETRASO','CRITICO')),
    descripcion NVARCHAR(1000) NOT NULL,
    genera_retraso BIT NOT NULL DEFAULT 0,
    fecha_hora DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_eventos_orden FOREIGN KEY (orden_id) REFERENCES ordenes(id)
    CONSTRAINT FK_orden_eventos_piloto FOREIGN KEY (piloto_id) REFERENCES usuarios(id)
);

CREATE TABLE orden_evidencias (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orden_id INT NOT NULL,
    url_archivo NVARCHAR(500) NOT NULL,
    fecha_subida DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_evidencias_orden FOREIGN KEY (orden_id) REFERENCES ordenes(id)
);

CREATE TABLE orden_kpi (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orden_id INT NOT NULL,
    tiempo_planificado INT NOT NULL,
    tiempo_real INT NULL,
    retraso INT NULL,
    fecha_calculo DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_kpi_orden FOREIGN KEY (orden_id) REFERENCES ordenes(id)
);

CREATE TABLE historial_cliente (
    id INT IDENTITY(1,1) PRIMARY KEY,
    cliente_id INT NOT NULL,
    orden_id INT NOT NULL,
    volumen_carga_ton DECIMAL(10,2) NOT NULL,
    monto_facturado DECIMAL(15,2) NOT NULL,
    gasto_operativo DECIMAL(15,2) NOT NULL,
    pago_puntual BIT NOT NULL,
    siniestro BIT NOT NULL DEFAULT 0,
    descripcion_siniestro NVARCHAR(1000) NULL,
    fecha_registro DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_historial_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    CONSTRAINT FK_historial_orden FOREIGN KEY (orden_id) REFERENCES ordenes(id)
);

CREATE TABLE notificaciones (
    id INT IDENTITY(1,1) PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo NVARCHAR(20) NOT NULL CHECK (tipo IN ('FACTURACION','EVENTO_CRITICO')),
    mensaje NVARCHAR(1000) NOT NULL,
    fecha DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_notificaciones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE facturas_fel (
    id INT IDENTITY(1,1) PRIMARY KEY,
    orden_id INT NOT NULL,
    cliente_id INT NOT NULL,
    contrato_id INT NOT NULL,
    numero_factura NVARCHAR(50) NOT NULL UNIQUE,
    tipo_documento NVARCHAR(10) NOT NULL DEFAULT 'FEL',
    estado NVARCHAR(15) NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR','VALIDADA','CERTIFICADA','ANULADA')),
    distancia_km DECIMAL(10,2) NOT NULL,
    tarifa_aplicada DECIMAL(10,2) NOT NULL,
    descuento_aplicado DECIMAL(15,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(15,2) NOT NULL,
    iva DECIMAL(15,2) NOT NULL,
    total_factura DECIMAL(15,2) NOT NULL,
    nit_cliente NVARCHAR(13) NOT NULL,
    nombre_cliente_facturacion NVARCHAR(255) NOT NULL,
    fecha_emision DATETIME2 NOT NULL DEFAULT GETDATE(),
    fecha_certificacion DATETIME2 NULL,
    certificado_por INT NULL,
    uuid_autorizacion NVARCHAR(100) NULL,
    xml_fel NVARCHAR(MAX) NULL,
    pdf_fel_url NVARCHAR(500) NULL,
    observaciones NVARCHAR(1000) NULL,
    CONSTRAINT FK_facturas_orden FOREIGN KEY (orden_id) REFERENCES ordenes(id),
    CONSTRAINT FK_facturas_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    CONSTRAINT FK_facturas_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id),
    CONSTRAINT FK_facturas_certificado_por FOREIGN KEY (certificado_por) REFERENCES usuarios(id)
);

CREATE TABLE validacion_fel (
    id INT IDENTITY(1,1) PRIMARY KEY,
    factura_id INT NOT NULL,
    nit_validado NVARCHAR(13) NOT NULL,
    nit_valido BIT NOT NULL,
    campos_obligatorios_completos BIT NOT NULL,
    resultado_validacion NVARCHAR(10) NOT NULL CHECK (resultado_validacion IN ('APROBADA','RECHAZADA')),
    mensaje_validacion NVARCHAR(500) NOT NULL,
    uuid_generado NVARCHAR(100) NULL,
    fecha_validacion DATETIME2 NOT NULL DEFAULT GETDATE(),
    validado_por INT NOT NULL,
    CONSTRAINT FK_validacion_factura FOREIGN KEY (factura_id) REFERENCES facturas_fel(id),
    CONSTRAINT FK_validacion_usuario FOREIGN KEY (validado_por) REFERENCES usuarios(id)
);

CREATE TABLE cuentas_por_cobrar (
    id INT IDENTITY(1,1) PRIMARY KEY,
    factura_id INT NOT NULL,
    cliente_id INT NOT NULL,
    contrato_id INT NOT NULL,
    monto_original DECIMAL(15,2) NOT NULL,
    saldo_pendiente DECIMAL(15,2) NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado_cobro NVARCHAR(10) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado_cobro IN ('PENDIENTE','PAGADA','VENCIDA','ANULADA')),
    ultima_fecha_pago DATE NULL,
    creado_automaticamente BIT NOT NULL DEFAULT 0,
    observaciones NVARCHAR(1000) NULL,
    CONSTRAINT FK_cxc_factura FOREIGN KEY (factura_id) REFERENCES facturas_fel(id),
    CONSTRAINT FK_cxc_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    CONSTRAINT FK_cxc_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id)
);

CREATE TABLE pagos_factura (
    id INT IDENTITY(1,1) PRIMARY KEY,
    factura_id INT NOT NULL,
    cuenta_por_cobrar_id INT NOT NULL,
    cliente_id INT NOT NULL,
    forma_pago NVARCHAR(15) NOT NULL CHECK (forma_pago IN ('CHEQUE','TRANSFERENCIA')),
    monto_pagado DECIMAL(15,2) NOT NULL,
    fecha_hora_pago DATETIME2 NOT NULL,
    banco_origen NVARCHAR(100) NOT NULL,
    cuenta_origen NVARCHAR(50) NOT NULL,
    numero_autorizacion_bancaria NVARCHAR(100) NOT NULL,
    registrado_por INT NOT NULL,
    fecha_registro DATETIME2 NOT NULL DEFAULT GETDATE(),
    observacion NVARCHAR(500) NULL,
    CONSTRAINT FK_pagos_factura FOREIGN KEY (factura_id) REFERENCES facturas_fel(id),
    CONSTRAINT FK_pagos_cxc FOREIGN KEY (cuenta_por_cobrar_id) REFERENCES cuentas_por_cobrar(id),
    CONSTRAINT FK_pagos_cliente FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    CONSTRAINT FK_pagos_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

CREATE TABLE movimientos_credito_contrato (
    id INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id INT NOT NULL,
    factura_id INT NOT NULL,
    pago_id INT NULL,
    tipo_movimiento NVARCHAR(6) NOT NULL CHECK (tipo_movimiento IN ('CARGO','ABONO')),
    monto_movimiento DECIMAL(15,2) NOT NULL,
    saldo_anterior DECIMAL(15,2) NOT NULL,
    saldo_nuevo DECIMAL(15,2) NOT NULL,
    motivo NVARCHAR(500) NOT NULL,
    fecha_movimiento DATETIME2 NOT NULL DEFAULT GETDATE(),
    registrado_por INT NOT NULL,
    CONSTRAINT FK_movimientos_contrato FOREIGN KEY (contrato_id) REFERENCES contratos(id),
    CONSTRAINT FK_movimientos_factura FOREIGN KEY (factura_id) REFERENCES facturas_fel(id),
    CONSTRAINT FK_movimientos_pago FOREIGN KEY (pago_id) REFERENCES pagos_factura(id),
    CONSTRAINT FK_movimientos_registrado_por FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

CREATE TABLE auditoria (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tabla_afectada NVARCHAR(100) NOT NULL,
    accion NVARCHAR(10) NOT NULL CHECK (accion IN ('CREATE','UPDATE','DELETE','READ')),
    registro_id INT NOT NULL,
    usuario_id INT NOT NULL,
    descripcion NVARCHAR(1000) NULL,
    datos_anteriores NVARCHAR(MAX) NULL,
    datos_nuevos NVARCHAR(MAX) NULL,
    ip_origen NVARCHAR(45) NULL,
    fecha_hora DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_auditoria_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

// Prueba de carga: Generación de órdenes con control de crédito
// Archivo: ordenes-load-test.js

import http from 'k6/http';
import { sleep } from 'k6';
import { Trend, Rate, Counter, Gauge } from 'k6/metrics';

const API_URL = 'http://localhost:3001';

// Credenciales del cliente específico
const LOGIN_CREDENTIALS = {
  email: 'probando@logitrans.com',
  password: '123456'
};

// Endpoints
const LOGIN_ENDPOINT = '/api/auth/login';
const CONTRATOS_ENDPOINT = '/api/contratos/cliente/36';

// Datos del cliente
const CLIENTE_ID = 36;
const CLIENTE_NOMBRE = 'Jens Prueba';
const CLIENTE_EMAIL = LOGIN_CREDENTIALS.email;

// Rutas estáticas (solo estas dos)
const RUTAS = [
  { 
    id: 1, 
    origen: 'Puerto Barrios', 
    destino: 'Guatemala', 
    distancia_km: 300,
    tipo_carga: 'GENERAL',
    costo_por_km: 5.00,
    nombre: 'Puerto Barrios → Guatemala'
  },
  { 
    id: 2, 
    origen: 'Quetzaltenango', 
    destino: 'Guatemala', 
    distancia_km: 200,
    tipo_carga: 'GENERAL',
    costo_por_km: 5.00,
    nombre: 'Quetzaltenango → Guatemala'
  }
];

// Métricas
const loginDuration = new Trend('login_duration', true);
const getContratosDuration = new Trend('get_contratos_duration', true);
const errorRate = new Rate('error_rate');
const ordenesCreadas = new Counter('ordenes_creadas');
const creditosInsuficientesMetric = new Counter('creditos_insuficientes');

// Métricas para almacenar el estado final
const limiteTotalMetric = new Gauge('limite_total');
const saldoUsadoInicialMetric = new Gauge('saldo_usado_inicial');
const creditoDisponibleFinalMetric = new Gauge('credito_disponible_final');
const ordenesGeneradasTotal = new Gauge('ordenes_generadas_total');
const creditosInsuficientesTotal = new Gauge('creditos_insuficientes_total');
const totalNuevasOrdenesGastado = new Gauge('total_nuevas_ordenes_gastado');

// Configuración de la prueba - 1000 ÓRDENES
export const options = {
  scenarios: {
    generate_ordenes_credito: {
      executor: 'per-vu-iterations',
      vus: 20,          // 20 usuarios virtuales
      iterations: 50,   // 20 VUs x 50 iteraciones = 1000 órdenes
      maxDuration: '10m', // Aumentado a 10 minutos
    },
  },
  thresholds: {
    error_rate: ['rate<0.05'],
    login_duration: ['p(95)<3000'],
    get_contratos_duration: ['p(95)<2000'],
  },
};

// Contador global para progreso
let ordenesGeneradasGlobal = 0;
let creditosInsuficientesGlobal = 0;

// Variables que se acumularán
let limiteTotal = 0;
let saldoUsadoInicial = 0;
let creditoDisponible = 0;
let totalGastadoEnNuevasOrdenes = 0;
let inicializado = false;

// Login para obtener token
function login() {
  const loginStart = new Date();
  const loginPayload = JSON.stringify(LOGIN_CREDENTIALS);
  
  const response = http.post(`${API_URL}${LOGIN_ENDPOINT}`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });
  
  const loginEnd = new Date();
  loginDuration.add(loginEnd - loginStart);
  
  if (response.status === 200) {
    try {
      const body = response.json();
      const token = body.data?.token || body.token;
      if (token) {
        return token;
      }
    } catch (e) {
      console.log(`Error parsing login response: ${e}`);
    }
  }
  console.log(` Login fallido con status: ${response.status}`);
  errorRate.add(1);
  return null;
}

// Obtener contratos del cliente
function getContratos(token) {
  const startTime = new Date();
  
  const response = http.get(`${API_URL}${CONTRATOS_ENDPOINT}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  const endTime = new Date();
  getContratosDuration.add(endTime - startTime);
  
  if (response.status === 200) {
    try {
      const body = response.json();
      if (body.ok && body.data && Array.isArray(body.data)) {
        return body.data;
      }
    } catch (e) {
      console.log(`Error parsing contratos: ${e}`);
    }
  }
  return [];
}

// Inicializar crédito
function inicializarCredito() {
  if (inicializado) {
    return true;
  }
  
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         INICIALIZANDO CRÉDITO DEL CLIENTE                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  const token = login();
  if (!token) {
    console.log(' No se pudo obtener token');
    return false;
  }
  
  const contratos = getContratos(token);
  
  if (contratos.length > 0) {
    let limiteTotalTemp = 0;
    let saldoUsadoTemp = 0;
    
    contratos.forEach(contrato => {
      if (contrato.estado === 'VIGENTE' || contrato.estado === 'ACTIVO') {
        limiteTotalTemp += parseFloat(contrato.limite_credito || 0);
        saldoUsadoTemp += parseFloat(contrato.saldo_usado || 0);
      }
    });
    
    limiteTotal = limiteTotalTemp;
    saldoUsadoInicial = saldoUsadoTemp;
    creditoDisponible = limiteTotalTemp - saldoUsadoTemp;
    totalGastadoEnNuevasOrdenes = 0;
    
    console.log('\n┌────────────────────────────────────────────────────────┐');
    console.log('│           ESTADO INICIAL DEL CLIENTE                   │');
    console.log('├────────────────────────────────────────────────────────┤');
    console.log(`│  LÍMITE TOTAL:                    Q${limiteTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} │`);
    console.log(`│  SALDO USADO (anterior):          Q${saldoUsadoInicial.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} │`);
    console.log(`│  CRÉDITO DISPONIBLE:              Q${creditoDisponible.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} │`);
    console.log('└────────────────────────────────────────────────────────┘');
    
    console.log('\n DETALLE DE CONTRATOS:');
    contratos.forEach((c, idx) => {
      console.log(`   ${idx + 1}. ${c.numero_contrato} | Límite: Q${parseFloat(c.limite_credito).toLocaleString(undefined, {minimumFractionDigits: 2})} | Usado: Q${parseFloat(c.saldo_usado).toLocaleString(undefined, {minimumFractionDigits: 2})} | Estado: ${c.estado}`);
    });
  } else {
    console.log(' No se encontraron contratos vigentes');
    console.log('   Usando valores por defecto para la prueba');
    limiteTotal = 160000;
    saldoUsadoInicial = 28695.27;
    creditoDisponible = 131304.73;
    totalGastadoEnNuevasOrdenes = 0;
  }
  
  inicializado = true;
  return true;
}

// Generar peso aleatorio entre 8 y 11 kg
function generarPesoEstimado() {
  const peso = 8 + (Math.random() * 3);
  return parseFloat(peso.toFixed(2));
}

// Calcular costo de una orden
function calcularCosto(ruta, pesoEstimado) {
  const costoBase = ruta.distancia_km * ruta.costo_por_km;
  const costoPorPeso = pesoEstimado * 10;
  return parseFloat((costoBase + costoPorPeso).toFixed(2));
}

// Generar número de orden
function generarNumeroOrden(index) {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  const secuencia = String(index).padStart(6, '0');
  return `ORD-${anio}${mes}${dia}-${secuencia}`;
}

// Escenario principal
export default function () {
  const vu = __VU;
  const iteration = __ITER;
  
  // Inicializar crédito en la primera iteración
  if (!inicializado) {
    inicializarCredito();
  }
  
  // Incrementar contadores globales
  ordenesGeneradasGlobal++;
  const totalActual = ordenesGeneradasGlobal;
  
  // Verificar crédito disponible
  if (creditoDisponible <= 0) {
    console.log(`\n [VU ${vu}][ITER ${iteration}] CRÉDITO INSUFICIENTE - Disponible: Q${creditoDisponible.toFixed(2)}`);
    creditosInsuficientesGlobal++;
    creditosInsuficientesMetric.add(1);
    errorRate.add(1);
    return;
  }
  
  // Seleccionar ruta aleatoria
  const ruta = RUTAS[Math.floor(Math.random() * RUTAS.length)];
  const peso = generarPesoEstimado();
  const costo = calcularCosto(ruta, peso);
  
  // Verificar si alcanza el crédito
  if (costo > creditoDisponible) {
    console.log(`\n [VU ${vu}][ITER ${iteration}] CRÉDITO INSUFICIENTE - Costo: Q${costo.toFixed(2)} | Disponible: Q${creditoDisponible.toFixed(2)}`);
    creditosInsuficientesGlobal++;
    creditosInsuficientesMetric.add(1);
    errorRate.add(1);
    return;
  }
  
  // Generar orden
  const numeroOrden = generarNumeroOrden(totalActual);
  const creditoAntes = creditoDisponible;
  creditoDisponible -= costo;
  totalGastadoEnNuevasOrdenes += costo;
  
  const nuevoSaldoUsado = saldoUsadoInicial + totalGastadoEnNuevasOrdenes;
  const porcentajeLimite = (nuevoSaldoUsado / limiteTotal) * 100;
  
  ordenesCreadas.add(1);
  
  // Actualizar métricas
  limiteTotalMetric.add(limiteTotal);
  saldoUsadoInicialMetric.add(saldoUsadoInicial);
  creditoDisponibleFinalMetric.add(creditoDisponible);
  ordenesGeneradasTotal.add(ordenesGeneradasGlobal);
  creditosInsuficientesTotal.add(creditosInsuficientesGlobal);
  totalNuevasOrdenesGastado.add(totalGastadoEnNuevasOrdenes);
  
  // Mostrar progreso cada 100 órdenes
  if (totalActual % 100 === 0 || totalActual === 1000) {
    console.log(`\n PROGRESO: ${totalActual}/1000 órdenes generadas (${(totalActual/1000*100).toFixed(1)}%)`);
    console.log(`    Crédito restante: Q${creditoDisponible.toFixed(2)}`);
    console.log(`    Total gastado cliente: Q${nuevoSaldoUsado.toFixed(2)} (${porcentajeLimite.toFixed(1)}% del límite)`);
  }
  
  // Pausa entre iteraciones
  sleep(0.05);
}

// Al finalizar - Guardar archivos JSON
export function handleSummary(data) {
  // Obtener valores finales
  const limiteTotalFinal = data.metrics.limite_total?.values?.value || limiteTotal;
  const saldoUsadoInicialFinal = data.metrics.saldo_usado_inicial?.values?.value || saldoUsadoInicial;
  const creditoDisponibleFinal = data.metrics.credito_disponible_final?.values?.value || creditoDisponible;
  const ordenesGeneradasFinal = data.metrics.ordenes_generadas_total?.values?.value || ordenesGeneradasGlobal;
  const creditosInsuficientesFinal = data.metrics.creditos_insuficientes_total?.values?.value || creditosInsuficientesGlobal;
  const totalNuevasOrdenesGastadoFinal = data.metrics.total_nuevas_ordenes_gastado?.values?.value || totalGastadoEnNuevasOrdenes;
  
  // Cálculos finales
  const totalGastadoCliente = saldoUsadoInicialFinal + totalNuevasOrdenesGastadoFinal;
  const porcentajeUsado = limiteTotalFinal > 0 ? (totalGastadoCliente / limiteTotalFinal) * 100 : 0;
  const totalIntentos = ordenesGeneradasFinal + creditosInsuficientesFinal;
  const tasaExito = ordenesGeneradasFinal > 0 ? (ordenesGeneradasFinal / totalIntentos) * 100 : 0;
  
  const tiempoPromedioLogin = data.metrics.login_duration?.values?.avg || 0;
  const tiempoPromedioContratos = data.metrics.get_contratos_duration?.values?.avg || 0;
  
  // Resumen en consola
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║              RESUMEN FINAL - PRUEBA DE ÓRDENES                     ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  
  console.log('\n┌─────────────── DATOS DEL CLIENTE ───────────────┐');
  console.log(`│  Cliente: ${CLIENTE_NOMBRE.padEnd(35)}│`);
  console.log(`│  ID: ${CLIENTE_ID.toString().padEnd(42)}│`);
  console.log(`│  Email: ${CLIENTE_EMAIL.padEnd(35)}│`);
  console.log('└────────────────────────────────────────────────┘');
  
  console.log('\n┌─────────────── ESTADO INICIAL ────────────────┐');
  console.log(`│  Límite total:                 Q${limiteTotalFinal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).padStart(12)} │`);
  console.log(`│  Saldo usado (anterior):       Q${saldoUsadoInicialFinal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).padStart(12)} │`);
  console.log(`│  Crédito disponible:            Q${(limiteTotalFinal - saldoUsadoInicialFinal).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).padStart(12)} │`);
  console.log('└────────────────────────────────────────────────┘');
  
  console.log('\n┌─────────────── RESULTADOS DE LA PRUEBA ────────────────┐');
  console.log(`│  Órdenes generadas:                 ${ordenesGeneradasFinal.toString().padStart(8)} │`);
  console.log(`│  Total gastado en nuevas órdenes:   Q${totalNuevasOrdenesGastadoFinal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).padStart(12)} │`);
  console.log(`│  Créditos insuficientes:            ${creditosInsuficientesFinal.toString().padStart(8)} │`);
  console.log(`│  Total intentos:                    ${totalIntentos.toString().padStart(8)} │`);
  console.log(`│  Tasa de éxito:                     ${tasaExito.toFixed(2)}%`.padStart(31) + ' │');
  console.log('└────────────────────────────────────────────────────────┘');
  
  console.log('\n┌─────────────── ESTADO FINAL ──────────────────┐');
  console.log(`│  Saldo usado TOTAL:               Q${totalGastadoCliente.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).padStart(12)} │`);
  console.log(`│  Crédito disponible restante:      Q${creditoDisponibleFinal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).padStart(12)} │`);
  console.log(`│  Porcentaje del límite utilizado:  ${porcentajeUsado.toFixed(2)}%`.padStart(30) + ' │');
  console.log('└────────────────────────────────────────────────┘');
  
  console.log('\n┌─────────────── TIEMPOS DE RESPUESTA ─────────────────┐');
  console.log(`│  Login promedio:                 ${tiempoPromedioLogin.toFixed(2)}ms`.padStart(41) + ' │');
  console.log(`│  Contratos promedio:             ${tiempoPromedioContratos.toFixed(2)}ms`.padStart(41) + ' │');
  console.log('└──────────────────────────────────────────────────────┘');
  
  console.log('\n Archivo generado: ordenes-resultado.json');
  console.log('════════════════════════════════════════════════════════════════════\n');
  
  // Preparar JSON
  const resultadoJson = {
    metadata: {
      fecha_prueba: new Date().toISOString(),
      tipo_prueba: "PRUEBA DE CARGA - 1000 órdenes con control de crédito",
      cliente: {
        id: CLIENTE_ID,
        nombre: CLIENTE_NOMBRE,
        email: CLIENTE_EMAIL
      },
      configuracion: {
        usuarios_virtuales: 20,
        iteraciones_por_usuario: 50,
        total_ordenes_simuladas: ordenesGeneradasFinal,
        max_duration: "10m"
      }
    },
    estado_inicial: {
      limite_total_credito: limiteTotalFinal,
      saldo_usado_anterior: saldoUsadoInicialFinal,
      credito_disponible_inicial: limiteTotalFinal - saldoUsadoInicialFinal,
      moneda: "GTQ"
    },
    resultados_prueba: {
      metricas_generales: {
        ordenes_generadas: ordenesGeneradasFinal,
        creditos_insuficientes: creditosInsuficientesFinal,
        total_intentos: totalIntentos,
        tasa_exito_porcentaje: parseFloat(tasaExito.toFixed(2))
      },
      gastos: {
        total_gastado_nuevas_ordenes: totalNuevasOrdenesGastadoFinal,
        total_gastado_acumulado_cliente: totalGastadoCliente,
        incremento_porcentual: saldoUsadoInicialFinal > 0 ? parseFloat(((totalNuevasOrdenesGastadoFinal / saldoUsadoInicialFinal) * 100).toFixed(2)) : 0
      }
    },
    estado_final: {
      saldo_usado_total: totalGastadoCliente,
      credito_disponible_final: creditoDisponibleFinal,
      porcentaje_limite_utilizado: parseFloat(porcentajeUsado.toFixed(2)),
      moneda: "GTQ"
    },
    rutas_disponibles: RUTAS,
    metricas_rendimiento: {
      tiempos_respuesta: {
        login_promedio_ms: parseFloat(tiempoPromedioLogin.toFixed(2)),
        contratos_promedio_ms: parseFloat(tiempoPromedioContratos.toFixed(2))
      },
      total_peticiones_http: data.metrics.http_reqs?.values?.count || 0,
      tasa_error: data.metrics.error_rate?.values?.rate || 0
    }
  };
  
  return {
    'ordenes-resultado.json': JSON.stringify(resultadoJson, null, 2),
  };
}
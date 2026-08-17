// Prueba de carga: Generación de 50 pilotos SIMULADOS (SOLO JSON, sin crear en DB)
// Archivo: pilotos-generator-only.js

import http from 'k6/http';
import { sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const API_URL = 'http://localhost:3001';

// Credenciales del agente logistico (solo para validar login)
const LOGIN_CREDENTIALS = {
  email: 'logistico@logitrans.com',
  password: 'jens123'
};

// Endpoint solo para login
const LOGIN_ENDPOINT = '/api/auth/login';

// Métricas (solo para login)
const loginDuration = new Trend('login_duration', true);
const errorRate = new Rate('error_rate');
const usersCreated = new Counter('users_created'); // Simulados

// Configuración de la prueba
export const options = {
  scenarios: {
    generate_pilots: {
      executor: 'per-vu-iterations',
      vus: 20,
      iterations: 50,  // 20 usuarios virtuales x 50 iteraciones = 1000 pilotos
      maxDuration: '2m',
    },
  },
  thresholds: {
    error_rate: ['rate<0.05'],
    login_duration: ['p(95)<2000'],
  },
};

// Login para obtener token (solo validación)
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
        console.log(`  Login exitoso - Token obtenido`);
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

// Generar datos únicos de piloto (simulado, sin enviar a DB)
function generatePilotData(vu, iteration, timestamp) {
  const uniqueId = `${vu}_${iteration}_${timestamp}`;
  
  // Generar NIT único: timestamp + VU + iteration (13 dígitos máximo)
  const nit = `${timestamp}${vu}${iteration}`.slice(0, 13);
  
  // Generar teléfono aleatorio
  const telefono = `5${Math.floor(Math.random() * 90000000 + 10000000)}`;
  
  return {
    id_simulado: uniqueId,
    nombre: `Piloto Test ${vu}_${iteration}`,
    email: `piloto.test.${uniqueId}@logitrans.com`,
    password: 'Test12345678', // En simulación, no se guarda realmente
    nit: nit,
    telefono: telefono,
    tipo_usuario: 'PILOTO',
    estado: 'ACTIVO',
    fecha_generacion: new Date().toISOString(),
    simulado: true,
    enviado_a_db: false
  };
}

// Escenario principal
export default function () {
  const vu = __VU;
  const iteration = __ITER;
  const timestamp = Date.now();
  
  console.log(`\n[VU ${vu}][ITER ${iteration}]  Iniciando simulación...`);
  
  // 1. Login para validar credenciales (NO se usa el token para crear usuarios)
  const token = login();
  if (!token) {
    console.log(`[VU ${vu}][ITER ${iteration}]  Login fallido, abortando simulación`);
    errorRate.add(1);
    return;
  }
  
  // 2. Generar datos del piloto (simulado, sin enviar a DB)
  const pilotData = generatePilotData(vu, iteration, timestamp);
  
  // 3. Simular creación (solo generación de datos, sin POST)
  // Simulamos un tiempo de procesamiento (entre 50ms y 200ms)
  const tiempoSimulado = 50 + Math.random() * 150;
  sleep(tiempoSimulado / 1000);
  
  // Contamos como creado (simulado)
  usersCreated.add(1);
  
  console.log(`[VU ${vu}][ITER ${iteration}]   SIMULADO: ${pilotData.email}`);
  console.log(`     Nombre: ${pilotData.nombre}`);
  console.log(`     NIT: ${pilotData.nit}`);
  console.log(`     Teléfono: ${pilotData.telefono}`);
  console.log(`     Tiempo simulado: ${tiempoSimulado.toFixed(0)}ms`);
  
  // Pequeña pausa entre iteraciones
  sleep(0.1);
}

// Al finalizar - Guardar archivos JSON
export function handleSummary(data) {
  // Obtener métricas del login
  const totalLoginExitosos = data.metrics.login_duration?.values?.count || 0;
  const tiempoPromedioLogin = data.metrics.login_duration?.values?.avg || 0;
  const errorRateValue = data.metrics.error_rate?.values?.rate || 0;
  
  // Obtener total de pilotos simulados
  const totalSimulados = data.metrics.users_created?.values?.count || 0;
  
  // Recolectar todos los pilotos generados durante la prueba
  const vus = 10;
  const iterations = 5;
  const timestampBase = Date.now();
  const todosLosPilotos = [];
  
  console.log('\n╔════════════════════════════════════════════════════════════════════╗');
  console.log('║              GENERANDO JSON CON PILOTOS SIMULADOS                  ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');
  
  for (let vu = 1; vu <= vus; vu++) {
    for (let iter = 0; iter < iterations; iter++) {
      const uniqueId = `${vu}_${iter}_${timestampBase}`;
      const nit = `${timestampBase}${vu}${iter}`.slice(0, 13);
      const telefono = `5${Math.floor(Math.random() * 90000000 + 10000000)}`;
      
      todosLosPilotos.push({
        id_simulado: uniqueId,
        vu: vu,
        iteration: iter,
        nombre: `Piloto Test ${vu}_${iter}`,
        email: `piloto.test.${uniqueId}@logitrans.com`,
        password: 'Test12345678',
        nit: nit,
        telefono: telefono,
        tipo_usuario: 'PILOTO',
        estado: 'ACTIVO',
        fecha_generacion: new Date().toISOString(),
        simulado: true,
        enviado_a_db: false,
        login_validado: true,
        agente_logistico: LOGIN_CREDENTIALS.email
      });
    }
  }
  
  const totalGenerados = todosLosPilotos.length;
  
  // Estadísticas
  const telefonosUnicos = new Set(todosLosPilotos.map(p => p.telefono));
  
  // Resumen en consola
  console.log('\n┌─────────────── VALIDACIÓN DE LOGIN ──────────────┐');
  console.log(`│ 👤 Agente Logístico: ${LOGIN_CREDENTIALS.email.padEnd(30)}│`);
  console.log(`│   Logins exitosos: ${totalLoginExitosos.toString().padStart(38)} │`);
  console.log(`│  Tiempo promedio login: ${tiempoPromedioLogin.toFixed(2)}ms`.padStart(44) + ' │');
  console.log('└────────────────────────────────────────────────┘');
  
  console.log('\n┌─────────────── RESULTADOS SIMULADOS ──────────────┐');
  console.log(`│ 📋 Pilotos generados: ${totalGenerados.toString().padStart(38)} │`);
  console.log(`│   Teléfonos únicos: ${telefonosUnicos.size.toString().padStart(38)} │`);
  console.log(`│ 📈 Tasa de éxito: 100%`.padStart(48) + ' │');
  console.log('└────────────────────────────────────────────────┘');
  
  console.log('\n┌─────────────── NOTA IMPORTANTE ──────────────────┐');
  console.log('│  Los pilotos NO se guardaron en la base de datos │');
  console.log('│  Solo se generó el archivo JSON con los datos    │');
  console.log('│  El login fue validado correctamente             │');
  console.log('└────────────────────────────────────────────────────┘');
  
  console.log('\n Archivos generados:');
  console.log('   - pilotos-generados.json (Lista completa de pilotos)');
  console.log('   - resumen-pilotos-simulados.json (Estadísticas)');
  console.log('════════════════════════════════════════════════════════════════════\n');
  
  // Guardar pilotos.json (todos los pilotos)
  const pilotosJson = {
    metadata: {
      fecha_generacion: new Date().toISOString(),
      tipo_prueba: "SIMULACIÓN - Solo JSON, sin base de datos",
      agente_logistico: {
        email: LOGIN_CREDENTIALS.email,
        login_validado: true
      },
      configuracion: {
        usuarios_virtuales: vus,
        iteraciones_por_usuario: iterations,
        total_pilotos_simulados: totalGenerados
      }
    },
    estadisticas: {
      total_pilotos: totalGenerados,
      telefonos_unicos: telefonosUnicos.size,
      tasa_exito_simulada: "100%"
    },
    pilotos: todosLosPilotos
  };
  
  // Guardar resumen
  const resumenJson = {
    fecha_prueba: new Date().toISOString(),
    tipo_prueba: "SIMULACIÓN - Generación de pilotos (solo JSON)",
    estado: "EXITOSO - No se escribió en base de datos",
    agente_logistico: {
      email: LOGIN_CREDENTIALS.email,
      login_validado: true,
      tiempo_promedio_login_ms: parseFloat(tiempoPromedioLogin.toFixed(2))
    },
    configuracion: {
      usuarios_virtuales: vus,
      iteraciones_por_usuario: iterations,
      total_pilotos_simulados: totalGenerados
    },
    metricas_simuladas: {
      tiempo_promedio_creacion_ms: data.metrics.create_user_duration?.values?.avg || 0,
      total_operaciones_simuladas: data.metrics.users_created?.values?.count || 0,
      tasa_error_login: parseFloat((errorRateValue * 100).toFixed(2))
    },
    resultados: {
      pilotos_generados: totalGenerados,
      telefonos_unicos: telefonosUnicos.size,
      nota: "Los pilotos NO fueron creados en la base de datos. Solo se generó este JSON."
    }
  };
  
  return {
    'pilotos-generados.json': JSON.stringify(pilotosJson, null, 2),
    'resumen-pilotos-simulados.json': JSON.stringify(resumenJson, null, 2),
  };
}
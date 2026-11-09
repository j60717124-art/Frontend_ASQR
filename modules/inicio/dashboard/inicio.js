// MÓDULO  DASHBOARD

const estado = {
  estudiantes: [],
  docentes: [],
  asistenciasDocentes: [],   // últimos 7 días (solo Dirección/Administrador)
  materias: [],
  horarios: []
};

// UTILIDADES
const $ = (id) => document.getElementById(id);
const fmtFecha = (d = new Date()) => d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const hoyISO = () => new Date().toLocaleDateString('en-CA');
const diaISOHace = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toLocaleDateString('en-CA'); };
const hhmm = (t) => String(t).slice(0, 5);

//  RELOJ
function tickReloj() {
  const ahora = new Date();
  $("reloj").textContent = ahora.toLocaleTimeString('es-ES', { hour12: false });
  $("fechaHoy").textContent = fmtFecha(ahora);
}
tickReloj();
setInterval(tickReloj, 1000);

// BIENVENIDA
function mostrarBienvenida() {
  const cuenta = obtenerCuentaActual() || {};
  const nombre = cuenta.n_usuario || 'Usuario';
  const tipo = sessionStorage.getItem('tipoCuenta') || '';
  $("bienvenida").textContent = `Bienvenido, ${nombre} · ${tipo}`;
}

//  CARGAR DATOS DEL BACKEND
async function cargarDatos() {
  const admin = esAdmin();
  const pedidos = [
    apiGet('/estudiantes'),
    apiGet('/materias'),
    apiGet('/horarios'),
    admin ? apiGet('/docentes') : Promise.resolve(null),
    admin ? apiGet(`/asistencia-docentes?fecha_inicio=${diaISOHace(6)}&fecha_fin=${hoyISO()}`) : Promise.resolve(null)
  ];
  const [est, mat, hor, doc, asis] = await Promise.allSettled(pedidos);
  const valor = (r) => (r.status === 'fulfilled' ? r.value : null);
  estado.estudiantes = valor(est) || [];
  estado.materias = valor(mat) || [];
  estado.horarios = valor(hor) || [];
  estado.docentes = valor(doc) || [];
  estado.asistenciasDocentes = valor(asis) || [];

  const fallos = [est, mat, hor, doc, asis].filter(r => r.status === 'rejected');
  if (fallos.length) {
    mostrarError(fallos[0].reason, 'No se pudieron cargar algunos datos del panel.');
  }

  // Estudiantes
  if (est.status === 'fulfilled') {
    const activos = estado.estudiantes.filter(e => e.estado_estudiante === 'Activo').length;
    $("statEstudiantes").textContent = estado.estudiantes.length;
    $("statEstudiantesNota").textContent = `${activos} activos`;
  } else {
    $("statEstudiantes").textContent = '—';
    $("statEstudiantesNota").textContent = 'No disponible';
  }

  if (admin) {
    pintarTarjetasDocentes(doc, asis);
  } else {
    ['statDocentes', 'statAsistencias', 'statRechazados'].forEach(id => { $(id).textContent = '—'; });
    ['statDocentesNota', 'statAsistenciasNota', 'statRechazadosNota'].forEach(id => { $(id).textContent = 'Solo Dirección/Administración'; });
    document.querySelectorAll('#chartSemana, #chartEstados').forEach(c => { const card = c.closest('.chart-card'); if (card) card.hidden = true; });
  }

  if (typeof Chart !== 'undefined') construirGraficos();
}

function pintarTarjetasDocentes(doc, asis) {
  const hoy = hoyISO();
  if (doc.status === 'fulfilled') {
    const activos = estado.docentes.filter(d => d.estado === 'Activo').length;
    $("statDocentes").textContent = estado.docentes.length;
    $("statDocentesNota").textContent = `${activos} con cuenta activa`;
  } else {
    $("statDocentes").textContent = '—';
    $("statDocentesNota").textContent = 'No disponible';
  }

  if (asis.status === 'fulfilled') {
    const deHoy = estado.asistenciasDocentes.filter(a => a.fecha === hoy);
    const aceptados = deHoy.filter(a => a.resultado === 'Aceptado').length;
    const rechazados = deHoy.filter(a => a.resultado === 'Rechazado').length;
    $("statAsistencias").textContent = aceptados;
    $("statAsistenciasNota").textContent = 'Docentes que marcaron hoy';
    $("statRechazados").textContent = rechazados;
    $("statRechazadosNota").textContent = rechazados > 0 ? 'Requieren revisión' : 'Todo en orden';
  } else {
    ['statAsistencias', 'statRechazados'].forEach(id => { $(id).textContent = '—'; });
    ['statAsistenciasNota', 'statRechazadosNota'].forEach(id => { $(id).textContent = 'No disponible'; });
  }
}

//  GRÁFICOS CON CHART.JS
let charts = {};

function construirGraficos() {
  // Configuración global de Chart.js
  Chart.defaults.font.family = "'Segoe UI', Arial, sans-serif";
  Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim();
  Chart.defaults.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();

  construirGraficoSemana();
  construirGraficoEstados();
  construirGraficoMaterias();
}

// Gráfico  de asistencia de los últimos 7 días (Línea)
function construirGraficoSemana() {
  const labels = [];
  const datos = [];
  const hoy = new Date();

  // Últimos 7 días: cantidad de registros ACEPTADOS por día
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }));
    const iso = d.toLocaleDateString('en-CA');
    datos.push(estado.asistenciasDocentes.filter(a => a.fecha === iso && a.resultado === 'Aceptado').length);
  }

  const ctx = $("chartSemana").getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, 'rgba(37, 99, 235, 0.3)');
  gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');

  charts.semana = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Docentes que marcaron',
        data: datos,
        borderColor: '#2563eb',
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: '#fff',
          bodyColor: '#e2e8f0',
          padding: 10,
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          displayColors: false
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// Gráfico de distribución de estados (Dona)
function construirGraficoEstados() {
  const ctx = $("chartEstados").getContext('2d');

  // Hoy: docentes que marcaron (aceptado), rechazados y activos que aún no marcaron
  const hoy = hoyISO();
  const deHoy = estado.asistenciasDocentes.filter(a => a.fecha === hoy);
  const aceptados = deHoy.filter(a => a.resultado === 'Aceptado').length;
  const rechazados = deHoy.filter(a => a.resultado === 'Rechazado').length;
  const marcaron = new Set(deHoy.filter(a => a.resultado === 'Aceptado').map(a => a.docente_iddocente));
  const sinMarcar = estado.docentes.filter(d => d.estado === 'Activo' && !marcaron.has(d.iddocente)).length;

  charts.estados = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Aceptados', 'Rechazados', 'Sin marcar'],
      datasets: [{
        data: [aceptados, rechazados, sinMarcar],
        backgroundColor: ['#10b981', '#ef4444', '#94a3b8'],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 12 }
          }
        }
      }
    }
  });
}

// Gráfico de assistencia por materia (Barras)
function construirGraficoMaterias() {
  const conteo = {};
  estado.horarios.forEach(h => {
    const nombre = h.nombre_materia || `Materia #${h.materia_idmateria}`;
    conteo[nombre] = (conteo[nombre] || 0) + 1;
  });
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const labels = top.map(([nombre]) => nombre);
  const datos = top.map(([, n]) => n);

  const ctx = $("chartMaterias").getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 320);
  gradient.addColorStop(0, 'rgba(37, 99, 235, 1)');
  gradient.addColorStop(1, 'rgba(16, 185, 129, 0.8)');

  charts.materias = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Horarios',
        data: datos,
        backgroundColor: gradient,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 28
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleColor: '#fff',
          bodyColor: '#e2e8f0',
          padding: 10
        }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// TEMA OSCURO/CLARO
function actualizarColoresGraficos() {
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim();
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();

  Chart.defaults.color = textColor;
  Chart.defaults.borderColor = borderColor;

  Object.values(charts).forEach(chart => {
    if (chart.options.scales) {
      if (chart.options.scales.y) chart.options.scales.y.grid.color = borderColor;
      if (chart.options.scales.x) chart.options.scales.x.grid.color = borderColor;
    }
    chart.update();
  });
}

// Observar cambios de tema
new MutationObserver(actualizarColoresGraficos).observe(
  document.documentElement,
  { attributes: true, attributeFilter: ['data-theme'] }
);

function filtrarAccesosRapidos() {
  document.querySelectorAll('.quick-card[data-roles]').forEach(card => {
    const roles = card.dataset.roles.split(',');
    if (!tieneRol(roles)) card.hidden = true;
  });
}

// INICIO
(async function iniciar() {
  mostrarBienvenida();
  filtrarAccesosRapidos();
  if (typeof Chart === 'undefined') {
    mostrarAviso('No se pudo cargar la librería de gráficos. Revisa tu conexión a internet.');
  }
  await conLoader(cargarDatos, 'Cargando panel…');
})();
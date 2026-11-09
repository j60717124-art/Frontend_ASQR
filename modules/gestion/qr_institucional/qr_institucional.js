// MÓDULO · QR INSTITUCIONAL

const MOSTRAR_HISTORIAL = 8;
const SONDEO_MS = 4000;          // cada cuánto se consulta al backend (detecta QR usado o expirado)
const REINTENTO_MIN_MS = 2000;   // mínimo entre dos consultas seguidas
const estado = { actual: null, historial: [], rotando: false, ultimoSegundo: -1, intervalo: 30, ultimaConsulta: 0, sinConexion: false };

// UTILIDADES
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ts = (v) => parseFechaBolivia(v)?.getTime() ?? NaN;
const hora = (v) => { const d = parseFechaBolivia(v); return d ? d.toLocaleTimeString("es-ES", { hour12: false }) : "—"; };
const emisionDe = (r) => ts(r.fecha_expiracion) - estado.intervalo * 1000;
const horaEmision = (r) => { const e = emisionDe(r); return Number.isNaN(e) ? "—" : new Date(e).toLocaleTimeString("es-ES", { hour12: false }); };
const pad = (n) => String(n).padStart(6, "0");
const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)");

function qrSvg(texto) {
  if (typeof qrcode === "undefined") return null;
  const q = qrcode(0, "M");
  q.addData(texto);
  q.make();
  const n = q.getModuleCount(), m = 4;
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
  const t = n + m * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges" role="img" aria-label="Código QR institucional"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

// Lo que lleva el QR: código + firma (el backend lo validará)
const cargaUtil = (r) => `QRI:${r.codigo}:${r.firma}`;

function setConexion(ok) {
  $("live").classList.toggle("is-off", !ok);
  $("liveText").textContent = ok ? "EN VIVO" : "SIN CONEXIÓN";
}

//  MOSTRAR UN CÓDIGO NUEVO
function pintarDatos(r) {
  $("numero").textContent = `N.º ${pad(r.idqr_institucional)}`;
  $("emitido").textContent = horaEmision(r);
  $("vence").textContent = hora(r.fecha_expiracion);
  $("firma").textContent = `firma ${String(r.firma).slice(0, 8)}…`;
}

function mostrar(registro, conAnimacion) {
  const svg = qrSvg(cargaUtil(registro));
  const aplicar = () => {
    $("qrSvg").innerHTML = svg ?? '<div class="qrcard__msg">No se pudo cargar el generador de QR.</div>';
    pintarDatos(registro);
  };

  const card = $("qrCard");
  if (conAnimacion && !reducirMovimiento.matches) {
    card.classList.remove("is-flip");
    void card.offsetWidth;
    card.classList.add("is-flip");
    setTimeout(aplicar, 310);
  } else {
    aplicar();
  }

  // Guardamos el QR actual con su fecha de expiración
  estado.actual = registro;

  // Agregamos al historial local
  if (!estado.historial.some(h => h.idqr_institucional === registro.idqr_institucional)) {
    estado.historial.unshift(registro);
    estado.historial = estado.historial.slice(0, MOSTRAR_HISTORIAL);
    pintarHistorial();
  }
}

// ROTACIÓN
async function rotar() {
  if (estado.rotando) return;
  if (Date.now() - estado.ultimaConsulta < REINTENTO_MIN_MS) return;
  estado.rotando = true;
  estado.ultimaConsulta = Date.now();
  try {
    const nuevo = await apiGet('/qr-institucional');

    if (!estado.actual || nuevo.codigo !== estado.actual.codigo) {
      if (estado.actual && ts(estado.actual.fecha_expiracion) > Date.now()) estado.actual.usado = 1;
      mostrar(nuevo, !!estado.actual);
      $("seg").textContent = Math.max(0, Math.ceil((ts(nuevo.fecha_expiracion) - Date.now()) / 1000));
    }

    if (estado.sinConexion) mostrarExito("Conexión con el servidor restablecida.");
    estado.sinConexion = false;
    setConexion(true);
  } catch (e) {
    setConexion(false);
    if (!estado.sinConexion) mostrarError(e, "No se pudo actualizar el código QR. Se reintentará automáticamente.");
    estado.sinConexion = true;
  } finally {
    estado.rotando = false;
  }
}

// HISTORIAL
function estadoDe(r) {
  if (Number(r.usado) === 1) return '<span class="badge badge--next">Usado</span>';
  return Date.now() < ts(r.fecha_expiracion)
    ? '<span class="badge badge--ok">Activo</span>'
    : '<span class="badge badge--off">Expirado</span>';
}

function pintarHistorial() {
  const lista = estado.historial;
  $("vacio").hidden = lista.length > 0;
  $("tbody").innerHTML = lista.map(r => `
    <tr>
      <td class="num"><strong>${pad(r.idqr_institucional)}</strong></td>
      <td class="muted num">${horaEmision(r)}</td>
      <td class="muted num">${hora(r.fecha_expiracion)}</td>
      <td class="mono">${escapar(String(r.firma).slice(0, 14))}…</td>
      <td>${estadoDe(r)}</td>
    </tr>`).join("");
}

// CUENTA REGRESIVA
function cuadro() {
  const a = estado.actual;
  if (a && a.fecha_expiracion) {
    const resto = ts(a.fecha_expiracion) - Date.now();
    const total = estado.intervalo * 1000;
    const frac = Math.min(1, Math.max(0, resto / total));
    $("ringBar").style.strokeDashoffset = String(100 * (1 - frac));

    const seg = Math.max(0, Math.ceil(resto / 1000));
    if (seg !== estado.ultimoSegundo) {
      estado.ultimoSegundo = seg;
      $("seg").textContent = seg;
      pintarHistorial();
    }
    if (resto <= 0) rotar();
  }
  requestAnimationFrame(cuadro);
}

// INCLINACIÓN 3D CON EL MOUSE
const escena = $("scene"), tilt = $("tilt");
escena.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch" || reducirMovimiento.matches) return;
  const r = escena.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
  tilt.classList.add("is-tilting");
  tilt.style.setProperty("--ry", `${((px - 0.5) * 22).toFixed(2)}deg`);
  tilt.style.setProperty("--rx", `${((0.5 - py) * 16).toFixed(2)}deg`);
});
escena.addEventListener("pointerleave", () => {
  tilt.classList.remove("is-tilting");
  tilt.style.setProperty("--rx", "0deg");
  tilt.style.setProperty("--ry", "0deg");
});

// PANTALLA COMPLETA
$("btnFs").addEventListener("click", () => {
  const el = $("hero");
  if (document.fullscreenElement) document.exitFullscreen();
  else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
});

// INICIO
(async function iniciar() {
  try {
    const cfg = await apiGet('/configuracion-geocerca');
    estado.intervalo = Number(cfg.intervalo_rotacion_segundos) || estado.intervalo;
  } catch (e) {
    mostrarAviso("No se pudo leer el intervalo de rotación; se usará " + estado.intervalo + " s.");
  }
  $("txtIntervalo").textContent = estado.intervalo;
  $("seg").textContent = estado.intervalo;

  await rotar();
  setInterval(rotar, SONDEO_MS);        // detecta cuando un docente usa el QR
  requestAnimationFrame(cuadro);
})();
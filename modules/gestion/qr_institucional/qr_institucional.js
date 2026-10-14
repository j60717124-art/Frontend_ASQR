/* =========================================================
   MÓDULO · QR INSTITUCIONAL (código dinámico)
   Tabla: qr_institucional (idqr_institucional, codigo varchar(255),
          firma varchar(255), fecha_emision datetime,
          fecha_expiracion datetime, usado tinyint(1))

   El QR cambia cada INTERVALO_SEGUNDOS. Cada código lleva una firma
   y una fecha de expiración, de modo que una foto o captura deja de
   servir en pocos segundos.
   ========================================================= */

/* ---------- CONFIGURACIÓN ---------- */
const INTERVALO_SEGUNDOS = 5;  // cada cuánto cambia el QR
const GRACIA_SEGUNDOS = 2;     // tiempo extra de validez para quien ya está escaneando
const MOSTRAR_HISTORIAL = 8;

/* ---------- CAPA DE DATOS ----------
   Ahora funciona en modo demostración (el navegador genera los códigos).
   Para conectarlo a tu backend, pon tu ruta en API_URL. El SERVIDOR es quien
   debe generar y firmar los códigos; esta pantalla solo los muestra:
     GET {API_URL}/qr-institucional/actual
         → { idqr_institucional, codigo, firma, fecha_emision, fecha_expiracion, usado }
         Devuelve el código vigente y crea uno nuevo cuando pasan INTERVALO_SEGUNDOS.
     GET {API_URL}/qr-institucional?limit=8
         → últimos códigos emitidos, del más reciente al más antiguo.
   Envía las fechas en formato ISO 8601 con zona horaria (ej.: 2026-10-13T16:32:05Z). */
const API_URL = ""; // ej.: "/api"

const SECRETO_DEMO = "clave-de-demostracion-no-usar-en-produccion";
const estado = { actual: null, historial: [], rotando: false, ultimoHistorial: 0, ultimoSegundo: -1 };

const hex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, "0")).join("");
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

// Firma HMAC-SHA256 (requiere https o localhost). Si no está disponible, usa una firma de relleno solo para la demo.
async function firmar(texto) {
  try {
    const enc = new TextEncoder();
    const clave = await crypto.subtle.importKey("raw", enc.encode(SECRETO_DEMO), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", clave, enc.encode(texto))));
  } catch (e) {
    return "demo-" + hex(16);
  }
}

const leerLocal = () => {
  try {
    const g = JSON.parse(localStorage.getItem("qr_institucional_demo"));
    if (Array.isArray(g)) return g;
  } catch (e) {}
  return [];
};

const api = {
  async actual() {
    if (API_URL) {
      const r = await fetch(`${API_URL}/qr-institucional/actual`, { cache: "no-store" });
      if (!r.ok) throw new Error("actual");
      return r.json();
    }
    const ahora = Date.now();
    const codigo = hex(16);
    const emision = new Date(ahora).toISOString();
    const expiracion = new Date(ahora + (INTERVALO_SEGUNDOS + GRACIA_SEGUNDOS) * 1000).toISOString();
    const registro = {
      idqr_institucional: Math.max(0, ...estado.historial.map(h => h.idqr_institucional)) + 1,
      codigo,
      firma: await firmar(`${codigo}|${emision}|${expiracion}`),
      fecha_emision: emision,
      fecha_expiracion: expiracion,
      usado: 0
    };
    estado.historial.unshift(registro);
    estado.historial = estado.historial.slice(0, 200);
    localStorage.setItem("qr_institucional_demo", JSON.stringify(estado.historial));
    return registro;
  },
  async historial() {
    if (API_URL) {
      const r = await fetch(`${API_URL}/qr-institucional?limit=${MOSTRAR_HISTORIAL}`, { cache: "no-store" });
      if (!r.ok) throw new Error("historial");
      return r.json();
    }
    return estado.historial;
  }
};

/* ---------- UTILIDADES ---------- */
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hora = (iso) => new Date(iso).toLocaleTimeString("es-ES", { hour12: false });
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

// Lo que lleva el QR: el lector envía esto al servidor, que verifica firma, expiración y uso.
const cargaUtil = (r) => `QRI:${r.codigo}:${r.firma}`;

function setConexion(ok) {
  $("live").classList.toggle("is-off", !ok);
  $("liveText").textContent = ok ? "EN VIVO" : "SIN CONEXIÓN";
}

/* ---------- MOSTRAR UN CÓDIGO NUEVO ---------- */
function pintarDatos(r) {
  $("numero").textContent = `N.º ${pad(r.idqr_institucional)}`;
  $("emitido").textContent = hora(r.fecha_emision);
  $("vence").textContent = hora(r.fecha_expiracion);
  $("firma").textContent = `firma ${String(r.firma).slice(0, 8)}…`;
}

function mostrar(registro, conAnimacion) {
  const svg = qrSvg(cargaUtil(registro));
  const aplicar = () => {
    $("qrSvg").innerHTML = svg ?? '<div class="qrcard__msg">No se pudo cargar el generador de QR. Revisa tu conexión a internet.</div>';
    pintarDatos(registro);
  };

  const card = $("qrCard");
  if (conAnimacion && !reducirMovimiento.matches) {
    card.classList.remove("is-flip");
    void card.offsetWidth; // reinicia la animación
    card.classList.add("is-flip");
    setTimeout(aplicar, 310); // se cambia el código cuando la tarjeta está de canto
  } else {
    aplicar();
  }

  const emisionMs = Date.parse(registro.fecha_emision);
  estado.actual = { ...registro, rotMs: emisionMs + INTERVALO_SEGUNDOS * 1000 };
}

async function rotar() {
  if (estado.rotando) return;
  estado.rotando = true;
  try {
    const nuevo = await api.actual();
    if (API_URL && estado.actual && nuevo.codigo === estado.actual.codigo) {
      estado.actual.rotMs = Date.now() + 500; // el servidor aún no rotó: reintenta pronto
    } else {
      mostrar(nuevo, !!estado.actual);
    }
    setConexion(true);
    await actualizarHistorial();
  } catch (e) {
    setConexion(false);
    if (estado.actual) estado.actual.rotMs = Date.now() + 2000;
    else estado.actual = { rotMs: Date.now() + 2000 };
  } finally {
    estado.rotando = false;
  }
}

/* ---------- HISTORIAL ---------- */
async function actualizarHistorial() {
  // Con servidor se consulta como máximo cada 10 s para no sobrecargarlo
  if (API_URL && Date.now() - estado.ultimoHistorial < 10000 && estado.historial.length) return;
  try {
    estado.historial = await api.historial();
    estado.ultimoHistorial = Date.now();
  } catch (e) {}
  pintarHistorial();
}

function estadoDe(r) {
  if (Number(r.usado) === 1) return '<span class="badge badge--next">Usado</span>';
  return Date.now() < Date.parse(r.fecha_expiracion)
    ? '<span class="badge badge--ok">Activo</span>'
    : '<span class="badge badge--off">Expirado</span>';
}

function pintarHistorial() {
  const lista = estado.historial.slice(0, MOSTRAR_HISTORIAL);
  $("vacio").hidden = lista.length > 0;
  $("tbody").innerHTML = lista.map(r => `
    <tr>
      <td class="num"><strong>${pad(r.idqr_institucional)}</strong></td>
      <td class="muted num">${hora(r.fecha_emision)}</td>
      <td class="muted num">${hora(r.fecha_expiracion)}</td>
      <td class="mono">${escapar(String(r.firma).slice(0, 14))}…</td>
      <td>${estadoDe(r)}</td>
    </tr>`).join("");
}

/* ---------- CUENTA REGRESIVA (anillo + segundos) ---------- */
function cuadro() {
  const a = estado.actual;
  if (a) {
    const resto = a.rotMs - Date.now();
    const frac = Math.min(1, Math.max(0, resto / (INTERVALO_SEGUNDOS * 1000)));
    $("ringBar").style.strokeDashoffset = String(100 * (1 - frac));

    const seg = Math.max(0, Math.ceil(resto / 1000));
    if (seg !== estado.ultimoSegundo) {
      estado.ultimoSegundo = seg;
      $("seg").textContent = seg;
      pintarHistorial(); // refresca los estados (Activo / Expirado) una vez por segundo
    }
    if (resto <= 0) rotar();
  }
  requestAnimationFrame(cuadro);
}

/* ---------- INCLINACIÓN 3D CON EL MOUSE ---------- */
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

/* ---------- PANTALLA COMPLETA ---------- */
$("btnFs").addEventListener("click", () => {
  const el = $("hero");
  if (document.fullscreenElement) document.exitFullscreen();
  else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
});

/* ---------- INICIO ---------- */
(function iniciar() {
  $("txtIntervalo").textContent = INTERVALO_SEGUNDOS;
  $("seg").textContent = INTERVALO_SEGUNDOS;
  if (!API_URL) estado.historial = leerLocal();
  pintarHistorial();
  rotar();                       // primer código
  requestAnimationFrame(cuadro); // arranca la cuenta regresiva
})();
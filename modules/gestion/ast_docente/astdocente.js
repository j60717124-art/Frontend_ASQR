/* =========================================================
   MÓDULO · ASISTENCIA DOCENTE
   Tabla: asistencia_docente (idasistencia_docente, fecha date, hora time,
          latitud decimal(10,7), longitud decimal(10,7),
          resultado varchar(14), motivo_rechazo varchar(150), docente_iddocente)
   ========================================================= */

/* ---------- CAPA DE DATOS ----------
   Ahora funciona en modo demostración (localStorage).
   Para conectarlo a tu backend, pon tu ruta en API_URL:
     GET    {API_URL}/asistencias-docente
     POST   {API_URL}/asistencias-docente
     PUT    {API_URL}/asistencias-docente/:id
     DELETE {API_URL}/asistencias-docente/:id
     GET    {API_URL}/docentes                  (iddocente, nombres, apellidos)
     GET    {API_URL}/configuracion-geocerca    (opcional: para mostrar la distancia al colegio)
   Valores de "resultado": "Aceptado" y "Rechazado" (caben en varchar(14)). */
const API_URL = ""; // ej.: "/api"

const OK = "Aceptado";
const NO = "Rechazado";

const diaISO = (hace = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - hace);
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD en hora local
};

const DOCENTES_DEMO = [
  { iddocente: 1, nombres: "María Fernanda", apellidos: "González Rojas" },
  { iddocente: 2, nombres: "Carmen", apellidos: "Mendoza Flores" }
];

const ASISTENCIAS_DEMO = [
  { idasistencia_docente: 1, fecha: diaISO(0), hora: "07:42:10", latitud: -17.393521, longitud: -66.156984, resultado: OK, motivo_rechazo: null, docente_iddocente: 1 },
  { idasistencia_docente: 2, fecha: diaISO(0), hora: "07:55:03", latitud: -17.39348, longitud: -66.15712, resultado: OK, motivo_rechazo: null, docente_iddocente: 2 },
  { idasistencia_docente: 3, fecha: diaISO(0), hora: "08:20:41", latitud: -17.4012, longitud: -66.149, resultado: NO, motivo_rechazo: "Fuera de la geocerca", docente_iddocente: 2 },
  { idasistencia_docente: 4, fecha: diaISO(1), hora: "07:38:00", latitud: -17.393505, longitud: -66.157011, resultado: OK, motivo_rechazo: null, docente_iddocente: 1 },
  { idasistencia_docente: 5, fecha: diaISO(1), hora: "07:51:27", latitud: -17.393462, longitud: -66.156955, resultado: NO, motivo_rechazo: "Código QR vencido", docente_iddocente: 2 },
  { idasistencia_docente: 6, fecha: diaISO(2), hora: "07:44:12", latitud: -17.393498, longitud: -66.157042, resultado: OK, motivo_rechazo: null, docente_iddocente: 1 },
  { idasistencia_docente: 7, fecha: diaISO(2), hora: "07:58:30", latitud: -17.393541, longitud: -66.156977, resultado: OK, motivo_rechazo: null, docente_iddocente: 2 }
];

const estado = { lista: [], docentes: [], geocerca: null, pagina: 1 };
const POR_PAGINA = 10;

const leerLocal = (clave, defecto) => {
  try {
    const g = JSON.parse(localStorage.getItem(clave));
    if (Array.isArray(g)) return g;
  } catch (e) {}
  return defecto.slice();
};

const api = {
  async listar() {
    if (API_URL) return (await fetch(`${API_URL}/asistencias-docente`)).json();
    return leerLocal("asistencia_docente_demo", ASISTENCIAS_DEMO);
  },
  async docentes() {
    if (API_URL) return (await fetch(`${API_URL}/docentes`)).json();
    return leerLocal("docentes_demo", DOCENTES_DEMO);
  },
  async geocerca() {
    try {
      if (API_URL) {
        const r = await fetch(`${API_URL}/configuracion-geocerca`);
        return r.ok ? r.json() : null;
      }
      return JSON.parse(localStorage.getItem("geocerca_demo")) || null;
    } catch (e) { return null; }
  },
  async guardar(reg) {
    if (API_URL) {
      const nuevo = !reg.idasistencia_docente;
      const r = await fetch(`${API_URL}/asistencias-docente${nuevo ? "" : "/" + reg.idasistencia_docente}`, {
        method: nuevo ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reg)
      });
      if (!r.ok) throw new Error("guardar");
      return r.json();
    }
    if (!reg.idasistencia_docente) {
      reg.idasistencia_docente = Math.max(0, ...estado.lista.map(x => x.idasistencia_docente)) + 1;
      estado.lista.push(reg);
    } else {
      const i = estado.lista.findIndex(x => x.idasistencia_docente === reg.idasistencia_docente);
      estado.lista[i] = reg;
    }
    localStorage.setItem("asistencia_docente_demo", JSON.stringify(estado.lista));
    return reg;
  },
  async eliminar(id) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/asistencias-docente/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("eliminar");
      return;
    }
    estado.lista = estado.lista.filter(x => x.idasistencia_docente !== id);
    localStorage.setItem("asistencia_docente_demo", JSON.stringify(estado.lista));
  }
};

/* ---------- UTILIDADES ---------- */
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");

const docenteDe = (id) => estado.docentes.find(d => d.iddocente === id);
const nombreDocente = (id) => { const d = docenteDe(id); return d ? `${d.apellidos}, ${d.nombres}` : "Docente no encontrado"; };
const inicialesDocente = (id) => { const d = docenteDe(id); return d ? (d.nombres.trim()[0] + d.apellidos.trim()[0]).toUpperCase() : "?"; };

const COLORES = [
  "linear-gradient(135deg, var(--secondary-500), var(--secondary-700))",
  "linear-gradient(135deg, var(--tertiary-500), var(--tertiary-600))",
  "linear-gradient(135deg, var(--cyan-500), var(--cyan-700))",
  "linear-gradient(135deg, var(--primary-500), var(--primary-700))"
];

// "2026-10-12" → fecha local (evita el corrimiento de zona horaria)
const fechaLocal = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const fmtFecha = (iso) => fechaLocal(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
const hhmm = (h) => String(h).slice(0, 5);
const aHoraSQL = (h) => (h.length === 5 ? `${h}:00` : h);

let toastTimer;
function aviso(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-show"), 2800);
}

function parseCoord(txt) {
  const v = String(txt).trim().replace(",", ".");
  return /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : NaN;
}

// Distancia en metros entre dos puntos (fórmula de Haversine)
function distanciaM(lat1, lon1, lat2, lon2) {
  const R = 6371000, rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

/* ---------- LISTADO ---------- */
function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  const res = $("fResultado").value;
  const desde = $("fDesde").value;
  const hasta = $("fHasta").value;
  return estado.lista
    .filter(r =>
      (!q || normalizar(nombreDocente(r.docente_iddocente)).includes(q)) &&
      (!res || r.resultado === res) &&
      (!desde || r.fecha >= desde) &&
      (!hasta || r.fecha <= hasta))
    .sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora));
}

function pintar() {
  const lista = filtrados();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = visibles.map(r => {
    const tieneUbic = r.latitud != null && r.longitud != null;
    const coords = tieneUbic
      ? `<a class="coords" href="https://www.google.com/maps/search/?api=1&query=${r.latitud},${r.longitud}" target="_blank" rel="noopener" title="Ver en el mapa">${icono("pin")}${Number(r.latitud).toFixed(5)}, ${Number(r.longitud).toFixed(5)}</a>`
      : '<span class="muted">—</span>';
    return `
    <tr>
      <td data-label="Fecha">${fmtFecha(r.fecha)}</td>
      <td data-label="Hora" class="time">${hhmm(r.hora)}</td>
      <td data-label="Docente">
        <div class="user">
          <span class="user__avatar" style="background:${COLORES[r.docente_iddocente % COLORES.length]}">${escapar(inicialesDocente(r.docente_iddocente))}</span>
          <strong>${escapar(nombreDocente(r.docente_iddocente))}</strong>
        </div>
      </td>
      <td data-label="Resultado"><span class="badge badge--${r.resultado === OK ? "ok" : "out"}">${escapar(r.resultado)}</span></td>
      <td data-label="Motivo" class="muted reason">${r.motivo_rechazo ? escapar(r.motivo_rechazo) : "—"}</td>
      <td data-label="Ubicación">${coords}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${r.idasistencia_docente}" title="Editar" aria-label="Editar registro">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${r.idasistencia_docente}" title="Eliminar" aria-label="Eliminar registro">${icono("del")}</button>
        </div>
      </td>
    </tr>`;
  }).join("");

  // Paginación
  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  // Resumen según los filtros
  const ok = lista.filter(r => r.resultado === OK).length;
  const no = lista.length - ok;
  const pct = (n) => (lista.length ? `${Math.round((n / lista.length) * 100)} %` : "0 %");
  $("stTotal").textContent = lista.length;
  $("stOk").textContent = ok;
  $("stNo").textContent = no;
  $("stOkPct").textContent = `${pct(ok)} del total`;
  $("stNoPct").textContent = `${pct(no)} del total`;

  const desde = $("fDesde").value, hasta = $("fHasta").value;
  $("stRango").textContent = desde || hasta
    ? `${desde ? fmtFecha(desde) : "Inicio"} → ${hasta ? fmtFecha(hasta) : "hoy"}`
    : "Todos los días";
  $("btnLimpiar").hidden = !($("fBuscar").value || $("fResultado").value || desde || hasta);

  const total = estado.lista.length;
  $("resumen").textContent = `${total} ${total === 1 ? "registro" : "registros"} de asistencia`;
}

/* ---------- FORMULARIO ---------- */
const dlg = $("dlgAsis");
const form = $("formAsis");

function llenarDocentes() {
  const ordenados = estado.docentes.slice().sort((a, b) => a.apellidos.localeCompare(b.apellidos, "es"));
  $("docente_iddocente").innerHTML =
    '<option value="">Selecciona un docente</option>' +
    ordenados.map(d => `<option value="${d.iddocente}">${escapar(d.apellidos)}, ${escapar(d.nombres)}</option>`).join("");
}

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
}

// El motivo solo aplica cuando el resultado es Rechazado
function sincronizarMotivo() {
  const rechazado = $("resultado").value === NO;
  $("motivo_rechazo").disabled = !rechazado;
  if (!rechazado) { $("motivo_rechazo").value = ""; $("motivo_rechazo").classList.remove("is-invalid"); form.querySelector('[data-err="motivo_rechazo"]').textContent = ""; }
}

// Muestra a cuántos metros del punto de referencia está la ubicación escrita
function actualizarDistancia() {
  const el = $("dist");
  const g = estado.geocerca;
  const lat = parseCoord($("latitud").value), lon = parseCoord($("longitud").value);
  el.className = "dist";
  if (!g || !Number.isFinite(lat) || !Number.isFinite(lon)) { el.textContent = ""; return; }
  const m = Math.round(distanciaM(lat, lon, Number(g.latitud_referencia), Number(g.longitud_referencia)));
  const radio = Number(g.radio_metros);
  const dentro = m <= radio;
  el.classList.add(dentro ? "is-in" : "is-out");
  el.textContent = `A ${m.toLocaleString("es-ES")} m del colegio · ${dentro ? "dentro" : "fuera"} del radio de ${radio} m`;
}

function abrirFormulario(reg) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = reg ? "Editar registro" : "Registrar asistencia";
  $("btnGuardar").textContent = reg ? "Guardar cambios" : "Guardar registro";
  $("idasistencia_docente").value = reg?.idasistencia_docente ?? "";
  $("docente_iddocente").value = reg?.docente_iddocente ?? "";
  $("fecha").value = reg?.fecha ?? diaISO(0);
  $("hora").value = reg ? String(reg.hora).slice(0, 8) : new Date().toTimeString().slice(0, 8);
  $("resultado").value = reg?.resultado ?? OK;
  $("motivo_rechazo").value = reg?.motivo_rechazo ?? "";
  $("latitud").value = reg?.latitud != null ? Number(reg.latitud).toFixed(7) : "";
  $("longitud").value = reg?.longitud != null ? Number(reg.longitud).toFixed(7) : "";
  sincronizarMotivo();
  actualizarDistancia();
  dlg.showModal();
  $("docente_iddocente").focus();
}

function marcarError(campo, msg) {
  form.querySelector(`[data-err="${campo}"]`).textContent = msg;
  $(campo).classList.add("is-invalid");
}

function validar() {
  limpiarErrores();
  let ok = true;
  const fecha = $("fecha").value, hora = $("hora").value;
  const lat = $("latitud").value.trim(), lon = $("longitud").value.trim();

  if (!$("docente_iddocente").value) { marcarError("docente_iddocente", "Selecciona el docente."); ok = false; }

  if (!fecha) { marcarError("fecha", "Indica la fecha."); ok = false; }
  else if (fecha > diaISO(0)) { marcarError("fecha", "La fecha no puede ser futura."); ok = false; }

  if (!hora) { marcarError("hora", "Indica la hora."); ok = false; }

  if ($("resultado").value === NO && limpiarEspacios($("motivo_rechazo").value).length < 3) {
    marcarError("motivo_rechazo", "Indica el motivo del rechazo."); ok = false;
  }

  // La ubicación es opcional, pero si se escribe una coordenada hace falta la otra
  if (lat || lon) {
    const la = parseCoord(lat), lo = parseCoord(lon);
    if (!(la >= -90 && la <= 90)) { marcarError("latitud", "Latitud entre -90 y 90."); ok = false; }
    if (!(lo >= -180 && lo <= 180)) { marcarError("longitud", "Longitud entre -180 y 180."); ok = false; }
  }
  return ok;
}

$("resultado").addEventListener("change", sincronizarMotivo);
["latitud", "longitud"].forEach(id => $(id).addEventListener("input", actualizarDistancia));

$("btnUbicacion").addEventListener("click", () => {
  if (!navigator.geolocation) { aviso("Tu navegador no permite obtener la ubicación."); return; }
  const btn = $("btnUbicacion");
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Buscando ubicación…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      $("latitud").value = pos.coords.latitude.toFixed(7);
      $("longitud").value = pos.coords.longitude.toFixed(7);
      ["latitud", "longitud"].forEach(c => { $(c).classList.remove("is-invalid"); form.querySelector(`[data-err="${c}"]`).textContent = ""; });
      actualizarDistancia();
      btn.disabled = false; btn.textContent = original;
    },
    (err) => {
      btn.disabled = false; btn.textContent = original;
      aviso(err.code === 1 ? "Permite el acceso a tu ubicación en el navegador." : "No se pudo obtener tu ubicación.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const lat = parseCoord($("latitud").value), lon = parseCoord($("longitud").value);
  const reg = {
    idasistencia_docente: Number($("idasistencia_docente").value) || null,
    fecha: $("fecha").value,
    hora: aHoraSQL($("hora").value),
    latitud: Number.isFinite(lat) ? Number(lat.toFixed(7)) : null,
    longitud: Number.isFinite(lon) ? Number(lon.toFixed(7)) : null,
    resultado: $("resultado").value,
    motivo_rechazo: $("resultado").value === NO ? limpiarEspacios($("motivo_rechazo").value) : null,
    docente_iddocente: Number($("docente_iddocente").value)
  };
  const editando = !!reg.idasistencia_docente;

  $("btnGuardar").disabled = true;
  try {
    await api.guardar(reg);
    if (API_URL) estado.lista = await api.listar();
    dlg.close();
    pintar();
    aviso(editando ? "Registro actualizado" : "Asistencia registrada");
  } catch (err) {
    aviso("No se pudo guardar el registro. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

/* ---------- ACCIONES DE FILA ---------- */
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const reg = estado.lista.find(x => x.idasistencia_docente === Number(btn.dataset.id));
  if (!reg) return;

  if (btn.dataset.accion === "editar") abrirFormulario(reg);
  if (btn.dataset.accion === "eliminar") {
    idEliminar = reg.idasistencia_docente;
    $("delTexto").textContent = `Se eliminará el registro de ${nombreDocente(reg.docente_iddocente)} del ${fmtFecha(reg.fecha)} a las ${hhmm(reg.hora)}. Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  try {
    await api.eliminar(idEliminar);
    if (API_URL) estado.lista = await api.listar();
    $("dlgEliminar").close();
    pintar();
    aviso("Registro eliminado");
  } catch (err) {
    $("dlgEliminar").close();
    aviso("No se pudo eliminar el registro. Intenta de nuevo.");
  }
});

/* ---------- EVENTOS GENERALES ---------- */
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fResultado", "fDesde", "fHasta"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnLimpiar").addEventListener("click", () => {
  ["fBuscar", "fResultado", "fDesde", "fHasta"].forEach(id => ($(id).value = ""));
  estado.pagina = 1;
  pintar();
});
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

/* ---------- INICIO ---------- */
(async function iniciar() {
  try {
    [estado.lista, estado.docentes, estado.geocerca] = await Promise.all([api.listar(), api.docentes(), api.geocerca()]);
  } catch (err) {
    $("resumen").textContent = "No se pudieron cargar los registros.";
    return;
  }
  llenarDocentes();
  pintar();
})();
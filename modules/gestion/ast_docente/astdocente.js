// MÓDULO · ASISTENCIA DOCENTE

const OK = "Aceptado";
const NO = "Rechazado";

const diaISO = (hace = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - hace);
  return d.toLocaleDateString("en-CA");
};

const estado = { lista: [], pagina: 1 };
const POR_PAGINA = 10;

// UTILIDADES
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const nombreDeRegistro = (r) => r.docente_nombre || "Docente no encontrado";
const inicialesDeRegistro = (r) => {
  const partes = String(r.docente_nombre || "?").trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "?") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
};

const COLORES = [
  "linear-gradient(135deg, var(--secondary-500), var(--secondary-700))",
  "linear-gradient(135deg, var(--tertiary-500), var(--tertiary-600))",
  "linear-gradient(135deg, var(--cyan-500), var(--cyan-700))",
  "linear-gradient(135deg, var(--primary-500), var(--primary-700))"
];

const fmtFecha = formatearFecha;
const hhmm = (h) => String(h).slice(0, 5);

function distanciaM(lat1, lon1, lat2, lon2) {
  const R = 6371000, rad = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const ICO = {
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

// LISTADO
function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  const res = $("fResultado").value;
  const desde = $("fDesde").value;
  const hasta = $("fHasta").value;
  return estado.lista
    .filter(r =>
      (!q || normalizar(nombreDeRegistro(r)).includes(q)) &&
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
          <span class="user__avatar" style="background:${COLORES[r.docente_iddocente % COLORES.length]}">${escapar(inicialesDeRegistro(r))}</span>
          <strong>${escapar(nombreDeRegistro(r))}</strong>
        </div>
      </td>
      <td data-label="Resultado"><span class="badge badge--${r.resultado === OK ? "ok" : "out"}">${escapar(r.resultado)}</span></td>
      <td data-label="Motivo" class="muted reason">${r.motivo_rechazo ? escapar(r.motivo_rechazo) : "—"}</td>
      <td data-label="Ubicación">${coords}</td>
    </tr>`;
  }).join("");

  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;
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

// EVENTOS GENERALES
["fBuscar", "fResultado", "fDesde", "fHasta"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnLimpiar").addEventListener("click", () => {
  ["fBuscar", "fResultado", "fDesde", "fHasta"].forEach(id => ($(id).value = ""));
  estado.pagina = 1;
  pintar();
});
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

// CARGA DE DATOS DESDE EL BACKEND
async function cargarAsistencias() {
  try {
    const desde = $("fDesde").value;
    const hasta = $("fHasta").value;
    if (desde && hasta && desde > hasta) {
      mostrarAviso("La fecha «Desde» no puede ser posterior a «Hasta».");
      return;
    }

    let url = '/asistencia-docentes';
    const params = new URLSearchParams();
    if (desde) params.append('fecha_inicio', desde);
    if (hasta) params.append('fecha_fin', hasta);
    if (params.toString()) url += `?${params.toString()}`;

    estado.lista = await apiGet(url);
    pintar();
  } catch (err) {
    $("resumen").textContent = "Error al cargar registros.";
    mostrarError(err, "No se pudieron cargar los registros de asistencia.");
    mostrarErrorTabla($("tbody"), err, cargarAsistencias);
  }
}

// INICIO
(async function iniciar() {
  const btnNuevo = $("btnNuevo");
  if (btnNuevo) btnNuevo.hidden = true;

  mostrarSkeleton($("tbody"), 6);
  $("resumen").textContent = "Cargando datos...";
  await cargarAsistencias();
})();
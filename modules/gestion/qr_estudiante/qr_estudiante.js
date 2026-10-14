/* =========================================================
   MÓDULO · QR DE ESTUDIANTES
   Tabla: qr_estudiante (idqr_estudiante, codigo varchar(255),
          fecha_emision datetime, vigente tinyint(1), estudiante_idestudiante)
   Un estudiante puede tener varios QR a lo largo del tiempo,
   pero solo uno vigente (vigente = 1).
   ========================================================= */

/* ---------- CAPA DE DATOS ----------
   Ahora funciona en modo demostración (localStorage).
   Para conectarlo a tu backend, pon tu ruta en API_URL:
     GET  {API_URL}/estudiantes     (idestudiante, nombres, apellidos, ci, estado_estudiante)
     GET  {API_URL}/qr-estudiantes  (todos los QR, vigentes y anteriores)
     POST {API_URL}/qr-estudiantes  body: { estudiante_idestudiante }
          El SERVIDOR debe generar el código (aleatorio e impredecible, o firmado),
          poner fecha_emision = NOW(), vigente = 1 y dejar en vigente = 0 los QR anteriores
          de ese estudiante. Responde con el registro creado.
     GET  {API_URL}/colegios        (opcional: nombre que sale en la tarjeta) */
const API_URL = ""; // ej.: "/api"

const hace = (d) => new Date(Date.now() - d * 864e5).toISOString();

const ESTUDIANTES_DEMO = [
  { idestudiante: 1, nombres: "María Fernanda", apellidos: "González Rojas", ci: "8456123", estado_estudiante: "Activo" },
  { idestudiante: 2, nombres: "Javier", apellidos: "Pérez Mamani", ci: "9123456", estado_estudiante: "Activo" },
  { idestudiante: 3, nombres: "Lucía", apellidos: "Ramírez Quispe", ci: "7894561", estado_estudiante: "Activo" },
  { idestudiante: 4, nombres: "Carlos Andrés", apellidos: "Torres Vargas", ci: "10234567", estado_estudiante: "Inactivo" },
  { idestudiante: 5, nombres: "Sofía", apellidos: "Aguilar Choque", ci: "6543210", estado_estudiante: "Retirado" }
];

const QRS_DEMO = [
  { idqr_estudiante: 1, codigo: "EST-3f9a1c7e5b2d48a6b0c1d2e3f4a59687", fecha_emision: hace(60), vigente: 0, estudiante_idestudiante: 1 },
  { idqr_estudiante: 2, codigo: "EST-a81d09c47e6b3f25d8c0b9a7e1f4d632", fecha_emision: hace(20), vigente: 1, estudiante_idestudiante: 1 },
  { idqr_estudiante: 3, codigo: "EST-5c2e7b90d1a46f38e9b0c7d2a4f18e53", fecha_emision: hace(60), vigente: 1, estudiante_idestudiante: 2 },
  { idqr_estudiante: 4, codigo: "EST-9e4b6d13a7c20f58b1e3d9a6c4072f8b", fecha_emision: hace(35), vigente: 1, estudiante_idestudiante: 3 }
];

const estado = { estudiantes: [], qrs: [], colegio: "", pagina: 1, seleccion: new Set(), actual: null };
const POR_PAGINA = 10;

const leerLocal = (clave, defecto) => {
  try {
    const g = JSON.parse(localStorage.getItem(clave));
    if (Array.isArray(g)) return g;
  } catch (e) {}
  return defecto.slice();
};

// Código aleatorio de 128 bits. En producción lo genera el servidor.
const nuevoCodigo = () => "EST-" + Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, "0")).join("");

const api = {
  async estudiantes() {
    if (API_URL) return (await fetch(`${API_URL}/estudiantes`)).json();
    return leerLocal("estudiantes_demo", ESTUDIANTES_DEMO);
  },
  async qrs() {
    if (API_URL) return (await fetch(`${API_URL}/qr-estudiantes`)).json();
    return leerLocal("qr_estudiante_demo", QRS_DEMO);
  },
  async colegio() {
    try {
      const lista = API_URL ? await (await fetch(`${API_URL}/colegios`)).json() : leerLocal("colegios_demo", [{ nombre: "Unidad Educativa San Martín" }]);
      return lista[0]?.nombre ?? "";
    } catch (e) { return ""; }
  },
  async generar(idEstudiante) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/qr-estudiantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estudiante_idestudiante: idEstudiante })
      });
      if (!r.ok) throw new Error("generar");
      return r.json();
    }
    estado.qrs.forEach(q => { if (q.estudiante_idestudiante === idEstudiante) q.vigente = 0; });
    const nuevo = {
      idqr_estudiante: Math.max(0, ...estado.qrs.map(q => q.idqr_estudiante)) + 1,
      codigo: nuevoCodigo(),
      fecha_emision: new Date().toISOString(),
      vigente: 1,
      estudiante_idestudiante: idEstudiante
    };
    estado.qrs.push(nuevo);
    localStorage.setItem("qr_estudiante_demo", JSON.stringify(estado.qrs));
    return nuevo;
  }
};

/* ---------- UTILIDADES ---------- */
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const estudiante = (id) => estado.estudiantes.find(e => e.idestudiante === id);
const nombreCompleto = (e) => `${e.apellidos}, ${e.nombres}`;
const iniciales = (e) => (e.nombres.trim()[0] + e.apellidos.trim()[0]).toUpperCase();

const fmtFecha = (iso) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
const fmtFechaHora = (iso) => new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const COLORES = [
  "linear-gradient(135deg, var(--secondary-500), var(--secondary-700))",
  "linear-gradient(135deg, var(--tertiary-500), var(--tertiary-600))",
  "linear-gradient(135deg, var(--cyan-500), var(--cyan-700))",
  "linear-gradient(135deg, var(--primary-500), var(--primary-700))"
];

const historialDe = (id) => estado.qrs
  .filter(q => q.estudiante_idestudiante === id)
  .sort((a, b) => b.fecha_emision.localeCompare(a.fecha_emision));
const vigenteDe = (id) => historialDe(id).find(q => Number(q.vigente) === 1) ?? null;

let toastTimer;
function aviso(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-show"), 3200);
}

const ICO = {
  qr: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4"/>',
  print: '<path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

/* ---------- GENERADOR DE QR ---------- */
const hayLibreriaQr = () => typeof qrcode !== "undefined";

// Devuelve un SVG nítido (negro sobre blanco, con zona de silencio) listo para pantalla o impresión
function qrSvg(texto) {
  if (!hayLibreriaQr()) return null;
  const q = qrcode(0, "M");
  q.addData(texto);
  q.make();
  const n = q.getModuleCount(), m = 4;
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
  const t = n + m * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges" role="img" aria-label="Código QR"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

/* ---------- LISTADO ---------- */
function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  const f = $("fQr").value;
  return estado.estudiantes
    .filter(e => {
      if (q && !normalizar(`${e.nombres} ${e.apellidos} ${e.ci}`).includes(q)) return false;
      const tiene = !!vigenteDe(e.idestudiante);
      return f === "con" ? tiene : f === "sin" ? !tiene : true;
    })
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos, "es") || a.nombres.localeCompare(b.nombres, "es"));
}

const insigniaEstudiante = (e) => {
  const clase = e.estado_estudiante === "Activo" ? "ok" : e.estado_estudiante === "Retirado" ? "out" : "off";
  return `<span class="badge badge--${clase}">${escapar(e.estado_estudiante)}</span>`;
};

function pintar() {
  const lista = filtrados();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = visibles.map(e => {
    const q = vigenteDe(e.idestudiante);
    const marcado = estado.seleccion.has(e.idestudiante);
    return `
    <tr class="row-click${marcado ? " is-selected" : ""}" data-id="${e.idestudiante}" tabindex="0" aria-label="Ver QR de ${escapar(nombreCompleto(e))}">
      <td class="td-check"><input type="checkbox" data-sel="${e.idestudiante}" ${marcado ? "checked" : ""} aria-label="Seleccionar a ${escapar(nombreCompleto(e))}"></td>
      <td data-label="Estudiante">
        <div class="user">
          <span class="user__avatar" style="background:${COLORES[e.idestudiante % COLORES.length]}">${escapar(iniciales(e))}</span>
          <strong>${escapar(nombreCompleto(e))}</strong>
        </div>
      </td>
      <td data-label="CI" class="muted num">${escapar(e.ci)}</td>
      <td data-label="Estado">${insigniaEstudiante(e)}</td>
      <td data-label="Código QR">${q ? '<span class="badge badge--ok">Vigente</span>' : '<span class="badge badge--off">Sin QR</span>'}</td>
      <td data-label="Emitido" class="muted">${q ? fmtFecha(q.fecha_emision) : "—"}</td>
      <td><span class="go">Ver QR ${icono("chevron")}</span></td>
    </tr>`;
  }).join("");

  // Paginación
  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  // Casilla "seleccionar todos" (sobre todos los filtrados)
  const selFiltrados = lista.filter(e => estado.seleccion.has(e.idestudiante)).length;
  $("chkTodos").checked = lista.length > 0 && selFiltrados === lista.length;
  $("chkTodos").indeterminate = selFiltrados > 0 && selFiltrados < lista.length;

  // Botones de cabecera
  const n = estado.seleccion.size;
  $("btnImprimirSel").disabled = n === 0;
  $("txtImprimirSel").textContent = n ? `Imprimir seleccionados (${n})` : "Imprimir seleccionados";
  const faltantes = estado.estudiantes.filter(e => e.estado_estudiante === "Activo" && !vigenteDe(e.idestudiante));
  $("btnFaltantes").hidden = faltantes.length === 0;
  $("txtFaltantes").textContent = `Generar QR faltantes (${faltantes.length})`;

  // Resumen
  const total = estado.estudiantes.length;
  const con = estado.estudiantes.filter(e => vigenteDe(e.idestudiante)).length;
  $("resumen").textContent = `${total} ${total === 1 ? "estudiante" : "estudiantes"} · ${con} con QR vigente · ${total - con} sin QR`;
}

/* ---------- SELECCIÓN ---------- */
$("chkTodos").addEventListener("change", (e) => {
  const lista = filtrados();
  lista.forEach(est => (e.target.checked ? estado.seleccion.add(est.idestudiante) : estado.seleccion.delete(est.idestudiante)));
  pintar();
});

/* ---------- CLIC EN LA TABLA ---------- */
$("tbody").addEventListener("click", (e) => {
  const chk = e.target.closest("[data-sel]");
  if (chk) {
    const id = Number(chk.dataset.sel);
    chk.checked ? estado.seleccion.add(id) : estado.seleccion.delete(id);
    pintar();
    return;
  }
  if (e.target.closest(".td-check")) return;
  const fila = e.target.closest("tr[data-id]");
  if (fila) abrirQr(Number(fila.dataset.id));
});

$("tbody").addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches("tr[data-id]")) {
    e.preventDefault();
    abrirQr(Number(e.target.dataset.id));
  }
});

/* ---------- MODAL DEL QR ---------- */
const dlgQr = $("dlgQr");

function abrirQr(id) {
  estado.actual = id;
  renderQr();
  dlgQr.showModal();
}

function renderQr() {
  const e = estudiante(estado.actual);
  if (!e) return;
  const q = vigenteDe(e.idestudiante);
  const historial = historialDe(e.idestudiante);
  const svg = q ? qrSvg(q.codigo) : null;

  $("qrTitulo").textContent = "QR del estudiante";

  const columnaQr = q
    ? (svg
        ? `<div class="qrbox">${svg}</div><button class="chip-btn" type="button" data-act="copiar">Copiar código</button>`
        : `<div class="qrbox qrbox--empty"><strong>No se pudo cargar el generador</strong><span>Revisa tu conexión a internet.</span></div>`)
    : `<div class="qrbox qrbox--empty">${icono("qr")}<strong>Sin QR vigente</strong><span>Genera uno para este estudiante.</span></div>`;

  const anteriores = historial.length;
  $("qrBody").innerHTML = `
    <div class="qrview">
      <div class="qrview__code">${columnaQr}</div>

      <div class="qrview__data">
        <div class="who">
          <span class="user__avatar" style="background:${COLORES[e.idestudiante % COLORES.length]}">${escapar(iniciales(e))}</span>
          <div><h3>${escapar(e.nombres)} ${escapar(e.apellidos)}</h3><span>Estudiante</span></div>
        </div>

        <dl class="facts">
          <dt>Cédula de identidad</dt><dd>${escapar(e.ci)}</dd>
          <dt>Estado</dt><dd>${insigniaEstudiante(e)}</dd>
          <dt>Código QR</dt><dd>${q ? '<span class="badge badge--ok">Vigente</span>' : '<span class="badge badge--off">Sin QR</span>'}</dd>
          <dt>Emitido</dt><dd>${q ? fmtFechaHora(q.fecha_emision) : "—"}</dd>
          <dt>Código</dt><dd class="mono">${q ? escapar(q.codigo) : "—"}</dd>
        </dl>

        ${e.estado_estudiante !== "Activo" ? `<p class="warn-note">Este estudiante figura como ${escapar(e.estado_estudiante.toLowerCase())}. Genera o imprime su QR solo si corresponde.</p>` : ""}

        ${anteriores ? `
        <details class="hist">
          <summary>Historial de QR (${anteriores})</summary>
          <ul>${historial.map(h => `<li><span>${fmtFechaHora(h.fecha_emision)}</span>${Number(h.vigente) === 1 ? '<span class="badge badge--ok">Vigente</span>' : '<span class="badge badge--off">Reemplazado</span>'}</li>`).join("")}</ul>
        </details>` : ""}
      </div>
    </div>`;

  $("qrFoot").innerHTML = q
    ? `<button class="btn btn--ghost" type="button" data-act="regenerar">${icono("refresh")}Regenerar QR</button>
       <button class="btn btn--primary" type="button" data-act="imprimir" ${svg ? "" : "disabled"}>${icono("print")}Imprimir tarjeta</button>`
    : `<button class="btn btn--primary" type="button" data-act="generar">${icono("qr")}Generar QR</button>`;
}

dlgQr.addEventListener("click", async (ev) => {
  const btn = ev.target.closest("[data-act]");
  if (!btn) return;
  const id = estado.actual;

  if (btn.dataset.act === "imprimir") imprimir([id]);
  if (btn.dataset.act === "generar") await generarQr(id);
  if (btn.dataset.act === "regenerar") {
    confirmar({
      titulo: "Regenerar QR",
      texto: "Se creará un QR nuevo y el actual dejará de ser válido. La tarjeta que ya se imprimió no podrá usarse para registrar asistencia.",
      boton: "Regenerar QR",
      alAceptar: () => generarQr(id, true)
    });
  }
  if (btn.dataset.act === "copiar") {
    const q = vigenteDe(id);
    try {
      await navigator.clipboard.writeText(q.codigo);
      aviso("Código copiado");
    } catch (e) {
      aviso("No se pudo copiar el código.");
    }
  }
});

/* ---------- GENERAR QR ---------- */
async function generarQr(id, regenerado = false) {
  try {
    await api.generar(id);
    if (API_URL) estado.qrs = await api.qrs();
    pintar();
    if (dlgQr.open && estado.actual === id) renderQr();
    aviso(regenerado ? "QR regenerado. El anterior ya no es válido." : "QR generado");
  } catch (e) {
    aviso("No se pudo generar el QR. Intenta de nuevo.");
  }
}

$("btnFaltantes").addEventListener("click", () => {
  const faltantes = estado.estudiantes.filter(e => e.estado_estudiante === "Activo" && !vigenteDe(e.idestudiante));
  if (!faltantes.length) return;
  confirmar({
    titulo: "Generar QR faltantes",
    texto: `Se generará un QR para ${faltantes.length} ${faltantes.length === 1 ? "estudiante activo que aún no lo tiene" : "estudiantes activos que aún no lo tienen"}.`,
    boton: "Generar",
    alAceptar: async () => {
      try {
        for (const e of faltantes) await api.generar(e.idestudiante);
        if (API_URL) estado.qrs = await api.qrs();
        pintar();
        aviso(`${faltantes.length} QR generados`);
      } catch (err) {
        if (API_URL) estado.qrs = await api.qrs();
        pintar();
        aviso("No se pudieron generar todos los QR. Intenta de nuevo.");
      }
    }
  });
});

/* ---------- CONFIRMAR ---------- */
let accionConfirmada = null;
function confirmar({ titulo, texto, boton, alAceptar }) {
  $("cfTitulo").textContent = titulo;
  $("cfTexto").textContent = texto;
  $("cfOk").textContent = boton;
  accionConfirmada = alAceptar;
  $("dlgConfirm").showModal();
}
$("cfOk").addEventListener("click", async () => {
  $("dlgConfirm").close();
  const fn = accionConfirmada;
  accionConfirmada = null;
  if (fn) await fn();
});

/* ---------- IMPRESIÓN DE TARJETAS ---------- */
function tarjetaHTML(e, q) {
  const colegio = estado.colegio || "Sistema de Asistencia QR";
  return `
  <div class="idcard">
    <div class="idcard__head">
      <span class="idcard__school">${escapar(colegio)}</span>
      <span class="idcard__kind">CREDENCIAL ESTUDIANTIL</span>
    </div>
    <div class="idcard__body">
      <div class="idcard__info">
        <small>Estudiante</small>
        <span class="idcard__name">${escapar(e.nombres)} ${escapar(e.apellidos)}</span>
        <small>C.I.</small>
        <b>${escapar(e.ci)}</b>
        <small>N.º de QR</small>
        <b>${String(q.idqr_estudiante).padStart(6, "0")}</b>
      </div>
      <div class="idcard__qr">
        ${qrSvg(q.codigo)}
        <small>Escanea al ingresar</small>
      </div>
    </div>
    <div class="idcard__stripe"></div>
  </div>`;
}

function imprimir(ids) {
  if (!hayLibreriaQr()) { aviso("No se pudo cargar el generador de QR. Revisa tu conexión."); return; }

  const conQr = ids.map(id => ({ e: estudiante(id), q: vigenteDe(id) })).filter(x => x.e && x.q);
  const omitidos = ids.length - conQr.length;
  if (!conQr.length) { aviso("Los estudiantes seleccionados no tienen un QR vigente."); return; }

  $("printArea").innerHTML = conQr.map(x => tarjetaHTML(x.e, x.q)).join("");
  if (omitidos) aviso(`${omitidos} sin QR vigente no se incluyeron en la impresión.`);
  window.print();
}

window.addEventListener("afterprint", () => { $("printArea").innerHTML = ""; });

$("btnImprimirSel").addEventListener("click", () => imprimir([...estado.seleccion]));

/* ---------- EVENTOS GENERALES ---------- */
["fBuscar", "fQr"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

/* ---------- INICIO ---------- */
(async function iniciar() {
  try {
    [estado.estudiantes, estado.qrs, estado.colegio] = await Promise.all([api.estudiantes(), api.qrs(), api.colegio()]);
  } catch (err) {
    $("resumen").textContent = "No se pudieron cargar los estudiantes.";
    return;
  }
  pintar();
})();
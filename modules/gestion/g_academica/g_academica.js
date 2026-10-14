/* =========================================================
   MÓDULO · GESTIÓN ACADÉMICA
   Tabla: gestion_academica (idgestion_academica, nombre varchar(60),
          fecha_inicio date, fecha_fin date)
   ========================================================= */

/* ---------- CAPA DE DATOS ----------
   Ahora funciona en modo demostración (localStorage).
   Para conectarlo a tu backend, pon tu ruta en API_URL:
     GET    {API_URL}/gestiones
     POST   {API_URL}/gestiones
     PUT    {API_URL}/gestiones/:id
     DELETE {API_URL}/gestiones/:id   (409 si tiene registros asociados) */
const API_URL = ""; // ej.: "/api"

const GESTIONES_DEMO = [
  { idgestion_academica: 1, nombre: "Gestión 2025", fecha_inicio: "2025-02-03", fecha_fin: "2025-12-05" },
  { idgestion_academica: 2, nombre: "Gestión 2026", fecha_inicio: "2026-02-02", fecha_fin: "2026-12-04" },
  { idgestion_academica: 3, nombre: "Gestión 2027", fecha_inicio: "2027-02-01", fecha_fin: "2027-12-03" }
];

const estado = { lista: [], pagina: 1 };
const POR_PAGINA = 10;

const api = {
  async listar() {
    if (API_URL) return (await fetch(`${API_URL}/gestiones`)).json();
    try {
      const g = JSON.parse(localStorage.getItem("gestiones_demo"));
      if (Array.isArray(g)) return g;
    } catch (e) {}
    return GESTIONES_DEMO.slice();
  },
  async guardar(ges) {
    if (API_URL) {
      const nueva = !ges.idgestion_academica;
      const r = await fetch(`${API_URL}/gestiones${nueva ? "" : "/" + ges.idgestion_academica}`, {
        method: nueva ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ges)
      });
      if (!r.ok) throw new Error("guardar");
      return r.json();
    }
    if (!ges.idgestion_academica) {
      ges.idgestion_academica = Math.max(0, ...estado.lista.map(x => x.idgestion_academica)) + 1;
      estado.lista.push(ges);
    } else {
      const i = estado.lista.findIndex(x => x.idgestion_academica === ges.idgestion_academica);
      estado.lista[i] = ges;
    }
    localStorage.setItem("gestiones_demo", JSON.stringify(estado.lista));
    return ges;
  },
  async eliminar(id) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/gestiones/${id}`, { method: "DELETE" });
      if (r.status === 409) throw new Error("en_uso");
      if (!r.ok) throw new Error("eliminar");
      return;
    }
    estado.lista = estado.lista.filter(x => x.idgestion_academica !== id);
    localStorage.setItem("gestiones_demo", JSON.stringify(estado.lista));
  }
};

/* ---------- UTILIDADES ---------- */
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");

const hoyISO = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD en hora local
const fechaLocal = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const fmtFecha = (iso) => fechaLocal(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });

// Días entre dos fechas, contando ambos extremos
const diasEntre = (a, b) => Math.round((fechaLocal(b) - fechaLocal(a)) / 864e5) + 1;

function fmtDuracion(inicio, fin) {
  const d = diasEntre(inicio, fin);
  const meses = Math.round(d / 30.4);
  return `${d.toLocaleString("es-ES")} días${meses >= 1 ? ` · ≈ ${meses} ${meses === 1 ? "mes" : "meses"}` : ""}`;
}

function estadoDe(g) {
  const hoy = hoyISO();
  if (hoy < g.fecha_inicio) return "Próxima";
  if (hoy > g.fecha_fin) return "Finalizada";
  return "En curso";
}

let toastTimer;
function aviso(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-show"), 2800);
}

const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

/* ---------- LISTADO ---------- */
function filtradas() {
  const q = normalizar($("fBuscar").value.trim());
  const est = $("fEstado").value;
  return estado.lista
    .filter(g => (!q || normalizar(g.nombre).includes(q)) && (!est || estadoDe(g) === est))
    .sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio)); // la más reciente primero
}

function insignia(g) {
  const e = estadoDe(g);
  const clase = e === "En curso" ? "ok" : e === "Próxima" ? "next" : "off";
  return `<span class="badge badge--${clase}">${e}</span>`;
}

// En las gestiones en curso se muestra cuánto del periodo ya transcurrió
function progreso(g) {
  if (estadoDe(g) !== "En curso") return "";
  const total = diasEntre(g.fecha_inicio, g.fecha_fin);
  const pasados = diasEntre(g.fecha_inicio, hoyISO());
  const pct = Math.min(100, Math.max(0, Math.round((pasados / total) * 100)));
  return `<div class="progress" title="Día ${pasados} de ${total}"><div class="progress__bar"><i style="width:${pct}%"></i></div><small>${pct} % transcurrido</small></div>`;
}

function pintar() {
  const lista = filtradas();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = visibles.map(g => `
    <tr>
      <td data-label="Gestión">
        <div class="term">
          <span class="term__ico">${icono("cal")}</span>
          <strong>${escapar(g.nombre)}</strong>
        </div>
      </td>
      <td data-label="Inicio" class="muted">${fmtFecha(g.fecha_inicio)}</td>
      <td data-label="Fin" class="muted">${fmtFecha(g.fecha_fin)}</td>
      <td data-label="Duración" class="muted">${fmtDuracion(g.fecha_inicio, g.fecha_fin)}</td>
      <td data-label="Estado"><div>${insignia(g)}${progreso(g)}</div></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${g.idgestion_academica}" title="Editar" aria-label="Editar ${escapar(g.nombre)}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${g.idgestion_academica}" title="Eliminar" aria-label="Eliminar ${escapar(g.nombre)}">${icono("del")}</button>
        </div>
      </td>
    </tr>`).join("");

  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  const total = estado.lista.length;
  const actual = estado.lista.find(g => estadoDe(g) === "En curso");
  $("resumen").textContent = `${total} ${total === 1 ? "gestión registrada" : "gestiones registradas"}` +
    (actual ? ` · En curso: ${actual.nombre}` : total ? " · Ninguna en curso" : "");
}

/* ---------- FORMULARIO ---------- */
const dlg = $("dlgGestion");
const form = $("formGestion");

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
}

function actualizarDuracion() {
  const h = $("hintDuracion");
  const a = $("fecha_inicio").value, b = $("fecha_fin").value;
  h.classList.remove("is-info");
  if (a && b && b >= a) {
    h.textContent = `Duración: ${fmtDuracion(a, b)}`;
    h.classList.add("is-info");
  } else {
    h.textContent = "Indica las fechas para calcular la duración.";
  }
}

function abrirFormulario(ges) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = ges ? "Editar gestión" : "Nueva gestión";
  $("btnGuardar").textContent = ges ? "Guardar cambios" : "Guardar gestión";
  $("idgestion_academica").value = ges?.idgestion_academica ?? "";
  $("nombre").value = ges?.nombre ?? "";
  $("fecha_inicio").value = ges?.fecha_inicio ?? "";
  $("fecha_fin").value = ges?.fecha_fin ?? "";
  actualizarDuracion();
  dlg.showModal();
  $("nombre").focus();
}

function marcarError(campo, msg) {
  form.querySelector(`[data-err="${campo}"]`).textContent = msg;
  $(campo).classList.add("is-invalid");
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("idgestion_academica").value) || null;
  const nombre = limpiarEspacios($("nombre").value);
  const ini = $("fecha_inicio").value, fin = $("fecha_fin").value;

  if (nombre.length < 3) { marcarError("nombre", "Escribe al menos 3 caracteres."); ok = false; }
  else if (estado.lista.some(g => g.idgestion_academica !== id && normalizar(g.nombre) === normalizar(nombre))) {
    marcarError("nombre", "Ya existe una gestión con ese nombre."); ok = false;
  }

  if (!ini) { marcarError("fecha_inicio", "Indica la fecha de inicio."); ok = false; }
  if (!fin) { marcarError("fecha_fin", "Indica la fecha de fin."); ok = false; }

  if (ini && fin) {
    if (fin <= ini) { marcarError("fecha_fin", "La fecha de fin debe ser posterior a la de inicio."); ok = false; }
    else {
      // Las gestiones no deben cruzarse entre sí
      const cruce = estado.lista.find(g => g.idgestion_academica !== id && ini <= g.fecha_fin && g.fecha_inicio <= fin);
      if (cruce) { marcarError("fecha_inicio", `Estas fechas se cruzan con «${cruce.nombre}» (${fmtFecha(cruce.fecha_inicio)} – ${fmtFecha(cruce.fecha_fin)}).`); ok = false; }
    }
  }
  return ok;
}

["fecha_inicio", "fecha_fin"].forEach(id => $(id).addEventListener("input", actualizarDuracion));

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const ges = {
    idgestion_academica: Number($("idgestion_academica").value) || null,
    nombre: limpiarEspacios($("nombre").value),
    fecha_inicio: $("fecha_inicio").value,
    fecha_fin: $("fecha_fin").value
  };
  const editando = !!ges.idgestion_academica;

  $("btnGuardar").disabled = true;
  try {
    await api.guardar(ges);
    if (API_URL) estado.lista = await api.listar();
    dlg.close();
    pintar();
    aviso(editando ? "Gestión actualizada" : "Gestión creada");
  } catch (err) {
    aviso("No se pudo guardar la gestión. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

/* ---------- ACCIONES DE FILA ---------- */
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const ges = estado.lista.find(x => x.idgestion_academica === Number(btn.dataset.id));
  if (!ges) return;

  if (btn.dataset.accion === "editar") abrirFormulario(ges);
  if (btn.dataset.accion === "eliminar") {
    idEliminar = ges.idgestion_academica;
    $("delTexto").textContent = `Se eliminará «${ges.nombre}». Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  try {
    await api.eliminar(idEliminar);
    if (API_URL) estado.lista = await api.listar();
    $("dlgEliminar").close();
    pintar();
    aviso("Gestión eliminada");
  } catch (err) {
    $("dlgEliminar").close();
    aviso(err.message === "en_uso"
      ? "No se puede eliminar: la gestión tiene registros asociados."
      : "No se pudo eliminar la gestión. Intenta de nuevo.");
  }
});

/* ---------- EVENTOS GENERALES ---------- */
$("btnNueva").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fEstado"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

/* ---------- INICIO ---------- */
(async function iniciar() {
  try {
    estado.lista = await api.listar();
  } catch (err) {
    $("resumen").textContent = "No se pudieron cargar las gestiones.";
    return;
  }
  pintar();
})();
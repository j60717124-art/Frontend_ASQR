/* =========================================================
   MÓDULO · COLEGIO
   Tabla: colegio (idcolegio, nombre varchar(100), telefono varchar(8),
          ubicacion varchar(255))
   ========================================================= */

/* ---------- CAPA DE DATOS ----------
   Ahora funciona en modo demostración (localStorage).
   Para conectarlo a tu backend, pon tu ruta en API_URL:
     GET    {API_URL}/colegios
     POST   {API_URL}/colegios
     PUT    {API_URL}/colegios/:id
     DELETE {API_URL}/colegios/:id   (409 si tiene registros asociados) */
const API_URL = ""; // ej.: "/api"

const COLEGIOS_DEMO = [
  { idcolegio: 1, nombre: "Unidad Educativa San Martín", telefono: "44123456", ubicacion: "Av. Principal #123, Zona Norte. Frente a la plaza central." }
];

const estado = { lista: [] };

const api = {
  async listar() {
    if (API_URL) return (await fetch(`${API_URL}/colegios`)).json();
    try {
      const g = JSON.parse(localStorage.getItem("colegios_demo"));
      if (Array.isArray(g)) return g;
    } catch (e) {}
    return COLEGIOS_DEMO.slice();
  },
  async guardar(col) {
    if (API_URL) {
      const nuevo = !col.idcolegio;
      const r = await fetch(`${API_URL}/colegios${nuevo ? "" : "/" + col.idcolegio}`, {
        method: nuevo ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(col)
      });
      if (!r.ok) throw new Error("guardar");
      return r.json();
    }
    if (!col.idcolegio) {
      col.idcolegio = Math.max(0, ...estado.lista.map(x => x.idcolegio)) + 1;
      estado.lista.push(col);
    } else {
      const i = estado.lista.findIndex(x => x.idcolegio === col.idcolegio);
      estado.lista[i] = col;
    }
    localStorage.setItem("colegios_demo", JSON.stringify(estado.lista));
    return col;
  },
  async eliminar(id) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/colegios/${id}`, { method: "DELETE" });
      if (r.status === 409) throw new Error("en_uso");
      if (!r.ok) throw new Error("eliminar");
      return;
    }
    estado.lista = estado.lista.filter(x => x.idcolegio !== id);
    localStorage.setItem("colegios_demo", JSON.stringify(estado.lista));
  }
};

/* ---------- UTILIDADES ---------- */
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");

function iniciales(nombre) {
  const palabras = nombre.trim().split(/\s+/).filter(p => p.length > 2 || /^\p{Lu}/u.test(p));
  const letras = (palabras.length ? palabras : nombre.trim().split(/\s+/)).slice(0, 2).map(p => p[0]);
  return letras.join("").toUpperCase();
}

let toastTimer;
function aviso(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-show"), 2800);
}

/* ---------- LISTADO ---------- */
const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  pin: '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

function pintar() {
  const q = normalizar($("fBuscar").value.trim());
  const lista = estado.lista
    .filter(c => !q || normalizar(`${c.nombre} ${c.ubicacion ?? ""}`).includes(q))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const hayDatos = estado.lista.length > 0;
  $("toolbar").hidden = estado.lista.length < 2;
  $("vacio").hidden = lista.length > 0;
  $("lista").hidden = lista.length === 0;

  if (!lista.length) {
    $("vacioTitulo").textContent = hayDatos ? "No hay resultados" : "Aún no hay colegios registrados";
    $("vacioTexto").textContent = hayDatos ? "Prueba con otra búsqueda." : "Registra los datos del colegio para empezar.";
    $("btnVacio").hidden = hayDatos;
  }

  $("lista").innerHTML = lista.map(c => {
    const mapa = c.ubicacion
      ? `<a class="link-map" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.ubicacion)}" target="_blank" rel="noopener">${icono("map")}Ver en el mapa</a>`
      : "<span></span>";
    return `
    <article class="school">
      <div class="school__top">
        <span class="school__logo">${escapar(iniciales(c.nombre))}</span>
        <h2 class="school__name">${escapar(c.nombre)}</h2>
      </div>

      <ul class="school__info">
        <li>
          <span class="ico">${icono("phone")}</span>
          <span><small>Teléfono</small>${c.telefono ? `<a href="tel:${escapar(c.telefono)}">${escapar(c.telefono)}</a>` : '<em class="none">Sin teléfono</em>'}</span>
        </li>
        <li>
          <span class="ico">${icono("pin")}</span>
          <span><small>Ubicación</small>${c.ubicacion ? `<span class="school__loc">${escapar(c.ubicacion)}</span>` : '<em class="none">Sin ubicación</em>'}</span>
        </li>
      </ul>

      <footer class="school__foot">
        ${mapa}
        <div class="school__actions">
          <button class="icon-btn" data-accion="editar" data-id="${c.idcolegio}" title="Editar" aria-label="Editar ${escapar(c.nombre)}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${c.idcolegio}" title="Eliminar" aria-label="Eliminar ${escapar(c.nombre)}">${icono("del")}</button>
        </div>
      </footer>
    </article>`;
  }).join("");

  const n = estado.lista.length;
  $("resumen").textContent = n === 0 ? "Sin colegios registrados"
    : n === 1 ? "Información institucional del colegio"
    : `${n} colegios registrados`;
}

/* ---------- FORMULARIO ---------- */
const dlg = $("dlgCol");
const form = $("formCol");

function contadores() {
  $("cntNombre").textContent = `${$("nombre").value.length}/100`;
  $("cntUbic").textContent = `${$("ubicacion").value.length}/255`;
}

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
}

function abrirFormulario(col) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = col ? "Editar colegio" : "Nuevo colegio";
  $("btnGuardar").textContent = col ? "Guardar cambios" : "Guardar colegio";
  $("idcolegio").value = col?.idcolegio ?? "";
  $("nombre").value = col?.nombre ?? "";
  $("telefono").value = col?.telefono ?? "";
  $("ubicacion").value = col?.ubicacion ?? "";
  contadores();
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
  const id = Number($("idcolegio").value) || null;
  const nombre = limpiarEspacios($("nombre").value);
  const tel = $("telefono").value.trim();

  if (nombre.length < 3) { marcarError("nombre", "Escribe al menos 3 caracteres."); ok = false; }
  else if (estado.lista.some(c => c.idcolegio !== id && normalizar(c.nombre) === normalizar(nombre))) {
    marcarError("nombre", "Ya existe un colegio con ese nombre."); ok = false;
  }

  if (tel && !/^\d{8}$/.test(tel)) { marcarError("telefono", "El teléfono debe tener exactamente 8 dígitos."); ok = false; }
  return ok;
}

$("nombre").addEventListener("input", contadores);
$("ubicacion").addEventListener("input", contadores);
$("telefono").addEventListener("input", (e) => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 8);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const col = {
    idcolegio: Number($("idcolegio").value) || null,
    nombre: limpiarEspacios($("nombre").value),
    telefono: $("telefono").value.trim() || null,
    ubicacion: limpiarEspacios($("ubicacion").value) || null
  };
  const editando = !!col.idcolegio;

  $("btnGuardar").disabled = true;
  try {
    await api.guardar(col);
    if (API_URL) estado.lista = await api.listar();
    dlg.close();
    pintar();
    aviso(editando ? "Colegio actualizado" : "Colegio registrado");
  } catch (err) {
    aviso("No se pudo guardar el colegio. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

/* ---------- ACCIONES ---------- */
let idEliminar = null;

$("lista").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const col = estado.lista.find(x => x.idcolegio === Number(btn.dataset.id));
  if (!col) return;

  if (btn.dataset.accion === "editar") abrirFormulario(col);
  if (btn.dataset.accion === "eliminar") {
    idEliminar = col.idcolegio;
    $("delTexto").textContent = `Se eliminará «${col.nombre}». Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  try {
    await api.eliminar(idEliminar);
    if (API_URL) estado.lista = await api.listar();
    $("dlgEliminar").close();
    pintar();
    aviso("Colegio eliminado");
  } catch (err) {
    $("dlgEliminar").close();
    aviso(err.message === "en_uso"
      ? "No se puede eliminar: el colegio tiene registros asociados."
      : "No se pudo eliminar el colegio. Intenta de nuevo.");
  }
});

/* ---------- EVENTOS GENERALES ---------- */
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
$("btnVacio").addEventListener("click", () => abrirFormulario(null));
$("fBuscar").addEventListener("input", pintar);

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

/* ---------- INICIO ---------- */
(async function iniciar() {
  try {
    estado.lista = await api.listar();
  } catch (err) {
    $("resumen").textContent = "No se pudo cargar la información.";
    return;
  }
  pintar();
})();
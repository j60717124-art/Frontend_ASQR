/* =========================================================
   MÓDULO · CURSO
   Tabla: curso (idcurso, nombre varchar(20), colegio_idcolegio int,
          nivel_idnivel int)
   ========================================================= */

/* ---------- CAPA DE DATOS ----------
   Ahora funciona en modo demostración (localStorage).
   Para conectarlo a tu backend, pon tu ruta en API_URL:
     GET    {API_URL}/cursos
     POST   {API_URL}/cursos
     PUT    {API_URL}/cursos/:id
     DELETE {API_URL}/cursos/:id   (409 si el curso tiene estudiantes, horarios u otros registros)
     GET    {API_URL}/colegios     (idcolegio, nombre)
     GET    {API_URL}/niveles      (idnivel, nivel) */
const API_URL = ""; // ej.: "/api"

const COLEGIOS_DEMO = [{ idcolegio: 1, nombre: "Unidad Educativa San Martín" }];
const NIVELES_DEMO = [
  { idnivel: 1, nivel: "Inicial" },
  { idnivel: 2, nivel: "Primaria" },
  { idnivel: 3, nivel: "Secundaria" }
];

const CURSOS_DEMO = [
  { idcurso: 1, nombre: "Pre-kínder", colegio_idcolegio: 1, nivel_idnivel: 1 },
  { idcurso: 2, nombre: "1.º", colegio_idcolegio: 1, nivel_idnivel: 2 },
  { idcurso: 3, nombre: "2.º", colegio_idcolegio: 1, nivel_idnivel: 2 },
  { idcurso: 4, nombre: "1.º", colegio_idcolegio: 1, nivel_idnivel: 3 },
  { idcurso: 5, nombre: "2.º", colegio_idcolegio: 1, nivel_idnivel: 3 },
  { idcurso: 6, nombre: "3.º", colegio_idcolegio: 1, nivel_idnivel: 3 }
];

const estado = { cursos: [], colegios: [], niveles: [], pagina: 1 };
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
    if (API_URL) return (await fetch(`${API_URL}/cursos`)).json();
    return leerLocal("cursos_demo", CURSOS_DEMO);
  },
  async colegios() {
    if (API_URL) return (await fetch(`${API_URL}/colegios`)).json();
    return leerLocal("colegios_demo", COLEGIOS_DEMO);
  },
  async niveles() {
    if (API_URL) return (await fetch(`${API_URL}/niveles`)).json();
    return leerLocal("niveles_demo", NIVELES_DEMO);
  },
  async guardar(cur) {
    if (API_URL) {
      const nuevo = !cur.idcurso;
      const r = await fetch(`${API_URL}/cursos${nuevo ? "" : "/" + cur.idcurso}`, {
        method: nuevo ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cur)
      });
      if (!r.ok) throw new Error("guardar");
      return r.json();
    }
    if (!cur.idcurso) {
      cur.idcurso = Math.max(0, ...estado.cursos.map(x => x.idcurso)) + 1;
      estado.cursos.push(cur);
    } else {
      const i = estado.cursos.findIndex(x => x.idcurso === cur.idcurso);
      estado.cursos[i] = cur;
    }
    localStorage.setItem("cursos_demo", JSON.stringify(estado.cursos));
    return cur;
  },
  async eliminar(id) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/cursos/${id}`, { method: "DELETE" });
      if (r.status === 409) throw new Error("en_uso");
      if (!r.ok) throw new Error("eliminar");
      return;
    }
    estado.cursos = estado.cursos.filter(x => x.idcurso !== id);
    localStorage.setItem("cursos_demo", JSON.stringify(estado.cursos));
  }
};

/* ---------- UTILIDADES ---------- */
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");

const nombreColegio = (id) => estado.colegios.find(c => c.idcolegio === id)?.nombre ?? "Sin colegio";
const nombreNivel = (id) => estado.niveles.find(n => n.idnivel === id)?.nivel ?? "Sin nivel";
const ordenNivel = (id) => { const i = estado.niveles.findIndex(n => n.idnivel === id); return i < 0 ? 999 : i; };

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
  group: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.5A6 6 0 0 1 21 20"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

/* ---------- LISTADO ---------- */
function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  const niv = $("fNivel").value;
  const col = $("fColegio").value;
  return estado.cursos
    .filter(c =>
      (!q || normalizar(`${c.nombre} ${nombreNivel(c.nivel_idnivel)} ${nombreColegio(c.colegio_idcolegio)}`).includes(q)) &&
      (!niv || String(c.nivel_idnivel) === niv) &&
      (!col || String(c.colegio_idcolegio) === col))
    // Primero por nivel (Inicial → Primaria → Secundaria) y luego por nombre, entendiendo los números
    .sort((a, b) =>
      ordenNivel(a.nivel_idnivel) - ordenNivel(b.nivel_idnivel) ||
      a.nombre.localeCompare(b.nombre, "es", { numeric: true }));
}

function pintar() {
  const lista = filtrados();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = visibles.map(c => `
    <tr>
      <td data-label="Curso">
        <div class="room">
          <span class="room__ico">${icono("group")}</span>
          <strong>${escapar(c.nombre)}</strong>
        </div>
      </td>
      <td data-label="Nivel"><span class="badge badge--level">${escapar(nombreNivel(c.nivel_idnivel))}</span></td>
      <td data-label="Colegio"><span class="badge badge--school" title="${escapar(nombreColegio(c.colegio_idcolegio))}"><span>${escapar(nombreColegio(c.colegio_idcolegio))}</span></span></td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${c.idcurso}" title="Editar" aria-label="Editar ${escapar(c.nombre)}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${c.idcurso}" title="Eliminar" aria-label="Eliminar ${escapar(c.nombre)}">${icono("del")}</button>
        </div>
      </td>
    </tr>`).join("");

  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  const n = estado.cursos.length;
  $("resumen").textContent = `${n} ${n === 1 ? "curso registrado" : "cursos registrados"}`;
}

/* ---------- COMBOS ---------- */
function llenarCombos() {
  const colegios = estado.colegios.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const optColegios = colegios.map(c => `<option value="${c.idcolegio}">${escapar(c.nombre)}</option>`).join("");
  const optNiveles = estado.niveles.map(n => `<option value="${n.idnivel}">${escapar(n.nivel)}</option>`).join("");

  $("colegio_idcolegio").innerHTML = '<option value="">Selecciona un colegio</option>' + optColegios;
  $("nivel_idnivel").innerHTML = '<option value="">Selecciona un nivel</option>' + optNiveles;
  $("fColegio").innerHTML = '<option value="">Todos los colegios</option>' + optColegios;
  $("fNivel").innerHTML = '<option value="">Todos los niveles</option>' + optNiveles;
  $("fColegio").hidden = colegios.length < 2; // con un solo colegio el filtro no aporta nada
}

/* ---------- FORMULARIO ---------- */
const dlg = $("dlgCurso");
const form = $("formCurso");

function contador() { $("cntNombre").textContent = `${$("nombre").value.length}/20`; }

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
}

function avisoVacio(hintId, hayDatos, texto) {
  const h = $(hintId);
  h.textContent = hayDatos ? "" : texto;
  h.classList.toggle("is-warn", !hayDatos);
}

function abrirFormulario(cur) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = cur ? "Editar curso" : "Nuevo curso";
  $("btnGuardar").textContent = cur ? "Guardar cambios" : "Guardar curso";
  $("idcurso").value = cur?.idcurso ?? "";
  $("nombre").value = cur?.nombre ?? "";
  $("nivel_idnivel").value = cur?.nivel_idnivel ?? "";
  // Con un solo colegio se preselecciona
  $("colegio_idcolegio").value = cur?.colegio_idcolegio ?? (estado.colegios.length === 1 ? estado.colegios[0].idcolegio : "");
  avisoVacio("hintNivel", estado.niveles.length > 0, "Primero registra un nivel en el módulo Nivel.");
  avisoVacio("hintColegio", estado.colegios.length > 0, "Primero registra un colegio en el módulo Colegio.");
  contador();
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
  const id = Number($("idcurso").value) || null;
  const nombre = limpiarEspacios($("nombre").value);
  const nivel = Number($("nivel_idnivel").value);
  const colegio = Number($("colegio_idcolegio").value);

  if (nombre.length < 2) { marcarError("nombre", "Escribe al menos 2 caracteres."); ok = false; }
  if (!nivel) { marcarError("nivel_idnivel", "Selecciona el nivel del curso."); ok = false; }
  if (!colegio) { marcarError("colegio_idcolegio", "Selecciona el colegio."); ok = false; }

  // El mismo nombre puede existir en otro nivel o colegio (ej.: «1.º» en Primaria y en Secundaria)
  if (nombre.length >= 2 && nivel && colegio &&
      estado.cursos.some(c => c.idcurso !== id && c.nivel_idnivel === nivel && c.colegio_idcolegio === colegio && normalizar(c.nombre) === normalizar(nombre))) {
    marcarError("nombre", "Ya existe un curso con ese nombre en este nivel y colegio."); ok = false;
  }
  return ok;
}

$("nombre").addEventListener("input", contador);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const cur = {
    idcurso: Number($("idcurso").value) || null,
    nombre: limpiarEspacios($("nombre").value),
    colegio_idcolegio: Number($("colegio_idcolegio").value),
    nivel_idnivel: Number($("nivel_idnivel").value)
  };
  const editando = !!cur.idcurso;

  $("btnGuardar").disabled = true;
  try {
    await api.guardar(cur);
    if (API_URL) estado.cursos = await api.listar();
    dlg.close();
    pintar();
    aviso(editando ? "Curso actualizado" : "Curso creado");
  } catch (err) {
    aviso("No se pudo guardar el curso. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

/* ---------- ACCIONES DE FILA ---------- */
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const cur = estado.cursos.find(x => x.idcurso === Number(btn.dataset.id));
  if (!cur) return;

  if (btn.dataset.accion === "editar") abrirFormulario(cur);
  if (btn.dataset.accion === "eliminar") {
    idEliminar = cur.idcurso;
    $("delTexto").textContent = `Se eliminará el curso «${cur.nombre}» de ${nombreNivel(cur.nivel_idnivel)}. Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  try {
    await api.eliminar(idEliminar);
    if (API_URL) estado.cursos = await api.listar();
    $("dlgEliminar").close();
    pintar();
    aviso("Curso eliminado");
  } catch (err) {
    $("dlgEliminar").close();
    aviso(err.message === "en_uso"
      ? "No se puede eliminar: el curso tiene estudiantes, horarios u otros registros asociados."
      : "No se pudo eliminar el curso. Intenta de nuevo.");
  }
});

/* ---------- EVENTOS GENERALES ---------- */
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fNivel", "fColegio"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

/* ---------- INICIO ---------- */
(async function iniciar() {
  try {
    [estado.cursos, estado.colegios, estado.niveles] = await Promise.all([api.listar(), api.colegios(), api.niveles()]);
  } catch (err) {
    $("resumen").textContent = "No se pudieron cargar los cursos.";
    return;
  }
  llenarCombos();
  pintar();
})();
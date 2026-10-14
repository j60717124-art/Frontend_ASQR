/* =========================================================
   MÓDULO · MATERIA
   Tabla: materia (idmateria, nombre_materia varchar(150),
          descripcion varchar(255))
   ========================================================= */

/* ---------- CAPA DE DATOS ----------
   Ahora funciona en modo demostración (localStorage).
   Para conectarlo a tu backend, pon tu ruta en API_URL:
     GET    {API_URL}/materias
     POST   {API_URL}/materias
     PUT    {API_URL}/materias/:id
     DELETE {API_URL}/materias/:id   (409 si la materia está en horarios u otros registros) */
const API_URL = ""; // ej.: "/api"

const MATERIAS_DEMO = [
  { idmateria: 1, nombre_materia: "Matemática", descripcion: "Aritmética, álgebra, geometría y razonamiento lógico." },
  { idmateria: 2, nombre_materia: "Lenguaje y Comunicación", descripcion: "Lectura, escritura, gramática y expresión oral." },
  { idmateria: 3, nombre_materia: "Ciencias Naturales", descripcion: "Estudio de los seres vivos, la materia y el entorno." },
  { idmateria: 4, nombre_materia: "Ciencias Sociales", descripcion: "Historia, geografía y convivencia ciudadana." },
  { idmateria: 5, nombre_materia: "Física", descripcion: "Movimiento, energía, fuerzas y electricidad." },
  { idmateria: 6, nombre_materia: "Química", descripcion: "Composición, propiedades y transformaciones de la materia." },
  { idmateria: 7, nombre_materia: "Biología", descripcion: "Células, organismos, genética y ecología." },
  { idmateria: 8, nombre_materia: "Inglés", descripcion: "Comprensión y comunicación en lengua inglesa." },
  { idmateria: 9, nombre_materia: "Educación Física", descripcion: "Desarrollo motriz, deporte y vida saludable." },
  { idmateria: 10, nombre_materia: "Artes Plásticas", descripcion: "Dibujo, pintura y expresión creativa." },
  { idmateria: 11, nombre_materia: "Música", descripcion: null },
  { idmateria: 12, nombre_materia: "Computación", descripcion: "Uso de herramientas digitales y pensamiento computacional." }
];

const estado = { lista: [], pagina: 1 };
const POR_PAGINA = 10;

const api = {
  async listar() {
    if (API_URL) return (await fetch(`${API_URL}/materias`)).json();
    try {
      const g = JSON.parse(localStorage.getItem("materias_demo"));
      if (Array.isArray(g)) return g;
    } catch (e) {}
    return MATERIAS_DEMO.slice();
  },
  async guardar(mat) {
    if (API_URL) {
      const nueva = !mat.idmateria;
      const r = await fetch(`${API_URL}/materias${nueva ? "" : "/" + mat.idmateria}`, {
        method: nueva ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mat)
      });
      if (!r.ok) throw new Error("guardar");
      return r.json();
    }
    if (!mat.idmateria) {
      mat.idmateria = Math.max(0, ...estado.lista.map(x => x.idmateria)) + 1;
      estado.lista.push(mat);
    } else {
      const i = estado.lista.findIndex(x => x.idmateria === mat.idmateria);
      estado.lista[i] = mat;
    }
    localStorage.setItem("materias_demo", JSON.stringify(estado.lista));
    return mat;
  },
  async eliminar(id) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/materias/${id}`, { method: "DELETE" });
      if (r.status === 409) throw new Error("en_uso");
      if (!r.ok) throw new Error("eliminar");
      return;
    }
    estado.lista = estado.lista.filter(x => x.idmateria !== id);
    localStorage.setItem("materias_demo", JSON.stringify(estado.lista));
  }
};

/* ---------- UTILIDADES ---------- */
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");

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
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 7h6"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

/* ---------- LISTADO ---------- */
function filtradas() {
  const q = normalizar($("fBuscar").value.trim());
  return estado.lista
    .filter(m => !q || normalizar(`${m.nombre_materia} ${m.descripcion ?? ""}`).includes(q))
    .sort((a, b) => a.nombre_materia.localeCompare(b.nombre_materia, "es"));
}

function pintar() {
  const lista = filtradas();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = visibles.map(m => `
    <tr>
      <td data-label="Materia">
        <div class="subject">
          <span class="subject__ico">${icono("book")}</span>
          <strong>${escapar(m.nombre_materia)}</strong>
        </div>
      </td>
      <td data-label="Descripción" class="muted desc">${m.descripcion ? escapar(m.descripcion) : "Sin descripción"}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${m.idmateria}" title="Editar" aria-label="Editar ${escapar(m.nombre_materia)}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${m.idmateria}" title="Eliminar" aria-label="Eliminar ${escapar(m.nombre_materia)}">${icono("del")}</button>
        </div>
      </td>
    </tr>`).join("");

  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  const n = estado.lista.length;
  $("resumen").textContent = `${n} ${n === 1 ? "materia registrada" : "materias registradas"}`;
}

/* ---------- FORMULARIO ---------- */
const dlg = $("dlgMateria");
const form = $("formMateria");

function contadores() {
  $("cntNombre").textContent = `${$("nombre_materia").value.length}/150`;
  $("cntDesc").textContent = `${$("descripcion").value.length}/255`;
}

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
}

function abrirFormulario(mat) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = mat ? "Editar materia" : "Nueva materia";
  $("btnGuardar").textContent = mat ? "Guardar cambios" : "Guardar materia";
  $("idmateria").value = mat?.idmateria ?? "";
  $("nombre_materia").value = mat?.nombre_materia ?? "";
  $("descripcion").value = mat?.descripcion ?? "";
  contadores();
  dlg.showModal();
  $("nombre_materia").focus();
}

function marcarError(campo, msg) {
  form.querySelector(`[data-err="${campo}"]`).textContent = msg;
  $(campo).classList.add("is-invalid");
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("idmateria").value) || null;
  const nombre = limpiarEspacios($("nombre_materia").value);

  if (nombre.length < 3) { marcarError("nombre_materia", "Escribe al menos 3 caracteres."); ok = false; }
  else if (estado.lista.some(m => m.idmateria !== id && normalizar(m.nombre_materia) === normalizar(nombre))) {
    marcarError("nombre_materia", "Ya existe una materia con ese nombre."); ok = false;
  }
  return ok;
}

$("nombre_materia").addEventListener("input", contadores);
$("descripcion").addEventListener("input", contadores);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const mat = {
    idmateria: Number($("idmateria").value) || null,
    nombre_materia: limpiarEspacios($("nombre_materia").value),
    descripcion: limpiarEspacios($("descripcion").value) || null
  };
  const editando = !!mat.idmateria;

  $("btnGuardar").disabled = true;
  try {
    await api.guardar(mat);
    if (API_URL) estado.lista = await api.listar();
    dlg.close();
    pintar();
    aviso(editando ? "Materia actualizada" : "Materia creada");
  } catch (err) {
    aviso("No se pudo guardar la materia. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

/* ---------- ACCIONES DE FILA ---------- */
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const mat = estado.lista.find(x => x.idmateria === Number(btn.dataset.id));
  if (!mat) return;

  if (btn.dataset.accion === "editar") abrirFormulario(mat);
  if (btn.dataset.accion === "eliminar") {
    idEliminar = mat.idmateria;
    $("delTexto").textContent = `Se eliminará «${mat.nombre_materia}». Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  try {
    await api.eliminar(idEliminar);
    if (API_URL) estado.lista = await api.listar();
    $("dlgEliminar").close();
    pintar();
    aviso("Materia eliminada");
  } catch (err) {
    $("dlgEliminar").close();
    aviso(err.message === "en_uso"
      ? "No se puede eliminar: la materia está asignada en horarios u otros registros."
      : "No se pudo eliminar la materia. Intenta de nuevo.");
  }
});

/* ---------- EVENTOS GENERALES ---------- */
$("btnNueva").addEventListener("click", () => abrirFormulario(null));
$("fBuscar").addEventListener("input", () => { estado.pagina = 1; pintar(); });
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

/* ---------- INICIO ---------- */
(async function iniciar() {
  try {
    estado.lista = await api.listar();
  } catch (err) {
    $("resumen").textContent = "No se pudieron cargar las materias.";
    return;
  }
  pintar();
})();
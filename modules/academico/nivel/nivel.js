/* =========================================================
   MÓDULO · NIVEL
   Tabla: nivel (idnivel, nivel varchar(22), descripcion varchar(255))
   ========================================================= */

/* ---------- CAPA DE DATOS ----------
   Ahora funciona en modo demostración (localStorage).
   Para conectarlo a tu backend, pon tu ruta en API_URL:
     GET    {API_URL}/niveles
     POST   {API_URL}/niveles
     PUT    {API_URL}/niveles/:id
     DELETE {API_URL}/niveles/:id   (409 si el nivel está en uso: cursos, paralelos, etc.) */
const API_URL = ""; // ej.: "/api"

const NIVELES_DEMO = [
  { idnivel: 1, nivel: "Inicial", descripcion: "Educación inicial en familia comunitaria." },
  { idnivel: 2, nivel: "Primaria", descripcion: "De 1.º a 6.º grado." },
  { idnivel: 3, nivel: "Secundaria", descripcion: "De 1.º a 6.º año de escolaridad." }
];

const estado = { lista: [], pagina: 1 };
const POR_PAGINA = 10;

const api = {
  async listar() {
    if (API_URL) return (await fetch(`${API_URL}/niveles`)).json();
    try {
      const g = JSON.parse(localStorage.getItem("niveles_demo"));
      if (Array.isArray(g)) return g;
    } catch (e) {}
    return NIVELES_DEMO.slice();
  },
  async guardar(niv) {
    if (API_URL) {
      const nuevo = !niv.idnivel;
      const r = await fetch(`${API_URL}/niveles${nuevo ? "" : "/" + niv.idnivel}`, {
        method: nuevo ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(niv)
      });
      if (!r.ok) throw new Error("guardar");
      return r.json();
    }
    if (!niv.idnivel) {
      niv.idnivel = Math.max(0, ...estado.lista.map(x => x.idnivel)) + 1;
      estado.lista.push(niv);
    } else {
      const i = estado.lista.findIndex(x => x.idnivel === niv.idnivel);
      estado.lista[i] = niv;
    }
    localStorage.setItem("niveles_demo", JSON.stringify(estado.lista));
    return niv;
  },
  async eliminar(id) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/niveles/${id}`, { method: "DELETE" });
      if (r.status === 409) throw new Error("en_uso");
      if (!r.ok) throw new Error("eliminar");
      return;
    }
    estado.lista = estado.lista.filter(x => x.idnivel !== id);
    localStorage.setItem("niveles_demo", JSON.stringify(estado.lista));
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
  layers: '<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

/* ---------- LISTADO ---------- */
function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  return estado.lista
    .filter(n => !q || normalizar(`${n.nivel} ${n.descripcion ?? ""}`).includes(q))
    .sort((a, b) => a.idnivel - b.idnivel); // mismo orden en que se registraron (Inicial, Primaria, Secundaria…)
}

function pintar() {
  const lista = filtrados();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = visibles.map(n => `
    <tr>
      <td data-label="Nivel">
        <div class="subject">
          <span class="subject__ico">${icono("layers")}</span>
          <strong>${escapar(n.nivel)}</strong>
        </div>
      </td>
      <td data-label="Descripción" class="muted desc">${n.descripcion ? escapar(n.descripcion) : "Sin descripción"}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${n.idnivel}" title="Editar" aria-label="Editar ${escapar(n.nivel)}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${n.idnivel}" title="Eliminar" aria-label="Eliminar ${escapar(n.nivel)}">${icono("del")}</button>
        </div>
      </td>
    </tr>`).join("");

  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  const total = estado.lista.length;
  $("resumen").textContent = `${total} ${total === 1 ? "nivel registrado" : "niveles registrados"}`;
}

/* ---------- FORMULARIO ---------- */
const dlg = $("dlgNivel");
const form = $("formNivel");

function contadores() {
  $("cntNivel").textContent = `${$("nivel").value.length}/22`;
  $("cntDesc").textContent = `${$("descripcion").value.length}/255`;
}

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
}

function abrirFormulario(niv) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = niv ? "Editar nivel" : "Nuevo nivel";
  $("btnGuardar").textContent = niv ? "Guardar cambios" : "Guardar nivel";
  $("idnivel").value = niv?.idnivel ?? "";
  $("nivel").value = niv?.nivel ?? "";
  $("descripcion").value = niv?.descripcion ?? "";
  contadores();
  dlg.showModal();
  $("nivel").focus();
}

function marcarError(campo, msg) {
  form.querySelector(`[data-err="${campo}"]`).textContent = msg;
  $(campo).classList.add("is-invalid");
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("idnivel").value) || null;
  const nombre = limpiarEspacios($("nivel").value);

  if (nombre.length < 3) { marcarError("nivel", "Escribe al menos 3 caracteres."); ok = false; }
  else if (estado.lista.some(n => n.idnivel !== id && normalizar(n.nivel) === normalizar(nombre))) {
    marcarError("nivel", "Ya existe un nivel con ese nombre."); ok = false;
  }
  return ok;
}

$("nivel").addEventListener("input", contadores);
$("descripcion").addEventListener("input", contadores);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const niv = {
    idnivel: Number($("idnivel").value) || null,
    nivel: limpiarEspacios($("nivel").value),
    descripcion: limpiarEspacios($("descripcion").value) || null
  };
  const editando = !!niv.idnivel;

  $("btnGuardar").disabled = true;
  try {
    await api.guardar(niv);
    if (API_URL) estado.lista = await api.listar();
    dlg.close();
    pintar();
    aviso(editando ? "Nivel actualizado" : "Nivel creado");
  } catch (err) {
    aviso("No se pudo guardar el nivel. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

/* ---------- ACCIONES DE FILA ---------- */
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const niv = estado.lista.find(x => x.idnivel === Number(btn.dataset.id));
  if (!niv) return;

  if (btn.dataset.accion === "editar") abrirFormulario(niv);
  if (btn.dataset.accion === "eliminar") {
    idEliminar = niv.idnivel;
    $("delTexto").textContent = `Se eliminará el nivel «${niv.nivel}». Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  try {
    await api.eliminar(idEliminar);
    if (API_URL) estado.lista = await api.listar();
    $("dlgEliminar").close();
    pintar();
    aviso("Nivel eliminado");
  } catch (err) {
    $("dlgEliminar").close();
    aviso(err.message === "en_uso"
      ? "No se puede eliminar: el nivel está en uso en otros registros."
      : "No se pudo eliminar el nivel. Intenta de nuevo.");
  }
});

/* ---------- EVENTOS GENERALES ---------- */
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
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
    $("resumen").textContent = "No se pudieron cargar los niveles.";
    return;
  }
  pintar();
})();
// MÓDULO · MATERIA

const estado = { lista: [], pagina: 1 };
const POR_PAGINA = 10;

// UTILIDADES
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");
const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M9 7h6"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

// LISTADO
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

// FORMULARIO
const dlg = $("dlgMateria");
const form = $("formMateria");

// Errores del backend que se muestran junto al campo correspondiente
const REGLAS_ERROR = [[/descripci/i, "descripcion"], [/materia/i, "nombre_materia"]];

function contadores() {
  $("cntNombre").textContent = `${$("nombre_materia").value.length}/150`;
  $("cntDesc").textContent = `${$("descripcion").value.length}/255`;
}

function limpiarErrores() {
  limpiarErroresFormulario(form);
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
  marcarErrorCampo(form, campo, msg);
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = $("idmateria").value ? String($("idmateria").value) : null;
  const nombre = limpiarEspacios($("nombre_materia").value);

  if (nombre.length < 2) { marcarError("nombre_materia", "Escribe al menos 2 caracteres."); ok = false; }
  else if (estado.lista.some(m => String(m.idmateria) !== id && normalizar(m.nombre_materia) === normalizar(nombre))) {
    marcarError("nombre_materia", "Ya existe una materia con ese nombre."); ok = false;
  }
  return ok;
}

$("nombre_materia").addEventListener("input", contadores);
$("descripcion").addEventListener("input", contadores);

//  GUARDAR
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const id = $("idmateria").value;
  const editando = !!id;

  const payload = {
    nombre_materia: limpiarEspacios($("nombre_materia").value),
    descripcion: limpiarEspacios($("descripcion").value) || null
  };

  setCargando($("btnGuardar"), true, "Guardando…");
  try {
    if (editando) {
      await apiPut(`/materias/${id}`, payload);
      mostrarExito("Materia actualizada correctamente");
    } else {
      await apiPost(`/materias`, payload);
      mostrarExito("Materia creada correctamente");
    }

    await cargarMaterias();
    dlg.close();

  } catch (err) {
    errorFormulario(form, err, REGLAS_ERROR, "No se pudo guardar la materia");
  } finally {
    setCargando($("btnGuardar"), false);
  }
});

// ACCIONES DE FILA
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;

  const id = String(btn.dataset.id);
  const mat = estado.lista.find(x => String(x.idmateria) === id);

  if (!mat) {
    console.warn("Materia no encontrada para id:", id, estado.lista);
    return;
  }

  if (btn.dataset.accion === "editar") abrirFormulario(mat);
  if (btn.dataset.accion === "eliminar") {
    idEliminar = mat.idmateria;
    $("delTexto").textContent = `Se eliminará «${mat.nombre_materia}». Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  const btnDel = $("btnConfirmarEliminar");
  setCargando(btnDel, true, "Eliminando…");
  try {
    await apiDelete(`/materias/${idEliminar}`);
    await cargarMaterias();
    $("dlgEliminar").close();
    mostrarExito("Materia eliminada correctamente");
  } catch (err) {
    $("dlgEliminar").close();
    mostrarError(err, "No se puede eliminar: la materia está asignada en horarios u otros registros.");
  } finally {
    setCargando(btnDel, false);
  }
});

// EVENTOS GENERALES
$("btnNueva").addEventListener("click", () => abrirFormulario(null));
$("fBuscar").addEventListener("input", () => { estado.pagina = 1; pintar(); });
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });
document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

// CARGA DE DATOS
async function cargarMaterias() {
  try {
    const data = await apiGet('/materias');
    estado.lista = Array.isArray(data) ? data : (data?.materias ?? data?.data ?? []);
    pintar();
  } catch (err) {
    $("resumen").textContent = "Error al cargar las materias.";
    mostrarError(err, "Error al cargar las materias.");
    mostrarErrorTabla($("tbody"), err, cargarMaterias);
  }
}

(async function iniciar() {
  mostrarSkeleton($("tbody"), 5);
  $("resumen").textContent = "Cargando materias...";
  await cargarMaterias();
})();

// PERMISOS
aplicarSoloLectura(esAdmin(), ["btnNueva"]);
// MÓDULO · CURSO
const estado = { cursos: [], colegios: [], niveles: [], pagina: 1 };
const POR_PAGINA = 10;

// UTILIDADES
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");
const nombreColegio = (id) => estado.colegios.find(c => c.idcolegio === id)?.nombre ?? "Sin colegio";
const nombreNivel = (id) => estado.niveles.find(n => n.idnivel === id)?.nivel ?? "Sin nivel";
const ordenNivel = (id) => { const i = estado.niveles.findIndex(n => n.idnivel === id); return i < 0 ? 999 : i; };
const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  group: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M16 5.2a3.2 3.2 0 0 1 0 5.6M18 14.5A6 6 0 0 1 21 20"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

// LISTADO
function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  const niv = $("fNivel").value;
  const col = $("fColegio").value;
  return estado.cursos
    .filter(c =>
      (!q || normalizar(`${c.nombre} ${nombreNivel(c.nivel_idnivel)} ${nombreColegio(c.colegio_idcolegio)}`).includes(q)) &&
      (!niv || String(c.nivel_idnivel) === niv) &&
      (!col || String(c.colegio_idcolegio) === col))
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
      <td data-label="Nivel"><span class="badge badge--level">${escapar(c.nivel_nombre || nombreNivel(c.nivel_idnivel))}</span></td>
      <td data-label="Colegio"><span class="badge badge--school" title="${escapar(c.colegio_nombre || nombreColegio(c.colegio_idcolegio))}"><span>${escapar(c.colegio_nombre || nombreColegio(c.colegio_idcolegio))}</span></span></td>
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

// COMBOS
function llenarCombos() {
  const colegios = estado.colegios.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const optColegios = colegios.map(c => `<option value="${c.idcolegio}">${escapar(c.nombre)}</option>`).join("");
  const optNiveles = estado.niveles.map(n => `<option value="${n.idnivel}">${escapar(n.nivel)}</option>`).join("");

  $("colegio_idcolegio").innerHTML = '<option value="">Selecciona un colegio</option>' + optColegios;
  $("nivel_idnivel").innerHTML = '<option value="">Selecciona un nivel</option>' + optNiveles;
  $("fColegio").innerHTML = '<option value="">Todos los colegios</option>' + optColegios;
  $("fNivel").innerHTML = '<option value="">Todos los niveles</option>' + optNiveles;
  $("fColegio").hidden = colegios.length < 2;
}

// FORMULARIO
const dlg = $("dlgCurso");
const form = $("formCurso");

// Errores del backend que se muestran junto al campo correspondiente
const REGLAS_ERROR = [[/colegio/i, "colegio_idcolegio"], [/nivel/i, "nivel_idnivel"], [/curso/i, "nombre"]];
function contador() { $("cntNombre").textContent = `${$("nombre").value.length}/20`; }
function limpiarErrores() {
  limpiarErroresFormulario(form);
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
  $("colegio_idcolegio").value = cur?.colegio_idcolegio ?? (estado.colegios.length === 1 ? estado.colegios[0].idcolegio : "");
  avisoVacio("hintNivel", estado.niveles.length > 0, "Primero registra un nivel en el módulo Nivel.");
  avisoVacio("hintColegio", estado.colegios.length > 0, "Primero registra un colegio en el módulo Colegio.");
  contador();
  dlg.showModal();
  $("nombre").focus();
}

function marcarError(campo, msg) {
  marcarErrorCampo(form, campo, msg);
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("idcurso").value) || null;
  const nombre = limpiarEspacios($("nombre").value);
  const nivel = Number($("nivel_idnivel").value);
  const colegio = Number($("colegio_idcolegio").value);
  if (nombre.length < 1) { marcarError("nombre", "Escribe al menos 1 caracter."); ok = false; }
  if (!nivel) { marcarError("nivel_idnivel", "Selecciona el nivel del curso."); ok = false; }
  if (!colegio) { marcarError("colegio_idcolegio", "Selecciona el colegio."); ok = false; }

  // Validación local para evitar duplicados
  if (nombre.length >= 1 && nivel && colegio &&
      estado.cursos.some(c => c.idcurso !== id && c.nivel_idnivel === nivel && c.colegio_idcolegio === colegio && normalizar(c.nombre) === normalizar(nombre))) {
    marcarError("nombre", "Ya existe un curso con ese nombre en este nivel y colegio."); ok = false;
  }
  return ok;
}

$("nombre").addEventListener("input", contador);

// GUARDAR CURSO
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const id = $("idcurso").value;
  const editando = !!id;
  const payload = {
    nombre: limpiarEspacios($("nombre").value),
    colegio_idcolegio: Number($("colegio_idcolegio").value),
    nivel_idnivel: Number($("nivel_idnivel").value)
  };

  setCargando($("btnGuardar"), true, "Guardando…");
  try {
    if (editando) {
      await apiPut(`/cursos/${id}`, payload);
      mostrarExito("Curso actualizado correctamente");
    } else {
      await apiPost(`/cursos`, payload);
      mostrarExito("Curso creado correctamente");
    }

    await cargarCursos();
    dlg.close();

  } catch (err) {
    errorFormulario(form, err, REGLAS_ERROR, "No se pudo guardar el curso");
  } finally {
    setCargando($("btnGuardar"), false);
  }
});

// ACCIONES DE FILA
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
  const btnDel = $("btnConfirmarEliminar");
  setCargando(btnDel, true, "Eliminando…");
  try {
    await apiDelete(`/cursos/${idEliminar}`);
    await cargarCursos();
    $("dlgEliminar").close();
    mostrarExito("Curso eliminado correctamente");
  } catch (err) {
    $("dlgEliminar").close();
    mostrarError(err, "No se puede eliminar: el curso tiene estudiantes, horarios u otros registros asociados.");
  } finally {
    setCargando(btnDel, false);
  }
});

// EVENTOS GENERALES
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fNivel", "fColegio"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

// CARGA DE DATOS
async function cargarCursos() {
  try {
    estado.cursos = await apiGet('/cursos');
    pintar();
  } catch (err) {
    $("resumen").textContent = "Error al cargar los cursos.";
    mostrarError(err, "Error al cargar los cursos.");
    mostrarErrorTabla($("tbody"), err, cargarCursos);
  }
}

async function cargarCatalogos() {
  try {
    [estado.colegios, estado.niveles] = await Promise.all([
      apiGet('/colegios'),
      apiGet('/niveles')
    ]);
    llenarCombos();
  } catch (err) {
    console.error("Error al cargar catálogos:", err);
  }
}

(async function iniciar() {
  mostrarSkeleton($("tbody"), 5);
  $("resumen").textContent = "Cargando datos...";
  await Promise.all([cargarCatalogos(), cargarCursos()]);
})();

// PERMISOS
aplicarSoloLectura(esAdmin(), ["btnNuevo"]);

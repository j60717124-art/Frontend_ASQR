// MÓDULO · NIVEL

const estado = { lista: [], pagina: 1 };
const POR_PAGINA = 10;

//  UTILIDADES
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");
const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

// LISTADO
function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  return estado.lista
    .filter(n => !q || normalizar(`${n.nivel} ${n.descripcion ?? ""}`).includes(q))
    .sort((a, b) => Number(a.idnivel) - Number(b.idnivel));
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

// FORMULARIO
const dlg = $("dlgNivel");
const form = $("formNivel");

// Errores del backend que se muestran junto al campo correspondiente
const REGLAS_ERROR = [[/descripci/i, "descripcion"], [/nivel/i, "nivel"]];
function contadores() {
  $("cntNivel").textContent = `${$("nivel").value.length}/22`;
  $("cntDesc").textContent = `${$("descripcion").value.length}/255`;
}

function limpiarErrores() {
  limpiarErroresFormulario(form);
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
  marcarErrorCampo(form, campo, msg);
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = $("idnivel").value ? String($("idnivel").value) : null;
  const nombre = limpiarEspacios($("nivel").value);

  if (nombre.length < 2) { marcarError("nivel", "Escribe al menos 2 caracteres."); ok = false; }
  else if (estado.lista.some(n => String(n.idnivel) !== id && normalizar(n.nivel) === normalizar(nombre))) {
    marcarError("nivel", "Ya existe un nivel con ese nombre."); ok = false;
  }
  return ok;
}

$("nivel").addEventListener("input", contadores);
$("descripcion").addEventListener("input", contadores);

// GUARDAR
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const id = $("idnivel").value;
  const editando = !!id;

  const payload = {
    nivel: limpiarEspacios($("nivel").value),
    descripcion: limpiarEspacios($("descripcion").value) || null
  };

  setCargando($("btnGuardar"), true, "Guardando…");
  try {
    if (editando) {
      await apiPut(`/niveles/${id}`, payload);
      mostrarExito("Nivel actualizado correctamente");
    } else {
      await apiPost(`/niveles`, payload);
      mostrarExito("Nivel creado correctamente");
    }

    await cargarNiveles();
    dlg.close();

  } catch (err) {
    errorFormulario(form, err, REGLAS_ERROR, "No se pudo guardar el nivel");
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
  const niv = estado.lista.find(x => String(x.idnivel) === id);

  if (!niv) {
    console.warn("Nivel no encontrado para id:", id, estado.lista);
    return;
  }

  if (btn.dataset.accion === "editar") abrirFormulario(niv);
  if (btn.dataset.accion === "eliminar") {
    idEliminar = niv.idnivel;
    $("delTexto").textContent = `Se eliminará el nivel «${niv.nivel}». Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  const btnDel = $("btnConfirmarEliminar");
  setCargando(btnDel, true, "Eliminando…");
  try {
    await apiDelete(`/niveles/${idEliminar}`);
    await cargarNiveles();
    $("dlgEliminar").close();
    mostrarExito("Nivel eliminado correctamente");
  } catch (err) {
    $("dlgEliminar").close();
    mostrarError(err, "No se puede eliminar: el nivel está en uso en otros registros.");
  } finally {
    setCargando(btnDel, false);
  }
});

// EVENTOS GENERALES
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
$("fBuscar").addEventListener("input", () => { estado.pagina = 1; pintar(); });
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

// CARGA DE DATOS
async function cargarNiveles() {
  try {
    const data = await apiGet('/niveles');
    estado.lista = Array.isArray(data) ? data : (data?.niveles ?? data?.data ?? []);
    pintar();
  } catch (err) {
    $("resumen").textContent = "Error al cargar los niveles.";
    mostrarError(err, "Error al cargar los niveles.");
    mostrarErrorTabla($("tbody"), err, cargarNiveles);
  }
}

(async function iniciar() {
  mostrarSkeleton($("tbody"), 5);
  $("resumen").textContent = "Cargando niveles...";
  await cargarNiveles();
})();

// PERMISOS
aplicarSoloLectura(esAdmin(), ["btnNuevo"]);
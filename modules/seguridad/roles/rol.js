/* MÓDULO ROLES */

const estado = { roles: [] };

// UTILIDADES
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// LISTADO
const ICO = {
  role: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

function pintar() {
  const q = normalizar($("fBuscar").value.trim());
  const lista = estado.roles.filter(r => !q || normalizar(`${r.nombre_rol} ${r.descripcion_rol ?? ""}`).includes(q));
  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = lista.map(r => `
    <tr>
      <td>
        <div class="role-name">
          <span class="role-name__ico">${icono("role")}</span>
          <strong>${escapar(r.nombre_rol)}</strong>
        </div>
      </td>
      <td class="muted">${r.descripcion_rol ? escapar(r.descripcion_rol) : "Sin descripción"}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${r.idrol}" title="Editar" aria-label="Editar ${escapar(r.nombre_rol)}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${r.idrol}" title="Eliminar" aria-label="Eliminar ${escapar(r.nombre_rol)}">${icono("del")}</button>
        </div>
      </td>
    </tr>`).join("");

  const n = estado.roles.length;
  $("resumen").textContent = `${n} ${n === 1 ? "rol registrado" : "roles registrados"}`;
}

// FORMULARIOS
const dlg = $("dlgRol");
const form = $("formRol");

// Errores del backend que se muestran junto al campo correspondiente
const REGLAS_ERROR = [[/nombre del rol|rol con ese nombre/i, "nombre_rol"], [/descripci/i, "descripcion_rol"]];

function contadores() {
  $("cntNombre").textContent = `${$("nombre_rol").value.length}/30`;
  $("cntDesc").textContent = `${$("descripcion_rol").value.length}/100`;
}

function limpiarErrores() {
  limpiarErroresFormulario(form);
}

function abrirFormulario(rol) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = rol ? "Editar rol" : "Nuevo rol";
  $("btnGuardar").textContent = rol ? "Guardar cambios" : "Guardar rol";
  $("idrol").value = rol?.idrol ?? "";
  $("nombre_rol").value = rol?.nombre_rol ?? "";
  $("descripcion_rol").value = rol?.descripcion_rol ?? "";
  contadores();
  dlg.showModal();
  $("nombre_rol").focus();
}

function marcarError(campo, msg) {
  marcarErrorCampo(form, campo, msg);
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = $("idrol").value ? String($("idrol").value) : null;
  const nombre = $("nombre_rol").value.trim();

  if (nombre.length < 3) { marcarError("nombre_rol", "Escribe al menos 3 caracteres."); ok = false; }
  else if (estado.roles.some(r => String(r.idrol) !== id && normalizar(r.nombre_rol) === normalizar(nombre))) {
    marcarError("nombre_rol", "Ya existe un rol con ese nombre."); ok = false;
  }
  return ok;
}

$("nombre_rol").addEventListener("input", contadores);
$("descripcion_rol").addEventListener("input", contadores);

// GUARDAR ROL
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const id = $("idrol").value;
  const editando = !!id;

  const payload = {
    nombre_rol: $("nombre_rol").value.trim(),
    descripcion_rol: $("descripcion_rol").value.trim() || null
  };

  setCargando($("btnGuardar"), true, "Guardando…");
  try {
    if (editando) {
      await apiPut(`/roles/${id}`, payload);
      mostrarExito("Rol actualizado correctamente");
    } else {
      await apiPost(`/roles`, payload);
      mostrarExito("Rol creado correctamente");
    }

    await cargarRoles(); // Recargar lista
    dlg.close();

  } catch (err) {
    errorFormulario(form, err, REGLAS_ERROR, "No se pudo guardar el rol");
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
  const rol = estado.roles.find(r => String(r.idrol) === id);
  if (!rol) {
    console.warn("Rol no encontrado para id:", id, "roles:", estado.roles);
    return;
  }

  if (btn.dataset.accion === "editar") abrirFormulario(rol);

  if (btn.dataset.accion === "eliminar") {
    idEliminar = rol.idrol;
    $("delTexto").textContent = `Se eliminará el rol «${rol.nombre_rol}». Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  const btnDel = $("btnConfirmarEliminar");
  setCargando(btnDel, true, "Eliminando…");
  try {
    await apiDelete(`/roles/${idEliminar}`);
    await cargarRoles(); // Recargar lista
    $("dlgEliminar").close();
    mostrarExito("Rol eliminado correctamente");
  } catch (err) {
    $("dlgEliminar").close();
    mostrarError(err, "No se puede eliminar: hay cuentas usando este rol.");
  } finally {
    setCargando(btnDel, false);
  }
});

// EVENTOS GENERALES
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
$("fBuscar").addEventListener("input", pintar);

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

// INICIO Y CARGA DE DATOS
async function cargarRoles() {
  try {
    const data = await apiGet('/roles');
    estado.roles = Array.isArray(data) ? data : (data?.roles ?? data?.data ?? []);
    pintar();
  } catch (err) {
    $("resumen").textContent = "Error al cargar roles.";
    mostrarError(err, "Error al cargar roles.");
    mostrarErrorTabla($("tbody"), err, cargarRoles);
  }
}

(async function iniciar() {
  mostrarSkeleton($("tbody"), 5);
  $("resumen").textContent = "Cargando roles...";
  await cargarRoles();
})();

// PERMISOS
aplicarSoloLectura(esAdmin(), ["btnNuevo"]);
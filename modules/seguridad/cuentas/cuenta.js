// MÓDULO  CUENTAS

//  UTILIDADES
const $ = (id) => document.getElementById(id);
const estado = { cuentas: [], roles: [] };

const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// El backend devuelve el nombre del rol en 'rol_nombre'
const nombreRol = (id) => estado.roles.find(r => String(r.idrol) === String(id))?.nombre_rol ?? "Sin rol";
const iniciales = (n) => String(n).trim().slice(0, 2).toUpperCase();
const fmtFecha = formatearFechaHora;

// Una cuenta no se puede borrar ni desactivar a sí misma desde aquí
const esCuentaPropia = (c) => obtenerCuentaActual()?.idcuenta === c.idcuenta;

//  LISTADO
function filtradas() {
  const q = normalizar($("fBuscar").value.trim());
  const rol = $("fRol").value;
  const est = $("fEstado").value;
  return estado.cuentas.filter(c =>
    (!q || normalizar(`${c.n_usuario} ${c.correo}`).includes(q)) &&
    (!rol || String(c.rol_idrol) === rol) &&
    (!est || c.estado === est)
  );
}

function insignia(c) {
  return c.estado === "Activo"
    ? '<span class="badge badge--ok">Activo</span>'
    : `<span class="badge badge--off">${escapar(c.estado)}</span>`;
}

const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

function pintar() {
  const lista = filtradas();
  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = lista.map(c => `
    <tr>
      <td data-label="Usuario">
        <div class="user">
          <span class="user__avatar">${escapar(iniciales(c.n_usuario))}</span>
          <div class="user__info"><strong>${escapar(c.n_usuario)}${esCuentaPropia(c) ? " (tú)" : ""}</strong><span>${escapar(c.correo)}</span></div>
        </div>
      </td>
      <td data-label="Rol"><span class="badge badge--role">${escapar(c.rol_nombre || nombreRol(c.rol_idrol))}</span></td>
      <td data-label="Estado">${insignia(c)}</td>
      <td data-label="Creada" class="muted">${fmtFecha(c.fecha_de_agregacion)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${c.idcuenta}" title="Editar" aria-label="Editar ${escapar(c.n_usuario)}">${icono("edit")}</button>
          ${esCuentaPropia(c) ? "" : `<button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${c.idcuenta}" title="Eliminar" aria-label="Eliminar ${escapar(c.n_usuario)}">${icono("del")}</button>`}
        </div>
      </td>
    </tr>`).join("");

  const total = estado.cuentas.length;
  const activas = estado.cuentas.filter(c => c.estado === "Activo").length;
  $("resumen").textContent = `${total} ${total === 1 ? "cuenta" : "cuentas"} · ${activas} ${activas === 1 ? "activa" : "activas"} · ${total - activas} ${total - activas === 1 ? "inactiva" : "inactivas"}`;
}

//  COMBOS DE ROL
function llenarRoles() {
  const opciones = estado.roles.map(r => `<option value="${r.idrol}">${escapar(r.nombre_rol)}</option>`).join("");
  $("rol_idrol").innerHTML = '<option value="">Selecciona un rol</option>' + opciones;
  $("fRol").innerHTML = '<option value="">Todos los roles</option>' + opciones;
}

//  FORMULARIO Y MODALES
const dlg = $("dlgCuenta");
const form = $("formCuenta");

// Errores del backend que se muestran junto al campo correspondiente
const REGLAS_ERROR = [
  [/nombre de usuario/i, "n_usuario"],
  [/correo/i, "correo"],
  [/contraseña/i, "clave"],
  [/\brol\b/i, "rol_idrol"],
  [/estado/i, "estado"]
];

function limpiarErrores() {
  limpiarErroresFormulario(form);
}

function abrirFormulario(cuenta) {
  limpiarErrores();
  form.reset();
  const editando = !!cuenta;

  $("dlgTitulo").textContent = editando ? "Editar cuenta" : "Nueva cuenta";
  $("btnGuardar").textContent = editando ? "Guardar cambios" : "Guardar cuenta";
  $("hintClave").textContent = editando ? "Déjala vacía para conservar la actual." : "Mínimo 8 caracteres, con al menos una letra y un número.";
  $("clave").type = "password";
  $("idcuenta").value = cuenta?.idcuenta ?? "";
  $("n_usuario").value = cuenta?.n_usuario ?? "";
  $("correo").value = cuenta?.correo ?? "";
  $("rol_idrol").value = cuenta?.rol_idrol ?? "";
  $("estado").value = cuenta?.estado ?? "Activo";

  dlg.showModal();
  $("n_usuario").focus();
}

function error(campo, msg) {
  marcarErrorCampo(form, campo, msg);
}

function validar() {
  limpiarErrores();
  let ok = true;
  const editando = !!$("idcuenta").value;
  const id = $("idcuenta").value ? String($("idcuenta").value) : null;

  const reglas = [
    ["n_usuario", validadores.usuario($("n_usuario").value)],
    ["correo", validadores.correo($("correo").value)],
    ["clave", validadores.clave($("clave").value, !editando)],
    ["rol_idrol", $("rol_idrol").value ? "" : "Selecciona un rol."]
  ];
  for (const [campo, msg] of reglas) if (msg) { error(campo, msg); ok = false; }

  // Duplicados
  const usuario = $("n_usuario").value.trim().toLowerCase();
  const correo = $("correo").value.trim().toLowerCase();
  if (!form.querySelector('[data-err="n_usuario"]').textContent &&
      estado.cuentas.some(c => String(c.idcuenta) !== id && String(c.n_usuario).toLowerCase() === usuario)) {
    error("n_usuario", "El nombre de usuario ya existe."); ok = false;
  }
  if (!form.querySelector('[data-err="correo"]').textContent &&
      estado.cuentas.some(c => String(c.idcuenta) !== id && String(c.correo).toLowerCase() === correo)) {
    error("correo", "Ya existe una cuenta registrada con ese correo."); ok = false;
  }
  return ok;
}

// Validación mientras se escribe
validarEnVivo(form, "n_usuario", (v) => validadores.usuario(v));
validarEnVivo(form, "correo", (v) => validadores.correo(v));
validarEnVivo(form, "clave", (v) => validadores.clave(v, !$("idcuenta").value));

//  GUARDAR CUENTA
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const id = $("idcuenta").value;
  const editando = !!id;

  const payload = {
    n_usuario: $("n_usuario").value.trim(),
    correo: $("correo").value.trim().toLowerCase(),
    estado: $("estado").value,
    rol_idrol: Number($("rol_idrol").value)
  };
  // Solo enviamos la clave si el usuario escribió una nueva
  const clave = $("clave").value;
  if (clave) payload.clave = clave;

  setCargando($("btnGuardar"), true, "Guardando…");
  try {
    if (editando) {
      await apiPut(`/cuentas/${id}`, payload);
      mostrarExito("Cuenta actualizada correctamente");
    } else {
      await apiPost(`/cuentas`, payload);
      mostrarExito("Cuenta creada correctamente");
    }
    await cargarCuentas();
    dlg.close();
  } catch (err) {
    errorFormulario(form, err, REGLAS_ERROR, "No se pudo guardar la cuenta");
  } finally {
    setCargando($("btnGuardar"), false);
  }
});

//  ACCIONES DE FILA (EDITAR, ELIMINAR)
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;

  const id = String(btn.dataset.id);
  const cuenta = estado.cuentas.find(c => String(c.idcuenta) === id);

  if (!cuenta) {
    console.warn("Cuenta no encontrada para id:", id, estado.cuentas);
    return;
  }

  if (btn.dataset.accion === "editar") abrirFormulario(cuenta);

  if (btn.dataset.accion === "eliminar") {
    idEliminar = cuenta.idcuenta;
    $("delTexto").textContent = `Se eliminará la cuenta «${cuenta.n_usuario}». Esta acción no se puede deshacer. Si pertenece a un docente, elimínalo desde el módulo Docentes.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  const btnDel = $("btnConfirmarEliminar");
  setCargando(btnDel, true, "Eliminando…");
  try {
    await apiDelete(`/cuentas/${idEliminar}`);
    await cargarCuentas();
    $("dlgEliminar").close();
    mostrarExito("Cuenta eliminada correctamente");
  } catch (err) {
    $("dlgEliminar").close();
    mostrarError(err, "No se pudo eliminar la cuenta");
  } finally {
    setCargando(btnDel, false);
  }
});

//  EVENTOS GENERALES
$("btnNueva").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fRol", "fEstado"].forEach(id => $(id).addEventListener("input", pintar));

$("verClave").addEventListener("click", () => {
  const c = $("clave");
  const ver = c.type === "password";
  c.type = ver ? "text" : "password";
  $("verClave").setAttribute("aria-label", ver ? "Ocultar contraseña" : "Mostrar contraseña");
});

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

//  INICIO Y CARGA DE DATOS
async function cargarCuentas() {
  try {
    const data = await apiGet('/cuentas');
    estado.cuentas = Array.isArray(data) ? data : (data?.cuentas ?? data?.data ?? []);
    pintar();
  } catch (err) {
    $("resumen").textContent = "Error al cargar cuentas.";
    mostrarError(err, "No se pudieron cargar las cuentas.");
    mostrarErrorTabla($("tbody"), err, cargarCuentas);
  }
}

async function cargarRoles() {
  try {
    const data = await apiGet('/roles');
    estado.roles = Array.isArray(data) ? data : (data?.roles ?? data?.data ?? []);
    llenarRoles();
  } catch (err) {
    mostrarError(err, "No se pudieron cargar los roles.");
  }
}

(async function iniciar() {
  mostrarSkeleton($("tbody"), 5);
  $("resumen").textContent = "Cargando datos desde el servidor...";
  await Promise.all([cargarRoles(), cargarCuentas()]);
})();

// PERMISOS
aplicarSoloLectura(esAdmin(), ["btnNueva"]);
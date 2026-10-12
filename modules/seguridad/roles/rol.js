/* MÓDULO · ROLES */

const API_URL = ""; // ej.: "/api"

const ROLES_DEMO = [
  { idrol: 1, nombre_rol: "Administrador", descripcion_rol: "Acceso total al sistema y a la configuración." },
  { idrol: 2, nombre_rol: "Director", descripcion_rol: "Consulta reportes y gestiona la asistencia docente." },
  { idrol: 3, nombre_rol: "Docente", descripcion_rol: "Registra y consulta la asistencia de sus cursos." },
  { idrol: 4, nombre_rol: "Secretaría", descripcion_rol: "Gestiona estudiantes, horarios y asignaciones." },
  { idrol: 5, nombre_rol: "Portería", descripcion_rol: "Escanea el QR de entrada y salida." }
];

const estado = { roles: [] };

const api = {
  async listar() {
    if (API_URL) return (await fetch(`${API_URL}/roles`)).json();
    try {
      const g = JSON.parse(localStorage.getItem("roles_demo"));
      if (Array.isArray(g)) return g;
    } catch (e) {}
    return ROLES_DEMO.slice();
  },
  async guardar(rol) {
    if (API_URL) {
      const nuevo = !rol.idrol;
      const r = await fetch(`${API_URL}/roles${nuevo ? "" : "/" + rol.idrol}`, {
        method: nuevo ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rol)
      });
      if (!r.ok) throw new Error("guardar");
      return r.json();
    }
    if (!rol.idrol) {
      rol.idrol = Math.max(0, ...estado.roles.map(x => x.idrol)) + 1;
      estado.roles.push(rol);
    } else {
      const i = estado.roles.findIndex(x => x.idrol === rol.idrol);
      estado.roles[i] = rol;
    }
    localStorage.setItem("roles_demo", JSON.stringify(estado.roles));
    return rol;
  },
  async eliminar(id) {
    if (API_URL) {
      const r = await fetch(`${API_URL}/roles/${id}`, { method: "DELETE" });
      if (r.status === 409) throw new Error("en_uso");
      if (!r.ok) throw new Error("eliminar");
      return;
    }
    estado.roles = estado.roles.filter(x => x.idrol !== id);
    localStorage.setItem("roles_demo", JSON.stringify(estado.roles));
  }
};

/* UTILIDADES */
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

let toastTimer;
function aviso(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("is-show"), 2800);
}

/* LISTADO */
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
      <td class="td-id muted">${r.idrol}</td>
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

/* FORMULARIO */
const dlg = $("dlgRol");
const form = $("formRol");

function contadores() {
  $("cntNombre").textContent = `${$("nombre_rol").value.length}/30`;
  $("cntDesc").textContent = `${$("descripcion_rol").value.length}/100`;
}

function limpiarErrores() {
  form.querySelectorAll(".err").forEach(e => (e.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach(e => e.classList.remove("is-invalid"));
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
  form.querySelector(`[data-err="${campo}"]`).textContent = msg;
  $(campo).classList.add("is-invalid");
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("idrol").value) || null;
  const nombre = $("nombre_rol").value.trim();

  if (nombre.length < 3) { marcarError("nombre_rol", "Escribe al menos 3 caracteres."); ok = false; }
  else if (estado.roles.some(r => r.idrol !== id && normalizar(r.nombre_rol) === normalizar(nombre))) {
    marcarError("nombre_rol", "Ya existe un rol con ese nombre."); ok = false;
  }
  return ok;
}

$("nombre_rol").addEventListener("input", contadores);
$("descripcion_rol").addEventListener("input", contadores);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const rol = {
    idrol: Number($("idrol").value) || null,
    nombre_rol: $("nombre_rol").value.trim(),
    descripcion_rol: $("descripcion_rol").value.trim() || null
  };
  const editando = !!rol.idrol;

  $("btnGuardar").disabled = true;
  try {
    await api.guardar(rol);
    if (API_URL) estado.roles = await api.listar();
    dlg.close();
    pintar();
    aviso(editando ? "Rol actualizado" : "Rol creado");
  } catch (err) {
    aviso("No se pudo guardar el rol. Intenta de nuevo.");
  } finally {
    $("btnGuardar").disabled = false;
  }
});

/* ACCIONES DE FILA */
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  const rol = estado.roles.find(r => r.idrol === Number(btn.dataset.id));
  if (!rol) return;

  if (btn.dataset.accion === "editar") abrirFormulario(rol);
  if (btn.dataset.accion === "eliminar") {
    idEliminar = rol.idrol;
    $("delTexto").textContent = `Se eliminará el rol «${rol.nombre_rol}». Esta acción no se puede deshacer.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  try {
    await api.eliminar(idEliminar);
    if (API_URL) estado.roles = await api.listar();
    $("dlgEliminar").close();
    pintar();
    aviso("Rol eliminado");
  } catch (err) {
    $("dlgEliminar").close();
    aviso(err.message === "en_uso"
      ? "No se puede eliminar: hay cuentas que usan este rol."
      : "No se pudo eliminar el rol. Intenta de nuevo.");
  }
});

/* EVENTOS GENERALES */
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
$("fBuscar").addEventListener("input", pintar);

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

/* INICIO */
(async function iniciar() {
  try {
    estado.roles = await api.listar();
  } catch (err) {
    $("resumen").textContent = "No se pudieron cargar los roles.";
    return;
  }
  pintar();
})();
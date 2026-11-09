// MÓDULO · ESTUDIANTES

const estado = { lista: [], pagina: 1 };
const POR_PAGINA = 10;

// UTILIDADES
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const limpiarEspacios = (s) => s.trim().replace(/\s+/g, " ");
const iniciales = (e) => (e.nombres.trim()[0] + e.apellidos.trim()[0]).toUpperCase();
const nombreCompleto = (e) => `${e.apellidos}, ${e.nombres}`;
const fmtFecha = formatearFecha;
const fmtFechaHora = formatearFechaHora;

const COLORES = [
  "linear-gradient(135deg, var(--secondary-500), var(--secondary-700))",
  "linear-gradient(135deg, var(--tertiary-500), var(--tertiary-600))",
  "linear-gradient(135deg, var(--cyan-500), var(--cyan-700))",
  "linear-gradient(135deg, var(--primary-500), var(--primary-700))"
];
const colorAvatar = (id) => COLORES[id % COLORES.length];

// LISTADO
const ICO = {
  edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  del: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5"/>'
};
const icono = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[n]}</svg>`;

function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  const est = $("fEstado").value;
  return estado.lista
    .filter(e =>
      (!q || normalizar(`${e.nombres} ${e.apellidos} ${e.ci}`).includes(q)) &&
      (!est || e.estado_estudiante === est))
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos, "es") || a.nombres.localeCompare(b.nombres, "es"));
}

function insignia(e) {
  const clase = e.estado_estudiante === "Activo" ? "ok" : "off";
  return `<span class="badge badge--${clase}">${escapar(e.estado_estudiante)}</span>`;
}

function pintar() {
  const lista = filtrados();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  $("vacio").hidden = lista.length > 0;

  $("tbody").innerHTML = visibles.map(e => `
    <tr>
      <td data-label="Estudiante">
        <div class="user">
          <span class="user__avatar" style="background:${colorAvatar(e.idestudiante)}">${escapar(iniciales(e))}</span>
          <strong>${escapar(nombreCompleto(e))}</strong>
        </div>
      </td>
      <td data-label="CI" class="muted num">${escapar(e.ci)}</td>
      <td data-label="Estado">${insignia(e)}</td>
      <td data-label="Registrado" class="muted">${fmtFecha(e.fecha_agregacion)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-accion="editar" data-id="${e.idestudiante}" title="Editar" aria-label="Editar ${escapar(nombreCompleto(e))}">${icono("edit")}</button>
          <button class="icon-btn icon-btn--danger" data-accion="eliminar" data-id="${e.idestudiante}" title="Eliminar" aria-label="Eliminar ${escapar(nombreCompleto(e))}">${icono("del")}</button>
        </div>
      </td>
    </tr>`).join("");

  $("pager").hidden = lista.length <= POR_PAGINA;
  $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  $("btnPrev").disabled = estado.pagina <= 1;
  $("btnNext").disabled = estado.pagina >= paginas;

  const total = estado.lista.length;
  const activos = estado.lista.filter(e => e.estado_estudiante === "Activo").length;
  $("resumen").textContent = `${total} ${total === 1 ? "estudiante" : "estudiantes"} · ${activos} ${activos === 1 ? "activo" : "activos"}`;
}

// QR PREVIEW (Imagen externa garantizada)
async function renderizarQrPreview(codigo) {
  const cont = $("qrPreview");
  if (!cont) return;
  cont.innerHTML = "";

  if (!codigo) {
    cont.innerHTML = `
      <div class="qr-preview__placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <path d="M14 14h3v3h-3zM19 19h2v2h-2z"/>
        </svg>
        <span>Haz clic en "Generar QR" para previsualizar el código del carnet.</span>
      </div>`;
    return;
  }

  // Usamos una API pública (QuickChart) para generar la imagen del QR
  const img = document.createElement("img");
  img.src = `https://quickchart.io/qr?text=${encodeURIComponent(codigo)}&size=200&margin=1`;
  img.alt = "Código QR del estudiante";
  img.className = "qr-preview__img";

  // Estilos en línea por si el CSS no carga a tiempo
  img.style.width = "180px";
  img.style.height = "180px";
  img.style.padding = "8px";
  img.style.background = "#fff";
  img.style.borderRadius = "10px";
  img.style.boxShadow = "var(--shadow)";

  // Si por alguna razón falla la carga de la imagen, mostramos el texto
  img.onerror = () => {
    cont.innerHTML = `<div class="qr-code-text" style="font-size:16px; padding:12px;">${codigo}</div>`;
  };

  cont.appendChild(img);
}

// FORMULARIO
const dlg = $("dlgEst");
const form = $("formEst");
const REGLAS_ERROR = [[/\bCI\b/, "ci"], [/nombres/i, "nombres"], [/apellidos/i, "apellidos"], [/estado/i, "estado_estudiante"]];

function limpiarErrores() {
  limpiarErroresFormulario(form);
}

function abrirFormulario(est) {
  limpiarErrores();
  form.reset();
  $("dlgTitulo").textContent = est ? "Editar estudiante" : "Nuevo estudiante";
  $("btnGuardar").textContent = est ? "Guardar cambios" : "Guardar estudiante";
  $("idestudiante").value = est?.idestudiante ?? "";
  $("nombres").value = est?.nombres ?? "";
  $("apellidos").value = est?.apellidos ?? "";
  $("ci").value = est?.ci ?? "";
  $("estado_estudiante").value = est?.estado_estudiante ?? "Activo";

  // Si es edición, obtener el QR actual
  if (est?.idestudiante) {
    (async () => {
      try {
        const qrs = await apiGet(`/estudiantes/${est.idestudiante}/qr`);
        const vigente = Array.isArray(qrs) ? qrs.find(q => Number(q.vigente) === 1) : qrs;
        renderizarQrPreview(vigente?.codigo ?? null);
      } catch {
        renderizarQrPreview(null);
      }
    })();
  } else {
    renderizarQrPreview(null);
  }

  dlg.showModal();
  $("nombres").focus();
}

function marcarError(campo, msg) {
  marcarErrorCampo(form, campo, msg);
}

function validar() {
  limpiarErrores();
  let ok = true;
  const id = Number($("idestudiante").value) || null;
  const ci = $("ci").value.trim().toUpperCase();

  const reglas = [
    ["nombres", validadores.nombrePersona($("nombres").value, "Los nombres")],
    ["apellidos", validadores.nombrePersona($("apellidos").value, "Los apellidos")],
    ["ci", validadores.ci(ci)]
  ];
  for (const [campo, msg] of reglas) if (msg) { marcarError(campo, msg); ok = false; }

  if (!form.querySelector('[data-err="ci"]').textContent &&
      estado.lista.some(e => Number(e.idestudiante) !== id && e.ci.toUpperCase() === ci)) {
    marcarError("ci", "Ya hay un estudiante registrado con ese CI."); ok = false;
  }
  return ok;
}

// Validación mientras se escribe
validarEnVivo(form, "nombres", (v) => validadores.nombrePersona(v, "Los nombres"));
validarEnVivo(form, "apellidos", (v) => validadores.nombrePersona(v, "Los apellidos"));
validarEnVivo(form, "ci", (v) => validadores.ci(v));

$("ci").addEventListener("input", (e) => {
  e.target.value = e.target.value.toUpperCase().replace(/[^0-9A-Z-]/g, "").slice(0, 13);
});

// GENERAR QR
function generarCodigoAleatorio() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

$("btnGenerarQr").addEventListener("click", async () => {
  const btn = $("btnGenerarQr");
  const idEst = $("idestudiante").value;

  // Si ya está guardado (edición), pedimos el QR real al backend
  if (idEst) {
    setCargando(btn, true);
    try {
      const qrs = await apiGet(`/estudiantes/${idEst}/qr`);
      const vigente = Array.isArray(qrs) ? qrs.find(q => Number(q.vigente) === 1) : qrs;

      if (vigente?.codigo) {
        renderizarQrPreview(vigente.codigo);
        mostrarExito("QR del estudiante cargado.");
      } else {
        renderizarQrPreview(generarCodigoAleatorio());
      }
    } catch {
      renderizarQrPreview(generarCodigoAleatorio());
    } finally {
      setCargando(btn, false);
    }
  } else {
    // Si es nuevo, generamos un QR visual local
    const codigoFalso = generarCodigoAleatorio();
    renderizarQrPreview(codigoFalso);
    mostrarExito("QR de vista previa generado. Al guardar se asignará el real.");
  }
});

// GUARDAR
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validar()) { form.querySelector(".is-invalid")?.focus(); return; }

  const id = $("idestudiante").value;
  const editando = !!id;
  const payload = {
    nombres: limpiarEspacios($("nombres").value),
    apellidos: limpiarEspacios($("apellidos").value),
    ci: $("ci").value.trim().toUpperCase(),
    estado_estudiante: $("estado_estudiante").value
  };

  setCargando($("btnGuardar"), true, "Guardando…");
  try {
    if (editando) {
      await apiPut(`/estudiantes/${id}`, payload);
      mostrarExito("Estudiante actualizado correctamente");
    } else {
      const resp = await apiPost(`/estudiantes`, payload);
      mostrarExito("Estudiante registrado. Se generó su QR de carnet.");
      if (resp?.qr_codigo) {
        renderizarQrPreview(resp.qr_codigo);
        await new Promise(r => setTimeout(r, 900));
      }
    }

    await cargarEstudiantes();
    dlg.close();
  } catch (err) {
    errorFormulario(form, err, REGLAS_ERROR, "No se pudo guardar el estudiante");
  } finally {
    setCargando($("btnGuardar"), false);
  }
});

// ACCIONES DE FILA
let idEliminar = null;

$("tbody").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;
  e.preventDefault();

  const id = btn.dataset.id;
  if (!id) return;

  const est = estado.lista.find(x => String(x.idestudiante) === String(id));
  if (!est) {
    console.warn("No se encontró estudiante con id:", id);
    return;
  }

  if (btn.dataset.accion === "editar") {
    abrirFormulario(est);
  } else if (btn.dataset.accion === "eliminar") {
    idEliminar = est.idestudiante;
    $("delTexto").textContent = `Se eliminará a ${est.nombres} ${est.apellidos} (CI ${est.ci}). Esta acción no se puede deshacer. Si solo dejó el colegio, cambia su estado a Inactivo.`;
    $("dlgEliminar").showModal();
  }
});

$("btnConfirmarEliminar").addEventListener("click", async () => {
  if (!idEliminar) return;
  const btnDel = $("btnConfirmarEliminar");
  setCargando(btnDel, true, "Eliminando…");
  try {
    await apiDelete(`/estudiantes/${idEliminar}`);
    await cargarEstudiantes();
    $("dlgEliminar").close();
    mostrarExito("Estudiante eliminado correctamente");
  } catch (err) {
    $("dlgEliminar").close();
    mostrarError(err, "No se puede eliminar: tiene registros asociados. Cámbialo a Inactivo.");
  } finally {
    setCargando(btnDel, false);
    idEliminar = null;
  }
});

// EVENTOS GENERALES
$("btnNuevo").addEventListener("click", () => abrirFormulario(null));
["fBuscar", "fEstado"].forEach(id => $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); }));
$("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
$("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });
document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

// CARGA DE DATOS
async function cargarEstudiantes() {
  try {
    estado.lista = await apiGet('/estudiantes');
    pintar();
  } catch (err) {
    $("resumen").textContent = "Error al cargar estudiantes.";
    mostrarError(err, "Error al cargar estudiantes.");
    mostrarErrorTabla($("tbody"), err, cargarEstudiantes);
  }
}

(async function iniciar() {
  mostrarSkeleton($("tbody"), 5);
  $("resumen").textContent = "Cargando estudiantes...";
  await cargarEstudiantes();
})();

// PERMISOS
aplicarSoloLectura(puedeGestionarMatricula(), ["btnNuevo"]);
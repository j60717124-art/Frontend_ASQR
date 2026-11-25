//   MÓDULO · QR DE ESTUDIANTES
const estado = { estudiantes: [], qrs: {}, colegio: "", pagina: 1, seleccion: new Set(), actual: null };
const POR_PAGINA = 10;

// UTILIDADES SEGURAS
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const normalizar = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const estudiante = (id) => estado.estudiantes.find(e => String(e.idestudiante) === String(id));
const nombreCompleto = (e) => `${e.apellidos || ""}, ${e.nombres || ""}`;
const iniciales = (e) => {
  const n = (e.nombres || " ").trim();
  const a = (e.apellidos || " ").trim();
  return (n[0] || "") + (a[0] || "");
};

const fFecha = (f) => typeof formatearFecha === 'function' ? formatearFecha(f) : String(f || "").split(' ')[0];
const fFechaHora = (f) => typeof formatearFechaHora === 'function' ? formatearFechaHora(f) : String(f || "");

const COLORES = [
  "linear-gradient(135deg, #3b82f6, #2563eb)",
  "linear-gradient(135deg, #10b981, #059669)",
  "linear-gradient(135deg, #06b6d4, #0891b2)",
  "linear-gradient(135deg, #6366f1, #4f46e5)"
];

const vigenteDe = (id) => estado.qrs[id] || null;

const ICO = {
  qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4"/></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>'
};

// GENERADOR DE QR LOCAL
function getQrDataUrl(texto) {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(texto);
    qr.make();
    return qr.createDataURL(4, 2);
  } catch (e) {
    console.error("Error al generar QR localmente:", e);
    return "";
  }
}

// LISTADO Y PINTADO
function filtrados() {
  const q = normalizar($("fBuscar").value.trim());
  const f = $("fQr").value;
  return estado.estudiantes
    .filter(e => {
      if (q && !normalizar(`${e.nombres} ${e.apellidos} ${e.ci}`).includes(q)) return false;
      const tiene = !!vigenteDe(e.idestudiante);
      return f === "con" ? tiene : f === "sin" ? !tiene : true;
    })
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos, "es") || a.nombres.localeCompare(b.nombres, "es"));
}

const insigniaEstudiante = (e) => {
  const clase = e.estado_estudiante === "Activo" ? "ok" : "off";
  return `<span class="badge badge--${clase}">${escapar(e.estado_estudiante)}</span>`;
};

function pintar() {
  const lista = filtrados();
  const paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
  estado.pagina = Math.min(estado.pagina, paginas);
  const inicio = (estado.pagina - 1) * POR_PAGINA;
  const visibles = lista.slice(inicio, inicio + POR_PAGINA);

  if ($("vacio")) $("vacio").hidden = lista.length > 0;

  if ($("tbody")) {
    $("tbody").innerHTML = visibles.map(e => {
      const q = vigenteDe(e.idestudiante);
      const marcado = estado.seleccion.has(e.idestudiante);
      return `
      <tr class="row-click${marcado ? " is-selected" : ""}" data-id="${e.idestudiante}" tabindex="0">
        <td class="td-check"><input type="checkbox" data-sel="${e.idestudiante}" ${marcado ? "checked" : ""}></td>
        <td data-label="Estudiante">
          <div class="user">
            <span class="user__avatar" style="background:${COLORES[e.idestudiante % COLORES.length]}">${escapar(iniciales(e))}</span>
            <strong>${escapar(nombreCompleto(e))}</strong>
          </div>
        </td>
        <td data-label="CI" class="muted num">${escapar(e.ci)}</td>
        <td data-label="Estado">${insigniaEstudiante(e)}</td>
        <td data-label="Código QR">${q ? '<span class="badge badge--ok">Vigente</span>' : '<span class="badge badge--off">Sin QR</span>'}</td>
        <td data-label="Emitido" class="muted">${q ? fFecha(q.fecha_emision) : "—"}</td>
        <td><span class="go">Ver QR ${ICO.chevron}</span></td>
      </tr>`;
    }).join("");
  }

  if ($("pager")) $("pager").hidden = lista.length <= POR_PAGINA;
  if ($("pagerInfo")) $("pagerInfo").textContent = `${inicio + 1}–${inicio + visibles.length} de ${lista.length}`;
  if ($("btnPrev")) $("btnPrev").disabled = estado.pagina <= 1;
  if ($("btnNext")) $("btnNext").disabled = estado.pagina >= paginas;

  const selFiltrados = lista.filter(e => estado.seleccion.has(e.idestudiante)).length;
  if ($("chkTodos")) {
    $("chkTodos").checked = lista.length > 0 && selFiltrados === lista.length;
    $("chkTodos").indeterminate = selFiltrados > 0 && selFiltrados < lista.length;
  }

  const n = estado.seleccion.size;
  if ($("btnImprimirSel")) {
    $("btnImprimirSel").disabled = n === 0;
    $("txtImprimirSel").textContent = n ? `Imprimir seleccionados (${n})` : "Imprimir seleccionados";
  }

  const faltantes = estado.estudiantes.filter(e => e.estado_estudiante === "Activo" && !vigenteDe(e.idestudiante));
  if ($("btnFaltantes")) {
    $("btnFaltantes").hidden = faltantes.length === 0;
    $("txtFaltantes").textContent = `Generar QR faltantes (${faltantes.length})`;
  }

  const total = estado.estudiantes.length;
  const con = estado.estudiantes.filter(e => vigenteDe(e.idestudiante)).length;
  if ($("resumen")) $("resumen").textContent = `${total} ${total === 1 ? "estudiante" : "estudiantes"} · ${con} con QR vigente · ${total - con} sin QR`;
}

// MODAL DEL QR (Unificado con el diseño de impresión)
const dlgQr = $("dlgQr");

function abrirQr(id) {
  estado.actual = id;
  renderQr();
  if (dlgQr) dlgQr.showModal();
}

function renderQr() {
  const e = estudiante(estado.actual);
  if (!e) return;
  const q = vigenteDe(e.idestudiante);

  if ($("qrTitulo")) $("qrTitulo").textContent = "Credencial del estudiante";
  const colegio = estado.colegio || "Sistema de Asistencia QR";

  if (!q) {
    if ($("qrBody")) {
      $("qrBody").innerHTML = `
        <div style="text-align:center; padding: 40px 20px; color: #64748b; width: 100%;">
          <div style="width:60px; height:60px; margin:0 auto; opacity:0.5;">${ICO.qr}</div>
          <h3 style="margin-top:16px; color:#0f172a;">Sin QR vigente</h3>
          <p style="margin-top:8px;">Genera uno para este estudiante.</p>
        </div>
      `;
    }
    if ($("qrFoot")) {
      $("qrFoot").innerHTML = `<button class="btn btn--primary" type="button" data-act="generar">${ICO.qr} Generar QR</button>`;
    }
    return;
  }

  // Inyectamos exactamente el mismo HTML de la tarjeta (la clase .idcard)
  if ($("qrBody")) {
    $("qrBody").innerHTML = `
      ${tarjetaHTML(e, q)}
      ${e.estado_estudiante !== "Activo" ? `<p class="warn-note">Este estudiante figura como ${escapar(e.estado_estudiante.toLowerCase())}.</p>` : ""}
    `;
  }

  if ($("qrFoot")) {
    $("qrFoot").innerHTML = `
      <button class="btn btn--ghost" type="button" data-act="regenerar">${ICO.refresh} Regenerar QR</button>
      <button class="btn btn--primary" type="button" data-act="imprimir">${ICO.print} Imprimir tarjeta</button>
    `;
  }
}

if (dlgQr) {
  dlgQr.addEventListener("click", async (ev) => {
    const btn = ev.target.closest("[data-act]");
    if (!btn) return;
    const id = estado.actual;

    if (btn.dataset.act === "imprimir") imprimir([id]);
    if (btn.dataset.act === "generar" || btn.dataset.act === "regenerar") {
      if (typeof mostrarLoader === 'function') mostrarLoader("Generando QR…");
      try {
        await apiPost(`/estudiantes/${id}/qr/duplicado`);
        await cargarQrEstudiante(id);
        pintar();
        renderQr();
        if (typeof mostrarExito === 'function') mostrarExito("QR generado correctamente.");
      } catch (err) {
        if (typeof mostrarError === 'function') mostrarError(err, "No se pudo generar el QR.");
      } finally {
        if (typeof ocultarLoader === 'function') ocultarLoader();
      }
    }
  });
}

// IMPRESIÓN DE TARJETAS (Genera el mismo HTML que ves en el modal)
function tarjetaHTML(e, q) {
  const colegio = estado.colegio || "Sistema de Asistencia QR";
  return `
  <div class="idcard">
    <div class="idcard__head">
      <span class="idcard__school">${escapar(colegio)}</span>
      <span class="idcard__kind">CREDENCIAL ESTUDIANTIL</span>
    </div>
    <div class="idcard__body">
      <div class="idcard__info">
        <small>Estudiante</small>
        <span class="idcard__name">${escapar(e.nombres)} ${escapar(e.apellidos)}</span>
        <small>C.I.</small>
        <b>${escapar(e.ci)}</b>
        <small>N.º de QR</small>
        <b>${String(q.idqr_estudiante).padStart(6, "0")}</b>
      </div>
      <div class="idcard__qr">
        <img src="${getQrDataUrl(q.codigo)}" alt="QR">
        <small>Escanea al ingresar</small>
      </div>
    </div>
    <div class="idcard__stripe"></div>
  </div>`;
}

function imprimir(ids) {
  const conQr = ids.map(id => ({ e: estudiante(id), q: vigenteDe(id) })).filter(x => x.e && x.q);
  const omitidos = ids.length - conQr.length;

  if (!conQr.length) {
    if (typeof mostrarAviso === 'function') mostrarAviso("Los estudiantes seleccionados no tienen un QR vigente.");
    return;
  }

  if ($("printArea")) {
    $("printArea").innerHTML = conQr.map(x => tarjetaHTML(x.e, x.q)).join("");
  }
  if (omitidos && typeof mostrarAviso === 'function') mostrarAviso(`${omitidos} sin QR no se incluyeron.`);

  setTimeout(() => {
    window.print();
  }, 150);
}

window.addEventListener("afterprint", () => { if ($("printArea")) $("printArea").innerHTML = ""; });

// EVENTOS GENERALES
if ($("chkTodos")) {
  $("chkTodos").addEventListener("change", (e) => {
    const lista = filtrados();
    lista.forEach(est => (e.target.checked ? estado.seleccion.add(est.idestudiante) : estado.seleccion.delete(est.idestudiante)));
    pintar();
  });
}

if ($("tbody")) {
  $("tbody").addEventListener("click", (e) => {
    const chk = e.target.closest("[data-sel]");

    if (chk) {
      const id = Number(chk.dataset.sel);
      if (chk.checked) estado.seleccion.add(id);
      else estado.seleccion.delete(id);

      const fila = chk.closest("tr");
      if (fila) fila.classList.toggle("is-selected", chk.checked);

      const n = estado.seleccion.size;
      if ($("btnImprimirSel")) {
        $("btnImprimirSel").disabled = n === 0;
        $("txtImprimirSel").textContent = n ? `Imprimir seleccionados (${n})` : "Imprimir seleccionados";
      }
      return;
    }

    if (e.target.closest(".td-check")) return;

    const fila = e.target.closest("tr[data-id]");
    if (fila) abrirQr(Number(fila.dataset.id));
  });
}

["fBuscar", "fQr"].forEach(id => {
  if ($(id)) $(id).addEventListener("input", () => { estado.pagina = 1; pintar(); });
});
if ($("btnPrev")) $("btnPrev").addEventListener("click", () => { estado.pagina--; pintar(); });
if ($("btnNext")) $("btnNext").addEventListener("click", () => { estado.pagina++; pintar(); });
if ($("btnImprimirSel")) $("btnImprimirSel").addEventListener("click", () => imprimir([...estado.seleccion]));

document.querySelectorAll("[data-cerrar]").forEach(b => b.addEventListener("click", () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach(d => d.addEventListener("mousedown", (e) => { if (e.target === d) d.close(); }));

// CARGA DE DATOS
async function cargarQrEstudiante(idEstudiante) {
  try {
    const lista = await apiGet(`/estudiantes/${idEstudiante}/qr`);
    if (Array.isArray(lista) && lista.length > 0) {
      const vigente = lista.find(q => Number(q.vigente) === 1);
      if (vigente) {
        estado.qrs[idEstudiante] = vigente;
        return;
      }
    }
    delete estado.qrs[idEstudiante];
  } catch (err) {
    delete estado.qrs[idEstudiante];
  }
}

async function cargarColegio() {
  try {
    const lista = await apiGet('/colegios');
    estado.colegio = lista[0]?.nombre ?? "";
  } catch (err) {
    estado.colegio = "";
  }
}

(async function iniciar() {
  if (typeof mostrarSkeleton === 'function') mostrarSkeleton($("tbody"), 6);
  try {
    estado.estudiantes = await apiGet('/estudiantes');
    await Promise.all([cargarColegio(), Promise.all(estado.estudiantes.map(e => cargarQrEstudiante(e.idestudiante)))]);
    pintar();
  } catch (err) {
    if ($("resumen")) $("resumen").textContent = "Error al cargar estudiantes.";
    if (typeof mostrarError === 'function') mostrarError(err, "No se pudieron cargar los estudiantes.");
  }
})();
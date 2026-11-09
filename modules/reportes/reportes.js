// MÓDULO · REPORTES

const estado = {
  tipo: 'estudiantes',
  datos: [],
  materias: [],
  estudiantes: [],
  docentes: [],
  filtros: {}
};

// UTILIDADES
const $ = (id) => document.getElementById(id);
const escapar = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtFecha = formatearFecha;
const hhmm = (h) => String(h).slice(0, 5);

// CARGA DE CATÁLOGOS
async function cargarCatalogos() {
  const [materias, estudiantes, docentes] = await Promise.allSettled([
    apiGet('/materias'),
    apiGet('/estudiantes'),
    esAdmin() ? apiGet('/docentes') : Promise.resolve([])
  ]);
  estado.materias = materias.status === "fulfilled" ? materias.value || [] : [];
  estado.estudiantes = estudiantes.status === "fulfilled" ? estudiantes.value || [] : [];
  estado.docentes = docentes.status === "fulfilled" ? docentes.value || [] : [];

  const fallo = [materias, estudiantes, docentes].find(r => r.status === "rejected");
  if (fallo) mostrarError(fallo.reason, "No se pudieron cargar los filtros (materias, estudiantes o docentes).");

  $("filtroMateria").innerHTML = '<option value="">Todas las materias</option>' +
    estado.materias.map(m => `<option value="${m.idmateria}">${escapar(m.nombre_materia)}</option>`).join("");

  $("filtroEstudiante").innerHTML = '<option value="">Todos los estudiantes</option>' +
    estado.estudiantes.map(e => `<option value="${e.idestudiante}">${escapar(e.apellidos)}, ${escapar(e.nombres)}</option>`).join("");

  $("filtroDocente").innerHTML = '<option value="">Todos los docentes</option>' +
    estado.docentes.map(d => `<option value="${d.iddocente}">${escapar(d.apellidos)}, ${escapar(d.nombres)}</option>`).join("");

  if (!esAdmin()) {
    const opt = $("tipoReporte").querySelector('option[value="docentes"]');
    if (opt) opt.remove();
  }
}

// GESTIÓN DE FILTROS SEGÚN TIPO
$("tipoReporte").addEventListener("change", (e) => {
  const tipo = e.target.value;
  estado.tipo = tipo;

  const esEstudiantes = tipo === 'estudiantes';
  $("filtroMateriaWrap").hidden = !esEstudiantes;
  $("filtroEstudianteWrap").hidden = !esEstudiantes;
  $("filtroDocenteWrap").hidden = esEstudiantes;
  $("resultados").hidden = true;
  $("btnPDF").disabled = true;
  $("btnExcel").disabled = true;
});

// GENERAR REPORTE
$("btnGenerar").addEventListener("click", async () => {
  const tipo = estado.tipo;
  const fechaInicio = $("fechaInicio").value;
  const fechaFin = $("fechaFin").value;

  if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
    mostrarAviso("La fecha «Desde» no puede ser posterior a «Hasta».");
    $("fechaInicio").focus();
    return;
  }

  setCargando($("btnGenerar"), true, "Generando…");
  try {
    if (tipo === 'estudiantes') {
      await generarReporteEstudiantes(fechaInicio, fechaFin);
    } else {
      await generarReporteDocentes(fechaInicio, fechaFin);
    }
  } catch (err) {
    mostrarError(err, "Error al generar el reporte.");
  } finally {
    setCargando($("btnGenerar"), false);
  }
});

// REPORTE DE ESTUDIANTES
async function generarReporteEstudiantes(fechaInicio, fechaFin) {
  const idMateria = $("filtroMateria").value;
  const idEstudiante = $("filtroEstudiante").value;

  const objetivo = estado.estudiantes.filter(e => !idEstudiante || String(e.idestudiante) === idEstudiante);
  if (!objetivo.length) { mostrarAviso("No hay estudiantes para consultar."); return; }

  // Para filtrar por materia se necesita saber qué materia es cada horario
  let materiaPorHorario = {};
  if (idMateria) {
    const horarios = await apiGet('/horarios');
    horarios.forEach(h => { materiaPorHorario[h.idhorario] = String(h.materia_idmateria); });
  }

  const registros = [];
  let fallos = 0;
  mostrarLoader(`Consultando asistencias (0/${objetivo.length})…`);
  try {
    for (let i = 0; i < objetivo.length; i += 8) {
      const lote = objetivo.slice(i, i + 8);
      const respuestas = await Promise.allSettled(lote.map(e => apiGet(`/estudiantes/${e.idestudiante}/asistencias`)));
      respuestas.forEach((r, k) => {
        const est = lote[k];
        if (r.status === "rejected") { fallos++; return; }
        (r.value || []).forEach(a => {
          if (fechaInicio && a.fecha < fechaInicio) return;
          if (fechaFin && a.fecha > fechaFin) return;
          if (idMateria && materiaPorHorario[a.idhorario] !== idMateria) return;
          registros.push({
            fecha: a.fecha,
            hora: a.hora,
            estudiante: `${est.apellidos}, ${est.nombres}`,
            materia: a.nombre_materia || '—',
            estado: a.estado
          });
        });
      });
      mostrarLoader(`Consultando asistencias (${Math.min(i + 8, objetivo.length)}/${objetivo.length})…`);
      ocultarLoader();
    }
  } finally {
    ocultarLoader();
  }

  if (fallos) mostrarAviso(`No se pudo consultar a ${fallos} ${fallos === 1 ? "estudiante" : "estudiantes"}; el reporte puede estar incompleto.`);

  registros.sort((a, b) => b.fecha.localeCompare(a.fecha) || String(b.hora).localeCompare(String(a.hora)));

  if (registros.length === 0) {
    $("resultados").hidden = true;
    $("btnPDF").disabled = true;
    $("btnExcel").disabled = true;
    mostrarInfo("No se encontraron registros con los filtros seleccionados.");
    return;
  }

  estado.datos = registros;
  estado.filtros = { tipo: 'estudiantes', fechaInicio, fechaFin, idMateria, idEstudiante };

  pintarResultados(registros, 'estudiantes');
  mostrarExito(`${registros.length} registros encontrados`);
}

// REPORTE DE DOCENTES
async function generarReporteDocentes(fechaInicio, fechaFin) {
  const idDocente = $("filtroDocente").value;

  let url = '/asistencia-docentes';
  const params = new URLSearchParams();
  if (fechaInicio) params.append('fecha_inicio', fechaInicio);
  if (fechaFin) params.append('fecha_fin', fechaFin);
  if (params.toString()) url += `?${params.toString()}`;

  const asistencias = await apiGet(url);

  let registros = (asistencias || []).map(a => {
    if (idDocente && String(a.docente_iddocente) !== idDocente) return null;

    return {
      fecha: a.fecha,
      hora: a.hora,
      docente: a.docente_nombre || 'Docente no encontrado',
      resultado: a.resultado,
      motivo: a.motivo_rechazo || '—'
    };
  }).filter(Boolean);

  registros.sort((a, b) => b.fecha.localeCompare(a.fecha) || String(b.hora).localeCompare(String(a.hora)));

  if (registros.length === 0) {
    $("resultados").hidden = true;
    $("btnPDF").disabled = true;
    $("btnExcel").disabled = true;
    mostrarInfo("No se encontraron registros con los filtros seleccionados.");
    return;
  }

  estado.datos = registros;
  estado.filtros = { tipo: 'docentes', fechaInicio, fechaFin, idDocente };

  pintarResultados(registros, 'docentes');
  mostrarExito(`${registros.length} registros encontrados`);
}

// PINTAR RESULTADOS
function pintarResultados(registros, tipo) {
  const esEstudiantes = tipo === 'estudiantes';

  // Cabecera de la tabla
  $("tablaHead").innerHTML = esEstudiantes
    ? '<th>Fecha</th><th>Hora</th><th>Estudiante</th><th>Materia</th><th>Estado</th>'
    : '<th>Fecha</th><th>Hora</th><th>Docente</th><th>Resultado</th><th>Motivo</th>';

  // Filas
  $("tablaBody").innerHTML = registros.map(r => {
    if (esEstudiantes) {
      const badge = r.estado === 'Presente' ? 'ok' : 'out';
      return `<tr>
        <td>${fmtFecha(r.fecha)}</td>
        <td>${hhmm(r.hora)}</td>
        <td>${escapar(r.estudiante)}</td>
        <td>${escapar(r.materia)}</td>
        <td><span class="badge badge--${badge}">${escapar(r.estado)}</span></td>
      </tr>`;
    } else {
      const badge = r.resultado === 'Aceptado' ? 'ok' : 'out';
      return `<tr>
        <td>${fmtFecha(r.fecha)}</td>
        <td>${hhmm(r.hora)}</td>
        <td>${escapar(r.docente)}</td>
        <td><span class="badge badge--${badge}">${escapar(r.resultado)}</span></td>
        <td>${escapar(r.motivo)}</td>
      </tr>`;
    }
  }).join("");

  // Estadísticas
  const total = registros.length;
  const ok = esEstudiantes
    ? registros.filter(r => r.estado === 'Presente').length
    : registros.filter(r => r.resultado === 'Aceptado').length;
  const no = total - ok;

  $("statTotal").textContent = total;
  $("statOk").textContent = ok;
  $("statNo").textContent = no;
  $("resultsTitle").textContent = esEstudiantes
    ? 'Reporte de Asistencia de Estudiantes'
    : 'Reporte de Asistencia de Docentes';
  $("resultados").hidden = false;
  $("btnPDF").disabled = false;
  $("btnExcel").disabled = false;
}

// EXPORTAR PDF
$("btnPDF").addEventListener("click", () => {
  if (!window.jspdf) { mostrarError("No se cargó la librería de PDF. Revisa tu conexión a internet y recarga la página."); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const esEstudiantes = estado.tipo === 'estudiantes';

  // Título
  doc.setFontSize(18);
  doc.setTextColor(30, 60, 114);
  doc.text(esEstudiantes ? 'Reporte de Asistencia de Estudiantes' : 'Reporte de Asistencia de Docentes', 14, 20);

  // Subtítulo
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`Generado el ${fecha}`, 14, 27);

  // Filtros aplicados
  const filtros = [];
  if (estado.filtros.fechaInicio) filtros.push(`Desde: ${estado.filtros.fechaInicio}`);
  if (estado.filtros.fechaFin) filtros.push(`Hasta: ${estado.filtros.fechaFin}`);
  if (filtros.length) {
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(filtros.join(' | '), 14, 33);
  }

  // Tabla
  const head = esEstudiantes
    ? [['Fecha', 'Hora', 'Estudiante', 'Materia', 'Estado']]
    : [['Fecha', 'Hora', 'Docente', 'Resultado', 'Motivo']];

  const body = estado.datos.map(r => esEstudiantes
    ? [fmtFecha(r.fecha), hhmm(r.hora), r.estudiante, r.materia, r.estado]
    : [fmtFecha(r.fecha), hhmm(r.hora), r.docente, r.resultado, r.motivo]
  );

  doc.autoTable({
    head: head,
    body: body,
    startY: 40,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 14, right: 14 }
  });

  // Pie de página
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Sistema de Asistencia QR · Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`reporte_${estado.tipo}_${new Date().toISOString().slice(0, 10)}.pdf`);
  mostrarExito("PDF generado correctamente");
});

// EXPORTAR EXCEL
$("btnExcel").addEventListener("click", () => {
  const esEstudiantes = estado.tipo === 'estudiantes';

  const datos = estado.datos.map(r => esEstudiantes
    ? {
        'Fecha': r.fecha,
        'Hora': r.hora,
        'Estudiante': r.estudiante,
        'Materia': r.materia,
        'Estado': r.estado
      }
    : {
        'Fecha': r.fecha,
        'Hora': r.hora,
        'Docente': r.docente,
        'Resultado': r.resultado,
        'Motivo': r.motivo
      }
  );

  if (typeof XLSX === "undefined") { mostrarError("No se cargó la librería de Excel. Revisa tu conexión a internet y recarga la página."); return; }
  const ws = XLSX.utils.json_to_sheet(datos);

  // Ajustar ancho de columnas
  ws['!cols'] = Object.keys(datos[0] || {}).map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
  XLSX.writeFile(wb, `reporte_${estado.tipo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  mostrarExito("Excel generado correctamente");
});

// INICIO
(async function iniciar() {
  await conLoader(cargarCatalogos, "Cargando filtros…");
})();
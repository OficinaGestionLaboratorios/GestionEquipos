/* Exportar a Excel y ZIP (Excel + adjuntos de Drive). */
function libroConformidades(lista, extra) {
  // extra: { [id]: { ruta, archivos } } -> solo cuando va dentro del ZIP
  const filas = lista.map(d => {
    const f = {
      'Fecha': d.fecha,
      'Orden': d.orden,
      'Proveedor': d.proveedor,
      'Laboratorio / Ubicación': d.ubicacion,
      'Equipo / servicio': d.equipo,
      'Respondido a Logística': d.respondido,
      'Respondido a Ing. Díaz': d.respondidoJorge,
      'Enlace Gmail': d.gmail
    };
    if (extra) {
      const x = extra[d.id] || {};
      f['Carpeta en el ZIP'] = x.ruta || '';
      f['Archivos incluidos'] = (x.archivos || []).join(' | ');
    }
    return f;
  });
  const ws = XLSX.utils.json_to_sheet(filas);
  const anchos = [{ wch: 11 }, { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 55 }, { wch: 18 }, { wch: 18 }, { wch: 40 }];
  if (extra) {
    anchos.push({ wch: 45 }, { wch: 60 });
    // enlace relativo a la carpeta de cada conformidad dentro del ZIP extraído
    lista.forEach((d, i) => {
      const ruta = (extra[d.id] || {}).ruta;
      if (!ruta) return;
      const celda = ws[XLSX.utils.encode_cell({ r: i + 1, c: 8 })];
      if (celda) celda.l = { Target: ruta, Tooltip: 'Abrir carpeta' };
    });
  }
  ws['!cols'] = anchos;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Conformidades');
  return wb;
}

function exportarExcel() {
  if (typeof XLSX === 'undefined') { aviso('No se pudo cargar la librería de Excel. Revisa tu conexión e intenta de nuevo.', 'err'); return; }
  const lista = filtrados();
  if (!lista.length) { aviso('No hay filas para exportar con los filtros actuales.', 'warn'); return; }
  XLSX.writeFile(libroConformidades(lista), 'Conformidades_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}


let zipCancelado = false, zipEnCurso = false;

function abrirZip() {
  if (typeof XLSX === 'undefined' || typeof JSZip === 'undefined') {
    aviso('No se pudieron cargar las librerías de Excel/ZIP. Revisa tu conexión e intenta de nuevo.', 'err'); return;
  }
  const lista = filtrados();
  if (!lista.length) { aviso('No hay filas para exportar con los filtros actuales.', 'warn'); return; }
  const conCarpeta = lista.filter(d => d.carpetaId).length;
  $('zipResumen').textContent = lista.length + ' conformidades con el filtro actual (' + conCarpeta + ' con carpeta en Drive).';
  $('zipProg').hidden = true; $('zipProg').value = 0;
  $('zipEstado').textContent = '';
  $('zipGenerar').disabled = false;
  $('dlgZip').showModal();
}

const nombreSeguro = (s) => String(s || '').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim().slice(0, 90) || 'sin-nombre';

function unico(nombre, usados) {
  if (!usados.has(nombre)) { usados.add(nombre); return nombre; }
  const p = nombre.lastIndexOf('.');
  const base = p > 0 ? nombre.slice(0, p) : nombre, ext = p > 0 ? nombre.slice(p) : '';
  let n = 2;
  while (usados.has(base + ' (' + n + ')' + ext)) n++;
  const nuevo = base + ' (' + n + ')' + ext;
  usados.add(nuevo);
  return nuevo;
}

async function generarZip() {
  if (zipEnCurso) return;
  zipEnCurso = true; zipCancelado = false;
  const lista = filtrados();
  const roles = ['informe', 'pedido', 'otro'].filter(r => $('zip-' + r).checked);
  const pendientes = lista.filter(d => d.carpetaId);
  const total = pendientes.length;
  const zip = new JSZip();
  const extra = {};            // id conformidad -> { ruta, archivos }
  const carpetasUsadas = new Set();
  const fallos = [];
  let hechas = 0, nArchivos = 0;

  $('zipGenerar').disabled = true;
  $('zipProg').hidden = false; $('zipProg').value = 0;
  ocultarAviso();

  const estado = () => {
    $('zipProg').value = total ? Math.round(hechas / total * 90) : 90;
    $('zipEstado').textContent = 'Descargando de Drive: ' + hechas + ' de ' + total + ' carpetas · ' + nArchivos + ' archivos';
  };
  estado();

  async function trabajador() {
    while (pendientes.length && !zipCancelado) {
      const d = pendientes.shift();
      try {
        const r = (await llamar('descargar', { carpeta: d.carpetaId })).carpeta;
        const carpeta = unico(nombreSeguro(r.nombre), carpetasUsadas);
        const usados = new Set(), incluidos = [];
        for (const a of r.archivos) {
          if (zipCancelado) break;
          if (!roles.includes(a.rol)) continue;
          try {
            const b64 = a.b64 != null ? a.b64 : (await llamar('archivo', { id: a.id })).b64;
            const nombre = unico(nombreSeguro(a.nombre), usados);
            zip.file('Adjuntos/' + carpeta + '/' + nombre, b64, { base64: true });
            incluidos.push(nombre); nArchivos++;
          } catch (e) {
            fallos.push(d.orden + ' / ' + a.nombre + ': ' + e.message);
          }
        }
        extra[d.id] = { ruta: 'Adjuntos/' + carpeta, archivos: incluidos };
      } catch (e) {
        fallos.push(d.orden + ': ' + e.message);
      }
      hechas++; estado();
    }
  }

  try {
    await Promise.all([trabajador(), trabajador(), trabajador()]);
    if (zipCancelado) { $('zipEstado').textContent = 'Cancelado.'; return; }

    $('zipEstado').textContent = 'Armando el Excel y comprimiendo…';
    const wb = libroConformidades(lista, extra);
    zip.file('Conformidades.xlsx', XLSX.write(wb, { bookType: 'xlsx', type: 'array' }));
    if (fallos.length) {
      zip.file('ERRORES.txt', 'No se pudieron descargar:\r\n\r\n' + fallos.join('\r\n'));
    }
    const blob = await zip.generateAsync(
      { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
      (m) => { $('zipProg').value = 90 + Math.round(m.percent / 10); }
    );
    if (zipCancelado) { $('zipEstado').textContent = 'Cancelado.'; return; }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Conformidades_' + new Date().toISOString().slice(0, 10) + '_' + lista.length + '.zip';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);

    $('zipProg').value = 100;
    $('zipEstado').textContent = 'Listo: ' + lista.length + ' filas, ' + nArchivos + ' archivos (' +
      (blob.size / 1048576).toFixed(1) + ' MB)' + (fallos.length ? ' · ' + fallos.length + ' con error (ver ERRORES.txt)' : '') + '.';
    if (fallos.length) aviso('El ZIP se generó, pero ' + fallos.length + ' archivo(s) fallaron. Revisa ERRORES.txt dentro del ZIP.', 'warn');
  } catch (e) {
    aviso('No se pudo generar el ZIP: ' + e.message, 'err');
    $('zipEstado').textContent = 'Error.';
  } finally {
    zipEnCurso = false;
    $('zipGenerar').disabled = false;
  }
}

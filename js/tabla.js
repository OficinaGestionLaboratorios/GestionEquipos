/* Filtros, buscador, tabla principal y detalle de informes. */
function llenarFiltros() {
  const anios = [...new Set(datos.map(d => d.fecha.slice(0, 4)))].sort().reverse();
  const provs = [...new Set(datos.map(d => d.proveedor).filter(Boolean))].sort();
  const labs = [...new Set(datos.map(d => d.ubicacion).filter(Boolean))].sort((x, y) => x.localeCompare(y, 'es'));
  const aSel = $('fAnio').value, pSel = $('fProv').value, lSel = $('fLab').value;
  $('fAnio').innerHTML = '<option value="">Todos los años</option>' +
    anios.map(a => `<option ${a === aSel ? 'selected' : ''}>${esc(a)}</option>`).join('');
  $('fProv').innerHTML = '<option value="">Todos los proveedores</option>' +
    provs.map(p => `<option ${p === pSel ? 'selected' : ''}>${esc(p)}</option>`).join('');

  $('fLab').innerHTML = '<option value="">Todos los laboratorios / ubicaciones</option>' +
    labs.map(l => `<option ${l === lSel ? 'selected' : ''}>${esc(l)}</option>`).join('') +
    (datos.some(d => !d.ubicacion) ? `<option value="__sin" ${lSel === '__sin' ? 'selected' : ''}>(Sin ubicación)</option>` : '');

  $('kTotal').textContent = datos.length;
  $('k2025').textContent = datos.filter(d => d.fecha.startsWith('2025')).length;
  $('k2026').textContent = datos.filter(d => d.fecha.startsWith('2026')).length;
  $('kProv').textContent = provs.length;
}

const sinTildes = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Buscador: varias palabras (todas deben aparecer), sin distinguir mayúsculas ni tildes.
function filtrados() {
  const palabras = sinTildes($('buscar').value).split(/\s+/).filter(Boolean);
  const a = $('fAnio').value, p = $('fProv').value, l = $('fLab').value;
  const desde = $('fDesde').value, hasta = $('fHasta').value;
  return datos.filter(d => {
    if (a && !d.fecha.startsWith(a)) return false;
    if (p && d.proveedor !== p) return false;
    if (l && (l === '__sin' ? d.ubicacion : d.ubicacion !== l)) return false;
    if (desde && d.fecha < desde) return false;
    if (hasta && d.fecha > hasta) return false;
    if (!palabras.length) return true;
    const pajar = sinTildes([d.orden, d.hes, d.proveedor, d.ubicacion, d.equipo, d.asunto, d.adjuntos].join(' '));
    return palabras.every(w => pajar.includes(w));
  });
}

function render() {
  const lista = filtrados();
  $('vacio').hidden = lista.length > 0;
  $('contador').textContent = lista.length + ' de ' + datos.length + ' conformidades';
  $('cuerpo').innerHTML = lista.map((d, i) => `
    <tr data-i="${i}">
      <td class="num">${esc(d.fecha)}</td>
      <td class="num">${esc(d.orden)}</td>
      <td>${esc(d.proveedor)}</td>
      <td>${d.ubicacion ? esc(d.ubicacion) : '<span class="sub">—</span>'}</td>
      <td class="eq">${esc(d.equipo)}</td>
      <td>${d.carpetaId ? `<button data-informes="${esc(d.carpetaId)}" data-fila="${i}">Ver informes</button>` : '—'}</td>
      <td><button data-correo="${esc(d.id)}">Ver correo</button></td>
      <td><div class="acc">
        ${d.respondido
          ? `<div><span class="tag informe">Logística ✓</span><div class="sub">${esc(d.respondido)}</div></div>`
          : ''}
        ${d.respondidoJorge
          ? `<div><span class="tag informe">Ing. Díaz ✓</span><div class="sub">${esc(d.respondidoJorge)}</div></div>`
          : `<button data-responder="${esc(d.id)}" data-destino="jorge">Responder a Jorge Díaz</button>`}
      </div></td>
    </tr>
    <tr class="detalle" id="det-${i}" hidden><td colspan="7"></td></tr>`).join('');
}


async function alternarInformes(btn) {
  const id = btn.dataset.informes, fila = btn.dataset.fila;
  const det = $('det-' + fila), celda = det.firstElementChild;

  if (!det.hidden) { det.hidden = true; btn.textContent = 'Ver informes'; return; }
  det.hidden = false; btn.textContent = 'Ocultar';
  celda.innerHTML = '<span class="spin"></span> Consultando Drive…';

  try {
    if (!cacheArchivos[id]) cacheArchivos[id] = (await llamar('archivos', { carpeta: id })).archivos;
    const arch = cacheArchivos[id];
    celda.innerHTML = arch.length
      ? '<ul class="archivos">' + arch.map(f => `
          <li>
            <span class="tag ${f.rol === 'informe' ? 'informe' : ''}">${esc(f.rol)}</span>
            <a href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.nombre)}</a>
            <span class="sub">${f.kb} KB</span>
          </li>`).join('') + '</ul>'
      : 'La carpeta no tiene archivos.';
  } catch (e) {
    celda.innerHTML = `<span style="color:var(--err)">${esc(e.message)}</span>`;
  }
}

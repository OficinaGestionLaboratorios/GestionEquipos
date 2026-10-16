/* Ver correo dentro del panel. */
const cacheCorreos = {};   // id -> correo

async function verCorreo(btn) {
  const id = btn.dataset.correo, textoOriginal = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span>';
  ocultarAviso();
  try {
    if (!cacheCorreos[id]) cacheCorreos[id] = await llamar('correo', { id });
    const c = cacheCorreos[id];
    $('dlgCorreoBody').innerHTML = `
      <div class="fila"><span>De</span><span>${esc(c.de)}</span></div>
      <div class="fila"><span>Para</span><span>${esc(c.para)}</span></div>
      ${c.cc ? `<div class="fila"><span>CC</span><span>${esc(c.cc)}</span></div>` : ''}
      <div class="fila"><span>Fecha</span><span>${esc(c.fecha)}</span></div>
      <div class="fila"><span>Asunto</span><span>${esc(c.asunto)}</span></div>
      <div class="fila"><span>Adjuntos</span><span>${c.adjuntos.length ? c.adjuntos.map(a => esc(a.nombre) + ' (' + a.kb + ' KB)').join(', ') : '(ninguno)'}</span></div>
      <pre>${esc(c.cuerpo)}</pre>
      <div class="sub">Los adjuntos están en la columna “Informes” (Ver informes).</div>`;
    $('dlgCorreo').showModal();
  } catch (e) {
    aviso(e.message, 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
}

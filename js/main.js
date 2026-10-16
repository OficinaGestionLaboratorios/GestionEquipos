/* Punto de entrada: eventos y carga inicial. */
$('btnActualizar').addEventListener('click', actualizar);
['buscar', 'fAnio', 'fProv', 'fLab', 'fDesde', 'fHasta'].forEach(id => $(id).addEventListener('input', render));
$('btnLimpiar').addEventListener('click', () => {
  ['buscar', 'fAnio', 'fProv', 'fLab', 'fDesde', 'fHasta'].forEach(id => $(id).value = '');
  render();
});
$('btnZip').addEventListener('click', abrirZip);
$('zipGenerar').addEventListener('click', generarZip);
$('zipCancelar').addEventListener('click', () => { zipCancelado = true; $('dlgZip').close(); });
$('dlgZip').addEventListener('cancel', () => { zipCancelado = true; });
$('btnExcel').addEventListener('click', exportarExcel);
$('cuerpo').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-informes]');
  if (b) { alternarInformes(b); return; }
  const c = e.target.closest('button[data-correo]');
  if (c) { verCorreo(c); return; }
  const r = e.target.closest('button[data-responder]');
  if (r) abrirResponder(r);
});
$('dlgBody').addEventListener('click', (e) => {
  if (e.target.id === 'btnEditar') {
    const ta = $('txtMsg'), ver = $('prevMsg');
    const editando = ta.hidden;
    ta.hidden = !editando; ver.hidden = editando;
    $('btnRestablecer').hidden = !editando;
    $('hintEdit').hidden = !editando;
    ['iPara', 'iCc'].forEach(k => $(k).hidden = !editando);
    ['vPara', 'vCc'].forEach(k => $(k).hidden = editando);
    e.target.textContent = editando ? 'Ver vista previa' : 'Editar mensaje y destinatarios';
    if (editando) { $('iPara').value = $('iPara').value; }
    if (editando) ta.focus();
  } else if (e.target.id === 'btnRestablecer') {
    if (!respuestaPendiente) return;
    $('txtMsg').value = respuestaPendiente.cuerpoOriginal;
    $('iPara').value = respuestaPendiente.paraOriginal;
    $('iCc').value = respuestaPendiente.ccOriginal;
  }
});
$('dlgCorreoCerrar').addEventListener('click', () => $('dlgCorreo').close());
$('dlgCancelar').addEventListener('click', () => { respuestaPendiente = null; $('dlg').close(); });
$('dlgEnviar').addEventListener('click', enviarRespuesta);

cargar();

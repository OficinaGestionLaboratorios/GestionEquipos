/* Responder a Almacén de Logística / ing. Díaz. */
let respuestaPendiente = null;   // { id, forzar }

async function abrirResponder(btn) {
  const id = btn.dataset.responder;
  const destino = btn.dataset.destino || 'logistica';
  const textoOriginal = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span> Preparando…';
  ocultarAviso();
  try {
    const v = await llamar(destino === 'jorge' ? 'preparar_jorge' : 'preparar', { id });
    respuestaPendiente = { id, destino, forzar: !!(v.ya || v.respondido), cuerpoOriginal: v.cuerpo, paraOriginal: v.para, ccOriginal: v.cc.join(', ') };
    $('dlgTitulo').textContent = destino === 'jorge' ? 'Responder al ing. Jorge Díaz' : 'Responder a Almacén de Logística';
    const aviso_ = v.ya
      ? `<div class="msg show warn">Ya hay una respuesta tuya en ese hilo (${esc(v.yaFecha)}). Si continúas, se enviará otra.</div>`
      : '';
    const nota = destino === 'jorge'
      ? '<div class="msg show info">Se enviará como <b>respuesta</b> al correo del ing. Díaz, con copia a los mismos que él puso.</div>'
      : '<div class="msg show info">Se enviará como <b>reenvío</b> del correo del ing. Díaz: tu texto va arriba y debajo el mensaje reenviado.</div>';
    $('dlgBody').innerHTML = nota + aviso_ + `
      <div class="fila"><span>Para</span><span id="vPara">${esc(v.para)}</span><input type="text" id="iPara" value="${esc(v.para)}" hidden></div>
      <div class="fila"><span>CC</span><span id="vCc">${v.cc.length ? v.cc.map(esc).join(', ') : '(sin CC)'}</span><input type="text" id="iCc" value="${esc(v.cc.join(', '))}" placeholder="(sin CC)" hidden></div>
      <div class="fila"><span>Asunto</span><span>${esc(v.asunto)}</span></div>
      <div class="fila"><span>Adjuntos</span><span>${v.adjuntos && v.adjuntos.length ? v.adjuntos.map(esc).join(', ') : '(ninguno)'}</span></div>
      ${v.html ? `<div class="prev" id="prevMsg">${v.html}</div>` : `<pre id="prevMsg">${esc(v.cuerpo)}</pre>`}
      <textarea id="txtMsg" maxlength="1500" hidden>${esc(v.cuerpo)}</textarea>
      <div class="edit-bar">
        <button type="button" id="btnEditar">Editar mensaje y destinatarios</button>
        <button type="button" id="btnRestablecer" hidden>Restablecer original</button>
      </div>
      <div class="sub" id="hintEdit" hidden>Separa varias direcciones con comas.${destino === 'jorge' ? ' Si cambias el destinatario de Para, se enviará como correo nuevo (fuera del hilo original).' : ''}</div>`;
    $('dlgEnviar').disabled = false;
    $('dlgEnviar').textContent = 'Enviar respuesta';
    $('dlg').showModal();
  } catch (e) {
    aviso(e.message, 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
}

async function enviarRespuesta() {
  if (!respuestaPendiente) return;
  const { id, forzar, destino, cuerpoOriginal, paraOriginal, ccOriginal } = respuestaPendiente;
  const norm = (s) => String(s || '').split(/[,;\s]+/).filter(Boolean).map(x => x.toLowerCase()).join(',');
  const extra = {};
  const ta = $('txtMsg');
  if (ta && !ta.hidden) {
    const t = ta.value.trim();
    if (!t) { alert('El mensaje no puede estar vacío.'); ta.focus(); return; }
    if (t !== String(cuerpoOriginal || '').trim()) extra.cuerpo = t;   // solo se envía lo que editaste
    const para = $('iPara').value, cc = $('iCc').value;
    if (!norm(para)) { alert('Debe haber al menos un destinatario en Para.'); $('iPara').focus(); return; }
    if (norm(para) !== norm(paraOriginal)) extra.para = para.trim();
    if (norm(cc) !== norm(ccOriginal)) extra.cc = cc.trim();
  }
  const b = $('dlgEnviar');
  b.disabled = true;
  b.innerHTML = '<span class="spin"></span> Enviando…';
  try {
    const r = await llamar(destino === 'jorge' ? 'responder_jorge' : 'responder', { id, forzar: forzar ? '1' : '0', ...extra });
    const d = datos.find(x => x.id === id);
    if (d) { if (destino === 'jorge') d.respondidoJorge = r.respondido; else d.respondido = r.respondido; }
    $('dlg').close();
    render();
    aviso('Respuesta enviada a ' + r.para + (r.cc.length ? ' con copia a ' + r.cc.join(', ') : '') + '.', 'ok');
  } catch (e) {
    $('dlg').close();
    aviso(e.message, 'err');
  } finally {
    respuestaPendiente = null;
  }
}

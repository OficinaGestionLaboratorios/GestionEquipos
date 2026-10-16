/* Utilidades generales: acceso al DOM, escape de HTML y avisos. */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function aviso(texto, tipo = 'info') {
  const m = $('msg');
  m.className = 'msg show ' + tipo;
  m.textContent = texto;
}
function ocultarAviso() { $('msg').className = 'msg'; }

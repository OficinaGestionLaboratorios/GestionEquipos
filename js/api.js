/* Comunicación con el Apps Script (clave de acceso y llamadas). */
function obtenerClave() {
  let k = localStorage.getItem(LS_CLAVE);
  if (!k) {
    k = prompt('Clave de acceso al panel:') || '';
    if (k) localStorage.setItem(LS_CLAVE, k);
  }
  return k;
}

async function llamar(accion, extra = {}) {
  const params = new URLSearchParams({ action: accion, key: obtenerClave(), ...extra });
  const r = await fetch(API + '?' + params.toString());
  if (!r.ok) throw new Error('Error de red (' + r.status + ')');
  const j = await r.json();
  if (!j.ok) {
    if (/clave/i.test(j.error || '')) localStorage.removeItem(LS_CLAVE);
    throw new Error(j.error || 'Error desconocido');
  }
  return j;
}

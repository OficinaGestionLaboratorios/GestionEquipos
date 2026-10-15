/* Carga de datos y actualización desde Gmail. */
async function cargar() {
  try {
    const j = await llamar('listar');
    datos = j.datos;
    $('ultima').textContent = 'Última lectura: ' + new Date().toLocaleString('es-PE');
    llenarFiltros();
    render();
  } catch (e) {
    aviso(e.message, 'err');
  }
}


async function actualizar() {
  const btn = $('btnActualizar');
  btn.disabled = true;
  btn.innerHTML = '<span class="spin"></span> Actualizando…';
  aviso('Buscando correos nuevos en Gmail y guardando adjuntos en Drive. Puede tardar unos minutos…', 'info');
  try {
    const r = await llamar('actualizar');
    await cargar();
    if (r.completo === false) {
      aviso(`Se guardaron ${r.guardados} correos, pero aún quedan pendientes. Pulsa Actualizar otra vez.`, 'warn');
    } else {
      aviso(r.guardados
        ? `Listo: ${r.guardados} correos nuevos guardados.`
        : 'No hay correos nuevos.', 'ok');
    }
  } catch (e) {
    aviso(e.message, 'err');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Actualizar';
  }
}

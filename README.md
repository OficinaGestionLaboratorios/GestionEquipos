# Conformidades de servicio · Mantenimiento de equipos

Panel web (sitio estático) que consume el Apps Script `Api.gs` / `Codigo.gs`.

```
index.html          Estructura de la página (solo HTML)
css/
  tema.css          Variables SAP Fiori (colores, fuente, modo oscuro)  ← cambiar apariencia aquí
  base.css          Reset, body, barra superior, contenedor
  componentes.css   Botones, KPI, filtros, avisos, tabla, etiquetas
  dialogos.css      Ventanas modales
js/                 (orden de carga = orden de index.html)
  config.js         URL del Apps Script y clave de localStorage
  estado.js         Datos y cachés compartidos
  utils.js          $, esc, aviso
  api.js            obtenerClave, llamar()
  datos.js          cargar(), actualizar()
  tabla.js          Filtros, buscador, render, ver informes
  correo.js         Ver correo
  exportar.js       Excel y ZIP
  responder.js      Responder a Logística / ing. Díaz
  main.js           Eventos y arranque
```

Para agregar una función nueva: crea `js/<nombre>.js`, agrégalo en `index.html` antes de `main.js`
y registra su evento en `main.js`. Los archivos usan scripts clásicos (sin módulos), por lo que
también funcionan abriendo `index.html` con doble clic.

/* Lógica de la página. Normalmente no necesitas editar este archivo:
   los textos están en config.js y las fechas/enlaces en la hoja de Google. */
(function () {
  "use strict";

  const C = window.CONFIG;
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, "0");
  const DIA = 24 * 60 * 60 * 1000;

  /* ---------- Textos ---------- */
  function pintarTextos(t) {
    document.title = t.tituloPestana;
    ["etiqueta", "subtitulo", "contadorTexto", "avisoLegal", "cerradoTitulo", "cerradoTexto"]
      .forEach((k) => { $(k).textContent = t[k]; });
    $("btn").textContent = t.boton;

    // *palabras* entre asteriscos se pintan en dorado
    const h1 = $("titulo");
    h1.textContent = "";
    t.titulo.split("*").forEach((trozo, i) => {
      if (i % 2) { const s = document.createElement("span"); s.textContent = trozo; h1.appendChild(s); }
      else h1.appendChild(document.createTextNode(trozo));
    });

    const ul = $("puntos");
    ul.textContent = "";
    t.puntos.forEach((p) => { const li = document.createElement("li"); li.textContent = p; ul.appendChild(li); });
  }

  /* ---------- Tiempo ---------- */
  // "-05:00" → -300 minutos. También acepta "-5" o "+1".
  function minutosZona(z) {
    const m = /^([+-])?(\d{1,2})(?::?(\d{2}))?$/.exec(String(z).trim());
    if (!m) return 0;
    const v = Number(m[2]) * 60 + Number(m[3] || 0);
    return m[1] === "-" ? -v : v;
  }

  // Convierte "2026-11-20 20:00" en la zona indicada a milisegundos UTC.
  function fechaEnZona(texto, zona) {
    const m = /(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/.exec(String(texto));
    if (!m) return NaN;
    return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - minutosZona(zona) * 60000;
  }

  // Devuelve cuándo empieza y termina el contador actual.
  // Modo diario: siempre cuenta hacia la próxima "horaDiaria".
  function calcularVentana(ev, ahora) {
    if (ev.modo === "diario") {
      const off = minutosZona(ev.zona) * 60000;
      const local = new Date(ahora + off);
      const [h, mi] = String(ev.horaDiaria).split(":").map(Number);
      let fin = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), h, mi || 0) - off;
      if (fin <= ahora) fin += DIA;
      return { inicio: fin - DIA, fin };
    }
    const inicio = fechaEnZona(ev.inicio, ev.zona);
    return { inicio, fin: inicio + Number(ev.duracionHoras || 24) * 3600000 };
  }

  /* ---------- Contador ---------- */
  let timer = null;
  function arrancarContador(ev) {
    if (String(ev.registroAbierto).toUpperCase() === "NO") { cerrar(); return; }

    function tick() {
      const ahora = Date.now();
      const v = calcularVentana(ev, ahora);
      if (isNaN(v.fin)) { console.error("Fecha de inicio inválida:", ev.inicio); return; }
      // Antes de empezar, el contador se queda quieto en su duración completa.
      const restante = ahora < v.inicio ? v.fin - v.inicio : v.fin - ahora;
      if (restante <= 0) { cerrar(); return; }
      $("hh").textContent = pad(Math.floor(restante / 3600000));
      $("mm").textContent = pad(Math.floor((restante % 3600000) / 60000));
      $("ss").textContent = pad(Math.floor((restante % 60000) / 1000));
    }
    clearInterval(timer);
    timer = setInterval(tick, 1000);
    tick();
  }

  function cerrar() {
    clearInterval(timer);
    document.body.classList.add("is-closed");
  }

  /* ---------- Configuración remota (hoja de Google) ---------- */
  async function cargarConfigRemota() {
    if (!C.appsScriptUrl) return {};
    try {
      const ctrl = new AbortController();
      const corte = setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch(C.appsScriptUrl + "?accion=config", { signal: ctrl.signal });
      clearTimeout(corte);
      return r.ok ? await r.json() : {};
    } catch (e) {
      console.warn("No se pudo leer la hoja; uso config.js", e);
      return {};
    }
  }

  /* ---------- Registro ---------- */
  function activarFormulario(ev) {
    $("registro").addEventListener("submit", async (e) => {
      e.preventDefault();
      const nombre = $("nombre").value.trim();
      const email = $("email").value.trim();
      const telefono = $("telefono").value.trim();
      const msg = $("msg");
      msg.className = "msg";

      if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.textContent = "Escribe tu nombre y un correo válido.";
        msg.classList.add("error");
        return;
      }

      $("btn").disabled = true;
      msg.textContent = "Guardando tu cupo…";

      try {
        if (C.appsScriptUrl) {
          // "no-cors": el navegador envía los datos sin pedir permiso previo; no leemos respuesta.
          await fetch(C.appsScriptUrl, {
            method: "POST",
            mode: "no-cors",
            body: new URLSearchParams({ nombre, email, telefono })
          });
        } else {
          console.warn("appsScriptUrl vacío: el registro NO se está guardando.");
        }
        msg.textContent = "¡Listo! Te llevamos al grupo de WhatsApp…";
        setTimeout(() => { window.location.href = ev.whatsapp; }, 800);
      } catch (err) {
        msg.textContent = "Hubo un problema de conexión. Inténtalo de nuevo.";
        msg.classList.add("error");
        $("btn").disabled = false;
      }
    });
  }

  /* ---------- Arranque ---------- */
  // El formulario funciona desde el primer momento con los datos de config.js;
  // cuando llega la hoja de Google, se actualizan enlace y contador.
  const ev = Object.assign({}, C.evento);
  pintarTextos(C.textos);
  activarFormulario(ev);
  cargarConfigRemota().then((remota) => {
    Object.assign(ev, remota);
    arrancarContador(ev);
  });
})();

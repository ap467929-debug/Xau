/**
 * BACKEND DE LA MASTERCLASS (Google Apps Script) — gratuito
 * ==========================================================
 * Dónde va: Google Sheets → Extensiones → Apps Script → pega todo esto.
 *
 * Qué hace:
 *  - doGet():  la página web le pide la configuración (fechas, enlaces).
 *  - doPost(): guarda cada registro en la pestaña "Registros".
 *  - revisarRecordatorio(): se ejecuta sola cada 5 minutos y, cuando
 *    faltan X minutos para la clase, envía el correo a quien no lo tenga.
 *
 * La configuración NO se edita aquí: se edita en la pestaña "Config"
 * de la hoja (también desde la app de Google Sheets del iPad).
 *
 * Primera vez: elige la función "instalar" arriba y pulsa ▶ Ejecutar.
 */

const HOJA_CONFIG = 'Config';
const HOJA_REGISTROS = 'Registros';
const DIA = 24 * 60 * 60 * 1000;

const CONFIG_POR_DEFECTO = [
  ['modo', 'fijo', 'fijo = una sola vez · diario = se repite todos los días'],
  ['inicio', '2026-11-20 20:00', 'Solo modo fijo: fecha y hora en que arranca el contador (AAAA-MM-DD HH:MM)'],
  ['duracionHoras', '24', 'Solo modo fijo: cuántas horas dura el contador. La clase empieza al terminar'],
  ['horaDiaria', '20:00', 'Solo modo diario: hora de la clase cada día (HH:MM, formato 24 h)'],
  ['zona', '-05:00', 'Zona horaria: Colombia/Perú -05:00 · México -06:00 · España +01:00'],
  ['whatsapp', 'https://chat.whatsapp.com/TU-CODIGO', 'Enlace de invitación del grupo de WhatsApp'],
  ['linkDirecto', 'https://TU-LINK-DE-LA-TRANSMISION', 'Enlace de Zoom / YouTube / Meet que va en el correo'],
  ['minutosAntes', '30', 'Minutos antes de la clase en que se envía el recordatorio'],
  ['registroAbierto', 'SI', 'Escribe NO para cerrar el registro al instante'],
  ['remitente', 'Tu Marca', 'Nombre que aparece como remitente del correo'],
  ['asunto', '⏰ En 30 minutos empezamos la masterclass', 'Asunto del correo de recordatorio']
];

// Claves que la página web puede leer (el resto es privado).
const CLAVES_PUBLICAS = ['modo', 'inicio', 'duracionHoras', 'horaDiaria', 'zona', 'whatsapp', 'registroAbierto'];

/* ------------------------------------------------------------------ */
/* INSTALACIÓN (ejecutar una sola vez)                                 */
/* ------------------------------------------------------------------ */
function instalar() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let cfg = ss.getSheetByName(HOJA_CONFIG);
  if (!cfg) {
    cfg = ss.insertSheet(HOJA_CONFIG);
    cfg.getRange('B:B').setNumberFormat('@'); // texto plano: evita que Sheets convierta horas/fechas
    cfg.getRange(1, 1, 1, 3).setValues([['Clave', 'Valor', 'Explicación']]).setFontWeight('bold');
    cfg.getRange(2, 1, CONFIG_POR_DEFECTO.length, 3).setValues(CONFIG_POR_DEFECTO);
    cfg.setColumnWidth(1, 140); cfg.setColumnWidth(2, 300); cfg.setColumnWidth(3, 480);
  }

  hojaRegistros_();

  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'revisarRecordatorio')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('revisarRecordatorio').timeBased().everyMinutes(5).create();

  Logger.log('Listo. Edita la pestaña "Config" y publica como Aplicación web.');
}

/* ------------------------------------------------------------------ */
/* WEB                                                                 */
/* ------------------------------------------------------------------ */
function doGet() {
  const cfg = leerConfig_();
  const publica = {};
  CLAVES_PUBLICAS.forEach(k => { if (cfg[k] !== undefined) publica[k] = cfg[k]; });
  return ContentService.createTextOutput(JSON.stringify(publica))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const email = String(p.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ContentService.createTextOutput('email inválido');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // evita que dos registros simultáneos se pisen
  try {
    const hoja = hojaRegistros_();
    const cfg = leerConfig_();
    const n = hoja.getLastRow() - 1;
    const emails = n > 0 ? hoja.getRange(2, 2, n).getValues().flat().map(String) : [];
    const idx = emails.indexOf(email);

    if (idx === -1) {
      hoja.appendRow([new Date(), email, limpiar_(p.nombre), limpiar_(p.telefono), 'pendiente']);
    } else if (cfg.modo === 'diario') {
      // En modo diario, si vuelve a registrarse, recibe el recordatorio de la próxima clase.
      hoja.getRange(idx + 2, 5).setValue('pendiente');
    }
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}

/* ------------------------------------------------------------------ */
/* RECORDATORIO (se ejecuta solo cada 5 minutos)                       */
/* ------------------------------------------------------------------ */
function revisarRecordatorio() {
  const cfg = leerConfig_();
  const ahora = Date.now();
  const clase = calcularVentana_(cfg, ahora).fin;
  const antes = Number(cfg.minutosAntes || 30) * 60000;

  // Solo envía dentro de la franja "X minutos antes → inicio de la clase".
  if (isNaN(clase) || ahora < clase - antes || ahora >= clase) return;
  enviarRecordatorios(cfg);
}

/** También puedes ejecutarla a mano para probar el correo. */
function enviarRecordatorios(cfg) {
  cfg = cfg || leerConfig_();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return; // ya hay un envío en marcha
  try {
    const hoja = hojaRegistros_();
    const filas = hoja.getDataRange().getValues();
    for (let i = 1; i < filas.length; i++) {
      const email = filas[i][1], nombre = filas[i][2], estado = String(filas[i][4]);
      if (!email || estado.indexOf('enviado') === 0) continue;
      if (MailApp.getRemainingDailyQuota() < 1) {
        hoja.getRange(i + 1, 5).setValue('sin cuota hoy');
        continue;
      }
      try {
        MailApp.sendEmail({
          to: email,
          name: cfg.remitente,
          subject: cfg.asunto,
          htmlBody: plantillaCorreo_(nombre, cfg)
        });
        hoja.getRange(i + 1, 5).setValue('enviado ' + new Date().toLocaleString());
      } catch (err) {
        hoja.getRange(i + 1, 5).setValue('error: ' + err.message);
      }
    }
  } finally {
    lock.releaseLock();
  }
}

function plantillaCorreo_(nombre, cfg) {
  const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return '<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5">' +
    '<p>Hola ' + esc(nombre) + ',</p>' +
    '<p>En <b>' + esc(cfg.minutosAntes) + ' minutos</b> empieza la masterclass en vivo.</p>' +
    '<p><a href="' + esc(cfg.linkDirecto) + '" style="background:#e3b341;color:#111;padding:12px 20px;' +
    'border-radius:8px;text-decoration:none;font-weight:bold">Entrar a la transmisión</a></p>' +
    '<p>¿Aún no estás en el grupo? <a href="' + esc(cfg.whatsapp) + '">Únete aquí</a>.</p>' +
    '<p>Nos vemos dentro.</p></div>';
}

/** Muestra cuántos correos te quedan hoy (Ver → Registros de ejecución). */
function verCuotaRestante() {
  Logger.log('Correos disponibles hoy: ' + MailApp.getRemainingDailyQuota());
}

/* ------------------------------------------------------------------ */
/* UTILIDADES                                                          */
/* ------------------------------------------------------------------ */
function leerConfig_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = ss.getSpreadsheetTimeZone();
  const cfg = {};
  CONFIG_POR_DEFECTO.forEach(([k, v]) => { cfg[k] = v; });

  const hoja = ss.getSheetByName(HOJA_CONFIG);
  if (!hoja) return cfg;
  hoja.getDataRange().getValues().slice(1).forEach(([k, v]) => {
    k = String(k).trim();
    if (!k || v === '') return;
    // Si Sheets convirtió el valor en fecha/hora, lo pasamos de vuelta a texto.
    if (v instanceof Date) {
      v = Utilities.formatDate(v, tz, k === 'horaDiaria' ? 'HH:mm' : 'yyyy-MM-dd HH:mm');
    }
    cfg[k] = String(v).trim();
  });
  cfg.modo = cfg.modo.toLowerCase();
  return cfg;
}

function minutosZona_(z) {
  const m = /^([+-])?(\d{1,2})(?::?(\d{2}))?$/.exec(String(z).trim());
  if (!m) return 0;
  const v = Number(m[2]) * 60 + Number(m[3] || 0);
  return m[1] === '-' ? -v : v;
}

function fechaEnZona_(texto, zona) {
  const m = /(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/.exec(String(texto));
  if (!m) return NaN;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - minutosZona_(zona) * 60000;
}

// Misma lógica que web/js/app.js: si cambias una, cambia la otra.
function calcularVentana_(cfg, ahora) {
  if (cfg.modo === 'diario') {
    const off = minutosZona_(cfg.zona) * 60000;
    const local = new Date(ahora + off);
    const partes = String(cfg.horaDiaria).split(':').map(Number);
    let fin = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), partes[0], partes[1] || 0) - off;
    if (fin <= ahora) fin += DIA;
    return { inicio: fin - DIA, fin: fin };
  }
  const inicio = fechaEnZona_(cfg.inicio, cfg.zona);
  return { inicio: inicio, fin: inicio + Number(cfg.duracionHoras || 24) * 3600000 };
}

function hojaRegistros_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = ss.getSheetByName(HOJA_REGISTROS);
  if (!hoja) {
    hoja = ss.insertSheet(HOJA_REGISTROS);
    hoja.appendRow(['Fecha', 'Email', 'Nombre', 'WhatsApp', 'Recordatorio']);
    hoja.getRange(1, 1, 1, 5).setFontWeight('bold');
  }
  return hoja;
}

// Evita que un texto empiece por "=" y Sheets lo trate como fórmula.
function limpiar_(s) {
  s = String(s || '').trim().slice(0, 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

/**
 * BACKEND GRATUITO DE LA MASTERCLASS (Google Apps Script)
 * --------------------------------------------------------
 * Pega este código en: Google Sheets → Extensiones → Apps Script.
 *
 * Hace 2 cosas:
 *  1. doPost(): recibe cada registro de la web y lo guarda en la hoja.
 *  2. enviarRecordatorios(): manda el correo 30 min antes. Se programa
 *     una sola vez ejecutando programarRecordatorio().
 */

// ===================== CONFIGURACIÓN =====================
const HORA_MASTERCLASS = '2026-11-21T20:00:00-05:00'; // cuando termina el contador
const MINUTOS_ANTES = 30;
const LINK_DIRECTO = 'https://TU-LINK-DE-ZOOM-O-YOUTUBE';
const LINK_WHATSAPP = 'https://chat.whatsapp.com/TU-CODIGO-DE-INVITACION';
const NOMBRE_REMITENTE = 'Tu Marca';
const HOJA = 'Registros';
// =========================================================

/** 1. Guarda cada registro que llega desde la página web. */
function doPost(e) {
  const p = e.parameter;
  const email = String(p.email || '').trim().toLowerCase();
  if (!email) return ContentService.createTextOutput('sin email');

  // El "candado" evita que dos registros simultáneos se pisen
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const hoja = obtenerHoja_();
    // Evita duplicados si alguien se registra dos veces
    const emails = hoja.getRange(2, 2, Math.max(hoja.getLastRow() - 1, 1)).getValues().flat();
    if (!emails.includes(email)) {
      hoja.appendRow([new Date(), email, p.nombre || '', p.telefono || '', 'pendiente']);
    }
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput('ok');
}

/** 2. Ejecuta ESTA función una vez (botón ▶) para dejar programado el recordatorio. */
function programarRecordatorio() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'enviarRecordatorios')
    .forEach(t => ScriptApp.deleteTrigger(t));

  const cuando = new Date(new Date(HORA_MASTERCLASS).getTime() - MINUTOS_ANTES * 60 * 1000);
  ScriptApp.newTrigger('enviarRecordatorios').timeBased().at(cuando).create();
  Logger.log('Recordatorio programado para: ' + cuando);
}

/** Envía el correo a todos los registrados que aún no lo recibieron. */
function enviarRecordatorios() {
  const hoja = obtenerHoja_();
  const filas = hoja.getDataRange().getValues();

  for (let i = 1; i < filas.length; i++) {
    const [, email, nombre, , estado] = filas[i];
    if (!email || estado === 'enviado') continue;

    try {
      MailApp.sendEmail({
        to: email,
        name: NOMBRE_REMITENTE,
        subject: '⏰ En 30 minutos empezamos la masterclass',
        htmlBody:
          '<p>Hola ' + (nombre || '') + ',</p>' +
          '<p>En <b>30 minutos</b> empieza la masterclass en vivo.</p>' +
          '<p><a href="' + LINK_DIRECTO + '">👉 Entrar a la transmisión</a></p>' +
          '<p>¿Aún no estás en el grupo? <a href="' + LINK_WHATSAPP + '">Únete aquí</a>.</p>' +
          '<p>Nos vemos dentro.</p>'
      });
      hoja.getRange(i + 1, 5).setValue('enviado');
    } catch (err) {
      hoja.getRange(i + 1, 5).setValue('error: ' + err.message);
    }
  }
}

/** Correos que todavía puedes enviar hoy (útil para revisar el límite). */
function verCuotaRestante() {
  Logger.log('Correos disponibles hoy: ' + MailApp.getRemainingDailyQuota());
}

function obtenerHoja_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = ss.getSheetByName(HOJA);
  if (!hoja) {
    hoja = ss.insertSheet(HOJA);
    hoja.appendRow(['Fecha', 'Email', 'Nombre', 'WhatsApp', 'Recordatorio']);
  }
  return hoja;
}

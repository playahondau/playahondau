/**
 * PLAYA HONDA — Push Notifications via OneSignal
 *
 * INSTRUCCIONES:
 * 1. Abrí el Google Apps Script de tu planilla (Extensiones → Apps Script)
 * 2. Pegá este código en un archivo nuevo
 * 3. Reemplazá ONESIGNAL_APP_ID y ONESIGNAL_REST_KEY con tus claves
 *    (onesignal.com → tu app → Settings → Keys & IDs)
 * 4. Instalá el trigger:
 *    - Menú izquierdo → Triggers (reloj) → Add Trigger
 *    - Función: onResultadoEdit
 *    - Tipo de evento: From spreadsheet → On edit
 *    - Guardá y autorizá
 */

var ONESIGNAL_APP_ID  = 'TU_APP_ID_AQUI';      // ← reemplazá
var ONESIGNAL_REST_KEY = 'TU_REST_KEY_AQUI';    // ← reemplazá (REST API Key, no la App Key)

/**
 * Se dispara automáticamente cada vez que alguien edita la planilla.
 * Detecta cuando se carga un nuevo resultado y envía la push.
 */
function onResultadoEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var val   = String(e.value || '').trim().toLowerCase();

  // Solo actuar si el valor editado es un resultado válido
  if (val !== 'victoria' && val !== 'empate' && val !== 'derrota') return;

  // Leer los headers de la primera fila para ubicar columnas por nombre
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function(h){ return String(h).trim().toLowerCase(); });

  var colOf = function(name) { return headers.indexOf(name); };

  // Leer toda la fila editada
  var row     = range.getRow();
  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  var local      = rowData[colOf('local')]       || 'Playa Honda';
  var visitante  = rowData[colOf('visitante')]   || 'Rival';
  var golesL     = rowData[colOf('goles_local')] != null ? rowData[colOf('goles_local')] : '-';
  var golesV     = rowData[colOf('goles_visitante')] != null ? rowData[colOf('goles_visitante')] : '-';
  var categoria  = rowData[colOf('categoria')]   || '';
  var resultado  = val;

  // Armar el mensaje según el resultado
  var emoji, titulo, cuerpo;
  if (resultado === 'victoria') {
    emoji  = '🏆';
    titulo = emoji + ' GANAMOS ' + golesL + '-' + golesV;
    cuerpo = local + ' ' + golesL + ' - ' + golesV + ' ' + visitante
           + (categoria ? '  ·  ' + categoria : '');
  } else if (resultado === 'empate') {
    emoji  = '🤝';
    titulo = emoji + ' Empatamos ' + golesL + '-' + golesV;
    cuerpo = local + ' ' + golesL + ' - ' + golesV + ' ' + visitante
           + (categoria ? '  ·  ' + categoria : '');
  } else {
    emoji  = '😔';
    titulo = emoji + ' Perdimos ' + golesL + '-' + golesV;
    cuerpo = local + ' ' + golesL + ' - ' + golesV + ' ' + visitante
           + (categoria ? '  ·  ' + categoria : '');
  }

  enviarPush(titulo, cuerpo);
}

/**
 * Llama a la API REST de OneSignal y manda la notificación
 * a todos los suscriptores.
 */
function enviarPush(titulo, cuerpo) {
  var url = 'https://onesignal.com/api/v1/notifications';

  var payload = JSON.stringify({
    app_id:            ONESIGNAL_APP_ID,
    included_segments: ['Total Subscriptions'],
    headings:  { es: titulo, en: titulo },
    contents:  { es: cuerpo, en: cuerpo },
    url: 'https://playahondau.github.io/playahondau/#resultados'
  });

  var opciones = {
    method:      'post',
    contentType: 'application/json',
    headers:     { 'Authorization': 'Basic ' + ONESIGNAL_REST_KEY },
    payload:     payload,
    muteHttpExceptions: true
  };

  try {
    var resp = UrlFetchApp.fetch(url, opciones);
    Logger.log('OneSignal response: ' + resp.getContentText());
  } catch(err) {
    Logger.log('Error enviando push: ' + err.toString());
  }
}

/**
 * TEST: corré esta función manualmente para verificar que todo funciona
 * antes de que entre el primer resultado real.
 */
function testPush() {
  enviarPush(
    '🧪 Test — Playa Honda',
    'Si ves esto, las notificaciones funcionan correctamente ✓'
  );
}

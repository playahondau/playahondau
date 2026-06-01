var ONESIGNAL_APP_ID = "6e3ee90d-b438-b3f3-4bce-fb88edb1c305";
var ONESIGNAL_REST_KEY = "os_v2_app_nzhosdnubhf45m7t7oeo3modavrk52lknatua2edfxhcdnncwh4muburgbxrqkixto36uafxsmcghacqkjrhmul4drjg7w4sqr7uhq";

function onResultadoEdit(e) {
  var sheet = e.source.getActiveSheet();
  var range = e.range;
  var val = String(e.value || "").trim().toLowerCase();
  if (val !== "victoria" && val !== "empate" && val !== "derrota") return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim().toLowerCase(); });
  var colOf = function(name) { return headers.indexOf(name); };
  var row = range.getRow();
  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var local = rowData[colOf("local")] || "Playa Honda";
  var visitante = rowData[colOf("visitante")] || "Rival";
  var golesL = rowData[colOf("goles_local")] || "-";
  var golesV = rowData[colOf("goles_visitante")] || "-";
  var categoria = rowData[colOf("categoria")] || "";
  var titulo;
  if (val === "victoria") {
    titulo = "GANAMOS " + golesL + "-" + golesV;
  } else if (val === "empate") {
    titulo = "Empatamos " + golesL + "-" + golesV;
  } else {
    titulo = "Perdimos " + golesL + "-" + golesV;
  }
  var cuerpo = local + " " + golesL + " - " + golesV + " " + visitante;
  if (categoria) { cuerpo = cuerpo + " - " + categoria; }
  enviarPush(titulo, cuerpo);
}

function enviarPush(titulo, cuerpo) {
  var payload = JSON.stringify({
    app_id: ONESIGNAL_APP_ID,
    included_segments: ["Total Subscriptions"],
    headings: { es: titulo, en: titulo },
    contents: { es: cuerpo, en: cuerpo },
    url: "https://playahondau.github.io/playahondau/#resultados"
  });
  var opciones = {
    method: "post",
    contentType: "application/json",
    headers: { "Authorization": "Basic " + ONESIGNAL_REST_KEY },
    payload: payload,
    muteHttpExceptions: true
  };
  try {
    var resp = UrlFetchApp.fetch("https://onesignal.com/api/v1/notifications", opciones);
    Logger.log("Respuesta: " + resp.getContentText());
  } catch(err) {
    Logger.log("Error: " + err.toString());
  }
}

function testPush() {
  enviarPush("Test Playa Honda", "Si ves esto las notificaciones funcionan");
}

// Proxy para stats de jugadores — evita el problema HTTP/2 de Render.com
function doGet(e) {
  var url = "https://lud-backend-ld7d.onrender.com/api/teams/120/season-players/";
  try {
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var output = ContentService.createTextOutput(resp.getContentText())
      .setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

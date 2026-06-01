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
  var segmento = "Total Subscriptions";
  var payload = JSON.stringify({
    app_id: ONESIGNAL_APP_ID,
    included_segments: [segmento],
    headings: { es: titulo, en: titulo },
    contents: { es: cuerpo, en: cuerpo },
    url: "https://playahondau.github.io/playahondau/#resultados"
  });
  var opciones = {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Basic " + ONESIGNAL_REST_KEY },
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

function doGet(e) {
  var view = e && e.parameter && e.parameter.view;

  if (view === 'master') {
    return getMasterStandings();
  }

  // Default: proxy LUD API
  var url = "https://lud-backend-ld7d.onrender.com/api/teams/120/season-players/";
  try {
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    return ContentService.createTextOutput(resp.getContentText()).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getMasterStandings() {
  try {
    var url = 'https://ffm.com.uy/index.php?view=posiciones&cat=2';
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var html = resp.getContentText();

    // Localizar sección SERIE B
    var serieBIdx = html.indexOf('SERIE B</h3>');
    if (serieBIdx === -1) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Serie B no encontrada' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Extraer la tabla que sigue a SERIE B
    var tableStart = html.indexOf('<table', serieBIdx);
    var tableEnd   = html.indexOf('</table>', tableStart) + 8;
    var tableHtml  = html.substring(tableStart, tableEnd);

    // Extraer tbody
    var tbodyStart = tableHtml.indexOf('<tbody>');
    var tbodyEnd   = tableHtml.indexOf('</tbody>');
    var tbodyHtml  = tableHtml.substring(tbodyStart, tbodyEnd);

    // Parsear filas
    var rows = [];
    var rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
    var rowMatch;
    var pos = 1;

    while ((rowMatch = rowRegex.exec(tbodyHtml)) !== null) {
      var rowHtml = rowMatch[1];
      var tds = [];
      var tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
      var tdMatch;
      while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
        tds.push(tdMatch[1]);
      }
      if (tds.length < 10) continue;

      // Nombre del equipo: remover el div logo y las etiquetas HTML
      var teamName = tds[1]
        .replace(/<div[\s\S]*?<\/div>/g, '')
        .replace(/<[^>]+>/g, '')
        .trim();

      var dif = tds[8].replace(/<[^>]+>/g, '').trim();

      rows.push({
        pos:            pos++,
        team:           teamName,
        played:         parseInt(tds[2]) || 0,
        won:            parseInt(tds[3]) || 0,
        drawn:          parseInt(tds[4]) || 0,
        lost:           parseInt(tds[5]) || 0,
        goals_for:      parseInt(tds[6]) || 0,
        goals_against:  parseInt(tds[7]) || 0,
        goal_difference: dif,
        points:         parseInt(tds[9].replace(/<[^>]+>/g, '')) || 0
      });
    }

    return ContentService.createTextOutput(JSON.stringify(rows))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

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
  if (view === 'master') return getMasterStandings();

  var LUD_BASE  = 'https://lud-backend-ld7d.onrender.com/api';
  var TEAM_NAME = 'PLAYA HONDA UNIVERSITARIO';
  var PHASES    = [
    {id:1,cat:'Mayor'},{id:8,cat:'Reserva'},{id:13,cat:'Pre Senior'},
    {id:23,cat:'Sub 20'},{id:30,cat:'Sub 18'}
  ];
  var DIAS  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  var MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  function fmtFecha(iso) {
    var d = new Date(iso);
    return DIAS[d.getDay()]+' '+d.getDate()+' '+MESES[d.getMonth()]+'.';
  }
  try {
    var resultados = [];
    var partidos   = {};
    for (var i = 0; i < PHASES.length; i++) {
      var p   = PHASES[i];
      var raw = UrlFetchApp.fetch(LUD_BASE+'/phases/'+p.id+'/matches/?limit=500',{muteHttpExceptions:true});
      var arr = JSON.parse(raw.getContentText());
      var ms  = Array.isArray(arr) ? arr : (arr.results||[]);
      var jugados = [], proximos = [];
      for (var j = 0; j < ms.length; j++) {
        var m = ms[j];
        if (m.home_team.name!==TEAM_NAME && m.away_team.name!==TEAM_NAME) continue;
        var esLocal = m.home_team.name===TEAM_NAME;
        var fechaStr = fmtFecha(m.date);
        if (m.status==='finished') {
          var nos = esLocal ? m.home_score : m.away_score;
          var riv = esLocal ? m.away_score : m.home_score;
          var res = nos>riv?'victoria':nos===riv?'empate':'derrota';
          var opp = esLocal ? m.away_team.name : m.home_team.name;
          resultados.push({categoria:p.cat,resultado:res,local:'Playa Honda U.',visitante:opp,goles_local:nos,goles_visitante:riv,fecha:fechaStr,_ts:m.date});
          jugados.push({local:m.home_team.name,visitante:m.away_team.name,goles_local:m.home_score,goles_visitante:m.away_score,resultado:res,fecha_str:fechaStr,_ts:m.date});
        } else {
          proximos.push({local:m.home_team.name,visitante:m.away_team.name,fecha_str:fechaStr,_ts:m.date});
        }
      }
      jugados.sort(function(a,b){return a._ts<b._ts?-1:1;});
      proximos.sort(function(a,b){return a._ts<b._ts?-1:1;});
      partidos[p.cat] = {jugados:jugados, proximos:proximos};
    }
    resultados.sort(function(a,b){return b._ts>a._ts?1:-1;});
    var wf   = JSON.parse(UrlFetchApp.fetch(LUD_BASE+'/weekend-fixture/',{muteHttpExceptions:true}).getContentText());
    var CMAP = {'Mayores':'Mayor','Reserva':'Reserva','Pre Senior':'Pre Senior','Sub 20':'Sub 20','Sub 18':'Sub 18'};
    var fixture = [];
    var cats = wf.categories||{};
    for (var cat in cats) {
      var cms = cats[cat];
      for (var k=0;k<cms.length;k++) {
        var cm = cms[k];
        if (cm.local!==TEAM_NAME && cm.visitante!==TEAM_NAME) continue;
        fixture.push({categoria:CMAP[cat]||cat,local:cm.local,visitante:cm.visitante,dia_hora:cm.dia+' · '+cm.hora+'h',lugar:cm.cancha,_ts:cm.datetime_iso});
      }
    }
    fixture.sort(function(a,b){return a._ts>b._ts?1:-1;});
    var out = ContentService.createTextOutput(JSON.stringify({resultados:resultados,fixture:fixture,partidos:partidos}));
    out.setMimeType(ContentService.MimeType.JSON);
    return out;
  } catch(err) {
    var out = ContentService.createTextOutput(JSON.stringify({resultados:[],fixture:[],partidos:{},error:err.toString()}));
    out.setMimeType(ContentService.MimeType.JSON);
    return out;
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

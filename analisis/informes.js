/*
  LISTA DE INFORMES DE SCOUTING — Playa Honda Universitario
  ===========================================================
  Para agregar un informe nuevo:
    1. Subí el PDF a esta misma carpeta (analisis/).
    2. Agregá un objeto nuevo al array INFORMES de abajo, con:
         fecha      -> "AAAA-MM-DD" (fecha del informe, para ordenar)
         rival      -> nombre del rival
         categoria  -> una de: "Mayores", "Reserva", "Pre Senior", "Sub 20", "Sub 18", "Master"
                       (usar el nombre EXACTO para que el filtro de la página funcione)
         archivo    -> nombre EXACTO del archivo PDF subido a esta carpeta
    3. Guardá y hacé commit + push. Listo, no hay que tocar nada más.

  El más reciente va a aparecer primero solo (se ordena por fecha).
*/

const INFORMES = [
  { fecha: "2026-09-04", rival: "Tenis El Pinar", categoria: "Sub 20", archivo: "2026-09-04-sub20-vs-tenis-el-pinar.pdf" },
];

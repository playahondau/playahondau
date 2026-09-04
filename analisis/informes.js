/*
  LISTA DE INFORMES DE SCOUTING — Playa Honda Universitario
  ===========================================================
  Para agregar un informe nuevo:
    1. Subí el PDF a esta misma carpeta (analisis/).
    2. Agregá un objeto nuevo al array INFORMES de abajo, con:
         fecha      -> "AAAA-MM-DD" (fecha del informe, para ordenar)
         rival      -> nombre del rival
         categoria  -> ej. "Mayores", "Sub 20", "Sub 18"...
         archivo    -> nombre EXACTO del archivo PDF subido a esta carpeta
    3. Guardá y hacé commit + push. Listo, no hay que tocar nada más.

  El más reciente va a aparecer primero solo (se ordena por fecha).
*/

const INFORMES = [
  // Ejemplo (borrá esta línea de comentario y completá con tus datos reales):
  // { fecha: "2026-09-03", rival: "Old Christians Club", categoria: "Mayores", archivo: "2026-09-03-mayores-vs-old-christians.pdf" },
];

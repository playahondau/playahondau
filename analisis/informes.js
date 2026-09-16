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
  { fecha: "2026-09-20", rival: "Carrasco Polo Club", categoria: "Mayores",    archivo: "analisis-carrasco-polo-mayores-2026-09-20.pdf" },
  { fecha: "2026-09-19", rival: "Old Christians Club",categoria: "Reserva",    archivo: "analisis-old-christians-reserva-2026-09-19.pdf" },
  { fecha: "2026-09-19", rival: "Nacional Universitario", categoria: "Pre Senior", archivo: "analisis-nacional-universitario-presenior-2026-09-19.pdf" },
  { fecha: "2026-09-19", rival: "ELF",               categoria: "Sub 20",     archivo: "analisis-elf-sub20-2026-09-19.pdf" },
  { fecha: "2026-09-13", rival: "ELF",               categoria: "Mayores",    archivo: "analisis-elf-mayores-2026-09-13.pdf" },
  { fecha: "2026-09-13", rival: "Ceibos Club",        categoria: "Sub 18",     archivo: "analisis-ceibos-sub18-2026-09-13.pdf" },
  { fecha: "2026-09-12", rival: "Old Woodlands Club", categoria: "Reserva",    archivo: "analisis-old-woodlands-reserva-2026-09-12.pdf" },
  { fecha: "2026-09-12", rival: "Old Woodlands Club", categoria: "Sub 20",     archivo: "analisis-old-woodlands-sub20-2026-09-12.pdf" },
  { fecha: "2026-09-12", rival: "Old Ivy",            categoria: "Pre Senior", archivo: "analisis-old-ivy-presenior-2026-09-12.pdf" },
  { fecha: "2026-09-04", rival: "Tenis El Pinar",     categoria: "Sub 20",     archivo: "analisis-tenis-el-pinar-sub20-2026-09-04.pdf" },
];

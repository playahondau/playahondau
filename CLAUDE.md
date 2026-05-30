# Playa Honda Universitario — Sitio Web

## Repositorio
- **Local:** `C:\Users\franc\playahondau`
- **GitHub:** https://github.com/playahondau/playahondau
- **Sitio en vivo:** https://playahondau.github.io/playahondau/

## Club
Playa Honda Universitario · Liga Universitaria del Uruguay · Fundado en 1964

## Stack técnico
- HTML + CSS + JavaScript puro (sin framework, sin build system, sin package.json)
- Hosting: GitHub Pages (deploy automático al hacer push a main)
- Base de datos: Google Sheets (publicado como CSV)
- Notificaciones push: OneSignal
- Formulario de suscripción: pendiente migración a Web3Forms

## Archivos principales

| Archivo | Descripción |
|---|---|
| `index.html` | Página principal (~580KB, contiene todo el CSS y JS inline) |
| `newsletter.html` | "Finde del Playa" — diario estilo periódico con resultados del Sheet |
| `cabezudos.html` | Juego interactivo con sprites de los jugadores |
| `notif_apps_script.gs` | Google Apps Script para disparar push de OneSignal al cargar resultados |
| `manifest.json` | PWA manifest |
| `OneSignalSDKWorker.js` | Service worker de OneSignal |

## Secciones del index.html

| ID | Título |
|---|---|
| `#hero` | Hero |
| `#resultados` | Últimos Resultados |
| `#proximos` | Fixture / Próxima fecha |
| `#partidos` | Partidos por Categoría |
| `#posiciones` | Tabla de Posiciones |
| `#planteles` | Planteles |
| `#goleadores` | Goleadores |
| `#historial` | Historial |
| `#estadisticas` | Estadísticas |
| `#divisiones` | Divisiones |

## Fuentes de datos

- **Resultados (CSV):** Google Sheet publicado en CSV — columnas: `categoria, rival, score, estado, localia, dia, fecha, goleadores, ..., cronica (col L)`
- **Fixture:** Google Apps Script endpoint
- **OneSignal App ID:** `6e3ee90d-b438-b3f3-4bce-fb88edb1c305`

## Branding y estilos

- **Colores:** Azul `#1a3a8f`, Dorado (CSS var `--dorado`), Fondo oscuro `#0b0f1a`
- **Tipografías:** Bebas Neue (títulos), Barlow Condensed (etiquetas/nav), Barlow (cuerpo), Georgia (secciones estilo periódico)
- **Botones:** clip-path poligonal tipo paralelogramo (`btn-primary`)

## Estado actual del formulario de suscripción

El `<form>` en el modal `#newsletter` de `index.html` **no tiene atributo `action`** — está sin conectar a ningún servicio. Estaba en Formspree (plan gratuito, límite 50/mes, ~38 suscripciones registradas). La migración pendiente es a **Web3Forms** (250/mes gratis). Falta el Access Key de Web3Forms.

## Flujo de trabajo habitual

1. Editar archivos localmente en `C:\Users\franc\playahondau`
2. `git add` + `git commit` + `git push`
3. GitHub Pages despliega automáticamente en ~30 segundos
4. Los resultados se cargan desde Google Sheets — no hace falta tocar el código para actualizar datos

## Notas importantes

- `index.html` es muy grande (~580KB) porque tiene todo el CSS, JS y algunas imágenes en base64 inline. Usar `offset` y `limit` para leerlo por partes.
- El sitio NO tiene node_modules, npm ni proceso de build — todo es estático.
- El usuario habla español; toda comunicación debe ser en español.

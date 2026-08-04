// Configuración compartida de "Llegué" — completar antes de desplegar.
// Los valores de Firebase son públicos por diseño (se protegen con las reglas
// de la base de datos, no ocultándolos). Crear el proyecto gratis en
// https://console.firebase.google.com, activar "Realtime Database" y pegar
// acá la configuración que te da Firebase (Configuración del proyecto > Tus apps > Web).
const LLEGUE_CONFIG = {
  firebase: {
    apiKey: "PEGAR_ACA",
    authDomain: "PEGAR_ACA.firebaseapp.com",
    databaseURL: "https://PEGAR_ACA-default-rtdb.firebaseio.com",
    projectId: "PEGAR_ACA",
    appId: "PEGAR_ACA"
  },
  // Nombre del tema de ntfy.sh para el aviso fuera de la app (push al celular).
  // Se puede dejar vacío y completarlo desde la página; queda guardado en el navegador.
  defaultNtfyTopic: ""
};

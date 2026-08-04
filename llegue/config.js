// Configuración compartida de "Llegué" — completar antes de desplegar.
// Los valores de Firebase son públicos por diseño (se protegen con las reglas
// de la base de datos, no ocultándolos). Crear el proyecto gratis en
// https://console.firebase.google.com, activar "Realtime Database" y pegar
// acá la configuración que te da Firebase (Configuración del proyecto > Tus apps > Web).
const LLEGUE_CONFIG = {
  firebase: {
    apiKey: "AIzaSyCdgk2XiDbcZfLmTQsMc-PiN_v68ujGUwc",
    authDomain: "llegue-24353.firebaseapp.com",
    databaseURL: "https://llegue-24353-default-rtdb.firebaseio.com",
    projectId: "llegue-24353",
    appId: "1:626168069225:web:03b0cf65328588cc36f6f8"
  },
  // Nombre del tema de ntfy.sh para el aviso fuera de la app (push al celular).
  // Se puede dejar vacío y completarlo desde la página; queda guardado en el navegador.
  defaultNtfyTopic: ""
};

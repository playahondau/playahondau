(function () {
  'use strict';

  var sb = window.supabase.createClient(CHAT_CONFIG.SUPABASE_URL, CHAT_CONFIG.SUPABASE_ANON_KEY);

  var LS_NOMBRE = 'phu_chat_nombre';
  var LS_CLIENT_ID = 'phu_chat_client_id';
  var LS_MIS_REACCIONES = 'phu_chat_mis_reacciones'; // set de "messageId:emoji" que YO reaccioné
  var PAGE_SIZE = 30;
  var EMOJIS = [
    { key: 'corazon', icon: '❤️' },
    { key: 'pulgar', icon: '👍' },
    { key: 'aplauso', icon: '👏' },
    { key: 'pelota', icon: '⚽' },
    { key: 'trapo', icon: '🧣' }
  ];

  // ---------- estado local ----------
  function getClientId() {
    var id = localStorage.getItem(LS_CLIENT_ID);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : 'c-' + Date.now() + '-' + Math.random().toString(16).slice(2));
      localStorage.setItem(LS_CLIENT_ID, id);
    }
    return id;
  }
  function getNombre() { return localStorage.getItem(LS_NOMBRE) || ''; }
  function setNombre(n) { localStorage.setItem(LS_NOMBRE, n); }

  function getMisReacciones() {
    try { return new Set(JSON.parse(localStorage.getItem(LS_MIS_REACCIONES) || '[]')); }
    catch (e) { return new Set(); }
  }
  function guardarMisReacciones(set) {
    localStorage.setItem(LS_MIS_REACCIONES, JSON.stringify(Array.from(set)));
  }

  var clientId = getClientId();
  var misReacciones = getMisReacciones();
  var oldestLoaded = null; // timestamp del mensaje más viejo ya cargado
  var hayMasViejos = true;
  var cargandoViejos = false;
  var mensajesRenderizados = {}; // id -> elemento DOM

  // ---------- refs DOM ----------
  var $ = function (id) { return document.getElementById(id); };
  var feed = $('feed');
  var feedWrap = $('feed-wrap');
  var estadoVacio = $('estado-vacio');
  var btnCargarMas = $('btn-cargar-mas');
  var modalNombre = $('modal-nombre');
  var inputNombre = $('input-nombre');
  var lblNombre = $('lbl-nombre');
  var lblNombre2 = $('lbl-nombre-2');
  var inputTexto = $('input-texto');
  var btnEnviar = $('btn-enviar');
  var contador = $('contador');
  var btnMic = $('btn-mic');
  var filaTexto = $('fila-texto');
  var filaGrabando = $('fila-grabando');
  var filaPreview = $('fila-preview');
  var recTiempo = $('rec-tiempo');
  var recWave = $('rec-wave');
  var btnStop = $('btn-stop');
  var previewDur = $('preview-dur');
  var previewWave = $('preview-wave');
  var btnPlayPreview = $('btn-play-preview');
  var btnCancelarAudio = $('btn-cancelar-audio');
  var btnConfirmarAudio = $('btn-confirmar-audio');
  var avisoMic = $('aviso-mic');
  var avisoError = $('aviso-error');
  var avisoErrorTxt = $('aviso-error-txt');

  function mostrarError(msg) {
    avisoErrorTxt.textContent = msg;
    avisoError.hidden = false;
    setTimeout(function () { avisoError.hidden = true; }, 4000);
  }

  // ---------- formato de fecha es-UY ----------
  function formatearFecha(iso) {
    var d = new Date(iso);
    var pad = function (n) { return String(n).padStart(2, '0'); };
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function barritas(contenedor, cantidad) {
    contenedor.innerHTML = '';
    for (var i = 0; i < cantidad; i++) {
      var b = document.createElement('span');
      var h = 8 + Math.round(Math.random() * 14);
      b.style.height = h + 'px';
      contenedor.appendChild(b);
    }
  }

  // ---------- modal de nombre ----------
  function abrirModalNombre() {
    inputNombre.value = getNombre();
    modalNombre.hidden = false;
    setTimeout(function () { inputNombre.focus(); }, 50);
  }
  function cerrarModalNombre() { modalNombre.hidden = true; }

  $('btn-confirmar-nombre').addEventListener('click', function () {
    var v = inputNombre.value.trim();
    if (!v) { inputNombre.focus(); return; }
    setNombre(v.slice(0, 40));
    actualizarNombreUI();
    cerrarModalNombre();
  });
  inputNombre.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') $('btn-confirmar-nombre').click();
  });
  $('btn-solo-mirar').addEventListener('click', cerrarModalNombre);
  $('btn-cambiar-nombre').addEventListener('click', abrirModalNombre);

  function actualizarNombreUI() {
    var n = getNombre() || 'Sin nombre';
    lblNombre.textContent = n;
    lblNombre2.textContent = n;
  }

  function requiereNombre(callback) {
    if (getNombre()) { callback(); return; }
    abrirModalNombre();
    var handler = function () {
      if (getNombre()) {
        $('btn-confirmar-nombre').removeEventListener('click', handler);
        callback();
      }
    };
    $('btn-confirmar-nombre').addEventListener('click', handler);
  }

  // ---------- render de mensajes ----------
  function crearElementoMensaje(m) {
    var esPropio = m.client_id === clientId;
    var wrap = document.createElement('div');
    wrap.className = 'msg ' + (esPropio ? 'own' : 'other');
    wrap.dataset.id = m.id;

    var head = document.createElement('div');
    head.className = 'msg-head';
    var nombreEl = document.createElement('span');
    nombreEl.className = 'nombre';
    nombreEl.textContent = m.nombre;
    var horaEl = document.createElement('span');
    horaEl.className = 'hora';
    horaEl.textContent = formatearFecha(m.created_at);
    head.appendChild(nombreEl);
    head.appendChild(horaEl);
    wrap.appendChild(head);

    var bubbleWrap = document.createElement('div');
    bubbleWrap.className = 'msg-bubble-wrap';

    if (m.tipo === 'audio') {
      var ab = document.createElement('div');
      ab.className = 'bubble audio-bubble';
      var playBtn = document.createElement('button');
      playBtn.className = 'audio-play';
      playBtn.type = 'button';
      playBtn.setAttribute('aria-label', 'Reproducir audio');
      playBtn.innerHTML = '<svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M1 1L11 7L1 13V1Z" fill="currentColor"/></svg>';
      var wave = document.createElement('div');
      wave.className = 'audio-wave';
      barritas(wave, 14);
      var dur = document.createElement('span');
      dur.className = 'audio-dur';
      dur.textContent = m.audio_seg ? formatearDuracion(m.audio_seg) : '';
      ab.appendChild(playBtn); ab.appendChild(wave); ab.appendChild(dur);
      bubbleWrap.appendChild(ab);

      var audioEl = new Audio(m.audio_url);
      var reproduciendo = false;
      playBtn.addEventListener('click', function () {
        if (reproduciendo) { audioEl.pause(); return; }
        audioEl.currentTime = 0;
        audioEl.play().catch(function () { mostrarError('No se pudo reproducir el audio.'); });
      });
      audioEl.addEventListener('play', function () {
        reproduciendo = true;
        playBtn.innerHTML = '<svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor"><rect x="1" y="1" width="4" height="12"/><rect x="7" y="1" width="4" height="12"/></svg>';
      });
      var volverAPlay = function () {
        reproduciendo = false;
        playBtn.innerHTML = '<svg width="12" height="14" viewBox="0 0 12 14" fill="none"><path d="M1 1L11 7L1 13V1Z" fill="currentColor"/></svg>';
      };
      audioEl.addEventListener('pause', volverAPlay);
      audioEl.addEventListener('ended', volverAPlay);
    } else {
      var tb = document.createElement('div');
      tb.className = 'bubble';
      tb.textContent = m.contenido || '';
      bubbleWrap.appendChild(tb);
    }

    if (esPropio) {
      var btnDel = document.createElement('button');
      btnDel.className = 'btn-borrar-msg';
      btnDel.type = 'button';
      btnDel.title = 'Borrar mensaje';
      btnDel.textContent = '⋯';
      btnDel.addEventListener('click', function () { pedirBorrado(m.id, wrap); });
      bubbleWrap.appendChild(btnDel);
      activarLongPress(wrap, m.id);
    }

    wrap.appendChild(bubbleWrap);

    var reacRow = document.createElement('div');
    reacRow.className = 'reacciones';
    EMOJIS.forEach(function (e) {
      var pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'reaccion';
      pill.dataset.emoji = e.key;
      var activa = misReacciones.has(m.id + ':' + e.key);
      if (activa) pill.classList.add('activa');
      var span = document.createElement('span');
      span.textContent = e.icon;
      pill.appendChild(span);
      var cantSpan = document.createElement('span');
      cantSpan.className = 'cant';
      var cantidad = (m.reaction_counts && m.reaction_counts[e.key]) || 0;
      cantSpan.textContent = cantidad > 0 ? cantidad : '';
      pill.appendChild(cantSpan);
      pill.addEventListener('click', function () { reaccionar(m.id, e.key, pill, cantSpan); });
      reacRow.appendChild(pill);
    });
    wrap.appendChild(reacRow);

    return wrap;
  }

  function formatearDuracion(seg) {
    var m = Math.floor(seg / 60), s = seg % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function estaAbajoDelTodo() {
    return feedWrap.scrollHeight - feedWrap.scrollTop - feedWrap.clientHeight < 80;
  }

  function agregarMensajeAlFinal(m, scrollSiCorresponde) {
    if (mensajesRenderizados[m.id]) return;
    var abajo = estaAbajoDelTodo();
    var el = crearElementoMensaje(m);
    feed.appendChild(el);
    mensajesRenderizados[m.id] = el;
    estadoVacio.hidden = true;
    if (scrollSiCorresponde && abajo) {
      feedWrap.scrollTop = feedWrap.scrollHeight;
    }
  }

  function prepararConReacciones(mensajes) {
    var ids = mensajes.map(function (m) { return m.id; });
    if (!ids.length) return Promise.resolve(mensajes);
    return sb.from('chat_reactions').select('message_id, emoji').in('message_id', ids)
      .then(function (res) {
        var counts = {};
        (res.data || []).forEach(function (r) {
          counts[r.message_id] = counts[r.message_id] || {};
          counts[r.message_id][r.emoji] = (counts[r.message_id][r.emoji] || 0) + 1;
        });
        mensajes.forEach(function (m) { m.reaction_counts = counts[m.id] || {}; });
        return mensajes;
      });
  }

  // ---------- carga inicial y paginación ----------
  function cargarRecientes() {
    return sb.from('chat_messages').select('*').eq('deleted', false)
      .order('created_at', { ascending: false }).limit(PAGE_SIZE)
      .then(function (res) {
        if (res.error) { mostrarError('No se pudo cargar el chat.'); return; }
        var mensajes = (res.data || []).slice().reverse();
        hayMasViejos = mensajes.length === PAGE_SIZE;
        oldestLoaded = mensajes.length ? mensajes[0].created_at : null;
        return prepararConReacciones(mensajes).then(function (msgs) {
          if (!msgs.length) { estadoVacio.hidden = false; }
          msgs.forEach(function (m) { agregarMensajeAlFinal(m, false); });
          feedWrap.scrollTop = feedWrap.scrollHeight;
          btnCargarMas.hidden = !hayMasViejos;
        });
      });
  }

  function cargarMasViejos() {
    if (cargandoViejos || !hayMasViejos || !oldestLoaded) return;
    cargandoViejos = true;
    sb.from('chat_messages').select('*').eq('deleted', false)
      .lt('created_at', oldestLoaded).order('created_at', { ascending: false }).limit(PAGE_SIZE)
      .then(function (res) {
        cargandoViejos = false;
        if (res.error) { mostrarError('No se pudieron cargar mensajes anteriores.'); return; }
        var mensajes = (res.data || []).slice().reverse();
        hayMasViejos = mensajes.length === PAGE_SIZE;
        btnCargarMas.hidden = !hayMasViejos;
        if (!mensajes.length) return;
        oldestLoaded = mensajes[0].created_at;
        var alturaPrevia = feedWrap.scrollHeight;
        prepararConReacciones(mensajes).then(function (msgs) {
          msgs.forEach(function (m) {
            if (mensajesRenderizados[m.id]) return;
            var el = crearElementoMensaje(m);
            feed.insertBefore(el, feed.firstChild);
            mensajesRenderizados[m.id] = el;
          });
          feedWrap.scrollTop = feedWrap.scrollHeight - alturaPrevia + feedWrap.scrollTop;
        });
      });
  }
  btnCargarMas.addEventListener('click', cargarMasViejos);
  feedWrap.addEventListener('scroll', function () {
    if (feedWrap.scrollTop < 60) cargarMasViejos();
  });

  // ---------- enviar texto ----------
  function actualizarEstadoComposer() {
    var len = inputTexto.value.length;
    contador.hidden = len === 0;
    contador.textContent = len + '/500';
    var activo = len > 0 && len <= 500;
    btnEnviar.disabled = !activo;
    btnEnviar.classList.toggle('activo', activo);
    inputTexto.style.height = 'auto';
    inputTexto.style.height = Math.min(inputTexto.scrollHeight, 110) + 'px';
  }
  inputTexto.addEventListener('input', actualizarEstadoComposer);
  inputTexto.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarTexto(); }
  });

  function enviarTexto() {
    var texto = inputTexto.value.trim();
    if (!texto || texto.length > 500) return;
    requiereNombre(function () {
      btnEnviar.disabled = true;
      sb.from('chat_messages').insert({
        client_id: clientId, nombre: getNombre(), tipo: 'texto', contenido: texto
      }).select().single().then(function (res) {
        if (res.error) { mostrarError('No se pudo enviar el mensaje. Probá de nuevo.'); actualizarEstadoComposer(); return; }
        inputTexto.value = '';
        actualizarEstadoComposer();
        res.data.reaction_counts = {};
        agregarMensajeAlFinal(res.data, true);
      });
    });
  }
  btnEnviar.addEventListener('click', enviarTexto);

  // ---------- reacciones ----------
  function reaccionar(messageId, emoji, pillEl, cantSpan) {
    var key = messageId + ':' + emoji;
    var estabaActiva = misReacciones.has(key);
    // optimista
    pillEl.classList.toggle('activa', !estabaActiva);
    var actual = parseInt(cantSpan.textContent || '0', 10) || 0;
    var nuevoValor = estabaActiva ? Math.max(0, actual - 1) : actual + 1;
    cantSpan.textContent = nuevoValor > 0 ? nuevoValor : '';

    sb.rpc('toggle_reaction', { p_message_id: messageId, p_client_id: clientId, p_emoji: emoji })
      .then(function (res) {
        if (res.error) {
          mostrarError('No se pudo reaccionar. Probá de nuevo.');
          pillEl.classList.toggle('activa', estabaActiva);
          cantSpan.textContent = actual > 0 ? actual : '';
          return;
        }
        if (res.data) misReacciones.add(key); else misReacciones.delete(key);
        guardarMisReacciones(misReacciones);
      });
  }

  // ---------- borrado ----------
  function pedirBorrado(messageId, el) {
    if (!confirm('¿Borrar este mensaje?')) return;
    el.classList.add('deleting');
    sb.rpc('soft_delete_message', { p_message_id: messageId, p_client_id: clientId })
      .then(function (res) {
        if (res.error || !res.data) {
          mostrarError('No se pudo borrar el mensaje.');
          el.classList.remove('deleting');
          return;
        }
        el.remove();
        delete mensajesRenderizados[messageId];
      });
  }

  function activarLongPress(el, messageId) {
    var timer = null;
    var start = function () { timer = setTimeout(function () { pedirBorrado(messageId, el); }, 550); };
    var cancel = function () { if (timer) { clearTimeout(timer); timer = null; } };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchend', cancel);
    el.addEventListener('touchmove', cancel);
    el.addEventListener('touchcancel', cancel);
  }

  // ---------- grabación de audio ----------
  var mediaRecorder = null, chunks = [], recStart = 0, recInterval = null, recBlob = null, recSeg = 0;
  var MAX_SEG = 30;

  function mostrarFila(fila) {
    filaTexto.hidden = fila !== 'texto';
    filaGrabando.hidden = fila !== 'grabando';
    filaPreview.hidden = fila !== 'preview';
    contador.hidden = fila !== 'texto' || inputTexto.value.length === 0;
  }

  btnMic.addEventListener('click', function () {
    requiereNombre(function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        avisoMic.hidden = false;
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        avisoMic.hidden = true;
        iniciarGrabacion(stream);
      }).catch(function () {
        avisoMic.hidden = false;
      });
    });
  });

  function iniciarGrabacion(stream) {
    chunks = [];
    var mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
      (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');
    mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType: mimeType }) : new MediaRecorder(stream);
    mediaRecorder.ondataavailable = function (e) { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = function () {
      stream.getTracks().forEach(function (t) { t.stop(); });
      recBlob = new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      mostrarPreviewAudio();
    };
    mediaRecorder.start();
    recStart = Date.now();
    recSeg = 0;
    barritas(recWave, 20);
    mostrarFila('grabando');
    recInterval = setInterval(function () {
      recSeg = Math.floor((Date.now() - recStart) / 1000);
      recTiempo.textContent = 'Grabando · 0:' + String(recSeg).padStart(2, '0');
      if (recSeg >= MAX_SEG) detenerGrabacion();
    }, 250);
  }

  function detenerGrabacion() {
    clearInterval(recInterval);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  }
  btnStop.addEventListener('click', detenerGrabacion);

  var audioPreviewEl = null;
  function mostrarPreviewAudio() {
    var url = URL.createObjectURL(recBlob);
    audioPreviewEl = new Audio(url);
    previewDur.textContent = formatearDuracion(recSeg);
    barritas(previewWave, 14);
    mostrarFila('preview');
  }
  btnPlayPreview.addEventListener('click', function () {
    if (!audioPreviewEl) return;
    audioPreviewEl.currentTime = 0;
    audioPreviewEl.play().catch(function () {});
  });
  btnCancelarAudio.addEventListener('click', function () {
    recBlob = null;
    mostrarFila('texto');
  });

  btnConfirmarAudio.addEventListener('click', function () {
    if (!recBlob) return;
    btnConfirmarAudio.disabled = true;
    var ext = (recBlob.type.indexOf('mp4') > -1) ? 'm4a' : 'webm';
    var path = clientId + '/' + Date.now() + '.' + ext;
    sb.storage.from('chat-audio').upload(path, recBlob, { contentType: recBlob.type }).then(function (res) {
      btnConfirmarAudio.disabled = false;
      if (res.error) { mostrarError('No se pudo subir el audio. Probá de nuevo.'); return; }
      var pub = sb.storage.from('chat-audio').getPublicUrl(path);
      var audioUrl = pub.data.publicUrl;
      requiereNombre(function () {
        sb.from('chat_messages').insert({
          client_id: clientId, nombre: getNombre(), tipo: 'audio', audio_url: audioUrl, audio_seg: recSeg
        }).select().single().then(function (r2) {
          if (r2.error) { mostrarError('No se pudo enviar el audio.'); return; }
          recBlob = null;
          mostrarFila('texto');
          r2.data.reaction_counts = {};
          agregarMensajeAlFinal(r2.data, true);
        });
      });
    });
  });

  // ---------- realtime ----------
  function suscribirRealtime() {
    sb.channel('chat-room')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, function (payload) {
        if (mensajesRenderizados[payload.new.id]) return;
        payload.new.reaction_counts = {};
        agregarMensajeAlFinal(payload.new, true);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' }, function (payload) {
        if (payload.new.deleted && mensajesRenderizados[payload.new.id]) {
          mensajesRenderizados[payload.new.id].remove();
          delete mensajesRenderizados[payload.new.id];
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_reactions' }, function (payload) {
        var messageId = (payload.new && payload.new.message_id) || (payload.old && payload.old.message_id);
        var el = mensajesRenderizados[messageId];
        if (!el) return;
        sb.from('chat_reactions').select('emoji').eq('message_id', messageId).then(function (res) {
          var counts = {};
          (res.data || []).forEach(function (r) { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
          el.querySelectorAll('.reaccion').forEach(function (pill) {
            var emoji = pill.dataset.emoji;
            var cantSpan = pill.querySelector('.cant');
            var n = counts[emoji] || 0;
            cantSpan.textContent = n > 0 ? n : '';
          });
        });
      })
      .subscribe();
  }

  // ---------- init ----------
  actualizarNombreUI();
  if (!getNombre()) abrirModalNombre();
  cargarRecientes().then(suscribirRealtime);
})();

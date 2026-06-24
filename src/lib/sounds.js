// Sonidos sintéticos generados con Web Audio API (sin archivos externos),
// más vibración táctil, para el feedback del swipe.

let ctx;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tono({ freq, duracion, tipo = 'sine', volInicial = 0.25, freqFinal }) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (freqFinal) osc.frequency.exponentialRampToValueAtTime(freqFinal, c.currentTime + duracion);
    gain.gain.setValueAtTime(volInicial, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duracion);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duracion);
  } catch {
    // Web Audio no disponible (ej. navegador antiguo): se ignora en silencio
  }
}

// Golpe seco de raqueta: clic agudo + cuerpo corto grave
export function sonidoDesafio() {
  tono({ freq: 900, freqFinal: 200, duracion: 0.12, tipo: 'triangle', volInicial: 0.3 });
  setTimeout(() => tono({ freq: 180, duracion: 0.08, tipo: 'sine', volInicial: 0.15 }), 30);
  if (navigator.vibrate) navigator.vibrate(50);
}

// Pelota que falla / rebote apagado: tono descendente y suave
export function sonidoPasar() {
  tono({ freq: 300, freqFinal: 120, duracion: 0.18, tipo: 'sine', volInicial: 0.12 });
  if (navigator.vibrate) navigator.vibrate(20);
}

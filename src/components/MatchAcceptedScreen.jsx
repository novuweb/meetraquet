import { useEffect, useRef } from 'react';

function Confetti() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      size: Math.random() * 8 + 4,
      speed: Math.random() * 3 + 2,
      color: ['#22C55E', '#16A34A', '#ffffff', '#86efac', '#4ade80'][Math.floor(Math.random() * 5)],
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 6,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
        ctx.restore();
        p.y += p.speed;
        p.rot += p.rotSpeed;
        if (p.y > canvas.height) p.y = -20;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  );
}

export default function MatchAcceptedScreen({ myName, myColor, rivalName, rivalColor, onGoToChat }) {
  const myInit = (myName || 'Tú').slice(0, 2).toUpperCase();
  const rivInit = (rivalName || 'R').slice(0, 2).toUpperCase();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: '#0A0A0A',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '20px',
    }}>
      <Confetti />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', zIndex: 1 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: myColor || '#22C55E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: '#fff',
          border: '3px solid #22C55E',
          boxShadow: '0 0 24px rgba(34,197,94,0.4)',
          animation: 'slideInLeft 0.5s cubic-bezier(0.4,0,0.2,1) forwards',
        }}>
          {myInit}
        </div>
        <div style={{ margin: '0 -4px', fontSize: '28px', zIndex: 2, filter: 'drop-shadow(0 0 8px rgba(255,200,0,0.8))' }}>
          ⚡
        </div>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: rivalColor || '#7c3aed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: '#fff',
          border: '3px solid #7c3aed',
          boxShadow: '0 0 24px rgba(124,58,237,0.4)',
          animation: 'slideInRight 0.5s cubic-bezier(0.4,0,0.2,1) forwards',
        }}>
          {rivInit}
        </div>
      </div>

      <h1 style={{
        fontFamily: 'Poppins, sans-serif', fontSize: '30px', fontWeight: 800,
        color: '#22C55E', textAlign: 'center', zIndex: 1,
        animation: 'fadeInUp 0.6s 0.3s cubic-bezier(0.4,0,0.2,1) both',
        textShadow: '0 0 40px rgba(34,197,94,0.5)',
        letterSpacing: '-0.02em',
      }}>
        ¡Desafío Aceptado!
      </h1>

      <p style={{
        color: '#9A9A9A', fontSize: '15px', zIndex: 1,
        animation: 'fadeInUp 0.6s 0.5s cubic-bezier(0.4,0,0.2,1) both',
      }}>
        Ya podéis coordinar el partido
      </p>

      <button
        className="btn-primary"
        style={{ zIndex: 1, animation: 'fadeInUp 0.6s 0.7s cubic-bezier(0.4,0,0.2,1) both', padding: '14px 32px' }}
        onClick={onGoToChat}
      >
        Ir al chat
      </button>

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-80px); opacity: 0; }
          to   { transform: none; opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(80px); opacity: 0; }
          to   { transform: none; opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}

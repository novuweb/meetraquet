import { useEffect, useRef, useState } from 'react';

const RacketSVG = ({ spin }) => (
  <svg
    width="48" height="48" viewBox="0 0 48 48" fill="none"
    style={{
      animation: spin ? 'racket-spin 0.7s linear infinite' : 'none',
      filter: 'drop-shadow(0 0 8px rgba(34,197,94,0.5))',
    }}
  >
    <ellipse cx="24" cy="18" rx="13" ry="15" stroke="#22C55E" strokeWidth="3" fill="none"/>
    <line x1="12" y1="14" x2="36" y2="14" stroke="#22C55E" strokeWidth="1.5" opacity="0.6"/>
    <line x1="11" y1="18" x2="37" y2="18" stroke="#22C55E" strokeWidth="1.5" opacity="0.6"/>
    <line x1="12" y1="22" x2="36" y2="22" stroke="#22C55E" strokeWidth="1.5" opacity="0.6"/>
    <line x1="18" y1="4" x2="18" y2="32" stroke="#22C55E" strokeWidth="1.5" opacity="0.6"/>
    <line x1="24" y1="3" x2="24" y2="33" stroke="#22C55E" strokeWidth="1.5" opacity="0.6"/>
    <line x1="30" y1="4" x2="30" y2="32" stroke="#22C55E" strokeWidth="1.5" opacity="0.6"/>
    <rect x="21" y="32" width="6" height="12" rx="3" fill="#22C55E"/>
  </svg>
);

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children, style }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (el.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = false;
      }
    };

    const onTouchMove = (e) => {
      if (!startY.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && el.scrollTop === 0) {
        pulling.current = true;
        setPullY(Math.min(dy * 0.5, THRESHOLD + 20));
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) { startY.current = 0; return; }
      const currentPull = Math.min((startY.current ? 1 : 0) * THRESHOLD, THRESHOLD + 20);
      pulling.current = false;

      // read pullY from state via a ref-like approach
      setPullY((py) => {
        if (py >= THRESHOLD) {
          setRefreshing(true);
          Promise.resolve(onRefresh?.()).finally(() => {
            setTimeout(() => {
              setRefreshing(false);
              setPullY(0);
            }, 700);
          });
          return THRESHOLD;
        }
        return 0;
      });
      startY.current = 0;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh]);

  const showIndicator = pullY > 10 || refreshing;

  return (
    <div ref={containerRef} className="scroll-area" style={style}>
      {showIndicator && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '8px 0',
          height: Math.max(pullY, refreshing ? 56 : 0),
          alignItems: 'center',
          overflow: 'hidden',
          transition: refreshing ? 'none' : 'height 0.2s ease',
        }}>
          <RacketSVG spin={refreshing} />
        </div>
      )}
      <div style={{
        transform: `translateY(${showIndicator && !refreshing ? 0 : 0}px)`,
      }}>
        {children}
      </div>
    </div>
  );
}

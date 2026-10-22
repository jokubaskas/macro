import { useRef, useState, useCallback } from "react";

// Paprastas, saugus "patrauk žemyn, kad atnaujintum" gestas — veikia TIK
// kai scroll'inamas konteineris jau yra pačiame viršuje (scrollTop<=0), ir
// niekada nenaudoja preventDefault() ar native scroll'o perrašymo, tad
// negali sutrikdyti įprasto puslapio slinkimo. Indikatorius tiesiog
// užima vietą (height), ne transform — paprasčiau ir patikimiau.
const THRESHOLD = 70;
const MAX_PULL = 100;

export function usePullToRefresh(scrollRef, onRefresh) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const active = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (refreshing) return;
    if (scrollRef.current && scrollRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      active.current = true;
    } else {
      active.current = false;
      startY.current = null;
    }
  }, [refreshing, scrollRef]);

  const onTouchMove = useCallback((e) => {
    if (!active.current || startY.current == null) return;
    if (!scrollRef.current || scrollRef.current.scrollTop > 0) { setPull(0); return; }
    const dy = e.touches[0].clientY - startY.current;
    setPull(dy > 0 ? Math.min(MAX_PULL, dy * 0.5) : 0);
  }, [scrollRef]);

  const onTouchEnd = useCallback(async () => {
    if (!active.current) return;
    active.current = false;
    startY.current = null;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD);
      try {
        if (navigator.vibrate) navigator.vibrate(10);
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }, [pull, onRefresh]);

  return { pull, refreshing, handlers: { onTouchStart, onTouchMove, onTouchEnd } };
}

// Nedidelis bendras pagalbinis veiksmas — trumpa vibracija, kai palaikoma
// (dauguma Android naršyklių; iOS Safari tyliai nieko nedaro, saugu kviesti visur).
export function haptic(pattern = 10) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* ignoruojama */ }
}

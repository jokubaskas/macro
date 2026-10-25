import { useState, useEffect } from "react";

// Bendras hook'as ekrano pločiui sekti — naudojamas vietoj CSS media query,
// kad atsakomybė liktų toje pačioje inline-style konvencijoje kaip visas
// likęs appas (nereikia kovoti su CSS specifiškumu prieš inline stilius).
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    try { return window.matchMedia(query).matches; } catch { return false; }
  });

  useEffect(() => {
    let mql;
    try { mql = window.matchMedia(query); } catch { return; }
    const handler = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else mql.addListener(handler);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else mql.removeListener(handler);
    };
  }, [query]);

  return matches;
}

// iPad landscape, laptop ir didesni ekranai — šoninis meniu + split-pane.
export function useIsDesktop() {
  return useMediaQuery("(min-width: 1000px)");
}

// iPad portrait ir panašūs — vis dar vienas stulpelis, bet platesnis nei telefonas.
export function useIsWide() {
  return useMediaQuery("(min-width: 680px)");
}

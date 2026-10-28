// Dalijamasi informacija "šiuo metu kažkuriam klientui vyksta pradėta, bet
// nebaigta gyva treniruotė" tarp LiveTraining.js (kuris tai žino) ir
// AdminPanel.js (kuris visur rodo nuolatinį indikatorių grįžti į ją) — be
// props gręžimo per kelis komponentų lygius. Ta pati pub-sub idėja kaip
// ./toast.js ir ./exitGuard.js.
let current = null; // { clientId, clientName } | null
let listeners = [];

export function setActiveLiveSession(session) {
  current = session;
  listeners.forEach(fn => fn(current));
}

// Išvalo indikatorių TIK jei jis šiuo metu rodo būtent šį klientą — kad
// atidarius kitą klientą (be aktyvios sesijos) netyčia neišnyktų kito
// kliento, kuriam treniruotė tikrai tebevyksta, indikatorius.
export function clearActiveLiveSessionIfMatches(clientId) {
  if (current?.clientId === clientId) setActiveLiveSession(null);
}

export function getActiveLiveSession() {
  return current;
}

export function subscribeLiveSession(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(f => f !== fn); };
}

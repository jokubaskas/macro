// Leidžia ekranui (pvz. gyvai treniruotei) "užregistruoti" patvirtinimo
// langą, kuris turi iššokti PRIEŠ bet kokį išėjimą iš jo — net kai išėjimo
// veiksmas (pvz. šoninio meniu mygtukas, "Atsijungti") vyksta visai kitame
// komponente, kuris apie tą ekraną nieko nežino. Modulio lygio singleton,
// ta pati pub-sub idėja kaip ./toast.js, be React Context ar props gręžimo
// per kelis lygius.
let currentGuard = null;

// fn: (proceed: () => void) => void — kai iškviečiamas, turi arba iškart
// pats paleisti proceed(), arba parodyti savo UI ir paleisti proceed()
// vėliau, kai vartotojas apsisprendžia.
export function setExitGuard(fn) {
  currentGuard = fn;
}

// Atsiregistruoja TIK jei tebesame tas pats guard — apsauga nuo lenktynių,
// kai senas komponentas nusiima jau po to, kai naujas spėjo užsiregistruoti.
export function clearExitGuard(fn) {
  if (!fn || currentGuard === fn) currentGuard = null;
}

export function attemptExit(proceed) {
  if (currentGuard) {
    currentGuard(proceed);
    return;
  }
  proceed();
}

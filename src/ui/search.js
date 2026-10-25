// Paieškos palyginimas be lietuviškų diakritikų — leidžia ieškoti "raumenys"
// ar "ejimas" ir rasti "raumenys"/"ėjimas", nereikalaujant tiksliai įvesti
// č/š/ž/ą/ę/ė/į/ų/ū. NFD skaido simbolį į pagrindinę raidę + diakritiką,
// o regex ją nupjauna.
export function normalizeForSearch(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function matchesSearch(text, query) {
  if (!query) return true;
  return normalizeForSearch(text).includes(normalizeForSearch(query));
}

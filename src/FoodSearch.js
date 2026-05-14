import { useState, useEffect, useRef, useCallback } from "react";
import { ALL_FOODS as foodDatabase } from "./foodDatabase";
import { PK } from "./constants";

const RECENT_KEY = "cv_recent_foods";
function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function addRecent(item) {
  const list = [item, ...getRecent().filter(x => x.name !== item.name)].slice(0, 8);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch {}
}

export default function FoodSearch({ meal, onAdd, onClose }) {
  const [query,         setQuery]        = useState("");
  const [results,       setResults]      = useState([]);
  const [recent,        setRecent]       = useState(getRecent);
  const [selected,      setSelected]     = useState(null);
  const [inputMode,     setInputMode]    = useState("grams"); // "unit" | "grams"
  const [selectedUnit,  setSelectedUnit] = useState(null);
  const [unitCount,     setUnitCount]    = useState("1");
  const [grams,         setGrams]        = useState("100");
  const [kbHeight,      setKbHeight]     = useState(0);
  const inputRef = useRef(null);

  // Klaviatūros aukštis
  useEffect(() => {
    function onResize() {
      const vv = window.visualViewport;
      if (vv) setKbHeight(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    }
    window.visualViewport?.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("scroll", onResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
    };
  }, []);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 120); }, []);

  const search = useCallback((q) => {
    if (!q.trim()) { setResults([]); return; }
    const lower = q.toLowerCase();
    setResults(foodDatabase.filter(f =>
      f.name.toLowerCase().includes(lower) || f.brand?.toLowerCase().includes(lower)
    ).slice(0, 40));
  }, []);

  useEffect(() => { search(query); }, [query, search]);

  function calcForGrams(food, g) {
    const ratio = g / 100;
    return {
      name:    food.name,
      brand:   food.brand || "",
      amount:  g,
      kcal:    Math.round((food.kcal    || 0) * ratio),
      protein: Math.round((food.protein || 0) * ratio * 10) / 10,
      fat:     Math.round((food.fat     || 0) * ratio * 10) / 10,
      carbs:   Math.round((food.carbs   || 0) * ratio * 10) / 10,
    };
  }

  function handleSelect(food) {
    setSelected(food);
    if (food.units?.length) {
      setInputMode("unit");
      setSelectedUnit(food.units[0]);
      setUnitCount("1");
    } else {
      setInputMode("grams");
      setSelectedUnit(null);
      setGrams("100");
    }
  }

  function getAmount() {
    if (inputMode === "unit" && selectedUnit) {
      return Math.round(selectedUnit.grams * (parseFloat(unitCount) || 1));
    }
    return parseFloat(grams) || 100;
  }

  function handleAdd() {
    if (!selected) return;
    const g = getAmount();
    const entry = calcForGrams(selected, g);
    addRecent({ name: selected.name, brand: selected.brand, ...selected });
    setRecent(getRecent());
    onAdd(entry);
    onClose();
  }

  const list = query.trim() ? results : (selected ? [] : recent);
  const showRecent = !query.trim() && !selected && recent.length > 0;
  const MEAL_NAMES = { breakfast:"🌅 Pusryčiai", lunch:"☀️ Pietūs", dinner:"🌙 Vakarienė", snack:"🍎 Užkandis" };
  const bottomOffset = kbHeight > 0 ? kbHeight : 80;

  // Stiliai
  const btnUnit = (active) => ({
    padding:"7px 12px", borderRadius:10, fontSize:12, fontWeight:700,
    cursor:"pointer", fontFamily:"inherit",
    border:`1.5px solid ${active ? "rgba(127,255,176,0.8)" : "rgba(255,255,255,0.2)"}`,
    background: active ? "rgba(127,255,176,0.15)" : "rgba(255,255,255,0.07)",
    color: active ? "#7FFFB0" : "#fff",
  });
  const btnCount = (active) => ({
    flex:1, padding:"5px 0", borderRadius:8, fontSize:12, fontWeight:700,
    cursor:"pointer", fontFamily:"inherit",
    background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)",
    border:"1px solid rgba(255,255,255,0.15)", color:"#fff",
  });

  const previewG = selected ? getAmount() : 100;
  const preview  = selected ? calcForGrams(selected, previewG) : null;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:400,
      background:"rgba(0,0,0,0.5)",
      display:"flex", flexDirection:"column", justifyContent:"flex-end",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{
        background:`linear-gradient(160deg,#2d0a1a,${PK.dark})`,
        borderRadius:"20px 20px 0 0",
        paddingBottom: bottomOffset,
        maxHeight:`calc(100vh - ${kbHeight}px - 20px)`,
        display:"flex", flexDirection:"column",
        transition:"padding-bottom 0.15s, max-height 0.15s",
      }}>

        {/* Header */}
        <div style={{ padding:"16px 16px 12px", borderBottom:"1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <p style={{ fontSize:14, fontWeight:700, color:"#fff", margin:0 }}>
              {MEAL_NAMES[meal] || "Pridėti maistą"}
            </p>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.12)", border:"none", borderRadius:10, padding:"6px 12px", color:"rgba(255,255,255,0.7)", fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
              ✕ Uždaryti
            </button>
          </div>
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:16, pointerEvents:"none" }}>🔍</span>
            <input ref={inputRef} type="text" value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); }}
              placeholder="Ieškoti produkto..."
              style={{ width:"100%", padding:"11px 12px 11px 38px", background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.2)", borderRadius:12, color:"#fff", fontSize:15, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
            />
            {query && (
              <button onClick={() => { setQuery(""); setSelected(null); inputRef.current?.focus(); }}
                style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:18, cursor:"pointer", padding:"0 4px" }}>×</button>
            )}
          </div>
        </div>

        {/* Pasirinktas produktas */}
        {selected && (
          <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize:12, fontWeight:700, color:"#fff", margin:"0 0 10px" }}>
              {selected.name}
              {selected.brand ? <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:400 }}> ({selected.brand})</span> : null}
            </p>

            {/* Režimo perjungimas jei yra vienetai */}
            {selected.units?.length > 0 && (
              <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                <button onClick={() => setInputMode("unit")} style={btnUnit(inputMode === "unit")}>📦 Vienetai</button>
                <button onClick={() => { setInputMode("grams"); setGrams(String(getAmount())); }} style={btnUnit(inputMode === "grams")}>⚖️ Gramai</button>
              </div>
            )}

            {/* VIENETŲ REŽIMAS */}
            {inputMode === "unit" && selected.units?.length > 0 && (
              <div>
                {/* Vieneto pasirinkimas */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                  {selected.units.map((u, i) => (
                    <button key={i} onClick={() => setSelectedUnit(u)} style={btnUnit(selectedUnit === u)}>
                      {u.label}
                    </button>
                  ))}
                </div>
                {/* Kiekio įvedimas */}
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                  <input
                    autoFocus
                    type="number" value={unitCount} step="0.5" min="0.5"
                    onChange={e => setUnitCount(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                    style={{ width:70, padding:"9px 10px", background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.3)", borderRadius:10, color:"#fff", fontSize:16, fontWeight:700, fontFamily:"inherit", outline:"none", textAlign:"center" }}
                  />
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>
                    vnt. = <span style={{ color:"#7FFFB0", fontWeight:700 }}>{Math.round((selectedUnit?.grams || 0) * (parseFloat(unitCount) || 1))}g</span>
                  </span>
                </div>
                {/* Greiti kiekiai */}
                <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                  {[0.5, 1, 1.5, 2, 3, 4].map(n => (
                    <button key={n} onClick={() => setUnitCount(String(n))} style={btnCount(unitCount === String(n))}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* GRAMŲ REŽIMAS */}
            {inputMode === "grams" && (
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <input
                    autoFocus={!selected.units?.length}
                    type="number" value={grams}
                    onChange={e => setGrams(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAdd()}
                    placeholder="100"
                    style={{ width:80, padding:"9px 12px", background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.25)", borderRadius:10, color:"#fff", fontSize:14, fontWeight:700, fontFamily:"inherit", outline:"none", textAlign:"center" }}
                  />
                  <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>g</span>
                </div>
                <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                  {[50, 100, 150, 200, 300].map(g => (
                    <button key={g} onClick={() => setGrams(String(g))} style={btnCount(grams === String(g))}>
                      {g}g
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Makrų peržiūra */}
            {preview && (
              <div style={{ display:"flex", gap:4, marginBottom:12 }}>
                {[
                  { l:"kcal", v:preview.kcal,    c:"#fff"     },
                  { l:"B",    v:preview.protein+"g", c:"#FFB3C6" },
                  { l:"R",    v:preview.fat+"g",     c:"#FF80AB" },
                  { l:"A",    v:preview.carbs+"g",   c:"#F48FB1" },
                ].map(item => (
                  <div key={item.l} style={{ flex:1, background:"rgba(255,255,255,0.08)", borderRadius:8, padding:"6px 4px", textAlign:"center" }}>
                    <div style={{ fontSize:14, fontWeight:700, color:item.c }}>{item.v}</div>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>{item.l}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={handleAdd} style={{ flex:1, padding:"11px 0", borderRadius:12, background:"rgba(127,255,176,0.2)", border:"1.5px solid rgba(127,255,176,0.4)", color:"#7FFFB0", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                + Pridėti
              </button>
              <button onClick={() => setSelected(null)} style={{ padding:"11px 14px", borderRadius:12, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.5)", fontSize:13, cursor:"pointer" }}>
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Rezultatų sąrašas */}
        <div style={{ overflowY:"auto", flex:1, WebkitOverflowScrolling:"touch" }}>
          {showRecent && (
            <p style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.4)", textTransform:"uppercase", letterSpacing:"0.08em", padding:"10px 16px 4px", margin:0 }}>
              Neseniai naudoti
            </p>
          )}
          {!query.trim() && !selected && recent.length === 0 && (
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"24px 16px" }}>
              Pradėk rašyti ieškoti produkto
            </p>
          )}
          {query.trim() && results.length === 0 && (
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", textAlign:"center", padding:"24px 16px" }}>
              Nieko nerasta pagal „{query}"
            </p>
          )}
          {list.map((food, i) => (
            <button key={i} onClick={() => handleSelect(food)} style={{
              width:"100%", padding:"11px 16px",
              background: selected?.name === food.name ? "rgba(255,255,255,0.12)" : "transparent",
              border:"none", borderBottom:"1px solid rgba(255,255,255,0.06)",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              cursor:"pointer", fontFamily:"inherit", textAlign:"left",
            }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:"#fff", margin:"0 0 1px" }}>{food.name}</p>
                {food.brand && <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>{food.brand}</p>}
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:2 }}>
                <span style={{ fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.75)" }}>{food.kcal} kcal</span>
                {food.units?.length > 0 && (
                  <span style={{ fontSize:9, color:"rgba(127,255,176,0.7)", background:"rgba(127,255,176,0.1)", borderRadius:4, padding:"1px 5px" }}>
                    {food.units[0].label}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
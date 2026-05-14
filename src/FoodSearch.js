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
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState([]);
  const [recent,   setRecent]   = useState(getRecent);
  const [selected, setSelected] = useState(null);
  const [grams,    setGrams]    = useState("100");
  const [kbHeight, setKbHeight] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    function onResize() {
      const vv = window.visualViewport;
      if (vv) {
        const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        setKbHeight(kb);
      }
    }
    window.visualViewport?.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("scroll", onResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120);
  }, []);

  const search = useCallback((q) => {
    if (!q.trim()) { setResults([]); return; }
    const lower = q.toLowerCase();
    const hits = foodDatabase
      .filter(f => f.name.toLowerCase().includes(lower) || f.brand?.toLowerCase().includes(lower))
      .slice(0, 40);
    setResults(hits);
  }, []);

  useEffect(() => { search(query); }, [query, search]);

  // FIX: "grams" → "amount" kad sutaptų su food_log lentelės schema
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
    setGrams("100");
  }

  function handleAdd() {
    const g = parseFloat(grams) || 100;
    const entry = calcForGrams(selected, g);
    addRecent({ name: selected.name, brand: selected.brand, ...selected });
    setRecent(getRecent());
    onAdd(entry);
    onClose(); // FIX: uždaryti iškart
  }

  const list = query.trim() ? results : (selected ? [] : recent);
  const showRecent = !query.trim() && !selected && recent.length > 0;

  const MEAL_NAMES = {
    breakfast:"🌅 Pusryčiai", lunch:"☀️ Pietūs",
    dinner:"🌙 Vakarienė", snack:"🍎 Užkandis",
  };

  const bottomOffset = kbHeight > 0 ? kbHeight : 80;

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
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); }}
              placeholder="Ieškoti produkto..."
              style={{
                width:"100%", padding:"11px 12px 11px 38px",
                background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.2)",
                borderRadius:12, color:"#fff", fontSize:15, fontFamily:"inherit",
                outline:"none", boxSizing:"border-box",
              }}
            />
            {query && (
              <button onClick={() => { setQuery(""); setSelected(null); inputRef.current?.focus(); }}
                style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:18, cursor:"pointer", padding:"0 4px" }}>×</button>
            )}
          </div>
        </div>

        {/* Gramų įvedimas */}
        {selected && (
          <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)" }}>
            <p style={{ fontSize:12, fontWeight:700, color:"#fff", margin:"0 0 8px" }}>
              {selected.name}{selected.brand ? <span style={{ fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:400 }}> ({selected.brand})</span> : null}
            </p>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <input
                autoFocus
                type="number" value={grams}
                onChange={e => setGrams(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                placeholder="100"
                style={{ width:80, padding:"9px 12px", background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.25)", borderRadius:10, color:"#fff", fontSize:14, fontWeight:700, fontFamily:"inherit", outline:"none", textAlign:"center" }}
              />
              <span style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>g</span>
              <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:4, fontSize:10, color:"rgba(255,255,255,0.6)", textAlign:"center" }}>
                {(() => {
                  const e = calcForGrams(selected, parseFloat(grams)||100);
                  return (
                    <>
                      <div><div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{e.kcal}</div>kcal</div>
                      <div><div style={{ fontSize:13, fontWeight:700, color:"#FFB3C6" }}>{e.protein}g</div>B</div>
                      <div><div style={{ fontSize:13, fontWeight:700, color:"#FF80AB" }}>{e.fat}g</div>R</div>
                      <div><div style={{ fontSize:13, fontWeight:700, color:"#F48FB1" }}>{e.carbs}g</div>A</div>
                    </>
                  );
                })()}
              </div>
              <button onClick={handleAdd} style={{ padding:"10px 16px", borderRadius:12, background:"rgba(127,255,176,0.2)", border:"1.5px solid rgba(127,255,176,0.4)", color:"#7FFFB0", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
                + Pridėti
              </button>
            </div>
            <div style={{ display:"flex", gap:6, marginTop:8 }}>
              {[50,100,150,200,300].map(g => (
                <button key={g} onClick={() => setGrams(String(g))}
                  style={{ flex:1, padding:"5px 0", borderRadius:8, background:grams===String(g)?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", fontSize:11, cursor:"pointer", fontFamily:"inherit" }}>
                  {g}g
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rezultatų sąrašas */}
        <div style={{ overflowY:"auto", flex:1, WebkitOverflowScrolling:"touch" }}>
          {showRecent && !selected && (
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
              background:selected?.name===food.name?"rgba(255,255,255,0.12)":"transparent",
              border:"none", borderBottom:"1px solid rgba(255,255,255,0.06)",
              display:"flex", justifyContent:"space-between", alignItems:"center",
              cursor:"pointer", fontFamily:"inherit", textAlign:"left",
            }}>
              <div>
                <p style={{ fontSize:13, fontWeight:600, color:"#fff", margin:"0 0 1px" }}>{food.name}</p>
                {food.brand && <p style={{ fontSize:10, color:"rgba(255,255,255,0.4)", margin:0 }}>{food.brand}</p>}
              </div>
              <div style={{ display:"flex", gap:8, fontSize:10, color:"rgba(255,255,255,0.5)" }}>
                <span style={{ fontWeight:700, color:"rgba(255,255,255,0.75)" }}>{food.kcal} kcal</span>
                <span>B{food.protein}g</span>
                <span>R{food.fat}g</span>
                <span>A{food.carbs}g</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
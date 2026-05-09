import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";
import { ALL_FOODS, searchLocalFoods, CATEGORIES } from "./foodDatabase";

const PK = {
  dark:"#6D1B3B", mid:"#AD1457", bright:"#E91E8C",
  rose:"#F48FB1", blush:"#F8BBD9", light:"#FCE4EC",
  pale:"#FFF0F5", coral:"#FFB3C6", water:"#5BB8D4",
};
const MEALS = [
  { id:"breakfast", label:"🌅 Pusryčiai" },
  { id:"lunch",     label:"☀️ Pietūs" },
  { id:"dinner",    label:"🌙 Vakarienė" },
  { id:"snack",     label:"🍎 Užkandžiai" },
];

function today() { return new Date().toISOString().split("T")[0]; }
function formatDate(d) {
  return new Date(d).toLocaleDateString("lt-LT", { weekday:"short", month:"short", day:"numeric" });
}
function isWithinWeek(dateStr) {
  return (new Date() - new Date(dateStr)) / 864e5 <= 7;
}
function getNutrients(food, grams) {
  const r = grams / 100;
  return {
    kcal:    Math.round(food.kcal    * r),
    protein: Math.round(food.protein * r * 10) / 10,
    fat:     Math.round(food.fat     * r * 10) / 10,
    carbs:   Math.round(food.carbs   * r * 10) / 10,
  };
}


// ── BARKODO SKENAVIMAS ─────────────────────────────────────────────────────
function BarcodeScanner({ onResult, onClose }) {
  const [msg,        setMsg]        = useState("Paruošta");
  const [searching,  setSearching]  = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [preview,    setPreview]    = useState(null);
  const fileRef = useRef(null);

  async function lookupBarcode(code) {
    setSearching(true);
    setMsg("Ieškoma: " + code + "...");
    try {
      const res  = await fetch("https://world.openfoodfacts.org/api/v0/product/" + code + ".json");
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const n = p.nutriments || {};
        const name = p.product_name_lt || p.product_name || p.product_name_en || "Nežinomas produktas";
        onResult({
          id: "bc_" + code, name, brand: p.brands || "",
          category: "Barkodas",
          kcal:    n["energy-kcal_100g"]    || 0,
          protein: n["proteins_100g"]        || 0,
          fat:     n["fat_100g"]             || 0,
          carbs:   n["carbohydrates_100g"]   || 0,
          units: [], source: "barcode",
        });
      } else {
        setMsg("Produktas nerastas (" + code + "). Bandyk dar kartą arba įvesk rankiniu būdu.");
        setSearching(false);
      }
    } catch(e) {
      setMsg("Klaida. Patikrink internetą.");
      setSearching(false);
    }
  }

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setMsg("Analizuojama nuotrauka...");
    setSearching(true);

    // 1. Bandome BarcodeDetector API (Chrome Android, Safari 17+)
    if ("BarcodeDetector" in window) {
      try {
        const detector = new window.BarcodeDetector({
          formats: ["ean_13","ean_8","upc_a","upc_e","code_128","qr_code"]
        });
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise(r => img.onload = r);
        const barcodes = await detector.detect(img);
        if (barcodes.length > 0) {
          await lookupBarcode(barcodes[0].rawValue);
          return;
        }
      } catch(e) {}
    }

    // 2. ZXing fallback
    try {
      if (!window.ZXing) {
        setMsg("Kraunama biblioteka...");
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://unpkg.com/@zxing/library@latest/umd/index.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise(r => img.onload = r);
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
      const imgData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
      const lum = new window.ZXing.RGBLuminanceSource(imgData.data, canvas.width, canvas.height);
      const bin = new window.ZXing.BinaryBitmap(new window.ZXing.HybridBinarizer(lum));
      const reader = new window.ZXing.MultiFormatReader();
      const result = reader.decode(bin);
      if (result) {
        await lookupBarcode(result.getText());
        return;
      }
    } catch(e) {}

    setMsg("Nepavyko aptikti barkodo. Pabandyk nufotografuoti aiškiau arba įvesk rankiniu būdu.");
    setSearching(false);
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:200, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <h3 style={{ color:"#fff", margin:0, fontSize:16, fontWeight:700 }}>📷 Barkodo skenavimas</h3>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
      </div>

      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20, gap:16 }}>

        {/* Nuotraukos peržiūra */}
        {preview ? (
          <div style={{ width:"100%", maxWidth:360, borderRadius:16, overflow:"hidden", border:"3px solid "+PK.rose }}>
            <img src={preview} alt="scan" style={{ width:"100%", display:"block" }} />
          </div>
        ) : (
          <div style={{ width:"100%", maxWidth:360, height:200, borderRadius:16, border:"3px dashed "+PK.rose, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
            <span style={{ fontSize:48 }}>📦</span>
            <p style={{ color:PK.blush, fontSize:13, textAlign:"center", margin:0 }}>Nufotografuok barkodą</p>
          </div>
        )}

        {/* Statusas */}
        <div style={{ background:"rgba(255,255,255,0.1)", borderRadius:12, padding:"10px 20px", width:"100%", maxWidth:360, textAlign:"center" }}>
          <p style={{ color:searching ? PK.coral : PK.blush, fontSize:13, margin:0 }}>
            {searching ? "⏳ " : "ℹ️ "}{msg}
          </p>
        </div>

        {/* Foto mygtukas */}
        <input ref={fileRef} type="file" accept="image/*" capture="environment"
          onChange={handlePhoto} style={{ display:"none" }} />
        <button
          onClick={() => { setPreview(null); setMsg("Paruošta"); fileRef.current?.click(); }}
          disabled={searching}
          style={{ width:"100%", maxWidth:360, padding:"16px 0", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:16, fontSize:16, fontWeight:700, cursor:"pointer", opacity:searching?0.6:1 }}>
          📷 Fotografuoti barkodą
        </button>

        {/* Rankinis įvedimas */}
        <div style={{ width:"100%", maxWidth:360 }}>
          <p style={{ color:"rgba(255,255,255,0.5)", fontSize:11, textAlign:"center", marginBottom:8 }}>
            arba įvesk rankiniu būdu
          </p>
          <div style={{ display:"flex", gap:8 }}>
            <input
              type="number"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="pvz. 4008400175478"
              style={{ flex:1, padding:"11px 14px", border:"none", borderRadius:12, fontSize:14, color:PK.dark, background:"rgba(255,255,255,0.95)", outline:"none", fontFamily:"inherit" }}
            />
            <button
              onClick={() => manualCode.length >= 8 && lookupBarcode(manualCode)}
              disabled={searching}
              style={{ padding:"11px 16px", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer" }}>
              Ieškoti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── VALGYMO SEKCIJA SU DROPDOWN ───────────────────────────────────────────
function MealSection({ entries, onAdd, onRemove }) {
  const [collapsed, setCollapsed] = useState({});

  function toggle(mealId) {
    setCollapsed(prev => ({ ...prev, [mealId]: !prev[mealId] }));
  }

  return (
    <>
      {MEALS.map(meal => {
        const mealEntries = entries.filter(e => e.meal === meal.id);
        const mT = mealEntries.reduce((a,e) => ({ kcal:a.kcal+(e.kcal||0), protein:a.protein+(e.protein||0), fat:a.fat+(e.fat||0), carbs:a.carbs+(e.carbs||0) }), { kcal:0,protein:0,fat:0,carbs:0 });
        const isCollapsed = collapsed[meal.id] && mealEntries.length > 0;

        return (
          <div key={meal.id} style={{ background:"#fff", borderRadius:16, marginBottom:10, border:"1px solid "+PK.blush, overflow:"hidden" }}>
            {/* Header */}
            <div style={{ padding:"14px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <button onClick={() => toggle(meal.id)}
                style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:8, padding:0 }}>
                <span style={{ fontSize:16 }}>{isCollapsed ? "▶" : "▼"}</span>
                <span style={{ fontSize:14, fontWeight:700, color:PK.dark }}>{meal.label}</span>
                {mealEntries.length > 0 && (
                  <span style={{ fontSize:11, color:PK.rose }}>
                    {Math.round(mT.kcal)} kcal · B:{Math.round(mT.protein)}g · R:{Math.round(mT.fat)}g · A:{Math.round(mT.carbs)}g
                  </span>
                )}
              </button>
              <button onClick={() => onAdd(meal.id)}
                style={{ padding:"6px 12px", background:PK.light, border:"1px solid "+PK.blush, borderRadius:10, fontSize:12, fontWeight:700, color:PK.mid, cursor:"pointer", flexShrink:0 }}>
                + Pridėti
              </button>
            </div>

            {/* Produktų sąrašas */}
            {!isCollapsed && mealEntries.length > 0 && (
              <div style={{ borderTop:"1px solid "+PK.light, padding:"0 16px" }}>
                {mealEntries.map(e => (
                  <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid "+PK.light }}>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:"0 0 2px", fontSize:13, color:PK.dark, fontWeight:500 }}>{e.name}</p>
                      <p style={{ margin:0, fontSize:11, color:PK.rose }}>{e.amount}g · {e.kcal} kcal · B:{e.protein}g R:{e.fat}g A:{e.carbs}g</p>
                    </div>
                    <button onClick={() => onRemove(e.id)} style={{ background:"none", border:"none", color:PK.rose, fontSize:18, cursor:"pointer", padding:"0 4px", marginLeft:8 }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {!isCollapsed && mealEntries.length === 0 && (
              <div style={{ borderTop:"1px solid "+PK.light, padding:"12px 16px" }}>
                <p style={{ margin:0, fontSize:12, color:PK.blush, fontStyle:"italic" }}>Dar nieko nėra – spausk + Pridėti</p>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default function FoodLog({ userId, targetMacros }) {
  const [date,       setDate]       = useState(today());
  const [entries,    setEntries]    = useState([]);
  const [history,    setHistory]    = useState([]);
  const [activeMeal, setActiveMeal] = useState(null);
  const [searching,  setSearching]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState("today");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("food_log").select("*").eq("user_id", userId).eq("date", date).order("created_at");
    setEntries(data || []);
    setLoading(false);
  }, [userId, date]);

  const loadHistory = useCallback(async () => {
    const { data } = await supabase.from("food_log").select("*").eq("user_id", userId).order("date", { ascending:false }).order("created_at");
    setHistory(data || []);
  }, [userId]);

  useEffect(() => { loadEntries(); }, [loadEntries]);
  useEffect(() => { if (tab === "history") loadHistory(); }, [tab, loadHistory]);

  async function addEntry(meal, food) {
    await supabase.from("food_log").insert({ user_id:userId, date, meal, ...food });
    setSearching(false); setActiveMeal(null);
    loadEntries();
  }

  async function removeEntry(id) {
    await supabase.from("food_log").delete().eq("id", id);
    loadEntries();
  }

  const totals = entries.reduce((a,e) => ({ kcal:a.kcal+(e.kcal||0), protein:a.protein+(e.protein||0), fat:a.fat+(e.fat||0), carbs:a.carbs+(e.carbs||0) }), { kcal:0,protein:0,fat:0,carbs:0 });
  const historyByDate = history.reduce((acc,e) => { if(!acc[e.date]) acc[e.date]=[]; acc[e.date].push(e); return acc; }, {});
  const weekHistory = Object.entries(historyByDate).filter(([d]) => isWithinWeek(d) && d !== today());
  const oldHistory  = Object.entries(historyByDate).filter(([d]) => !isWithinWeek(d));

  function DaySummary({ dateStr, dayEntries }) {
    const t = dayEntries.reduce((a,e) => ({ kcal:a.kcal+(e.kcal||0), protein:a.protein+(e.protein||0), fat:a.fat+(e.fat||0), carbs:a.carbs+(e.carbs||0) }), { kcal:0,protein:0,fat:0,carbs:0 });
    return (
      <div style={{ background:"#fff", borderRadius:16, padding:"14px 16px", marginBottom:10, border:"1px solid "+PK.blush }}>
        <p style={{ fontSize:13, fontWeight:700, color:PK.dark, marginBottom:10 }}>{formatDate(dateStr)}</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
          {[{l:"Kalorijos",v:Math.round(t.kcal),u:"kcal",c:PK.dark},{l:"Baltymai",v:Math.round(t.protein),u:"g",c:PK.mid},{l:"Riebalai",v:Math.round(t.fat),u:"g",c:PK.bright},{l:"Angliavandeniai",v:Math.round(t.carbs),u:"g",c:PK.rose}].map(item => (
            <div key={item.l} style={{ background:PK.pale, borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
              <div style={{ fontSize:15, fontWeight:700, color:item.c }}>{item.v}<span style={{ fontSize:9 }}>{item.u}</span></div>
              <div style={{ fontSize:9, color:PK.rose, marginTop:1 }}>{item.l}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom:24 }}>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {[{id:"today",l:"📅 Šiandien"},{id:"history",l:"📊 Istorija"}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex:1, padding:"10px 0", borderRadius:12, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit", border:"2px solid "+(tab===t.id?PK.mid:PK.blush), background:tab===t.id?PK.light:"#fff", color:tab===t.id?PK.dark:PK.rose }}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <>
          <div style={{ background:"#fff", borderRadius:16, padding:"12px 16px", marginBottom:12, border:"1px solid "+PK.blush, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:13, fontWeight:700, color:PK.mid }}>Data:</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ border:"none", background:"none", fontSize:14, color:PK.dark, fontFamily:"inherit", outline:"none", flex:1 }} />
          </div>

          {targetMacros && (
            <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", borderRadius:20, padding:16, marginBottom:12 }}>
              <p style={{ color:"#fff", fontSize:13, fontWeight:700, marginBottom:12, textAlign:"center" }}>Dienos pažanga</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
                {[
                  {l:"Kalorijos",cur:Math.round(totals.kcal),   tgt:targetMacros.target,  c:"#fff"},
                  {l:"Baltymai", cur:Math.round(totals.protein), tgt:targetMacros.prot.g,  c:PK.blush},
                  {l:"Riebalai", cur:Math.round(totals.fat),     tgt:targetMacros.fat.g,   c:PK.coral},
                  {l:"Angliavandeniai",cur:Math.round(totals.carbs),tgt:targetMacros.carb.g,c:PK.rose},
                ].map(item => {
                  const pct = item.tgt ? Math.min(100, Math.round(item.cur/item.tgt*100)) : 0;
                  const over = item.tgt && item.cur > item.tgt;
                  return (
                    <div key={item.l} style={{ background:"rgba(255,255,255,0.13)", borderRadius:12, padding:"10px 6px", textAlign:"center" }}>
                      <div style={{ fontSize:16, fontWeight:700, color:over?"#FFD700":item.c }}>{item.cur}</div>
                      <div style={{ fontSize:9, color:"rgba(255,255,255,0.6)" }}>/ {item.tgt}</div>
                      <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:99, height:4, margin:"6px 0 4px" }}>
                        <div style={{ width:pct+"%", height:"100%", borderRadius:99, background:over?"#FFD700":item.c, transition:"width 0.5s" }} />
                      </div>
                      <div style={{ fontSize:9, color:over?"#FFD700":item.c, fontWeight:700 }}>{pct}%</div>
                      <div style={{ fontSize:8, color:"rgba(255,255,255,0.5)", marginTop:2 }}>{item.l}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <MealSection entries={entries} onAdd={(mealId) => { setActiveMeal(mealId); setSearching(true); }} onRemove={removeEntry} />
        </>
      )}

      {tab === "history" && (
        <>
          {weekHistory.length === 0 && oldHistory.length === 0 ? (
            <div style={{ background:PK.pale, borderRadius:16, padding:"32px 20px", textAlign:"center", border:"2px dashed "+PK.blush }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🌸</div>
              <p style={{ color:PK.rose, fontSize:14 }}>Dar nėra istorijos</p>
            </div>
          ) : (
            <>
              {weekHistory.length > 0 && (
                <>
                  <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:PK.mid, marginBottom:10 }}>Ši savaitė</p>
                  {weekHistory.map(([d, ents]) => (
                    <div key={d}>
                      <DaySummary dateStr={d} dayEntries={ents} />
                      {ents.map(e => (
                        <div key={e.id} style={{ padding:"5px 16px 5px 24px", borderLeft:"2px solid "+PK.blush, marginBottom:3 }}>
                          <p style={{ margin:0, fontSize:12, color:PK.dark }}>{e.name} <span style={{ color:PK.rose }}>{e.amount}g · {e.kcal} kcal</span></p>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
              {oldHistory.length > 0 && (
                <>
                  <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:PK.mid, margin:"16px 0 10px" }}>Senesnė istorija</p>
                  {oldHistory.map(([d, ents]) => <DaySummary key={d} dateStr={d} dayEntries={ents} />)}
                </>
              )}
            </>
          )}
        </>
      )}

      {searching && (
        <FoodSearch
          onAdd={food => addEntry(activeMeal, food)}
          onClose={() => { setSearching(false); setActiveMeal(null); }}
        />
      )}
    </div>
  );
}

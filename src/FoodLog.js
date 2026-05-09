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
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const [status,  setStatus]  = useState("starting");
  const [msg,     setMsg]     = useState("Paleidžiama kamera...");
  const [manualCode, setManualCode] = useState("");

  // Krauname ZXing iš CDN
  useEffect(() => {
    let stopped = false;

    async function init() {
      // 1. Kamera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width:{ ideal:1280 }, height:{ ideal:720 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch(e) {
        setStatus("error");
        setMsg("Nepavyko pasiekti kameros. Patikrink ar leista prieiga.");
        return;
      }

      // 2. Krauname ZXing iš CDN
      if (!window.ZXing) {
        setMsg("Kraunama skenavimo biblioteka...");
        await new Promise((res, rej) => {
          const s = document.createElement("script");
          s.src = "https://unpkg.com/@zxing/library@latest/umd/index.min.js";
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }

      if (stopped) return;
      setStatus("scanning");
      setMsg("Nukreipk kamerą į barkodą");

      // 3. Skenavimo ciklas
      const hints = new Map();
      const formats = [
        window.ZXing.BarcodeFormat.EAN_13,
        window.ZXing.BarcodeFormat.EAN_8,
        window.ZXing.BarcodeFormat.UPC_A,
        window.ZXing.BarcodeFormat.CODE_128,
        window.ZXing.BarcodeFormat.QR_CODE,
      ];
      hints.set(window.ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
      const reader = new window.ZXing.MultiFormatReader();
      reader.setHints(hints);

      function scanFrame() {
        if (stopped || !videoRef.current || !canvasRef.current) return;
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width  = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext("2d").drawImage(video, 0, 0);
          try {
            const imgData = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
            const lumSrc  = new window.ZXing.RGBLuminanceSource(imgData.data, canvas.width, canvas.height);
            const binBmp  = new window.ZXing.BinaryBitmap(new window.ZXing.HybridBinarizer(lumSrc));
            const result  = reader.decode(binBmp);
            if (result) {
              stopped = true;
              lookupBarcode(result.getText());
              return;
            }
          } catch(e) { /* nerasta šiame kadre */ }
        }
        rafRef.current = requestAnimationFrame(scanFrame);
      }
      rafRef.current = requestAnimationFrame(scanFrame);
    }

    init();
    return () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  async function lookupBarcode(code) {
    setStatus("found");
    setMsg("Rastas barkodas: " + code + " – ieškoma...");
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
        setStatus("notfound");
        setMsg("Produktas nerastas (" + code + "). Pabandyk įvesti rankiniu būdu.");
      }
    } catch(e) {
      setStatus("notfound");
      setMsg("Klaida ieškant. Patikrink internetą.");
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"#000", zIndex:200, display:"flex", flexDirection:"column" }}>
      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <h3 style={{ color:"#fff", margin:0, fontSize:16, fontWeight:700 }}>📷 Barkodo skenavimas</h3>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
      </div>

      {/* Kameros rodinys */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        <video ref={videoRef} playsInline muted style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        <canvas ref={canvasRef} style={{ display:"none" }} />

        {/* Taikinys */}
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ width:"80%", maxWidth:320, height:130, position:"relative" }}>
            <div style={{ position:"absolute", inset:0, boxShadow:"0 0 0 2000px rgba(0,0,0,0.55)", borderRadius:12 }} />
            <div style={{ position:"absolute", inset:0, border:"3px solid "+(status==="scanning"?PK.rose:"#22C55E"), borderRadius:12, transition:"border-color 0.3s" }}>
              {/* Kampai */}
              {[["0 auto auto 0"],["0 0 auto auto"],["auto auto 0 0"],["auto 0 0 auto"]].map((inset,i) => (
                <div key={i} style={{ position:"absolute", width:20, height:20, borderColor:status==="scanning"?PK.mid:"#22C55E",
                  borderStyle:"solid", borderWidth: i===0?"3px 0 0 3px": i===1?"3px 3px 0 0": i===2?"0 0 3px 3px":"0 3px 3px 0",
                  top: i<2?"0":"auto", bottom: i>=2?"0":"auto", left: i%2===0?"0":"auto", right: i%2===1?"0":"auto" }} />
              ))}
            </div>
          </div>
        </div>

        {/* Statusas */}
        <div style={{ position:"absolute", bottom:16, left:0, right:0, display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:"0 20px" }}>
          <div style={{ background:"rgba(0,0,0,0.7)", borderRadius:12, padding:"10px 20px", textAlign:"center" }}>
            <p style={{ color: status==="scanning"?PK.blush:"#22C55E", fontSize:13, margin:0 }}>{msg}</p>
          </div>

          {/* Rankinis įvedimas */}
          <div style={{ width:"100%", maxWidth:380, display:"flex", gap:8 }}>
            <input
              type="number"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="Įvesk barkodą rankiniu būdu..."
              style={{ flex:1, padding:"11px 14px", border:"none", borderRadius:12, fontSize:14, color:PK.dark, background:"rgba(255,255,255,0.95)", outline:"none", fontFamily:"inherit" }}
            />
            <button onClick={() => manualCode.length >= 8 && lookupBarcode(manualCode)}
              style={{ padding:"11px 16px", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer" }}>
              Ieškoti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FoodSearch({ onAdd, onClose }) {
  const [query,    setQuery]    = useState("");
  const [localRes, setLocalRes] = useState(ALL_FOODS.slice(0, 15));
  const [onlineRes,setOnlineRes]= useState([]);
  const [usdaRes,  setUsdaRes]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [amount,   setAmount]   = useState("100");
  const [unit,     setUnit]     = useState(null);
  const [category, setCategory] = useState("Visi");
  const [showBarcode, setShowBarcode] = useState(false);

  // Vietinė paieška – iš karto
  useEffect(() => {
    setLocalRes(
      !query
        ? (category === "Visi" ? ALL_FOODS.slice(0, 15) : ALL_FOODS.filter(f => f.category === category).slice(0, 15))
        : searchLocalFoods(query)
    );
  }, [query, category]);

  // Pasaulinė paieška – automatiškai po 600ms
  useEffect(() => {
    if (!query || query.length < 2) { setOnlineRes([]); setUsdaRes([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);

      // Open Food Facts
      try {
        const res = await fetch(
          "https://world.openfoodfacts.org/cgi/search.pl?search_terms=" +
          encodeURIComponent(query) +
          "&search_simple=1&action=process&json=1&page_size=6&fields=product_name,nutriments,brands,code"
        );
        const data = await res.json();
        const filtered = (data.products || []).filter(p =>
          p.product_name && p.nutriments?.["energy-kcal_100g"]
        ).map(p => ({
          id: "off_" + p.code,
          name: p.product_name,
          brand: p.brands || "",
          category: "Supakuoti produktai",
          kcal:    p.nutriments["energy-kcal_100g"]     || 0,
          protein: p.nutriments["proteins_100g"]         || 0,
          fat:     p.nutriments["fat_100g"]              || 0,
          carbs:   p.nutriments["carbohydrates_100g"]    || 0,
          units: [],
          isOnline: true,
          source: "off",
        }));
        setOnlineRes(filtered);
      } catch(e) { setOnlineRes([]); }

      // USDA FoodData Central
      try {
        const USDA_KEY = process.env.REACT_APP_USDA_KEY;
        const res = await fetch(
          "https://api.nal.usda.gov/fdc/v1/foods/search?api_key=" + USDA_KEY +
          "&query=" + encodeURIComponent(query) +
          "&pageSize=8&dataType=SR%20Legacy,Foundation,Branded"
        );
        const data = await res.json();
        const filtered = (data.foods || []).filter(f => {
          const n = f.foodNutrients || [];
          return n.some(x => x.nutrientName === "Energy" && x.value > 0);
        }).map(f => {
          const nutrients = f.foodNutrients || [];
          const get = (name) => {
            const n = nutrients.find(x => x.nutrientName === name || x.nutrientName?.startsWith(name));
            return Math.round((n?.value || 0) * 10) / 10;
          };
          return {
            id: "usda_" + f.fdcId,
            name: f.description,
            brand: f.brandOwner || f.brandName || "",
            category: "USDA duomenų bazė",
            kcal:    get("Energy"),
            protein: get("Protein"),
            fat:     get("Total lipid"),
            carbs:   get("Carbohydrate"),
            units: [],
            isOnline: true,
            source: "usda",
          };
        });
        setUsdaRes(filtered);
      } catch(e) { setUsdaRes([]); }

      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);

  function selectFood(food) {
    setSelected(food);
    setUnit(food.units?.length ? food.units[0] : null);
    setAmount(food.units?.length ? "" : "100");
  }

  function getGrams() { return unit ? unit.grams : (parseFloat(amount) || 100); }

  function handleAdd() {
    if (!selected) return;
    const g = getGrams();
    const n = getNutrients(selected, g);
    onAdd({ name: selected.name, brand: selected.brand || "", amount: g, ...n });
  }

  const inp = {
    width:"100%", padding:"11px 14px", border:"2px solid "+PK.blush,
    borderRadius:12, fontSize:15, color:PK.dark, background:PK.pale,
    outline:"none", fontFamily:"inherit", boxSizing:"border-box",
  };

  const FoodButton = ({ food }) => (
    <button onClick={() => selectFood(food)} style={{
      padding:"12px 14px", border:"2px solid "+PK.blush, borderRadius:14,
      background:"#fff", textAlign:"left", cursor:"pointer", fontFamily:"inherit", width:"100%",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ flex:1 }}>
          <p style={{ margin:"0 0 2px", fontSize:13, fontWeight:700, color:PK.dark }}>{food.name}</p>
          {food.brand && <p style={{ margin:"0 0 2px", fontSize:11, color:PK.rose }}>{food.brand}</p>}
          <p style={{ margin:0, fontSize:11, color:PK.mid }}>
            {Math.round(food.kcal)} kcal · B:{Math.round(food.protein)}g · R:{Math.round(food.fat)}g · A:{Math.round(food.carbs)}g
            <span style={{ color:PK.rose }}> / 100g</span>
          </p>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, marginLeft:8 }}>
          {food.units?.length > 0 && (
            <span style={{ fontSize:9, background:PK.light, color:PK.mid, borderRadius:8, padding:"2px 6px", fontWeight:700 }}>
              {food.units.length} dydžiai
            </span>
          )}
          {food.source === "usda" && (
            <span style={{ fontSize:9, background:"#ECFDF5", color:"#059669", borderRadius:8, padding:"2px 6px", fontWeight:700 }}>
              🇺🇸 USDA
            </span>
          )}
          {food.source === "off" && (
            <span style={{ fontSize:9, background:"#EEF2FF", color:"#4F46E5", borderRadius:8, padding:"2px 6px", fontWeight:700 }}>
              🌍 internetas
            </span>
          )}
        </div>
      </div>
    </button>
  );

  return (
    <>
    {showBarcode && <BarcodeScanner onResult={(food) => { selectFood(food); setShowBarcode(false); }} onClose={() => setShowBarcode(false)} />}
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:100, display:"flex", alignItems:"flex-end" }}>
      <div style={{ width:"100%", maxHeight:"92vh", background:"#fff", borderRadius:"20px 20px 0 0", display:"flex", flexDirection:"column" }}>
        <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <h3 style={{ color:"#fff", margin:0, fontSize:16, fontWeight:700 }}>Ieškoti maisto</h3>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => setShowBarcode(true)} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", cursor:"pointer", fontSize:14 }}>📷</button>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"6px 10px", color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
          </div>
        </div>

        <div style={{ overflowY:"auto", flex:1, padding:"16px" }}>
          {/* Paieška */}
          <div style={{ position:"relative", marginBottom:12 }}>
            <input style={{ ...inp, paddingLeft:36 }} value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); }}
              placeholder="Ieškoti produkto..."
            />
            <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:16 }}>🔍</span>
            {loading && <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:12, color:PK.rose }}>...</span>}
          </div>

          {/* Kategorijos */}
          {!query && (
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              {["Visi", ...CATEGORIES].map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  padding:"5px 10px", borderRadius:20, fontSize:11, fontWeight:700,
                  cursor:"pointer", fontFamily:"inherit",
                  border:"1px solid "+(category===cat ? PK.mid : PK.blush),
                  background:category===cat ? PK.light : "#fff",
                  color:category===cat ? PK.dark : PK.rose,
                }}>{cat}</button>
              ))}
            </div>
          )}

          {/* Pasirinktas produktas */}
          {selected && (
            <div style={{ background:PK.pale, borderRadius:16, padding:16, marginBottom:14, border:"1px solid "+PK.blush }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ flex:1 }}>
                  <p style={{ margin:"0 0 2px", fontSize:14, fontWeight:700, color:PK.dark }}>{selected.name}</p>
                  {selected.brand && <p style={{ margin:0, fontSize:11, color:PK.rose }}>{selected.brand}</p>}
                  <p style={{ margin:"4px 0 0", fontSize:11, color:PK.mid }}>
                    {Math.round(selected.kcal)} kcal · B:{Math.round(selected.protein)}g · R:{Math.round(selected.fat)}g · A:{Math.round(selected.carbs)}g (per 100g)
                  </p>
                </div>
                <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", color:PK.rose, fontSize:18, cursor:"pointer", marginLeft:8 }}>✕</button>
              </div>

              <p style={{ fontSize:11, fontWeight:700, color:PK.mid, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>Kiekis</p>

              {selected.units?.length > 0 && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                  {selected.units.map((u, i) => (
                    <button key={i} onClick={() => { setUnit(u); setAmount(""); }} style={{
                      padding:"7px 12px", borderRadius:10, fontSize:12, fontWeight:700,
                      cursor:"pointer", fontFamily:"inherit",
                      border:"2px solid "+(unit===u ? PK.mid : PK.blush),
                      background:unit===u ? PK.light : "#fff",
                      color:unit===u ? PK.dark : PK.rose,
                    }}>{u.label}</button>
                  ))}
                  <button onClick={() => { setUnit(null); setAmount("100"); }} style={{
                    padding:"7px 12px", borderRadius:10, fontSize:12, fontWeight:700,
                    cursor:"pointer", fontFamily:"inherit",
                    border:"2px solid "+(!unit ? PK.mid : PK.blush),
                    background:!unit ? PK.light : "#fff",
                    color:!unit ? PK.dark : PK.rose,
                  }}>Gramai</button>
                </div>
              )}

              {!unit && (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                    style={{ ...inp, width:100, padding:"8px 12px" }} placeholder="100" />
                  <span style={{ fontSize:13, color:PK.mid, fontWeight:600 }}>gramų</span>
                </div>
              )}

              {(() => {
                const g = getGrams();
                const n = getNutrients(selected, g);
                return (
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                    {[{l:"Kalorijos",v:n.kcal,u:"kcal",c:PK.dark},{l:"Baltymai",v:n.protein,u:"g",c:PK.mid},{l:"Riebalai",v:n.fat,u:"g",c:PK.bright},{l:"Angliavandeniai",v:n.carbs,u:"g",c:PK.rose}].map(item => (
                      <div key={item.l} style={{ background:"#fff", borderRadius:10, padding:"8px 4px", textAlign:"center", border:"1px solid "+PK.blush }}>
                        <div style={{ fontSize:16, fontWeight:700, color:item.c }}>{item.v}<span style={{ fontSize:9 }}>{item.u}</span></div>
                        <div style={{ fontSize:9, color:PK.rose, marginTop:1 }}>{item.l}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <button onClick={handleAdd} style={{ width:"100%", padding:"13px 0", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:14, fontSize:15, fontWeight:700, cursor:"pointer" }}>
                ✓ Pridėti į žurnalą
              </button>
            </div>
          )}

          {/* Sujungti rezultatai */}
          {!selected && (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {localRes.length > 0 && (
                <>
                  {query && <p style={{ fontSize:10, fontWeight:700, color:PK.mid, textTransform:"uppercase", letterSpacing:"0.1em", margin:"4px 0" }}>🇱🇹 Mūsų duomenų bazė</p>}
                  {localRes.map(food => <FoodButton key={food.id} food={food} />)}
                </>
              )}
              {onlineRes.length > 0 && (
                <>
                  <p style={{ fontSize:10, fontWeight:700, color:"#4F46E5", textTransform:"uppercase", letterSpacing:"0.1em", margin:"8px 0 4px" }}>🌍 Supakuoti produktai (Open Food Facts)</p>
                  {onlineRes.map(food => <FoodButton key={food.id} food={food} />)}
                </>
              )}
              {usdaRes.length > 0 && (
                <>
                  <p style={{ fontSize:10, fontWeight:700, color:"#059669", textTransform:"uppercase", letterSpacing:"0.1em", margin:"8px 0 4px" }}>🇺🇸 USDA duomenų bazė (400,000+ produktų)</p>
                  {usdaRes.map(food => <FoodButton key={food.id} food={food} />)}
                </>
              )}
              {query && localRes.length === 0 && onlineRes.length === 0 && usdaRes.length === 0 && !loading && (
                <p style={{ textAlign:"center", color:PK.rose, padding:"20px 0", fontSize:13 }}>Nerasta produktų</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
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

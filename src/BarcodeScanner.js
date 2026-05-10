import { useState, useEffect, useRef } from "react";
import Quagga from "@ericblade/quagga2";

const PK = {
  dark:"#6D1B3B", mid:"#AD1457",
  rose:"#F48FB1", blush:"#F8BBD9", coral:"#FFB3C6",
};

async function translateToLT(text) {
  if (!text || text.length < 2) return text;
  const ltPattern = /[ąčęėįšųūž]/i;
  if (ltPattern.test(text)) return text;
  if (/^[0-9\s\-\.,\%\+]+$/.test(text)) return text;
  try {
    const res = await fetch(
      "https://api.mymemory.translated.net/get?q=" +
      encodeURIComponent(text.substring(0, 200)) + "&langpair=en|lt"
    );
    const data = await res.json();
    const t = data?.responseData?.translatedText;
    if (t && t !== text && !t.includes("MYMEMORY")) return t;
  } catch(e) {}
  return text;
}

export default function BarcodeScanner({ onResult, onClose }) {
  const scannerRef  = useRef(null);
  const detectedRef = useRef(false);
  const [started,   setStarted]   = useState(false);
  const [msg,       setMsg]       = useState("Paleidžiama kamera...");
  const [manual,    setManual]    = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let active = true;
    Quagga.init({
      inputStream: {
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          width: { min:640, ideal:1280 },
          height: { min:480, ideal:720 },
          facingMode: "environment",
          aspectRatio: { ideal:1.5 },
        },
        area: { top:"20%", right:"10%", left:"10%", bottom:"20%" },
      },
      locator: { patchSize:"medium", halfSample:true },
      numOfWorkers: 2,
      frequency: 10,
      decoder: { readers:["ean_reader","ean_8_reader","upc_reader","upc_e_reader","code_128_reader","code_39_reader"] },
      locate: true,
    }, (err) => {
      if (!active) return;
      if (err) { setMsg("Nepavyko pasiekti kameros: " + err); return; }
      Quagga.start();
      setStarted(true);
      setMsg("Nukreipk kamerą į barkodą");
    });

    Quagga.onDetected((data) => {
      if (!active || detectedRef.current) return;
      const code = data?.codeResult?.code;
      if (!code) return;
      const errors = data?.codeResult?.decodedCodes?.filter(c => c.error !== undefined)?.map(c => c.error) || [];
      const avgError = errors.length ? errors.reduce((a,b) => a+b, 0) / errors.length : 1;
      if (avgError > 0.25) return;
      detectedRef.current = true;
      Quagga.stop();
      setStarted(false);
      lookupBarcode(code);
    });

    return () => {
      active = false;
      try { Quagga.stop(); } catch(e) {}
      try { Quagga.offDetected(); } catch(e) {}
    };
  }, []);

  async function lookupBarcode(code) {
    setSearching(true);
    setMsg("Rastas: " + code + " – ieškoma...");
    try {
      const res  = await fetch("https://world.openfoodfacts.org/api/v0/product/" + code.trim() + ".json");
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const n = p.nutriments || {};
        let name = p.product_name_lt || p.product_name || p.product_name_en || "Nežinomas produktas";
        name = await translateToLT(name);
        onResult({
          name, brand: p.brands || "", amount: 100,
          kcal:    Math.round(n["energy-kcal_100g"] || 0),
          protein: Math.round((n["proteins_100g"]      || 0) * 10) / 10,
          fat:     Math.round((n["fat_100g"]           || 0) * 10) / 10,
          carbs:   Math.round((n["carbohydrates_100g"] || 0) * 10) / 10,
        });
        return;
      }
      detectedRef.current = false;
      setMsg("Produktas nerastas (" + code + "). Bandyk dar kartą.");
      setSearching(false);
      Quagga.start();
      setStarted(true);
    } catch(e) {
      setMsg("Klaida. Patikrink internetą.");
      setSearching(false);
      detectedRef.current = false;
    }
  }

  async function handleManual() {
    if (!manual || manual.trim().length < 6) return;
    try { Quagga.stop(); } catch(e) {}
    setStarted(false);
    await lookupBarcode(manual.trim());
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:300, background:"#000", display:"flex", flexDirection:"column" }}>
      <div style={{ background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <h3 style={{ color:"#fff", margin:0, fontSize:16, fontWeight:700 }}>📷 Barkodo skenavimas</h3>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", borderRadius:8, padding:"8px 12px", color:"#fff", cursor:"pointer", fontSize:14 }}>✕</button>
      </div>

      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        <div ref={scannerRef} style={{ width:"100%", height:"100%", position:"relative" }}>
          <canvas className="drawingBuffer" style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:1 }} />
        </div>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:2, pointerEvents:"none" }}>
          <div style={{ width:"80%", maxWidth:300, height:100, position:"relative" }}>
            <div style={{ position:"absolute", inset:0, boxShadow:"0 0 0 2000px rgba(0,0,0,0.5)", borderRadius:8 }} />
            <div style={{ position:"absolute", inset:0, border:"3px solid "+(started?PK.rose:"rgba(255,255,255,0.3)"), borderRadius:8 }} />
          </div>
        </div>
        <div style={{ position:"absolute", bottom:120, left:0, right:0, display:"flex", justifyContent:"center", zIndex:3, padding:"0 20px" }}>
          <div style={{ background:"rgba(0,0,0,0.75)", borderRadius:12, padding:"10px 20px" }}>
            <p style={{ color:searching?PK.coral:started?PK.blush:"rgba(255,255,255,0.5)", fontSize:13, margin:0 }}>
              {searching ? "⏳ " : started ? "🟢 " : "⚪ "}{msg}
            </p>
          </div>
        </div>
      </div>

      <div style={{ background:"rgba(0,0,0,0.9)", padding:"16px 20px", flexShrink:0 }}>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:11, textAlign:"center", marginBottom:10 }}>arba įvesk barkodą rankiniu būdu</p>
        <div style={{ display:"flex", gap:8 }}>
          <input
            type="number"
            value={manual}
            onChange={e => setManual(e.target.value)}
            onKeyDown={e => e.key==="Enter" && handleManual()}
            placeholder="pvz. 4008400175478"
            style={{ flex:1, padding:"12px 14px", border:"none", borderRadius:12, fontSize:14, color:PK.dark, background:"rgba(255,255,255,0.92)", outline:"none", fontFamily:"inherit" }}
          />
          <button onClick={handleManual} disabled={searching}
            style={{ padding:"12px 16px", background:"linear-gradient(135deg,"+PK.dark+","+PK.mid+")", color:"#fff", border:"none", borderRadius:12, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
            Ieškoti
          </button>
        </div>
      </div>
    </div>
  );
}

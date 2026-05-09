// Vietinė lietuviška maisto duomenų bazė
// Maistingumas per 100g, vienetai su svoriais

export const LOCAL_FOODS = [
  // ── KIAUŠINIAI ─────────────────────────────────────────────────────────
  { id:"egg_m",     name:"Kiaušinis (vidutinis)", category:"Kiaušiniai",    kcal:143, protein:12.6, fat:9.5,  carbs:0.7, units:[{ label:"1 vnt (55g)", grams:55 },{ label:"2 vnt",grams:110 },{ label:"3 vnt",grams:165 }] },
  { id:"egg_l",     name:"Kiaušinis (didelis)",   category:"Kiaušiniai",    kcal:143, protein:12.6, fat:9.5,  carbs:0.7, units:[{ label:"1 vnt (65g)", grams:65 },{ label:"2 vnt",grams:130 }] },
  { id:"egg_white", name:"Kiaušinio baltymas",     category:"Kiaušiniai",    kcal:52,  protein:10.9, fat:0.2,  carbs:0.7, units:[{ label:"1 vnt (33g)", grams:33 },{ label:"2 vnt",grams:66 }] },

  // ── MĖSA ───────────────────────────────────────────────────────────────
  { id:"chick_breast", name:"Vištienos krūtinėlė (virta)",  category:"Mėsa", kcal:165, protein:31,   fat:3.6,  carbs:0,   units:[{ label:"1 porcija (150g)", grams:150 },{ label:"½ porcija (75g)", grams:75 }] },
  { id:"chick_thigh",  name:"Vištienos šlaunelė (virta)",   category:"Mėsa", kcal:209, protein:26,   fat:11,   carbs:0,   units:[{ label:"1 vnt (100g)", grams:100 },{ label:"2 vnt",grams:200 }] },
  { id:"beef_lean",    name:"Jautiena (liesa, virta)",       category:"Mėsa", kcal:215, protein:26,   fat:12,   carbs:0,   units:[{ label:"1 porcija (150g)", grams:150 }] },
  { id:"pork_lean",    name:"Kiauliena (liesa, virta)",      category:"Mėsa", kcal:242, protein:27,   fat:14,   carbs:0,   units:[{ label:"1 porcija (150g)", grams:150 }] },
  { id:"turkey",       name:"Kalakutiena (krūtinėlė, virta)",category:"Mėsa", kcal:189, protein:29,   fat:7.4,  carbs:0,   units:[{ label:"1 porcija (150g)", grams:150 }] },
  { id:"tuna_can",     name:"Tunas (konservuotas vandenyje)", category:"Mėsa", kcal:116, protein:26,   fat:0.5,  carbs:0,   units:[{ label:"1 skardinė (160g)", grams:160 },{ label:"½ skardinė", grams:80 }] },
  { id:"salmon",       name:"Lašiša (kepta)",                category:"Mėsa", kcal:206, protein:20,   fat:13,   carbs:0,   units:[{ label:"1 porcija (150g)", grams:150 }] },
  { id:"shrimp",       name:"Krevetės (virtos)",             category:"Mėsa", kcal:99,  protein:24,   fat:0.3,  carbs:0.2, units:[{ label:"1 porcija (150g)", grams:150 }] },

  // ── PIENO PRODUKTAI ────────────────────────────────────────────────────
  { id:"cottage",   name:"Varškė (5% riebumo)",   category:"Pieno produktai", kcal:103, protein:11,   fat:4.5,  carbs:3.4, units:[{ label:"½ puodelis (120g)", grams:120 },{ label:"1 puodelis (240g)", grams:240 }] },
  { id:"greek_yog", name:"Graikiškas jogurtas (0%)",category:"Pieno produktai",kcal:59,  protein:10.2, fat:0.4,  carbs:3.6, units:[{ label:"1 indelis (150g)", grams:150 },{ label:"1 puodelis (200g)", grams:200 }] },
  { id:"milk_whole",name:"Pienas (3,5%)",          category:"Pieno produktai", kcal:61,  protein:3.2,  fat:3.5,  carbs:4.8, units:[{ label:"1 stiklinė (200ml)", grams:200 },{ label:"½ stiklinė", grams:100 }] },
  { id:"milk_skim", name:"Pienas (liesas, 0,5%)",  category:"Pieno produktai", kcal:35,  protein:3.4,  fat:0.5,  carbs:5.0, units:[{ label:"1 stiklinė (200ml)", grams:200 }] },
  { id:"cheese_ch", name:"Čederio sūris",          category:"Pieno produktai", kcal:402, protein:25,   fat:33,   carbs:1.3, units:[{ label:"1 riekelė (30g)", grams:30 },{ label:"2 riekelės", grams:60 }] },
  { id:"mozzarella",name:"Mocarela (lengva)",      category:"Pieno produktai", kcal:254, protein:28,   fat:15,   carbs:2.8, units:[{ label:"1 porcija (80g)", grams:80 }] },
  { id:"butter",    name:"Sviestas",               category:"Pieno produktai", kcal:717, protein:0.5,  fat:81,   carbs:0.1, units:[{ label:"1 šaukštelis (5g)", grams:5 },{ label:"1 šaukštas (15g)", grams:15 }] },

  // ── GRŪDAI IR DUONA ────────────────────────────────────────────────────
  { id:"oats",       name:"Avižiniai dribsniai (sausi)",category:"Grūdai", kcal:389, protein:17,   fat:7,    carbs:66,  units:[{ label:"½ puodelio (40g)", grams:40 },{ label:"1 puodelis (80g)", grams:80 }] },
  { id:"rice_white", name:"Ryžiai balti (virti)",       category:"Grūdai", kcal:130, protein:2.7,  fat:0.3,  carbs:28,  units:[{ label:"½ puodelio (100g)", grams:100 },{ label:"1 puodelis (200g)", grams:200 }] },
  { id:"rice_brown", name:"Ryžiai rudieji (virti)",     category:"Grūdai", kcal:122, protein:2.6,  fat:1,    carbs:26,  units:[{ label:"½ puodelio (100g)", grams:100 },{ label:"1 puodelis (200g)", grams:200 }] },
  { id:"pasta",      name:"Makaronai (virti)",          category:"Grūdai", kcal:158, protein:5.8,  fat:0.9,  carbs:31,  units:[{ label:"1 porcija (200g)", grams:200 }] },
  { id:"bread_rye",  name:"Ruginė duona",               category:"Grūdai", kcal:259, protein:8.5,  fat:3.3,  carbs:48,  units:[{ label:"1 riekelė (30g)", grams:30 },{ label:"2 riekelės", grams:60 }] },
  { id:"bread_wht",  name:"Balta duona",                category:"Grūdai", kcal:265, protein:9,    fat:3.2,  carbs:49,  units:[{ label:"1 riekelė (30g)", grams:30 },{ label:"2 riekelės", grams:60 }] },
  { id:"buckwheat",  name:"Grikiai (virti)",            category:"Grūdai", kcal:92,  protein:3.4,  fat:0.6,  carbs:20,  units:[{ label:"½ puodelio (100g)", grams:100 },{ label:"1 puodelis (200g)", grams:200 }] },

  // ── ANKŠTINIAI ─────────────────────────────────────────────────────────
  { id:"lentils",   name:"Lęšiai (virti)",           category:"Ankštiniai", kcal:116, protein:9,    fat:0.4,  carbs:20,  units:[{ label:"½ puodelio (100g)", grams:100 },{ label:"1 puodelis (200g)", grams:200 }] },
  { id:"chickpeas", name:"Avinžirniai (virti)",      category:"Ankštiniai", kcal:164, protein:8.9,  fat:2.6,  carbs:27,  units:[{ label:"½ puodelio (100g)", grams:100 }] },
  { id:"beans_blk", name:"Juodosios pupelės (virtos)",category:"Ankštiniai", kcal:132, protein:8.9,  fat:0.5,  carbs:24,  units:[{ label:"½ puodelio (100g)", grams:100 }] },

  // ── DARŽOVĖS ───────────────────────────────────────────────────────────
  { id:"broccoli",  name:"Brokoliai (virti)",   category:"Daržovės", kcal:35,  protein:2.4,  fat:0.4,  carbs:7.2, units:[{ label:"1 porcija (150g)", grams:150 },{ label:"½ porcija", grams:75 }] },
  { id:"spinach",   name:"Špinatai (švieži)",   category:"Daržovės", kcal:23,  protein:2.9,  fat:0.4,  carbs:3.6, units:[{ label:"1 sauja (30g)", grams:30 },{ label:"didelė sautelė (60g)", grams:60 }] },
  { id:"carrot",    name:"Morkos",              category:"Daržovės", kcal:41,  protein:0.9,  fat:0.2,  carbs:10,  units:[{ label:"1 vidutin. (80g)", grams:80 },{ label:"2 vnt", grams:160 }] },
  { id:"tomato",    name:"Pomidoras",           category:"Daržovės", kcal:18,  protein:0.9,  fat:0.2,  carbs:3.9, units:[{ label:"1 vidutin. (120g)", grams:120 },{ label:"2 vnt", grams:240 }] },
  { id:"cucumber",  name:"Agurkas",             category:"Daržovės", kcal:15,  protein:0.7,  fat:0.1,  carbs:3.6, units:[{ label:"½ agurko (100g)", grams:100 },{ label:"1 visas (200g)", grams:200 }] },
  { id:"pepper_red",name:"Raudonoji paprika",   category:"Daržovės", kcal:31,  protein:1,    fat:0.3,  carbs:6,   units:[{ label:"1 vnt (150g)", grams:150 },{ label:"½ vnt", grams:75 }] },
  { id:"onion",     name:"Svogūnas",            category:"Daržovės", kcal:40,  protein:1.1,  fat:0.1,  carbs:9.3, units:[{ label:"1 vidutin. (110g)", grams:110 },{ label:"½ svogūno", grams:55 }] },
  { id:"potato",    name:"Bulvė (virta)",       category:"Daržovės", kcal:87,  protein:1.9,  fat:0.1,  carbs:20,  units:[{ label:"1 vidutin. (150g)", grams:150 },{ label:"2 vnt", grams:300 }] },
  { id:"sweetpot",  name:"Saldžioji bulvė (virta)",category:"Daržovės",kcal:86, protein:1.6,  fat:0.1,  carbs:20,  units:[{ label:"1 vidutin. (150g)", grams:150 }] },
  { id:"avocado",   name:"Avokadas",            category:"Daržovės", kcal:160, protein:2,    fat:15,   carbs:9,   units:[{ label:"½ vnt (75g)", grams:75 },{ label:"1 visas (150g)", grams:150 }] },

  // ── VAISIAI ────────────────────────────────────────────────────────────
  { id:"banana",    name:"Bananas",            category:"Vaisiai", kcal:89,  protein:1.1,  fat:0.3,  carbs:23,  units:[{ label:"1 vidutin. (120g)", grams:120 },{ label:"1 didelis (150g)", grams:150 }] },
  { id:"apple",     name:"Obuolys",            category:"Vaisiai", kcal:52,  protein:0.3,  fat:0.2,  carbs:14,  units:[{ label:"1 vidutin. (150g)", grams:150 },{ label:"1 didelis (200g)", grams:200 }] },
  { id:"orange",    name:"Apelsinas",          category:"Vaisiai", kcal:47,  protein:0.9,  fat:0.1,  carbs:12,  units:[{ label:"1 vnt (150g)", grams:150 }] },
  { id:"berries_mix",name:"Uogos (mišinys)",   category:"Vaisiai", kcal:57,  protein:0.7,  fat:0.5,  carbs:14,  units:[{ label:"½ puodelio (75g)", grams:75 },{ label:"1 puodelis (150g)", grams:150 }] },
  { id:"strawberry",name:"Braškės",            category:"Vaisiai", kcal:32,  protein:0.7,  fat:0.3,  carbs:7.7, units:[{ label:"10 vnt (100g)", grams:100 },{ label:"20 vnt (200g)", grams:200 }] },

  // ── RIEŠUTAI IR SĖKLOS ─────────────────────────────────────────────────
  { id:"almonds",   name:"Migdolai",           category:"Riešutai", kcal:579, protein:21,   fat:50,   carbs:22,  units:[{ label:"sauja (30g)", grams:30 },{ label:"2 saujos (60g)", grams:60 }] },
  { id:"walnuts",   name:"Graikiniai riešutai",category:"Riešutai", kcal:654, protein:15,   fat:65,   carbs:14,  units:[{ label:"sauja (30g)", grams:30 }] },
  { id:"pb",        name:"Žemės riešutų sviestas",category:"Riešutai",kcal:588,protein:25,  fat:50,   carbs:20,  units:[{ label:"1 šaukštas (16g)", grams:16 },{ label:"2 šaukštai (32g)", grams:32 }] },
  { id:"chia",      name:"Čia sėklos",         category:"Riešutai", kcal:486, protein:17,   fat:31,   carbs:42,  units:[{ label:"1 šaukštas (15g)", grams:15 }] },

  // ── ALIEJAI ────────────────────────────────────────────────────────────
  { id:"olive_oil", name:"Alyvuogių aliejus",  category:"Riebalai", kcal:884, protein:0,    fat:100,  carbs:0,   units:[{ label:"1 šaukštelis (5ml)", grams:5 },{ label:"1 šaukštas (15ml)", grams:15 }] },
  { id:"coco_oil",  name:"Kokosų aliejus",     category:"Riebalai", kcal:862, protein:0,    fat:100,  carbs:0,   units:[{ label:"1 šaukštelis (5g)", grams:5 },{ label:"1 šaukštas (15g)", grams:15 }] },

  // ── GĖRIMAI ────────────────────────────────────────────────────────────
  { id:"protein_sh",name:"Baltyminis kokteilius (vidut.)",category:"Gėrimai",kcal:120,protein:25,fat:2,carbs:5,units:[{ label:"1 porcija (300ml)", grams:300 }] },
  { id:"coffee_bl", name:"Juoda kava",          category:"Gėrimai", kcal:2,   protein:0.3,  fat:0,    carbs:0,   units:[{ label:"1 puodelis (200ml)", grams:200 }] },
  { id:"orange_j",  name:"Apelsinų sultys",     category:"Gėrimai", kcal:45,  protein:0.7,  fat:0.2,  carbs:10,  units:[{ label:"1 stiklinė (200ml)", grams:200 }] },
];

export function searchLocalFoods(query) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return LOCAL_FOODS.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.category.toLowerCase().includes(q)
  ).slice(0, 8);
}

export const CATEGORIES = [...new Set(LOCAL_FOODS.map(f => f.category))];

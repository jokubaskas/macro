// ── VIETINĖ MAISTO DUOMENŲ BAZĖ ───────────────────────────────────────────
export const LOCAL_FOODS = [
  // ── KIAUŠINIAI ─────────────────────────────────────────────────────────
  { id:"egg_m",      name:"Kiaušinis (vidutinis)",      category:"Kiaušiniai",     kcal:143, protein:12.6, fat:9.5,  carbs:0.7, units:[{label:"1 vnt (55g)",grams:55},{label:"2 vnt",grams:110},{label:"3 vnt",grams:165}] },
  { id:"egg_l",      name:"Kiaušinis (didelis)",        category:"Kiaušiniai",     kcal:143, protein:12.6, fat:9.5,  carbs:0.7, units:[{label:"1 vnt (65g)",grams:65},{label:"2 vnt",grams:130},{label:"3 vnt",grams:195}] },
  { id:"egg_white",  name:"Kiaušinio baltymas",         category:"Kiaušiniai",     kcal:52,  protein:10.9, fat:0.2,  carbs:0.7, units:[{label:"1 vnt (33g)",grams:33},{label:"2 vnt",grams:66},{label:"4 vnt",grams:132}] },
  { id:"egg_yolk",   name:"Kiaušinio trynys",           category:"Kiaušiniai",     kcal:322, protein:15.9, fat:26.5, carbs:3.6, units:[{label:"1 vnt (18g)",grams:18},{label:"2 vnt",grams:36}] },
  { id:"egg_scr",    name:"Kiaušinienė (2 kiaušiniai)", category:"Kiaušiniai",     kcal:148, protein:10,   fat:11,   carbs:1.6, units:[{label:"1 porcija (130g)",grams:130}] },

  // ── VIŠTIENA ───────────────────────────────────────────────────────────
  { id:"chick_br_r", name:"Vištienos krūtinėlė (žalia)", category:"Mėsa – vištiena", kcal:120, protein:22.5, fat:2.6, carbs:0, units:[{label:"1 filė (150g)",grams:150},{label:"1 filė (200g)",grams:200}] },
  { id:"chick_br_c", name:"Vištienos krūtinėlė (virta)", category:"Mėsa – vištiena", kcal:165, protein:31,   fat:3.6, carbs:0, units:[{label:"1 porcija (150g)",grams:150},{label:"½ porcija",grams:75}] },
  { id:"chick_br_b", name:"Vištienos krūtinėlė (kepta)", category:"Mėsa – vištiena", kcal:195, protein:29,   fat:8.5, carbs:0, units:[{label:"1 porcija (150g)",grams:150}] },
  { id:"chick_th_c", name:"Vištienos šlaunelė (virta)",  category:"Mėsa – vištiena", kcal:209, protein:26,   fat:11,  carbs:0, units:[{label:"1 vnt (100g)",grams:100},{label:"2 vnt",grams:200}] },
  { id:"chick_wing", name:"Vištienos sparneliai (kepti)", category:"Mėsa – vištiena", kcal:290, protein:27,   fat:19,  carbs:0, units:[{label:"2 vnt (80g)",grams:80},{label:"4 vnt",grams:160}] },
  { id:"chick_min",  name:"Vištienos maltinukai",         category:"Mėsa – vištiena", kcal:143, protein:17,   fat:8,   carbs:0, units:[{label:"1 porcija (150g)",grams:150}] },

  // ── JAUTIENA / KIAULIENA ──────────────────────────────────────────────
  { id:"beef_lean",  name:"Jautiena liesa (virta)",      category:"Mėsa – raudona", kcal:215, protein:26,   fat:12,   carbs:0, units:[{label:"1 porcija (150g)",grams:150}] },
  { id:"beef_min",   name:"Jautienos miltinukai (10%)",  category:"Mėsa – raudona", kcal:215, protein:21,   fat:14,   carbs:0, units:[{label:"1 porcija (150g)",grams:150}] },
  { id:"beef_steak", name:"Jautienos kepsnys (liesas)",  category:"Mėsa – raudona", kcal:207, protein:27,   fat:11,   carbs:0, units:[{label:"1 kepsnys (180g)",grams:180}] },
  { id:"pork_lean",  name:"Kiauliena liesa (virta)",     category:"Mėsa – raudona", kcal:242, protein:27,   fat:14,   carbs:0, units:[{label:"1 porcija (150g)",grams:150}] },
  { id:"pork_ch",    name:"Kiaulienos kotletas (keptas)",category:"Mėsa – raudona", kcal:280, protein:25,   fat:19,   carbs:0, units:[{label:"1 vnt (130g)",grams:130}] },
  { id:"bacon",      name:"Bekono juostelės (keptos)",   category:"Mėsa – raudona", kcal:541, protein:37,   fat:42,   carbs:1.4,units:[{label:"2 juostelės (20g)",grams:20},{label:"4 juostelės",grams:40}] },
  { id:"turkey_br",  name:"Kalakutiena (krūtinėlė, virta)",category:"Mėsa – vištiena",kcal:189,protein:29, fat:7.4,  carbs:0, units:[{label:"1 porcija (150g)",grams:150}] },
  { id:"saus_chick", name:"Vištienos dešrelė (virta)",   category:"Mėsa – vištiena", kcal:172, protein:14,   fat:12,   carbs:2, units:[{label:"1 vnt (60g)",grams:60},{label:"2 vnt",grams:120}] },

  // ── ŽUVIS IR JŪROS GĖRYBĖS ────────────────────────────────────────────
  { id:"tuna_can",   name:"Tunas vandenyje (konservuotas)", category:"Žuvis",      kcal:116, protein:26,   fat:0.5,  carbs:0, units:[{label:"1 skardinė (160g)",grams:160},{label:"½ skardinė",grams:80}] },
  { id:"tuna_oil",   name:"Tunas aliejuje (konservuotas)",  category:"Žuvis",      kcal:198, protein:25,   fat:10,   carbs:0, units:[{label:"1 skardinė (160g)",grams:160}] },
  { id:"salmon_c",   name:"Lašiša (kepta)",                 category:"Žuvis",      kcal:206, protein:20,   fat:13,   carbs:0, units:[{label:"1 filė (150g)",grams:150},{label:"1 filė (200g)",grams:200}] },
  { id:"cod",        name:"Menkė (virta)",                  category:"Žuvis",      kcal:105, protein:23,   fat:0.9,  carbs:0, units:[{label:"1 filė (150g)",grams:150},{label:"2 vnt",grams:300}] },
  { id:"herring",    name:"Silkė (marinuota)",              category:"Žuvis",      kcal:158, protein:17,   fat:9,    carbs:2.5,units:[{label:"1 filė (80g)",grams:80},{label:"2 filės",grams:160}] },
  { id:"shrimp",     name:"Krevetės (virtos)",              category:"Žuvis",      kcal:99,  protein:24,   fat:0.3,  carbs:0.2,units:[{label:"1 porcija (150g)",grams:150},{label:"½ porcija",grams:75}] },
  { id:"mackerel",   name:"Skumbrė (rūkyta)",              category:"Žuvis",      kcal:305, protein:19,   fat:25,   carbs:0, units:[{label:"1 filė (120g)",grams:120}] },

  // ── PIENO PRODUKTAI ────────────────────────────────────────────────────
  { id:"cottage_5",  name:"Varškė 5%",                   category:"Pieno produktai", kcal:103, protein:11,   fat:4.5,  carbs:3.4, units:[{label:"½ puodelis (120g)",grams:120},{label:"1 puodelis (240g)",grams:240}] },
  { id:"cottage_0",  name:"Varškė 0%",                   category:"Pieno produktai", kcal:72,  protein:12.4, fat:0.3,  carbs:3.4, units:[{label:"½ puodelis (120g)",grams:120},{label:"1 puodelis (240g)",grams:240}] },
  { id:"greek_0",    name:"Graikiškas jogurtas 0%",      category:"Pieno produktai", kcal:59,  protein:10.2, fat:0.4,  carbs:3.6, units:[{label:"1 indelis (150g)",grams:150},{label:"1 puodelis (200g)",grams:200}] },
  { id:"greek_2",    name:"Graikiškas jogurtas 2%",      category:"Pieno produktai", kcal:73,  protein:9.9,  fat:1.9,  carbs:3.6, units:[{label:"1 indelis (150g)",grams:150}] },
  { id:"jogurt_nat", name:"Natūralus jogurtas",          category:"Pieno produktai", kcal:61,  protein:3.5,  fat:3.3,  carbs:4.7, units:[{label:"1 indelis (150g)",grams:150},{label:"1 puodelis (200g)",grams:200}] },
  { id:"milk_35",    name:"Pienas 3,5%",                 category:"Pieno produktai", kcal:61,  protein:3.2,  fat:3.5,  carbs:4.8, units:[{label:"1 stiklinė (200ml)",grams:200},{label:"½ stiklinė",grams:100}] },
  { id:"milk_15",    name:"Pienas 1,5%",                 category:"Pieno produktai", kcal:46,  protein:3.3,  fat:1.5,  carbs:4.8, units:[{label:"1 stiklinė (200ml)",grams:200}] },
  { id:"milk_0",     name:"Liesas pienas 0,5%",          category:"Pieno produktai", kcal:35,  protein:3.4,  fat:0.5,  carbs:5.0, units:[{label:"1 stiklinė (200ml)",grams:200}] },
  { id:"kefir",      name:"Kefyras",                     category:"Pieno produktai", kcal:52,  protein:3.3,  fat:1.5,  carbs:4.8, units:[{label:"1 stiklinė (200ml)",grams:200}] },
  { id:"cheese_ch",  name:"Čederio sūris",               category:"Pieno produktai", kcal:402, protein:25,   fat:33,   carbs:1.3, units:[{label:"1 riekelė (30g)",grams:30},{label:"2 riekelės",grams:60}] },
  { id:"mozz",       name:"Mocarela (lengva)",           category:"Pieno produktai", kcal:254, protein:28,   fat:15,   carbs:2.8, units:[{label:"1 rutuliukas (80g)",grams:80}] },
  { id:"parmes",     name:"Parmezanas (tarkuotas)",      category:"Pieno produktai", kcal:431, protein:38,   fat:29,   carbs:3.2, units:[{label:"1 šaukštas (10g)",grams:10},{label:"2 šaukštai",grams:20}] },
  { id:"cream_ch",   name:"Grietinėlės sūris",           category:"Pieno produktai", kcal:342, protein:6,    fat:34,   carbs:4,   units:[{label:"1 šaukštas (30g)",grams:30}] },
  { id:"sour_cr",    name:"Grietinė 15%",                category:"Pieno produktai", kcal:163, protein:2.7,  fat:15,   carbs:3.8, units:[{label:"1 šaukštas (25g)",grams:25},{label:"2 šaukštai",grams:50}] },
  { id:"butter",     name:"Sviestas",                    category:"Pieno produktai", kcal:717, protein:0.5,  fat:81,   carbs:0.1, units:[{label:"1 šaukštelis (5g)",grams:5},{label:"1 šaukštas (15g)",grams:15}] },
  { id:"prot_powder",name:"Baltymų milteliai (whey)",    category:"Pieno produktai", kcal:380, protein:75,   fat:5,    carbs:8,   units:[{label:"1 porcija (30g)",grams:30}] },

  // ── GRŪDAI ─────────────────────────────────────────────────────────────
  { id:"oats_dry",   name:"Avižiniai dribsniai (sausi)", category:"Grūdai",     kcal:389, protein:17,   fat:7,    carbs:66,  units:[{label:"½ puodelio (40g)",grams:40},{label:"1 puodelis (80g)",grams:80}] },
  { id:"rice_wh",    name:"Ryžiai balti (virti)",        category:"Grūdai",     kcal:130, protein:2.7,  fat:0.3,  carbs:28,  units:[{label:"½ puodelio (100g)",grams:100},{label:"1 puodelis (200g)",grams:200}] },
  { id:"rice_br",    name:"Ryžiai rudieji (virti)",      category:"Grūdai",     kcal:122, protein:2.6,  fat:1,    carbs:26,  units:[{label:"½ puodelio (100g)",grams:100},{label:"1 puodelis (200g)",grams:200}] },
  { id:"pasta_c",    name:"Makaronai (virti)",           category:"Grūdai",     kcal:158, protein:5.8,  fat:0.9,  carbs:31,  units:[{label:"1 porcija (200g)",grams:200},{label:"½ porcija",grams:100}] },
  { id:"pasta_wh",   name:"Makaronai iš kviečių (virti)",category:"Grūdai",    kcal:124, protein:5.3,  fat:0.5,  carbs:26,  units:[{label:"1 porcija (200g)",grams:200}] },
  { id:"bread_rye",  name:"Ruginė duona",                category:"Grūdai",     kcal:259, protein:8.5,  fat:3.3,  carbs:48,  units:[{label:"1 riekelė (30g)",grams:30},{label:"2 riekelės",grams:60}] },
  { id:"bread_wh",   name:"Balta duona",                 category:"Grūdai",     kcal:265, protein:9,    fat:3.2,  carbs:49,  units:[{label:"1 riekelė (30g)",grams:30},{label:"2 riekelės",grams:60}] },
  { id:"bread_wht",  name:"Duona iš visų grūdų",         category:"Grūdai",     kcal:247, protein:13,   fat:3.4,  carbs:41,  units:[{label:"1 riekelė (35g)",grams:35},{label:"2 riekelės",grams:70}] },
  { id:"buckwheat",  name:"Grikiai (virti)",              category:"Grūdai",     kcal:92,  protein:3.4,  fat:0.6,  carbs:20,  units:[{label:"½ puodelio (100g)",grams:100},{label:"1 puodelis (200g)",grams:200}] },
  { id:"quinoa",     name:"Kvietinukai (virti)",          category:"Grūdai",     kcal:120, protein:4.4,  fat:1.9,  carbs:22,  units:[{label:"½ puodelio (100g)",grams:100},{label:"1 puodelis (200g)",grams:200}] },
  { id:"couscous",   name:"Kuskusas (virti)",             category:"Grūdai",     kcal:112, protein:3.8,  fat:0.2,  carbs:23,  units:[{label:"½ puodelio (100g)",grams:100}] },
  { id:"crisp",      name:"Ryžių/kukurūzų traškučiai",   category:"Grūdai",     kcal:372, protein:7,    fat:2,    carbs:82,  units:[{label:"1 gabalėlis (10g)",grams:10},{label:"3 gabalėliai",grams:30}] },
  { id:"muesli",     name:"Miuslis (be cukraus)",         category:"Grūdai",     kcal:352, protein:11,   fat:7,    carbs:63,  units:[{label:"½ puodelio (50g)",grams:50}] },
  { id:"corn_flour", name:"Kukurūzų miltai",              category:"Grūdai",     kcal:365, protein:9,    fat:4,    carbs:74,  units:[{label:"1 šaukštas (10g)",grams:10}] },

  // ── ANKŠTINIAI ─────────────────────────────────────────────────────────
  { id:"lentils",    name:"Lęšiai (virti)",             category:"Ankštiniai", kcal:116, protein:9,    fat:0.4,  carbs:20,  units:[{label:"½ puodelio (100g)",grams:100},{label:"1 puodelis (200g)",grams:200}] },
  { id:"chickpeas",  name:"Avinžirniai (virti)",        category:"Ankštiniai", kcal:164, protein:8.9,  fat:2.6,  carbs:27,  units:[{label:"½ puodelio (100g)",grams:100},{label:"1 puodelis (200g)",grams:200}] },
  { id:"black_beans",name:"Juodosios pupelės (virtos)", category:"Ankštiniai", kcal:132, protein:8.9,  fat:0.5,  carbs:24,  units:[{label:"½ puodelio (100g)",grams:100}] },
  { id:"kidney_b",   name:"Raudonosios pupelės (virtos)",category:"Ankštiniai",kcal:127, protein:8.7,  fat:0.5,  carbs:23,  units:[{label:"½ puodelio (100g)",grams:100}] },
  { id:"edamame_b",  name:"Edamame (virtų, su ankštiena)",category:"Ankštiniai",kcal:121,protein:11,  fat:5,    carbs:9,   units:[{label:"½ puodelio (100g)",grams:100}] },

  // ── DARŽOVĖS ───────────────────────────────────────────────────────────
  { id:"broccoli",   name:"Brokoliai (virti)",          category:"Daržovės", kcal:35,  protein:2.4,  fat:0.4,  carbs:7.2, units:[{label:"1 porcija (150g)",grams:150},{label:"2 porcijos",grams:300}] },
  { id:"spinach",    name:"Špinatai (virti)",            category:"Daržovės", kcal:23,  protein:2.9,  fat:0.4,  carbs:3.6, units:[{label:"1 porcija (80g)",grams:80},{label:"2 vnt",grams:160}] },
  { id:"tomato",     name:"Pomidoras",                  category:"Daržovės", kcal:18,  protein:0.9,  fat:0.2,  carbs:3.9, units:[{label:"1 vidutin. (120g)",grams:120},{label:"2 vnt",grams:240}] },
  { id:"tom_cherry", name:"Vyšniniai pomidorai",        category:"Daržovės", kcal:18,  protein:0.9,  fat:0.2,  carbs:3.9, units:[{label:"10 vnt (100g)",grams:100},{label:"20 vnt",grams:200}] },
  { id:"cucumber",   name:"Agurkas",                    category:"Daržovės", kcal:15,  protein:0.7,  fat:0.1,  carbs:3.6, units:[{label:"½ agurko (100g)",grams:100},{label:"1 visas (200g)",grams:200}] },
  { id:"pepper_red", name:"Raudonoji paprika",          category:"Daržovės", kcal:31,  protein:1,    fat:0.3,  carbs:6,   units:[{label:"1 vnt (150g)",grams:150},{label:"½ vnt",grams:75}] },
  { id:"pepper_grn", name:"Žalioji paprika",            category:"Daržovės", kcal:20,  protein:0.9,  fat:0.2,  carbs:4.6, units:[{label:"1 vnt (150g)",grams:150},{label:"½ vnt",grams:75}] },
  { id:"onion",      name:"Svogūnas",                   category:"Daržovės", kcal:40,  protein:1.1,  fat:0.1,  carbs:9.3, units:[{label:"1 vidutin. (110g)",grams:110},{label:"½ svogūno",grams:55}] },
  { id:"garlic",     name:"Česnakas",                   category:"Daržovės", kcal:149, protein:6.4,  fat:0.5,  carbs:33,  units:[{label:"1 skiltelė (5g)",grams:5},{label:"2 skiltelės",grams:10}] },
  { id:"zucchini",   name:"Cukinija (kepta)",           category:"Daržovės", kcal:17,  protein:1.2,  fat:0.3,  carbs:3.1, units:[{label:"1 porcija (150g)",grams:150}] },
  { id:"eggplant",   name:"Baklažanas (keptas)",        category:"Daržovės", kcal:35,  protein:0.8,  fat:0.2,  carbs:8.7, units:[{label:"1 porcija (150g)",grams:150}] },
  { id:"mushroom",   name:"Pievagrybiai (kepti)",       category:"Daržovės", kcal:29,  protein:1.8,  fat:1.7,  carbs:4.4, units:[{label:"5 vnt (100g)",grams:100},{label:"10 vnt",grams:200}] },
  { id:"lettuce",    name:"Salotos (lapinės)",          category:"Daržovės", kcal:15,  protein:1.4,  fat:0.2,  carbs:2.9, units:[{label:"1 saujelė (30g)",grams:30},{label:"1 didelė porcija (80g)",grams:80}] },
  { id:"potato",     name:"Bulvė (virta)",              category:"Daržovės", kcal:87,  protein:1.9,  fat:0.1,  carbs:20,  units:[{label:"1 vidutin. (150g)",grams:150},{label:"2 vnt",grams:300}] },
  { id:"sweet_pot",  name:"Saldžioji bulvė (virta)",   category:"Daržovės", kcal:86,  protein:1.6,  fat:0.1,  carbs:20,  units:[{label:"1 vidutin. (150g)",grams:150}] },
  { id:"avocado",    name:"Avokadas",                   category:"Daržovės", kcal:160, protein:2,    fat:15,   carbs:9,   units:[{label:"½ vnt (75g)",grams:75},{label:"1 visas (150g)",grams:150}] },
  { id:"beetroot",   name:"Burokėliai (virti)",         category:"Daržovės", kcal:43,  protein:1.6,  fat:0.2,  carbs:10,  units:[{label:"1 vidutin. (100g)",grams:100}] },
  { id:"cabbage",    name:"Kopūstai (švieži)",          category:"Daržovės", kcal:25,  protein:1.3,  fat:0.1,  carbs:5.8, units:[{label:"1 porcija (100g)",grams:100}] },
  { id:"corn",       name:"Kukurūzai (skardinė, nusausintas)",category:"Daržovės",kcal:86,protein:3.2,fat:1.2,carbs:19,units:[{label:"½ skardinė (100g)",grams:100},{label:"1 skardinė (200g)",grams:200}] },
  { id:"asparagus",  name:"Šparagų pupelės (virtos)",  category:"Daržovės", kcal:20,  protein:2.2,  fat:0.1,  carbs:3.9, units:[{label:"1 porcija (100g)",grams:100}] },
  { id:"peas_frz",   name:"Žirneliai (užšaldyti, virti)",category:"Daržovės",kcal:69,protein:5,    fat:0.4,  carbs:12,  units:[{label:"½ puodelio (80g)",grams:80}] },

  // ── VAISIAI ────────────────────────────────────────────────────────────
  { id:"banana",     name:"Bananas",                    category:"Vaisiai", kcal:89,  protein:1.1,  fat:0.3,  carbs:23,  units:[{label:"1 mažas (90g)",grams:90},{label:"1 vidutin. (120g)",grams:120},{label:"1 didelis (150g)",grams:150}] },
  { id:"apple",      name:"Obuolys",                    category:"Vaisiai", kcal:52,  protein:0.3,  fat:0.2,  carbs:14,  units:[{label:"1 mažas (120g)",grams:120},{label:"1 vidutin. (150g)",grams:150},{label:"1 didelis (200g)",grams:200}] },
  { id:"orange",     name:"Apelsinas",                  category:"Vaisiai", kcal:47,  protein:0.9,  fat:0.1,  carbs:12,  units:[{label:"1 vnt (150g)",grams:150},{label:"2 vnt",grams:300}] },
  { id:"pear",       name:"Kriaušė",                    category:"Vaisiai", kcal:57,  protein:0.4,  fat:0.1,  carbs:15,  units:[{label:"1 vidutin. (150g)",grams:150}] },
  { id:"berries",    name:"Uogos (mišrainė)",           category:"Vaisiai", kcal:57,  protein:0.7,  fat:0.5,  carbs:14,  units:[{label:"½ puodelio (75g)",grams:75},{label:"1 puodelis (150g)",grams:150}] },
  { id:"strawberry", name:"Braškės",                    category:"Vaisiai", kcal:32,  protein:0.7,  fat:0.3,  carbs:7.7, units:[{label:"10 vnt (100g)",grams:100},{label:"20 vnt",grams:200}] },
  { id:"blueberry",  name:"Mėlynės",                    category:"Vaisiai", kcal:57,  protein:0.7,  fat:0.3,  carbs:14,  units:[{label:"½ puodelio (75g)",grams:75},{label:"1 puodelis (150g)",grams:150}] },
  { id:"grape",      name:"Vynuogės",                   category:"Vaisiai", kcal:67,  protein:0.6,  fat:0.4,  carbs:17,  units:[{label:"sauja (80g)",grams:80},{label:"didelė sauja (150g)",grams:150}] },
  { id:"mango",      name:"Mangas",                     category:"Vaisiai", kcal:60,  protein:0.8,  fat:0.4,  carbs:15,  units:[{label:"½ vnt (100g)",grams:100},{label:"1 visas (200g)",grams:200}] },
  { id:"kiwi",       name:"Kivis",                      category:"Vaisiai", kcal:61,  protein:1.1,  fat:0.5,  carbs:15,  units:[{label:"1 vnt (70g)",grams:70},{label:"2 vnt",grams:140}] },
  { id:"pineapple",  name:"Ananasas (šviežias)",        category:"Vaisiai", kcal:50,  protein:0.5,  fat:0.1,  carbs:13,  units:[{label:"1 riekelė (80g)",grams:80},{label:"2 riekelės",grams:160}] },
  { id:"watermelon", name:"Arbūzas",                    category:"Vaisiai", kcal:30,  protein:0.6,  fat:0.2,  carbs:7.6, units:[{label:"1 porcija (200g)",grams:200},{label:"2 porcijos",grams:400}] },
  { id:"dates",      name:"Datulės (džiovintos)",       category:"Vaisiai", kcal:277, protein:1.8,  fat:0.2,  carbs:75,  units:[{label:"2 vnt (20g)",grams:20},{label:"4 vnt",grams:40}] },

  // ── RIEŠUTAI IR SĖKLOS ─────────────────────────────────────────────────
  { id:"almonds",    name:"Migdolai",                   category:"Riešutai", kcal:579, protein:21,   fat:50,   carbs:22,  units:[{label:"sauja (30g)",grams:30},{label:"2 saujos (60g)",grams:60}] },
  { id:"walnuts",    name:"Graikiniai riešutai",        category:"Riešutai", kcal:654, protein:15,   fat:65,   carbs:14,  units:[{label:"sauja (30g)",grams:30}] },
  { id:"cashews",    name:"Anakardžiai",                category:"Riešutai", kcal:553, protein:18,   fat:44,   carbs:30,  units:[{label:"sauja (30g)",grams:30}] },
  { id:"pb",         name:"Žemės riešutų sviestas",    category:"Riešutai", kcal:588, protein:25,   fat:50,   carbs:20,  units:[{label:"1 šaukštas (16g)",grams:16},{label:"2 šaukštai",grams:32}] },
  { id:"almond_b",   name:"Migdolų sviestas",          category:"Riešutai", kcal:614, protein:21,   fat:56,   carbs:19,  units:[{label:"1 šaukštas (16g)",grams:16},{label:"2 šaukštai",grams:32}] },
  { id:"chia",       name:"Čia sėklos",                category:"Riešutai", kcal:486, protein:17,   fat:31,   carbs:42,  units:[{label:"1 šaukštas (15g)",grams:15},{label:"2 šaukštai",grams:30}] },
  { id:"flax",       name:"Linų sėklos (maltos)",      category:"Riešutai", kcal:534, protein:18,   fat:42,   carbs:29,  units:[{label:"1 šaukštas (10g)",grams:10}] },
  { id:"sunflower",  name:"Saulėgrąžų sėklos",         category:"Riešutai", kcal:584, protein:21,   fat:51,   carbs:20,  units:[{label:"sauja (30g)",grams:30}] },
  { id:"pumpkin_s",  name:"Moliūgų sėklos",            category:"Riešutai", kcal:559, protein:30,   fat:49,   carbs:11,  units:[{label:"sauja (30g)",grams:30}] },

  // ── RIEBALAI IR ALIEJAI ────────────────────────────────────────────────
  { id:"olive_oil",  name:"Alyvuogių aliejus",         category:"Riebalai", kcal:884, protein:0,    fat:100,  carbs:0,   units:[{label:"1 šaukštelis (5ml)",grams:5},{label:"1 šaukštas (15ml)",grams:15}] },
  { id:"coco_oil",   name:"Kokosų aliejus",            category:"Riebalai", kcal:862, protein:0,    fat:100,  carbs:0,   units:[{label:"1 šaukštelis (5g)",grams:5},{label:"1 šaukštas (15g)",grams:15}] },
  { id:"avocado_oil",name:"Avokadų aliejus",           category:"Riebalai", kcal:884, protein:0,    fat:100,  carbs:0,   units:[{label:"1 šaukštelis (5ml)",grams:5},{label:"1 šaukštas (15ml)",grams:15}] },
  { id:"ghee",       name:"Ghee (lydytas sviestas)",   category:"Riebalai", kcal:900, protein:0,    fat:100,  carbs:0,   units:[{label:"1 šaukštelis (5g)",grams:5},{label:"1 šaukštas (15g)",grams:15}] },

  // ── GĖRIMAI ────────────────────────────────────────────────────────────
  { id:"prot_wh",    name:"Baltymų kokteilius (whey)", category:"Gėrimai", kcal:120, protein:25,   fat:2,    carbs:5,   units:[{label:"1 porcija (300ml)",grams:300}] },
  { id:"coffee_bl",  name:"Juoda kava",                category:"Gėrimai", kcal:2,   protein:0.3,  fat:0,    carbs:0,   units:[{label:"1 puodelis (200ml)",grams:200}] },
  { id:"coffee_lat", name:"Latte (pieno kava)",        category:"Gėrimai", kcal:61,  protein:3.3,  fat:2.4,  carbs:7.2, units:[{label:"1 puodelis (300ml)",grams:300}] },
  { id:"oat_milk",   name:"Avižų pienas",              category:"Gėrimai", kcal:46,  protein:1,    fat:1.5,  carbs:7,   units:[{label:"1 stiklinė (200ml)",grams:200}] },
  { id:"alm_milk",   name:"Migdolų pienas (be cukraus)",category:"Gėrimai",kcal:17, protein:0.6,  fat:1.4,  carbs:0.3, units:[{label:"1 stiklinė (200ml)",grams:200}] },
  { id:"oj",         name:"Apelsinų sultys (šviežios)",category:"Gėrimai", kcal:45,  protein:0.7,  fat:0.2,  carbs:10,  units:[{label:"1 stiklinė (200ml)",grams:200}] },

  // ── PRIESKONIAI IR PADAŽAI ────────────────────────────────────────────
  { id:"ketchup",    name:"Kečupas",                   category:"Padažai", kcal:101, protein:1.4,  fat:0.1,  carbs:26,  units:[{label:"1 šaukštas (17g)",grams:17}] },
  { id:"mustard",    name:"Garstyčios",                category:"Padažai", kcal:66,  protein:4.4,  fat:3.5,  carbs:5.8, units:[{label:"1 šaukštelis (5g)",grams:5}] },
  { id:"mayo",       name:"Majonezas",                 category:"Padažai", kcal:680, protein:1,    fat:75,   carbs:1,   units:[{label:"1 šaukštas (15g)",grams:15}] },
  { id:"soysauce",   name:"Sojos padažas",             category:"Padažai", kcal:53,  protein:8.1,  fat:0.1,  carbs:4.9, units:[{label:"1 šaukštas (15ml)",grams:15}] },
  { id:"honey",      name:"Medus",                     category:"Padažai", kcal:304, protein:0.3,  fat:0,    carbs:82,  units:[{label:"1 šaukštelis (7g)",grams:7},{label:"1 šaukštas (21g)",grams:21}] },

  // ── SNACKS ────────────────────────────────────────────────────────────
  { id:"prot_bar",   name:"Baltymų batonėlis (vidutinis)", category:"Snacks", kcal:350, protein:25,   fat:10,   carbs:40,  units:[{label:"1 vnt (60g)",grams:60}] },
  { id:"chips_pot",  name:"Bulvių traškučiai",           category:"Snacks",  kcal:536, protein:7,    fat:35,   carbs:53,  units:[{label:"sauja (30g)",grams:30},{label:"mažas pakelis (50g)",grams:50}] },
  { id:"popcorn",    name:"Spragėsiai (be sviesto)",     category:"Snacks",  kcal:382, protein:12,   fat:4.3,  carbs:78,  units:[{label:"1 puodelis (8g)",grams:8},{label:"3 puodeliai",grams:24}] },
  { id:"dark_choc",  name:"Juodasis šokoladas (70%+)",   category:"Snacks",  kcal:598, protein:7.8,  fat:42,   carbs:46,  units:[{label:"2 plytelės (20g)",grams:20},{label:"4 plytelės",grams:40}] },
  { id:"milk_choc",  name:"Pieninis šokoladas",          category:"Snacks",  kcal:535, protein:7.7,  fat:29,   carbs:60,  units:[{label:"2 plytelės (20g)",grams:20}] },
  { id:"pretzel",    name:"Preceliai",                   category:"Snacks",  kcal:381, protein:9.6,  fat:3.6,  carbs:80,  units:[{label:"sauja (30g)",grams:30}] },

  // ── PERDIRBTA MĖSA ────────────────────────────────────────────────────
  { id:"ham",        name:"Kumpis (virtas)",             category:"Perdirbta mėsa", kcal:145, protein:20,   fat:6.5,  carbs:1.6, units:[{label:"2 riekelės (60g)",grams:60},{label:"4 riekelės",grams:120}] },
  { id:"salami",     name:"Salami",                      category:"Perdirbta mėsa", kcal:425, protein:22,   fat:37,   carbs:1.2, units:[{label:"3 riekelės (30g)",grams:30}] },
  { id:"hotdog",     name:"Dešra (virta)",               category:"Perdirbta mėsa", kcal:290, protein:11,   fat:26,   carbs:2.7, units:[{label:"1 vnt (52g)",grams:52}] },
  { id:"sausage_br", name:"Dešrelė pusryčiams (kepta)", category:"Perdirbta mėsa", kcal:301, protein:13,   fat:27,   carbs:2,   units:[{label:"1 vnt (45g)",grams:45},{label:"2 vnt",grams:90}] },

  // ── RESTORANAI ────────────────────────────────────────────────────────
  { id:"pizza_sl",   name:"Pica (1 gabalėlis, sūrio)",  category:"Restoranai", kcal:285, protein:12,   fat:10,   carbs:36,  units:[{label:"1 gabalėlis (107g)",grams:107},{label:"2 gabalėliai",grams:214}] },
  { id:"burger_p",   name:"Burgerio kotletas (jautiena)",category:"Restoranai", kcal:295, protein:20,   fat:23,   carbs:0,   units:[{label:"1 kotletas (113g)",grams:113}] },
  { id:"sushi_r",    name:"Sushi ritiniklis (su žuvimi)",category:"Restoranai", kcal:93,  protein:5,    fat:0.7,  carbs:18,  units:[{label:"1 vnt (28g)",grams:28},{label:"6 vnt",grams:168},{label:"8 vnt",grams:224}] },
];

// ── PAPILDYMAI ─────────────────────────────────────────────────────────────
const EXTRA_FOODS = [
  // ── KEPYKLA / DUONOS GAMINIAI ──────────────────────────────────────────
  { id:"bagel",      name:"Beigelis (paprastas)",        category:"Kepykla", kcal:272, protein:10.6, fat:1.8,  carbs:53,  units:[{label:"1 mažas (70g)",grams:70},{label:"1 didelis (105g)",grams:105}] },
  { id:"bagel_wh",   name:"Beigelis (viso grūdo)",       category:"Kepykla", kcal:245, protein:11,   fat:2,    carbs:48,  units:[{label:"1 vnt (105g)",grams:105}] },
  { id:"bagel_bl",   name:"Beigelis su sėklomis",        category:"Kepykla", kcal:280, protein:10,   fat:3,    carbs:54,  units:[{label:"1 vnt (105g)",grams:105}] },
  { id:"croissant_k",name:"Kruasanas",                   category:"Kepykla", kcal:406, protein:8.2,  fat:21,   carbs:46,  units:[{label:"1 mažas (50g)",grams:50},{label:"1 didelis (80g)",grams:80}] },
  { id:"muffin_bl",  name:"Muffinas (su mėlynėmis)",     category:"Kepykla", kcal:377, protein:5.7,  fat:14,   carbs:57,  units:[{label:"1 vnt (113g)",grams:113}] },
  { id:"pita",       name:"Pita duona",                  category:"Kepykla", kcal:275, protein:9.1,  fat:1.2,  carbs:56,  units:[{label:"1 vnt (60g)",grams:60}] },
  { id:"tortilla_wh",name:"Tortila (kvietinė)",          category:"Kepykla", kcal:312, protein:8.5,  fat:7.7,  carbs:51,  units:[{label:"1 maža (30g)",grams:30},{label:"1 didelė (65g)",grams:65}] },
  { id:"tortilla_co",name:"Tortila (kukurūzų)",          category:"Kepykla", kcal:218, protein:5.7,  fat:3.2,  carbs:46,  units:[{label:"1 vnt (26g)",grams:26}] },
  { id:"wrap",       name:"Wrap duonelė (pilno grūdo)",  category:"Kepykla", kcal:290, protein:9,    fat:6,    carbs:50,  units:[{label:"1 vnt (64g)",grams:64}] },
  { id:"pancake_k",  name:"Blynai (klasikiniai)",        category:"Kepykla", kcal:227, protein:6.3,  fat:10,   carbs:28,  units:[{label:"1 blynas (40g)",grams:40},{label:"3 blynai",grams:120}] },
  { id:"waffle_k",   name:"Vafelis",                     category:"Kepykla", kcal:291, protein:7.9,  fat:14,   carbs:37,  units:[{label:"1 vnt (75g)",grams:75}] },
  { id:"rice_cake",  name:"Ryžių pyragaitis",            category:"Kepykla", kcal:387, protein:8,    fat:2.8,  carbs:81,  units:[{label:"1 vnt (9g)",grams:9},{label:"2 vnt",grams:18},{label:"3 vnt",grams:27}] },
  { id:"granola_bar",name:"Granola batonėlis",           category:"Kepykla", kcal:471, protein:7,    fat:19,   carbs:70,  units:[{label:"1 vnt (47g)",grams:47}] },

  // ── PAPILDOMI PIENO ────────────────────────────────────────────────────
  { id:"prot_yog",   name:"Baltyminis jogurtas (Skyr)", category:"Pieno produktai", kcal:67,  protein:11,   fat:0.2,  carbs:4.5, units:[{label:"1 indelis (150g)",grams:150},{label:"1 didelis (200g)",grams:200}] },
  { id:"ice_cream",  name:"Ledai (vaniliniai)",          category:"Pieno produktai", kcal:207, protein:3.5,  fat:11,   carbs:24,  units:[{label:"1 kaušelis (65g)",grams:65},{label:"2 kaušeliai",grams:130}] },
  { id:"whip_cream", name:"Grietinėlė (plakta, 35%)",   category:"Pieno produktai", kcal:340, protein:2.2,  fat:35,   carbs:2.8, units:[{label:"2 šaukštai (30g)",grams:30}] },

  // ── PUPELIŲ / SOJOS ────────────────────────────────────────────────────
  { id:"tempeh",     name:"Tempeh",                      category:"Ankštiniai", kcal:193, protein:19,   fat:11,   carbs:9.4, units:[{label:"½ bloko (85g)",grams:85}] },
  { id:"miso",       name:"Miso pasta",                  category:"Ankštiniai", kcal:199, protein:12,   fat:6,    carbs:27,  units:[{label:"1 šaukštas (17g)",grams:17}] },

  // ── PAPILDOMOS DARŽOVĖS ────────────────────────────────────────────────
  { id:"artich",     name:"Artišokai (konservuoti)",     category:"Daržovės", kcal:50,  protein:2.8,  fat:0.2,  carbs:11,  units:[{label:"½ skardinė (120g)",grams:120}] },
  { id:"sun_tom",    name:"Džiovinti pomidorai aliejuje",category:"Daržovės", kcal:213, protein:5.1,  fat:15,   carbs:23,  units:[{label:"2 šaukštai (30g)",grams:30}] },
  { id:"olives",     name:"Alyvuogės (juodos)",          category:"Daržovės", kcal:115, protein:0.8,  fat:10.9, carbs:6.3, units:[{label:"10 vnt (40g)",grams:40}] },

  // ── PAPILDOMI PADAŽAI ──────────────────────────────────────────────────
  { id:"tahini",     name:"Tahini (sezamo pasta)",       category:"Padažai", kcal:595, protein:17,   fat:53,   carbs:21,  units:[{label:"1 šaukštas (15g)",grams:15}] },
  { id:"pesto",      name:"Pesto padažas",               category:"Padažai", kcal:376, protein:6,    fat:35,   carbs:9,   units:[{label:"1 šaukštas (20g)",grams:20}] },
  { id:"bbq_sauce",  name:"BBQ padažas",                 category:"Padažai", kcal:172, protein:1,    fat:0.4,  carbs:41,  units:[{label:"1 šaukštas (17g)",grams:17}] },
  { id:"ranch",      name:"Ranch padažas",               category:"Padažai", kcal:522, protein:1.3,  fat:55,   carbs:5.1, units:[{label:"2 šaukštai (30g)",grams:30}] },

  // ════════════════════════════════════════════════════════════════════════
  // NAUJI PRODUKTAI
  // ════════════════════════════════════════════════════════════════════════

  // ── GĖRIMAI – GAZUOTI ─────────────────────────────────────────────────
  { id:"coca_cola",    name:"Coca-Cola (originali)",        barcode:"5449000000996", category:"Gėrimai", kcal:42,  protein:0,    fat:0,    carbs:10.6,units:[{label:"skardinė 330ml",grams:330},{label:"butelis 500ml",grams:500}] },
  { id:"coca_zero",    name:"Coca-Cola Zero",               barcode:"5449000131836", category:"Gėrimai", kcal:0,   protein:0,    fat:0,    carbs:0,   units:[{label:"skardinė 330ml",grams:330}] },
  { id:"pepsi",        name:"Pepsi (originali)",            barcode:"4006381333597", category:"Gėrimai", kcal:42,  protein:0,    fat:0,    carbs:11,  units:[{label:"skardinė 330ml",grams:330},{label:"butelis 500ml",grams:500}] },
  { id:"pepsi_max",    name:"Pepsi Max",                    barcode:"4006381333528", category:"Gėrimai", kcal:0,   protein:0,    fat:0,    carbs:0,   units:[{label:"skardinė 330ml",grams:330}] },
  { id:"sprite",       name:"Sprite",                       barcode:"5449000054227", category:"Gėrimai", kcal:40,  protein:0,    fat:0,    carbs:10,  units:[{label:"skardinė 330ml",grams:330}] },
  { id:"fanta_org",    name:"Fanta apelsinų",               barcode:"5449000054203", category:"Gėrimai", kcal:46,  protein:0,    fat:0,    carbs:12,  units:[{label:"skardinė 330ml",grams:330}] },
  { id:"7up",          name:"7UP",                          barcode:"5000112638943", category:"Gėrimai", kcal:40,  protein:0,    fat:0,    carbs:10,  units:[{label:"skardinė 330ml",grams:330}] },
  { id:"schweppes_t",  name:"Schweppes Tonic Water",        barcode:"5449000133335", category:"Gėrimai", kcal:34,  protein:0,    fat:0,    carbs:9,   units:[{label:"skardinė 330ml",grams:330}] },
  { id:"dr_pepper",    name:"Dr Pepper",                    barcode:"5000112546804", category:"Gėrimai", kcal:44,  protein:0.1,  fat:0,    carbs:11,  units:[{label:"skardinė 330ml",grams:330}] },

  // ── GĖRIMAI – ENERGINIAI ──────────────────────────────────────────────
  { id:"red_bull",     name:"Red Bull (originali)",         barcode:"9002490100070", category:"Gėrimai", kcal:45,  protein:0,    fat:0,    carbs:11,  units:[{label:"skardinė 250ml",grams:250},{label:"skardinė 473ml",grams:473}] },
  { id:"red_bull_sf",  name:"Red Bull Sugar Free",          barcode:"9002490204761", category:"Gėrimai", kcal:5,   protein:0.6,  fat:0.2,  carbs:0.3, units:[{label:"skardinė 250ml",grams:250}] },
  { id:"monster_org",  name:"Monster Energy (originali)",   barcode:"5060166694411", category:"Gėrimai", kcal:45,  protein:0,    fat:0,    carbs:11,  units:[{label:"skardinė 500ml",grams:500}] },
  { id:"monster_zero", name:"Monster Energy Zero Sugar",    barcode:"5060579250066", category:"Gėrimai", kcal:0,   protein:0,    fat:0,    carbs:0,   units:[{label:"skardinė 500ml",grams:500}] },
  { id:"burn",         name:"Burn Energy Drink",            barcode:"5449000133571", category:"Gėrimai", kcal:44,  protein:0,    fat:0,    carbs:11,  units:[{label:"skardinė 250ml",grams:250}] },
  { id:"hell_energy",  name:"Hell Energy (originali)",      barcode:"5999860423748", category:"Gėrimai", kcal:45,  protein:0,    fat:0,    carbs:11,  units:[{label:"skardinė 250ml",grams:250}] },
  { id:"rockstar",     name:"Rockstar Original",            barcode:"0818094001102", category:"Gėrimai", kcal:64,  protein:0,    fat:0,    carbs:16,  units:[{label:"skardinė 500ml",grams:500}] },

  // ── GĖRIMAI – SULTYS ─────────────────────────────────────────────────
  { id:"juice_apple",  name:"Obuolių sultys (pakuotėje)",   category:"Gėrimai", kcal:44,  protein:0.1,  fat:0.1,  carbs:11,  units:[{label:"stiklinė 200ml",grams:200}] },
  { id:"juice_grape",  name:"Vynuogių sultys",              category:"Gėrimai", kcal:60,  protein:0.4,  fat:0.1,  carbs:15,  units:[{label:"stiklinė 200ml",grams:200}] },
  { id:"juice_tom",    name:"Pomidorų sultys",              category:"Gėrimai", kcal:17,  protein:0.8,  fat:0.1,  carbs:4,   units:[{label:"stiklinė 200ml",grams:200}] },
  { id:"juice_carr",   name:"Morkų sultys",                 category:"Gėrimai", kcal:40,  protein:0.9,  fat:0.2,  carbs:9,   units:[{label:"stiklinė 200ml",grams:200}] },
  { id:"smoothie_b",   name:"Smoothie (bananų-braškių)",    category:"Gėrimai", kcal:70,  protein:0.8,  fat:0.3,  carbs:17,  units:[{label:"stiklinė 250ml",grams:250}] },
  { id:"coconut_w",    name:"Kokosų vanduo",                barcode:"5060388840018", category:"Gėrimai", kcal:19,  protein:0.7,  fat:0.2,  carbs:4,   units:[{label:"1 pak. (330ml)",grams:330}] },

  // ── GĖRIMAI – KAVA IR ARBATA ─────────────────────────────────────────
  { id:"espresso",     name:"Espresso",                     category:"Gėrimai", kcal:9,   protein:0.6,  fat:0.2,  carbs:1.3, units:[{label:"1 šotas (30ml)",grams:30}] },
  { id:"cappuccino",   name:"Kapučinas",                    category:"Gėrimai", kcal:74,  protein:4.0,  fat:3.3,  carbs:7.0, units:[{label:"1 puodelis (180ml)",grams:180}] },
  { id:"coffee_am",    name:"Americano",                    category:"Gėrimai", kcal:5,   protein:0.5,  fat:0.1,  carbs:0.8, units:[{label:"1 puodelis (240ml)",grams:240}] },
  { id:"coffee_flat",  name:"Flat White",                   category:"Gėrimai", kcal:110, protein:6,    fat:4.5,  carbs:11,  units:[{label:"1 puodelis (220ml)",grams:220}] },
  { id:"tea_black",    name:"Juoda arbata (be cukraus)",    category:"Gėrimai", kcal:1,   protein:0,    fat:0,    carbs:0.2, units:[{label:"1 puodelis (200ml)",grams:200}] },
  { id:"tea_green",    name:"Žalioji arbata",               category:"Gėrimai", kcal:2,   protein:0,    fat:0,    carbs:0.4, units:[{label:"1 puodelis (200ml)",grams:200}] },
  { id:"tea_herbal",   name:"Žolelių arbata",               category:"Gėrimai", kcal:2,   protein:0,    fat:0,    carbs:0.4, units:[{label:"1 puodelis (200ml)",grams:200}] },
  { id:"nescafe_3in1", name:"Nescafé 3 in 1",              barcode:"4891000000532", category:"Gėrimai", kcal:70,  protein:1,    fat:1.8,  carbs:13,  units:[{label:"1 pakelė (18g)",grams:18}] },
  { id:"kak_milk",     name:"Kakavos gėrimas su pienu",    category:"Gėrimai", kcal:68,  protein:3.4,  fat:1.7,  carbs:11,  units:[{label:"stiklinė 200ml",grams:200}] },
  { id:"soy_milk",     name:"Sojos pienas",                barcode:"5411188083689", category:"Gėrimai", kcal:33,  protein:3,    fat:1.8,  carbs:1.5, units:[{label:"stiklinė 200ml",grams:200}] },

  // ── GĖRIMAI – ALKOHOLINIAI ───────────────────────────────────────────
  { id:"beer_lager",   name:"Alus (šviesus, 5%)",          category:"Gėrimai", kcal:43,  protein:0.5,  fat:0,    carbs:3.6, units:[{label:"skardinė 330ml",grams:330},{label:"butelis 500ml",grams:500}] },
  { id:"beer_dark",    name:"Alus (tamsus, 5%)",           category:"Gėrimai", kcal:45,  protein:0.5,  fat:0,    carbs:4.5, units:[{label:"skardinė 330ml",grams:330}] },
  { id:"wine_red",     name:"Raudonasis vynas (sausas)",   category:"Gėrimai", kcal:85,  protein:0.1,  fat:0,    carbs:2.6, units:[{label:"1 taurė (150ml)",grams:150}] },
  { id:"wine_white",   name:"Baltasis vynas (sausas)",     category:"Gėrimai", kcal:82,  protein:0.1,  fat:0,    carbs:2.1, units:[{label:"1 taurė (150ml)",grams:150}] },
  { id:"wine_rose",    name:"Rožinis vynas",               category:"Gėrimai", kcal:83,  protein:0.1,  fat:0,    carbs:2.8, units:[{label:"1 taurė (150ml)",grams:150}] },
  { id:"vodka",        name:"Degtinė (40%)",               category:"Gėrimai", kcal:231, protein:0,    fat:0,    carbs:0,   units:[{label:"1 taurelė (50ml)",grams:50}] },
  { id:"whisky",       name:"Viskis (40%)",                category:"Gėrimai", kcal:250, protein:0,    fat:0,    carbs:0,   units:[{label:"1 taurelė (50ml)",grams:50}] },
  { id:"champagne",    name:"Šampanas (sausas)",           category:"Gėrimai", kcal:76,  protein:0.3,  fat:0,    carbs:1.7, units:[{label:"1 taurė (150ml)",grams:150}] },
  { id:"cider",        name:"Sidras (sausas, 5%)",         category:"Gėrimai", kcal:36,  protein:0,    fat:0,    carbs:2.6, units:[{label:"skardinė 330ml",grams:330}] },

  // ── SALDAINIAI IR ŠOKOLADAS ──────────────────────────────────────────
  { id:"snickers",     name:"Snickers (50g)",              barcode:"5000159461481", category:"Saldainiai", kcal:488, protein:8.6,  fat:24,   carbs:60,  units:[{label:"1 batonėlis (50g)",grams:50}] },
  { id:"mars_bar",     name:"Mars batonėlis (51g)",        barcode:"5000159407236", category:"Saldainiai", kcal:449, protein:4.2,  fat:16,   carbs:70,  units:[{label:"1 batonėlis (51g)",grams:51}] },
  { id:"twix",         name:"Twix (50g)",                  barcode:"5000159414075", category:"Saldainiai", kcal:495, protein:4.5,  fat:24,   carbs:65,  units:[{label:"1 batonėlis (50g)",grams:50}] },
  { id:"bounty",       name:"Bounty (57g)",                barcode:"5000159461627", category:"Saldainiai", kcal:478, protein:4,    fat:27,   carbs:57,  units:[{label:"1 batonėlis (57g)",grams:57}] },
  { id:"kitkat",       name:"KitKat (45g)",                barcode:"7613035444515", category:"Saldainiai", kcal:505, protein:6.4,  fat:26,   carbs:64,  units:[{label:"1 pak. (45g)",grams:45},{label:"2 lazdutės (21g)",grams:21}] },
  { id:"milka_choc",   name:"Milka pieno šokoladas",       barcode:"7622201312312", category:"Saldainiai", kcal:535, protein:7.5,  fat:31,   carbs:59,  units:[{label:"2 plytelės (20g)",grams:20}] },
  { id:"milka_oreo",   name:"Milka su Oreo",               barcode:"7622210966858", category:"Saldainiai", kcal:523, protein:6.5,  fat:28,   carbs:64,  units:[{label:"2 plytelės (20g)",grams:20}] },
  { id:"raffaello",    name:"Raffaello",                   barcode:"8000500171936", category:"Saldainiai", kcal:614, protein:6,    fat:44,   carbs:51,  units:[{label:"1 rutulys (10g)",grams:10},{label:"3 rutuliukai (30g)",grams:30}] },
  { id:"ferr_rocher",  name:"Ferrero Rocher",              barcode:"8000500037347", category:"Saldainiai", kcal:614, protein:7,    fat:43,   carbs:50,  units:[{label:"1 vnt (12.5g)",grams:13},{label:"3 vnt",grams:38}] },
  { id:"kinder_bueno", name:"Kinder Bueno (43g)",          barcode:"4008400188614", category:"Saldainiai", kcal:551, protein:7,    fat:34,   carbs:53,  units:[{label:"1 pak. (43g)",grams:43}] },
  { id:"nutella_jar",  name:"Nutella",                     barcode:"8000500037560", category:"Saldainiai", kcal:539, protein:6,    fat:31,   carbs:58,  units:[{label:"1 šaukštas (15g)",grams:15},{label:"2 šaukštai (30g)",grams:30}] },
  { id:"toblerone",    name:"Toblerone (pieno)",           barcode:"7617027030507", category:"Saldainiai", kcal:541, protein:7.9,  fat:31,   carbs:61,  units:[{label:"2 porcijos (25g)",grams:25}] },
  { id:"haribo_gold",  name:"Haribo Goldbären (guminukai)",barcode:"4001686300022", category:"Saldainiai", kcal:343, protein:6.9,  fat:0.5,  carbs:77,  units:[{label:"sauja (40g)",grams:40},{label:"1 maišelis (80g)",grams:80}] },
  { id:"skittles",     name:"Skittles",                    barcode:"5000159382878", category:"Saldainiai", kcal:404, protein:0.1,  fat:3.9,  carbs:91,  units:[{label:"1 maišelis (55g)",grams:55}] },
  { id:"chupa_chup",   name:"Chupa Chups (liktinukas)",    barcode:"8410031340002", category:"Saldainiai", kcal:367, protein:0,    fat:0,    carbs:91,  units:[{label:"1 vnt (12g)",grams:12}] },
  { id:"marsh_plain",  name:"Marshmallow",                 category:"Saldainiai", kcal:318, protein:1.8,  fat:0.2,  carbs:81,  units:[{label:"1 vnt (8g)",grams:8},{label:"sauja (30g)",grams:30}] },
  { id:"toffee",       name:"Toffee (pieno karamele)",     category:"Saldainiai", kcal:420, protein:3,    fat:13,   carbs:73,  units:[{label:"1 vnt (10g)",grams:10}] },
  { id:"white_choc",   name:"Baltasis šokoladas",          category:"Saldainiai", kcal:539, protein:5.9,  fat:32,   carbs:59,  units:[{label:"2 plytelės (20g)",grams:20}] },
  { id:"oreo",         name:"Oreo sausainiai",             barcode:"7622210055194", category:"Saldainiai", kcal:473, protein:5.1,  fat:20,   carbs:67,  units:[{label:"3 sausainiai (36g)",grams:36}] },
  { id:"lotus_biscoff",name:"Lotus Biscoff sausainiai",    barcode:"5410126000013", category:"Saldainiai", kcal:480, protein:5.6,  fat:16,   carbs:77,  units:[{label:"2 sausainiai (25g)",grams:25}] },
  { id:"digestive",    name:"Digestive sausainiai",        barcode:"5000168015530", category:"Saldainiai", kcal:471, protein:7.4,  fat:20,   carbs:64,  units:[{label:"2 sausainiai (30g)",grams:30}] },
  { id:"jam_donut",    name:"Spurga su uogiene",           category:"Saldainiai", kcal:310, protein:5,    fat:14,   carbs:43,  units:[{label:"1 vnt (65g)",grams:65}] },
  { id:"brownie",      name:"Brownie",                     category:"Saldainiai", kcal:415, protein:5,    fat:19,   carbs:57,  units:[{label:"1 gabaliukas (60g)",grams:60}] },

  // ── DESERTAI ─────────────────────────────────────────────────────────
  { id:"cheesecake",   name:"Varškės tortas (cheesecake)", category:"Desertai", kcal:321, protein:5.5,  fat:22,   carbs:26,  units:[{label:"1 gabalėlis (120g)",grams:120}] },
  { id:"tiramisu",     name:"Tiramisu",                    category:"Desertai", kcal:283, protein:6,    fat:18,   carbs:26,  units:[{label:"1 porcija (120g)",grams:120}] },
  { id:"panna_cotta",  name:"Panna Cotta",                 category:"Desertai", kcal:200, protein:3.5,  fat:14,   carbs:17,  units:[{label:"1 indelis (100g)",grams:100}] },
  { id:"pancake_des",  name:"Blyneliai su sirupu",         category:"Desertai", kcal:227, protein:6.4,  fat:10,   carbs:28,  units:[{label:"2 vnt (100g)",grams:100}] },
  { id:"waffle_syr",   name:"Gofrai su sirupu",            category:"Desertai", kcal:291, protein:7.9,  fat:10,   carbs:44,  units:[{label:"1 vnt (100g)",grams:100}] },
  { id:"ice_choc",     name:"Ledai (šokoladiniai)",        category:"Desertai", kcal:216, protein:3.8,  fat:11,   carbs:27,  units:[{label:"1 kaušelis (65g)",grams:65}] },
  { id:"ice_straw",    name:"Ledai (braškių)",             category:"Desertai", kcal:127, protein:1.8,  fat:4.5,  carbs:21,  units:[{label:"1 kaušelis (65g)",grams:65}] },
  { id:"ice_magnum",   name:"Magnum Classic",              barcode:"8717677833528", category:"Desertai", kcal:256, protein:3.5,  fat:17,   carbs:23,  units:[{label:"1 vnt (86g)",grams:86}] },
  { id:"ice_cornetto", name:"Cornetto (vaniliniai)",       barcode:"8717677867509", category:"Desertai", kcal:251, protein:4.2,  fat:13,   carbs:31,  units:[{label:"1 vnt (75g)",grams:75}] },
  { id:"apple_pie",    name:"Obuolių pyragas",             category:"Desertai", kcal:237, protein:2.5,  fat:11,   carbs:33,  units:[{label:"1 gabalėlis (120g)",grams:120}] },
  { id:"honey_cake",   name:"Medaus tortas",               category:"Desertai", kcal:390, protein:6,    fat:19,   carbs:51,  units:[{label:"1 gabalėlis (100g)",grams:100}] },
  { id:"eclair",       name:"Eklerai (su kremu)",          category:"Desertai", kcal:310, protein:6,    fat:17,   carbs:35,  units:[{label:"1 vnt (70g)",grams:70}] },
  { id:"muffin_choc",  name:"Muffinas (šokoladinis)",      category:"Desertai", kcal:378, protein:5.5,  fat:16,   carbs:55,  units:[{label:"1 vidut. (80g)",grams:80}] },
  { id:"croissant_des",name:"Kruasanas (paprastas)",       category:"Desertai", kcal:406, protein:8.2,  fat:21,   carbs:46,  units:[{label:"mažas (50g)",grams:50},{label:"didelis (80g)",grams:80}] },

  // ── BALTYMŲ PAPILDAI ─────────────────────────────────────────────────
  { id:"whey_iso",     name:"Whey Isolate (baltymai)",     category:"Baltymų papildai", kcal:375, protein:90,   fat:1,    carbs:3,   units:[{label:"1 porcija (30g)",grams:30}] },
  { id:"whey_conc",    name:"Whey Concentrate (baltymai)", category:"Baltymų papildai", kcal:400, protein:78,   fat:5,    carbs:8,   units:[{label:"1 porcija (30g)",grams:30}] },
  { id:"casein_p",     name:"Kazeino baltymai",            category:"Baltymų papildai", kcal:370, protein:80,   fat:2,    carbs:6,   units:[{label:"1 porcija (33g)",grams:33}] },
  { id:"vegan_prot",   name:"Augaliniai baltymai (žirnių)",category:"Baltymų papildai", kcal:360, protein:80,   fat:2,    carbs:5,   units:[{label:"1 porcija (30g)",grams:30}] },
  { id:"quest_bar",    name:"Quest Protein Bar (šokolado)",barcode:"888849000265",  category:"Baltymų papildai", kcal:190, protein:21,   fat:7,    carbs:22,  units:[{label:"1 batonėlis (60g)",grams:60}] },
  { id:"fulfil_bar",   name:"Fulfil Vitamin Protein Bar",  barcode:"5391529133007", category:"Baltymų papildai", kcal:194, protein:20,   fat:6,    carbs:19,  units:[{label:"1 batonėlis (55g)",grams:55}] },
  { id:"creatine",     name:"Kreatinas (monohidratas)",    category:"Baltymų papildai", kcal:0,   protein:0,    fat:0,    carbs:0,   units:[{label:"1 porcija (5g)",grams:5}] },

  // ── DAUGIAU SNACKS ───────────────────────────────────────────────────
  { id:"pringles_org", name:"Pringles Original",           barcode:"5053990103928", category:"Snacks", kcal:536, protein:5.6,  fat:35,   carbs:52,  units:[{label:"sauja (30g)",grams:30},{label:"maž. butelis (40g)",grams:40}] },
  { id:"pringles_sc",  name:"Pringles Sour Cream & Onion", barcode:"5053990113460", category:"Snacks", kcal:523, protein:5,    fat:33,   carbs:53,  units:[{label:"sauja (30g)",grams:30}] },
  { id:"doritos_n",    name:"Doritos (originalūs)",        barcode:"5449000188861", category:"Snacks", kcal:507, protein:7.3,  fat:26,   carbs:63,  units:[{label:"sauja (30g)",grams:30}] },
  { id:"lays_classic", name:"Lay's Classic traškučiai",    barcode:"5900259006050", category:"Snacks", kcal:536, protein:5.8,  fat:35,   carbs:50,  units:[{label:"sauja (30g)",grams:30}] },
  { id:"rice_cakes_n", name:"Ryžių trapučiai (nesūdyti)",  barcode:"8710522688526", category:"Snacks", kcal:392, protein:7.5,  fat:2.9,  carbs:81,  units:[{label:"1 vnt (9g)",grams:9},{label:"2 vnt",grams:18}] },
  { id:"nuts_mix",     name:"Riešutų mišinys (sūdytas)",   category:"Snacks", kcal:607, protein:20,   fat:53,   carbs:20,  units:[{label:"sauja (30g)",grams:30}] },
  { id:"granola_bar2", name:"Granola batonėlis (šokolado)",barcode:"5000168019811", category:"Snacks", kcal:431, protein:6.5,  fat:17,   carbs:62,  units:[{label:"1 batonėlis (40g)",grams:40}] },
  { id:"seaweed_snk",  name:"Džiovinti jūros dumbliai",    category:"Snacks", kcal:35,  protein:5,    fat:0.5,  carbs:2,   units:[{label:"1 pak. (5g)",grams:5}] },
  { id:"nachos",       name:"Nachos (su padažu)",          category:"Snacks", kcal:520, protein:7.4,  fat:29,   carbs:58,  units:[{label:"porcija (50g)",grams:50}] },

  // ── DAUGIAU RESTORANŲ ────────────────────────────────────────────────
  { id:"big_mac",      name:"McDonald's Big Mac",          category:"Restoranai", kcal:508, protein:27,   fat:26,   carbs:43,  units:[{label:"1 burgeris (212g)",grams:212}] },
  { id:"mcnuggets6",   name:"McDonald's McNuggets (6 vnt)",category:"Restoranai", kcal:270, protein:15,   fat:16,   carbs:17,  units:[{label:"6 vnt (100g)",grams:100}] },
  { id:"kfc_wing",     name:"KFC keptas sparnelis",        category:"Restoranai", kcal:350, protein:24,   fat:21,   carbs:12,  units:[{label:"1 vnt (80g)",grams:80}] },
  { id:"kebab_wrap",   name:"Kebabas (suktinis)",          category:"Restoranai", kcal:285, protein:17,   fat:11,   carbs:30,  units:[{label:"1 porcija (200g)",grams:200}] },
  { id:"shawarma",     name:"Šavarma (vištiena)",          category:"Restoranai", kcal:265, protein:18,   fat:10,   carbs:26,  units:[{label:"1 porcija (200g)",grams:200}] },
  { id:"hotdog_rest",  name:"Dešrainis (klasikinis)",      category:"Restoranai", kcal:310, protein:12,   fat:18,   carbs:28,  units:[{label:"1 vnt (120g)",grams:120}] },
  { id:"pizza_pep",    name:"Pica (pepperoni, 1 gabaliukas)", category:"Restoranai", kcal:298, protein:13,   fat:12,   carbs:34,  units:[{label:"1 gabalėlis (107g)",grams:107}] },
  { id:"french_fries", name:"Keptos bulvytės (restorane)", category:"Restoranai", kcal:365, protein:4.8,  fat:19,   carbs:44,  units:[{label:"maža porcija (100g)",grams:100},{label:"didelė porcija (200g)",grams:200}] },
  { id:"cesar_salad",  name:"Cezario salotos",             category:"Restoranai", kcal:186, protein:10,   fat:13,   carbs:9,   units:[{label:"1 porcija (200g)",grams:200}] },
  { id:"ramen",        name:"Ramen (su kiauliena)",        category:"Restoranai", kcal:185, protein:10,   fat:7,    carbs:22,  units:[{label:"1 porcija (400g)",grams:400}] },
  { id:"gyros",        name:"Gyros (su tzatziki)",         category:"Restoranai", kcal:270, protein:18,   fat:12,   carbs:22,  units:[{label:"1 porcija (200g)",grams:200}] },
  { id:"spring_roll",  name:"Spyruoklinis suktinukas (keptas)", category:"Restoranai", kcal:220, protein:5, fat:12,   carbs:26,  units:[{label:"1 vnt (50g)",grams:50}] },

  // ── DAUGIAU MĖSOS ────────────────────────────────────────────────────
  { id:"duck_breast",  name:"Antienos krūtinėlė (kepta)", category:"Mėsa – raudona", kcal:337, protein:27,   fat:28,   carbs:0,   units:[{label:"1 porcija (150g)",grams:150}] },
  { id:"lamb_chop",    name:"Avienos kotletas (keptas)",  category:"Mėsa – raudona", kcal:294, protein:25,   fat:21,   carbs:0,   units:[{label:"1 kotletas (100g)",grams:100}] },
  { id:"pork_ribs",    name:"Kiaulienos šonkauliai",      category:"Mėsa – raudona", kcal:321, protein:22,   fat:26,   carbs:0,   units:[{label:"2 šonkauliai (130g)",grams:130}] },
  { id:"chicken_th",   name:"Vištienos šlaunelė be kaulo (kepta)", category:"Mėsa – vištiena", kcal:229, protein:25, fat:14, carbs:0, units:[{label:"1 vnt (100g)",grams:100},{label:"2 vnt",grams:200}] },
  { id:"liver_beef",   name:"Jautienos kepenys (keptos)", category:"Mėsa – raudona", kcal:175, protein:26,   fat:5,    carbs:5,   units:[{label:"1 porcija (150g)",grams:150}] },
  { id:"chorizo",      name:"Chorizo dešra",              category:"Perdirbta mėsa", kcal:455, protein:24,   fat:39,   carbs:2,   units:[{label:"4 riekelės (50g)",grams:50}] },
  { id:"pepperoni",    name:"Pepperoni",                  barcode:"4000400106005", category:"Perdirbta mėsa", kcal:494, protein:22,   fat:44,   carbs:2,   units:[{label:"3 riekelės (30g)",grams:30}] },
  { id:"prosciutto",   name:"Prosciutto (kumpis)",        category:"Perdirbta mėsa", kcal:215, protein:29,   fat:11,   carbs:0.3, units:[{label:"3 riekelės (40g)",grams:40}] },
  { id:"pastrami",     name:"Pastrami",                   category:"Perdirbta mėsa", kcal:143, protein:20,   fat:5,    carbs:2.5, units:[{label:"3 riekelės (60g)",grams:60}] },

  // ── DAUGIAU ŽUVIES ───────────────────────────────────────────────────
  { id:"tuna_steak",   name:"Tunų kepsnys (keptas)",      category:"Žuvis", kcal:184, protein:30,   fat:6,    carbs:0,   units:[{label:"1 kepsnys (150g)",grams:150}] },
  { id:"sardines",     name:"Sardinės (konservuotos aliejuje)", barcode:"3168930003019", category:"Žuvis", kcal:208, protein:25, fat:11, carbs:0, units:[{label:"½ skardinė (60g)",grams:60},{label:"1 skardinė (120g)",grams:120}] },
  { id:"crab_meat",    name:"Krabų mėsa (virta)",         category:"Žuvis", kcal:97,  protein:19,   fat:1.5,  carbs:0,   units:[{label:"1 porcija (100g)",grams:100}] },
  { id:"squid",        name:"Kalmarai (kepti)",           category:"Žuvis", kcal:175, protein:18,   fat:7,    carbs:8,   units:[{label:"1 porcija (150g)",grams:150}] },
  { id:"mussels",      name:"Midijos (garuose)",          category:"Žuvis", kcal:86,  protein:12,   fat:2.2,  carbs:3.7, units:[{label:"porcija (150g)",grams:150}] },
  { id:"fish_sticks",  name:"Žuvų lazdelės (keptos)",     barcode:"8710522688083", category:"Žuvis", kcal:235, protein:12, fat:11, carbs:22, units:[{label:"4 lazdelės (100g)",grams:100}] },
  { id:"caviar_red",   name:"Raudonieji ikrai",           category:"Žuvis", kcal:251, protein:29,   fat:14,   carbs:2.5, units:[{label:"1 šaukštelis (15g)",grams:15}] },
  { id:"halibut",      name:"Paltusas (keptas)",          category:"Žuvis", kcal:189, protein:27,   fat:8,    carbs:0,   units:[{label:"1 porcija (150g)",grams:150}] },

  // ── DAUGIAU PIENO PRODUKTŲ ───────────────────────────────────────────
  { id:"cream_ph",     name:"Kreminis sūris (Philadelphia)", barcode:"7622210028884", category:"Pieno produktai", kcal:253, protein:6, fat:23, carbs:4.8, units:[{label:"1 šaukštas (30g)",grams:30}] },
  { id:"brie",         name:"Brie sūris",                 category:"Pieno produktai", kcal:334, protein:21,   fat:28,   carbs:0.5, units:[{label:"1 porcija (30g)",grams:30}] },
  { id:"gouda",        name:"Gouda sūris",                category:"Pieno produktai", kcal:356, protein:25,   fat:27,   carbs:2.2, units:[{label:"1 riekelė (30g)",grams:30}] },
  { id:"camembert",    name:"Camembert sūris",            category:"Pieno produktai", kcal:300, protein:20,   fat:24,   carbs:0.5, units:[{label:"1 porcija (30g)",grams:30}] },
  { id:"blue_cheese",  name:"Mėlynasis sūris (Gorgonzola)",category:"Pieno produktai", kcal:353, protein:22,  fat:29,   carbs:2.3, units:[{label:"1 porcija (30g)",grams:30}] },
  { id:"parmesan2",    name:"Parmezanas (tarkuotas, blok.)",category:"Pieno produktai",kcal:431, protein:38,  fat:29,   carbs:4.1, units:[{label:"1 šaukštas (10g)",grams:10}] },
  { id:"activia_yog",  name:"Activia jogurtas (natūralus)", barcode:"3033490004064", category:"Pieno produktai", kcal:66, protein:4.5, fat:2.7, carbs:7, units:[{label:"1 indelis (125g)",grams:125}] },
  { id:"yog_fruit",    name:"Vaisinis jogurtas",           category:"Pieno produktai", kcal:90,  protein:3.5,  fat:1.5,  carbs:16,  units:[{label:"1 indelis (150g)",grams:150}] },
  { id:"condensed_m",  name:"Kondensuotas pienas (su cukrumi)", barcode:"7622210397317", category:"Pieno produktai", kcal:321, protein:7.9, fat:8, carbs:55, units:[{label:"1 šaukštas (20g)",grams:20}] },
  { id:"sour_cr_30",   name:"Grietinė (30%)",             category:"Pieno produktai", kcal:294, protein:2.5,  fat:30,   carbs:3.8, units:[{label:"1 šaukštas (25g)",grams:25}] },
  { id:"heavy_cream",  name:"Grietinėlė (riebi, 33%)",    category:"Pieno produktai", kcal:340, protein:2.5,  fat:35,   carbs:3,   units:[{label:"1 šaukštas (15ml)",grams:15}] },
  { id:"lactose_free", name:"Pienas be laktozės",         barcode:"4015400545927", category:"Pieno produktai", kcal:46, protein:3.3, fat:1.5, carbs:5.5, units:[{label:"stiklinė 200ml",grams:200}] },

  // ── JAVAI / PUSRYČIAI ────────────────────────────────────────────────
  { id:"cornflakes",   name:"Cornflakes (Kellogg's)",     barcode:"5053827185690", category:"Javai", kcal:378, protein:7.2,  fat:0.9,  carbs:84,  units:[{label:"porcija (30g)",grams:30}] },
  { id:"coco_pops",    name:"Coco Pops (Kellogg's)",      barcode:"5053827180909", category:"Javai", kcal:391, protein:5.7,  fat:3,    carbs:86,  units:[{label:"porcija (30g)",grams:30}] },
  { id:"frosties",     name:"Frosties (Kellogg's)",       barcode:"5053827186443", category:"Javai", kcal:380, protein:5.2,  fat:0.3,  carbs:89,  units:[{label:"porcija (30g)",grams:30}] },
  { id:"honey_nut_ch", name:"Honey Nut Cheerios",         barcode:"5010029214929", category:"Javai", kcal:387, protein:9,    fat:5.3,  carbs:77,  units:[{label:"porcija (30g)",grams:30}] },
  { id:"special_k",    name:"Special K (Kellogg's)",      barcode:"5053827188652", category:"Javai", kcal:379, protein:15,   fat:1.7,  carbs:75,  units:[{label:"porcija (30g)",grams:30}] },
  { id:"granola_choc", name:"Granola su šokoladu",        category:"Javai", kcal:462, protein:10,   fat:16,   carbs:71,  units:[{label:"porcija (45g)",grams:45}] },
  { id:"muesli_fruit", name:"Muesli su džiovintais vaisiais", category:"Javai", kcal:367, protein:8.7, fat:5.5, carbs:72, units:[{label:"porcija (45g)",grams:45}] },
  { id:"porridge_q",   name:"Avižinė košė (greita, sausas)", barcode:"5010029212413", category:"Javai", kcal:368, protein:10, fat:7.4, carbs:64, units:[{label:"porcija (40g)",grams:40}] },
  { id:"bulgur_j",     name:"Bulgur (virti)",             category:"Javai", kcal:83,  protein:3.1,  fat:0.2,  carbs:19,  units:[{label:"porcija (150g)",grams:150}] },
  { id:"polenta",      name:"Polenta (virta)",            category:"Javai", kcal:70,  protein:1.6,  fat:0.3,  carbs:15,  units:[{label:"porcija (150g)",grams:150}] },
  { id:"rye_crisp",    name:"Ruginiai krekeriukai (Wasa)", barcode:"7300400111125", category:"Javai", kcal:336, protein:9.4, fat:1.6, carbs:69, units:[{label:"1 krekerėlis (10g)",grams:10},{label:"2 krekerėliai",grams:20}] },

  // ── DAUGIAU DARŽOVIŲ ─────────────────────────────────────────────────
  { id:"broccoli_r",   name:"Brokoliai (žali, nevirti)",  category:"Daržovės", kcal:34,  protein:2.8,  fat:0.4,  carbs:7,   units:[{label:"1 porcija (100g)",grams:100}] },
  { id:"cauliflower",  name:"Žiediniai kopūstai (virti)", category:"Daržovės", kcal:23,  protein:1.8,  fat:0.3,  carbs:4.5, units:[{label:"1 porcija (150g)",grams:150}] },
  { id:"brussels_sp",  name:"Briuselio kopūstai (virti)", category:"Daržovės", kcal:43,  protein:3.4,  fat:0.3,  carbs:8.3, units:[{label:"1 porcija (100g)",grams:100}] },
  { id:"kale",         name:"Kale (lapiniai kopūstai)",   category:"Daržovės", kcal:49,  protein:4.3,  fat:0.9,  carbs:9,   units:[{label:"sauja (30g)",grams:30},{label:"porcija (80g)",grams:80}] },
  { id:"arugula",      name:"Rucola",                     category:"Daržovės", kcal:25,  protein:2.6,  fat:0.7,  carbs:3.7, units:[{label:"sauja (30g)",grams:30}] },
  { id:"spinach_raw",  name:"Špinatai (švieži)",          category:"Daržovės", kcal:23,  protein:2.9,  fat:0.4,  carbs:3.6, units:[{label:"sauja (30g)",grams:30},{label:"didelė (80g)",grams:80}] },
  { id:"celery",       name:"Salierai (stiebai)",         category:"Daržovės", kcal:16,  protein:0.7,  fat:0.2,  carbs:3,   units:[{label:"1 stiebas (40g)",grams:40}] },
  { id:"leek",         name:"Porai",                      category:"Daržovės", kcal:31,  protein:1.5,  fat:0.3,  carbs:7.6, units:[{label:"1 porcija (100g)",grams:100}] },
  { id:"pumpkin",      name:"Moliūgas (keptas)",          category:"Daržovės", kcal:45,  protein:1,    fat:0.1,  carbs:12,  units:[{label:"1 porcija (150g)",grams:150}] },
  { id:"green_beans",  name:"Žaliosios pupelės (virtos)", category:"Daržovės", kcal:31,  protein:1.8,  fat:0.1,  carbs:7,   units:[{label:"1 porcija (100g)",grams:100}] },
  { id:"sauerkraut",   name:"Rauginti kopūstai",          category:"Daržovės", kcal:19,  protein:0.9,  fat:0.1,  carbs:4.3, units:[{label:"porcija (100g)",grams:100}] },
  { id:"tofu_firm",    name:"Tofu (kietas, keptas)",      category:"Daržovės", kcal:144, protein:15,   fat:9,    carbs:3,   units:[{label:"½ bloko (100g)",grams:100},{label:"1 blokas (200g)",grams:200}] },
  { id:"radish",       name:"Ridikėliai",                 category:"Daržovės", kcal:16,  protein:0.7,  fat:0.1,  carbs:3.4, units:[{label:"5 vnt (50g)",grams:50}] },

  // ── DAUGIAU VAISIŲ ───────────────────────────────────────────────────
  { id:"lemon",        name:"Citrina",                    category:"Vaisiai", kcal:29,  protein:1.1,  fat:0.3,  carbs:9,   units:[{label:"1 vnt (80g)",grams:80}] },
  { id:"grapefruit",   name:"Greipfrutas",                category:"Vaisiai", kcal:42,  protein:0.8,  fat:0.1,  carbs:11,  units:[{label:"½ vnt (120g)",grams:120}] },
  { id:"peach",        name:"Persikas",                   category:"Vaisiai", kcal:39,  protein:0.9,  fat:0.3,  carbs:10,  units:[{label:"1 vidutin. (130g)",grams:130}] },
  { id:"plum",         name:"Slyva",                      category:"Vaisiai", kcal:46,  protein:0.7,  fat:0.3,  carbs:11,  units:[{label:"2 vnt (80g)",grams:80}] },
  { id:"cherry",       name:"Vyšnios",                    category:"Vaisiai", kcal:63,  protein:1.1,  fat:0.2,  carbs:16,  units:[{label:"sauja (80g)",grams:80}] },
  { id:"apricot",      name:"Abrikosas",                  category:"Vaisiai", kcal:48,  protein:1.4,  fat:0.4,  carbs:11,  units:[{label:"2 vnt (70g)",grams:70}] },
  { id:"fig",          name:"Figos (šviežios)",           category:"Vaisiai", kcal:74,  protein:0.8,  fat:0.3,  carbs:19,  units:[{label:"1 vnt (50g)",grams:50}] },
  { id:"pomegranate",  name:"Granatinis obuolys",         category:"Vaisiai", kcal:83,  protein:1.7,  fat:1.2,  carbs:19,  units:[{label:"½ vnt (90g)",grams:90}] },
  { id:"papaya",       name:"Papaja",                     category:"Vaisiai", kcal:43,  protein:0.5,  fat:0.3,  carbs:11,  units:[{label:"porcija (130g)",grams:130}] },
  { id:"dried_apric",  name:"Džiovinti abrikosai",        category:"Vaisiai", kcal:241, protein:3.4,  fat:0.5,  carbs:63,  units:[{label:"sauja (30g)",grams:30}] },
  { id:"raisins",      name:"Razinos",                    category:"Vaisiai", kcal:299, protein:3.1,  fat:0.5,  carbs:79,  units:[{label:"sauja (30g)",grams:30}] },

  // ── DAUGIAU RIEŠUTŲ ──────────────────────────────────────────────────
  { id:"macadamia",    name:"Makadamijos riešutai",       category:"Riešutai", kcal:718, protein:7.9,  fat:76,   carbs:14,  units:[{label:"sauja (28g)",grams:28}] },
  { id:"pistachio",    name:"Pistacijos (nesūdytos)",     category:"Riešutai", kcal:562, protein:20,   fat:45,   carbs:28,  units:[{label:"sauja (30g)",grams:30}] },
  { id:"hazelnuts",    name:"Lazdyno riešutai",           category:"Riešutai", kcal:628, protein:15,   fat:61,   carbs:17,  units:[{label:"sauja (30g)",grams:30}] },
  { id:"pecan",        name:"Pekanai",                    category:"Riešutai", kcal:691, protein:9.2,  fat:72,   carbs:14,  units:[{label:"sauja (28g)",grams:28}] },
  { id:"pumpkin_s2",   name:"Moliūgų sėklos (skrudytos)",category:"Riešutai", kcal:559, protein:30,   fat:49,   carbs:11,  units:[{label:"sauja (28g)",grams:28}] },
  { id:"peanut_butter",name:"Žemės riešutų sviestas (nat.)", barcode:"5010044003817", category:"Riešutai", kcal:588, protein:25, fat:50, carbs:20, units:[{label:"1 šaukštas (15g)",grams:15},{label:"2 šaukštai (30g)",grams:30}] },

  // ── DAUGIAU ANKŠTINIŲ ────────────────────────────────────────────────
  { id:"falafel",      name:"Falafelis (keptas)",         category:"Ankštiniai", kcal:333, protein:13,   fat:17,   carbs:32,  units:[{label:"3 vnt (100g)",grams:100}] },
  { id:"hummus",       name:"Humas",                     barcode:"5060012490209", category:"Ankštiniai", kcal:166, protein:7.9, fat:9.6, carbs:14, units:[{label:"2 šaukštai (40g)",grams:40},{label:"4 šaukštai (80g)",grams:80}] },
  { id:"dal_lentil",   name:"Lęšių dhal (troškinti)",    category:"Ankštiniai", kcal:127, protein:7.9,  fat:2.1,  carbs:21,  units:[{label:"porcija (200g)",grams:200}] },

  // ── SRIUBOS ──────────────────────────────────────────────────────────
  { id:"tomato_soup",  name:"Pomidorų sriuba (konservas)", barcode:"5000118980141", category:"Sriubos", kcal:72, protein:1.8, fat:2.9, carbs:10, units:[{label:"1 porcija (300ml)",grams:300}] },
  { id:"chicken_soup", name:"Vištienos sriuba su makaronais", category:"Sriubos", kcal:72, protein:5.6, fat:2.1, carbs:9, units:[{label:"1 porcija (300ml)",grams:300}] },
  { id:"borscht",      name:"Burokėlių sriuba (barščiai)",  category:"Sriubos", kcal:62, protein:2, fat:1.5, carbs:12, units:[{label:"1 porcija (300ml)",grams:300}] },
  { id:"lentil_soup",  name:"Lęšių sriuba",               category:"Sriubos", kcal:115, protein:7,    fat:1.8,  carbs:20,  units:[{label:"1 porcija (300ml)",grams:300}] },
  { id:"miso_soup",    name:"Miso sriuba",                 category:"Sriubos", kcal:40,  protein:3,    fat:1.5,  carbs:5,   units:[{label:"1 dubenėlis (200ml)",grams:200}] },

  // ── PAPILDOMI PADAŽAI ────────────────────────────────────────────────
  { id:"sriracha",     name:"Sriracha aštraus padažas",   barcode:"0769728190005", category:"Padažai", kcal:93, protein:1.5, fat:0.5, carbs:21, units:[{label:"1 šaukštelis (5g)",grams:5},{label:"1 šaukštas (16g)",grams:16}] },
  { id:"tabasco",      name:"Tabasco padažas",            barcode:"0011210000000", category:"Padažai", kcal:12, protein:0, fat:0, carbs:0.9, units:[{label:"1 šaukštelis (5ml)",grams:5}] },
  { id:"guacamole",    name:"Gvakamolė",                  category:"Padažai", kcal:160, protein:2,    fat:15,   carbs:9,   units:[{label:"2 šaukštai (50g)",grams:50}] },
  { id:"tzatziki",     name:"Tzatziki",                   category:"Padažai", kcal:72,  protein:4,    fat:3.7,  carbs:5,   units:[{label:"2 šaukštai (50g)",grams:50}] },
  { id:"sweet_chili",  name:"Saldus čili padažas",        barcode:"8715700110042", category:"Padažai", kcal:232, protein:0.4, fat:0.2, carbs:57, units:[{label:"1 šaukštas (17g)",grams:17}] },
  { id:"worcester",    name:"Worcestershire padažas",     barcode:"5000157023756", category:"Padažai", kcal:78, protein:1.1, fat:0.1, carbs:19, units:[{label:"1 šaukštelis (5ml)",grams:5}] },
  { id:"caesar_dr",    name:"Cezario padažas",            category:"Padažai", kcal:456, protein:3.5,  fat:48,   carbs:4,   units:[{label:"1 šaukštas (15g)",grams:15}] },
  { id:"balsamic_v",   name:"Balzaminis actas",           category:"Padažai", kcal:88,  protein:0.5,  fat:0,    carbs:17,  units:[{label:"1 šaukštelis (5ml)",grams:5}] },
  { id:"oyster_sauce", name:"Austrių padažas",            barcode:"0038900000141", category:"Padažai", kcal:102, protein:2.8, fat:0.3, carbs:23, units:[{label:"1 šaukštas (18g)",grams:18}] },
  { id:"fish_sauce",   name:"Žuvies padažas",             category:"Padažai", kcal:35,  protein:5,    fat:0,    carbs:3.6, units:[{label:"1 šaukštelis (5ml)",grams:5}] },
];

// ── SUJUNGIMAS ─────────────────────────────────────────────────────────────
export const ALL_FOODS = [...LOCAL_FOODS, ...EXTRA_FOODS];

export function searchLocalFoods(query) {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_FOODS.slice(0, 15);
  // Barkodo paieška (tiksliai pagal skaitmenų eilutę)
  if (/^\d{8,14}$/.test(q)) {
    const byBarcode = ALL_FOODS.filter(f => f.barcode === q);
    if (byBarcode.length) return byBarcode;
  }
  return ALL_FOODS.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.category.toLowerCase().includes(q) ||
    (f.barcode && f.barcode.includes(q))
  ).slice(0, 12);
}

export const CATEGORIES = [...new Set(ALL_FOODS.map(f => f.category))];
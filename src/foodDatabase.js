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
  { id:"cod",        name:"Menkė (virta)",                  category:"Žuvis",      kcal:105, protein:23,   fat:0.9,  carbs:0, units:[{label:"1 filė (150g)",grams:150}] },
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
  { id:"millet",     name:"Soros (virtos)",               category:"Grūdai",     kcal:119, protein:3.5,  fat:1,    carbs:23,  units:[{label:"½ puodelio (100g)",grams:100}] },
  { id:"quinoa",     name:"Kvietinukai (virti)",          category:"Grūdai",     kcal:120, protein:4.4,  fat:1.9,  carbs:22,  units:[{label:"½ puodelio (100g)",grams:100},{label:"1 puodelis (200g)",grams:200}] },
  { id:"couscous",   name:"Kuskusas (virti)",             category:"Grūdai",     kcal:112, protein:3.8,  fat:0.2,  carbs:23,  units:[{label:"½ puodelio (100g)",grams:100}] },
  { id:"crisp",      name:"Ryžių/kukurūzų traškučiai",   category:"Grūdai",     kcal:372, protein:7,    fat:2,    carbs:82,  units:[{label:"1 gabalėlis (10g)",grams:10},{label:"3 gabalėliai",grams:30}] },
  { id:"muesli",     name:"Miuslis (be cukraus)",         category:"Grūdai",     kcal:352, protein:11,   fat:7,    carbs:63,  units:[{label:"½ puodelio (50g)",grams:50}] },
  { id:"corn_flour", name:"Kukurūzų miltai",              category:"Grūdai",     kcal:365, protein:9,    fat:4,    carbs:74,  units:[{label:"1 šaukštas (10g)",grams:10}] },

  // ── ANKŠTINIAI ─────────────────────────────────────────────────────────
  { id:"lentils",    name:"Lęšiai (virti)",             category:"Ankštiniai", kcal:116, protein:9,    fat:0.4,  carbs:20,  units:[{label:"½ puodelio (100g)",grams:100},{label:"1 puodelis (200g)",grams:200}] },
  { id:"chickpeas",  name:"Avinžirniai (virti)",        category:"Ankštiniai", kcal:164, protein:8.9,  fat:2.6,  carbs:27,  units:[{label:"½ puodelio (100g)",grams:100},{label:"1 puodelis (200g)",grams:200}] },
  { id:"beans_blk",  name:"Juodosios pupelės (virtos)", category:"Ankštiniai", kcal:132, protein:8.9,  fat:0.5,  carbs:24,  units:[{label:"½ puodelio (100g)",grams:100}] },
  { id:"beans_wh",   name:"Baltosios pupelės (virtos)", category:"Ankštiniai", kcal:139, protein:9.7,  fat:0.5,  carbs:25,  units:[{label:"½ puodelio (100g)",grams:100}] },
  { id:"edamame",    name:"Edamamė (virta)",             category:"Ankštiniai", kcal:122, protein:11,   fat:5.2,  carbs:8.9, units:[{label:"½ puodelio (80g)",grams:80}] },
  { id:"tofu",       name:"Tofu (kietas)",               category:"Ankštiniai", kcal:76,  protein:8,    fat:4.2,  carbs:1.9, units:[{label:"½ bloko (140g)",grams:140}] },
  { id:"hummus",     name:"Hummusas",                    category:"Ankštiniai", kcal:177, protein:7.9,  fat:9.6,  carbs:20,  units:[{label:"2 šaukštai (30g)",grams:30},{label:"4 šaukštai",grams:60}] },

  // ── DARŽOVĖS ───────────────────────────────────────────────────────────
  { id:"broccoli",   name:"Brokoliai (virti)",          category:"Daržovės", kcal:35,  protein:2.4,  fat:0.4,  carbs:7.2, units:[{label:"1 porcija (150g)",grams:150},{label:"½ porcija",grams:75}] },
  { id:"caulifl",    name:"Žiediniai kopūstai (virti)", category:"Daržovės", kcal:23,  protein:1.8,  fat:0.3,  carbs:4.1, units:[{label:"1 porcija (150g)",grams:150}] },
  { id:"spinach",    name:"Špinatai (švieži)",          category:"Daržovės", kcal:23,  protein:2.9,  fat:0.4,  carbs:3.6, units:[{label:"1 sauja (30g)",grams:30},{label:"didelė sautelė (60g)",grams:60}] },
  { id:"spinach_c",  name:"Špinatai (virti)",           category:"Daržovės", kcal:23,  protein:2.9,  fat:0.4,  carbs:3.6, units:[{label:"½ puodelio (100g)",grams:100}] },
  { id:"kale",       name:"Lapiniai kopūstai (kale)",   category:"Daržovės", kcal:49,  protein:4.3,  fat:0.9,  carbs:9,   units:[{label:"1 sauja (30g)",grams:30},{label:"1 porcija (80g)",grams:80}] },
  { id:"carrot",     name:"Morkos",                     category:"Daržovės", kcal:41,  protein:0.9,  fat:0.2,  carbs:10,  units:[{label:"1 vidutin. (80g)",grams:80},{label:"2 vnt",grams:160}] },
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
];

export function searchLocalFoods(query) {
  const q = query.toLowerCase().trim();
  if (!q) return LOCAL_FOODS.slice(0, 15);
  return LOCAL_FOODS.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.category.toLowerCase().includes(q)
  ).slice(0, 12);
}

export const CATEGORIES = [...new Set(LOCAL_FOODS.map(f => f.category))];

// ── PAPILDYMAI ─────────────────────────────────────────────────────────────
const EXTRA_FOODS = [
  // Kepyklos / duonos gaminiai
  { id:"bagel",      name:"Beigelis (paprastas)",        category:"Kepykla", kcal:272, protein:10.6, fat:1.8,  carbs:53,  units:[{label:"1 mažas (70g)",grams:70},{label:"1 didelis (105g)",grams:105}] },
  { id:"bagel_wh",   name:"Beigelis (viso grūdo)",       category:"Kepykla", kcal:245, protein:11,   fat:2,    carbs:48,  units:[{label:"1 vnt (105g)",grams:105}] },
  { id:"bagel_bl",   name:"Beigelis su sėklomis",        category:"Kepykla", kcal:280, protein:10,   fat:3,    carbs:54,  units:[{label:"1 vnt (105g)",grams:105}] },
  { id:"croissant",  name:"Kruasanas",                   category:"Kepykla", kcal:406, protein:8.2,  fat:21,   carbs:46,  units:[{label:"1 mažas (50g)",grams:50},{label:"1 didelis (80g)",grams:80}] },
  { id:"muffin_bl",  name:"Muffinas (su mėlynėmis)",     category:"Kepykla", kcal:377, protein:5.7,  fat:14,   carbs:57,  units:[{label:"1 vnt (113g)",grams:113}] },
  { id:"pita",       name:"Pita duona",                  category:"Kepykla", kcal:275, protein:9.1,  fat:1.2,  carbs:56,  units:[{label:"1 vnt (60g)",grams:60}] },
  { id:"tortilla_wh",name:"Tortila (kvietinė)",          category:"Kepykla", kcal:312, protein:8.5,  fat:7.7,  carbs:51,  units:[{label:"1 maža (30g)",grams:30},{label:"1 didelė (65g)",grams:65}] },
  { id:"tortilla_co",name:"Tortila (kukurūzų)",          category:"Kepykla", kcal:218, protein:5.7,  fat:3.2,  carbs:46,  units:[{label:"1 vnt (26g)",grams:26}] },
  { id:"wrap",       name:"Wrap duonelė (pilno grūdo)",  category:"Kepykla", kcal:290, protein:9,    fat:6,    carbs:50,  units:[{label:"1 vnt (64g)",grams:64}] },
  { id:"pancake",    name:"Blynai (klasikiniai)",        category:"Kepykla", kcal:227, protein:6.3,  fat:10,   carbs:28,  units:[{label:"1 blynas (40g)",grams:40},{label:"3 blynai",grams:120}] },
  { id:"waffle",     name:"Vafelis",                     category:"Kepykla", kcal:291, protein:7.9,  fat:14,   carbs:37,  units:[{label:"1 vnt (75g)",grams:75}] },
  { id:"rice_cake",  name:"Ryžių pyragaitis",            category:"Kepykla", kcal:387, protein:8,    fat:2.8,  carbs:81,  units:[{label:"1 vnt (9g)",grams:9},{label:"2 vnt",grams:18},{label:"3 vnt",grams:27}] },
  { id:"granola_bar",name:"Granola batonėlis",           category:"Kepykla", kcal:471, protein:7,    fat:19,   carbs:70,  units:[{label:"1 vnt (47g)",grams:47}] },

  // Snacks / užkandžiai
  { id:"prot_bar",   name:"Baltymų batonėlis (vidut.)",  category:"Snacks",  kcal:350, protein:25,   fat:10,   carbs:40,  units:[{label:"1 vnt (60g)",grams:60}] },
  { id:"chips_pot",  name:"Bulvių traškučiai",           category:"Snacks",  kcal:536, protein:7,    fat:35,   carbs:53,  units:[{label:"sauja (30g)",grams:30},{label:"mažas pakelis (50g)",grams:50}] },
  { id:"popcorn",    name:"Spragėsiai (be sviesto)",     category:"Snacks",  kcal:382, protein:12,   fat:4.3,  carbs:78,  units:[{label:"1 puodelis (8g)",grams:8},{label:"3 puodeliai",grams:24}] },
  { id:"dark_choc",  name:"Juodasis šokoladas (70%+)",   category:"Snacks",  kcal:598, protein:7.8,  fat:42,   carbs:46,  units:[{label:"2 plytelės (20g)",grams:20},{label:"4 plytelės",grams:40}] },
  { id:"milk_choc",  name:"Pieninis šokoladas",          category:"Snacks",  kcal:535, protein:7.7,  fat:29,   carbs:60,  units:[{label:"2 plytelės (20g)",grams:20}] },
  { id:"pretzel",    name:"Preceliai",                   category:"Snacks",  kcal:381, protein:9.6,  fat:3.6,  carbs:80,  units:[{label:"sauja (30g)",grams:30}] },

  // Perdirbti maisto produktai
  { id:"ham",        name:"Kumpis (virtas)",             category:"Perdirbta mėsa", kcal:145, protein:20,   fat:6.5,  carbs:1.6, units:[{label:"2 riekelės (60g)",grams:60},{label:"4 riekelės",grams:120}] },
  { id:"salami",     name:"Salami",                      category:"Perdirbta mėsa", kcal:425, protein:22,   fat:37,   carbs:1.2, units:[{label:"3 riekelės (30g)",grams:30}] },
  { id:"hotdog",     name:"Dešra (virta)",               category:"Perdirbta mėsa", kcal:290, protein:11,   fat:26,   carbs:2.7, units:[{label:"1 vnt (52g)",grams:52}] },
  { id:"sausage_br", name:"Dešrelė pusryčiams (kepta)", category:"Perdirbta mėsa", kcal:301, protein:13,   fat:27,   carbs:2,   units:[{label:"1 vnt (45g)",grams:45},{label:"2 vnt",grams:90}] },

  // Greitasis maistas / restoranai
  { id:"pizza_sl",   name:"Pica (1 gabalėlis, sūrio)",  category:"Restoranai", kcal:285, protein:12,   fat:10,   carbs:36,  units:[{label:"1 gabalėlis (107g)",grams:107},{label:"2 gabalėliai",grams:214}] },
  { id:"burger_p",   name:"Burgerio kotletas (jautiena)",category:"Restoranai", kcal:295, protein:20,   fat:23,   carbs:0,   units:[{label:"1 kotletas (113g)",grams:113}] },
  { id:"sushi_r",    name:"Sushi ritiniklis (su žuvimi)",category:"Restoranai", kcal:93,  protein:5,    fat:0.7,  carbs:18,  units:[{label:"1 vnt (28g)",grams:28},{label:"6 vnt",grams:168},{label:"8 vnt",grams:224}] },

  // Papildomi pieno
  { id:"prot_yog",   name:"Baltyminis jogurtas (Skyr)", category:"Pieno produktai", kcal:67,  protein:11,   fat:0.2,  carbs:4.5, units:[{label:"1 indelis (150g)",grams:150},{label:"1 didelis (200g)",grams:200}] },
  { id:"ice_cream",  name:"Ledai (vaniliniai)",          category:"Pieno produktai", kcal:207, protein:3.5,  fat:11,   carbs:24,  units:[{label:"1 kaušelis (65g)",grams:65},{label:"2 kaušeliai",grams:130}] },
  { id:"whip_cream", name:"Grietinėlė (plakta, 35%)",   category:"Pieno produktai", kcal:340, protein:2.2,  fat:35,   carbs:2.8, units:[{label:"2 šaukštai (30g)",grams:30}] },

  // Pupelių/sojos produktai
  { id:"tempeh",     name:"Tempeh",                      category:"Ankštiniai", kcal:193, protein:19,   fat:11,   carbs:9.4, units:[{label:"½ bloko (85g)",grams:85}] },
  { id:"miso",       name:"Miso pasta",                  category:"Ankštiniai", kcal:199, protein:12,   fat:6,    carbs:27,  units:[{label:"1 šaukštas (17g)",grams:17}] },

  // Papildomos daržovės
  { id:"artich",     name:"Artišokai (konservuoti)",     category:"Daržovės", kcal:50,  protein:2.8,  fat:0.2,  carbs:11,  units:[{label:"½ skardinė (120g)",grams:120}] },
  { id:"sun_tom",    name:"Džiovinti pomidorai aliejuje",category:"Daržovės", kcal:213, protein:5.1,  fat:15,   carbs:23,  units:[{label:"2 šaukštai (30g)",grams:30}] },
  { id:"olives",     name:"Alyvuogės (juodos)",          category:"Daržovės", kcal:115, protein:0.8,  fat:10.9, carbs:6.3, units:[{label:"10 vnt (40g)",grams:40}] },

  // Prieskoniai
  { id:"tahini",     name:"Tahini (sezamo pasta)",       category:"Padažai", kcal:595, protein:17,   fat:53,   carbs:21,  units:[{label:"1 šaukštas (15g)",grams:15}] },
  { id:"pesto",      name:"Pesto padažas",               category:"Padažas", kcal:376, protein:6,    fat:35,   carbs:9,   units:[{label:"1 šaukštas (20g)",grams:20}] },
  { id:"bbq_sauce",  name:"BBQ padažas",                 category:"Padažai", kcal:172, protein:1,    fat:0.4,  carbs:41,  units:[{label:"1 šaukštas (17g)",grams:17}] },
  { id:"ranch",      name:"Ranch padažas",               category:"Padažai", kcal:522, protein:1.3,  fat:55,   carbs:5.1, units:[{label:"2 šaukštai (30g)",grams:30}] },
];

// Sujungiam su pagrindiniu masyvu
export const ALL_FOODS = [...LOCAL_FOODS, ...EXTRA_FOODS];

export function searchLocalFoods(query) {
  const q = query.toLowerCase().trim();
  if (!q) return ALL_FOODS.slice(0, 15);
  return ALL_FOODS.filter(f =>
    f.name.toLowerCase().includes(q) ||
    f.category.toLowerCase().includes(q)
  ).slice(0, 12);
}

export const CATEGORIES = [...new Set(ALL_FOODS.map(f => f.category))];

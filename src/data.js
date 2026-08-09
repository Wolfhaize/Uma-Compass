// Parsed from "Copy_of_Draft Cheat Sheet v1.1 - Tracks.pdf"
// Columns: location, distance, type, surface, handed, threshold, posKeepEnd, spurtStart,
// spurtDetails, lastSpurtStart, beforeAfter, corners, straights, skills[], accels[]
// NOTE: The source PDF's table columns were merged by the PDF text extractor
// (e.g. "After22" = After + 2 corners + 2 straights). This was reconstructed
// by inference — please spot-check against the original sheet and use the
// in-app "Edit" / data file to correct anything that looks off.

const T = (loc, distance, type, surface, handed, threshold, posKeepEnd, spurtStart, spurtDetails, lastSpurtStart, beforeAfter, corners, straights, skills, accels, umas) => ({
  location: loc, distance, type, surface, handed, threshold, posKeepEnd, spurtStart,
  spurtDetails, lastSpurtStart, beforeAfter, corners, straights, skills, accels,
  umas: umas || accels,
})

export const TRACKS = [
  T("Chukyo","1200","Sprint","Turf","Left","-",500,800,"Final Straight Downhill",1000,"After",2,2,["Victoria por plancha","Straightaway Spurt","Budding Blossom"],["Nishino Flower"]),
  T("Chukyo","1400","Sprint","Turf","Left","-",583,933,"Final Corner Downhill",1167,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron!","Budding Blossom","Shooting For Victory"],["Taiki Shuttle","Nishino Flower"]),
  T("Chukyo","1600","Mile","Turf","Left","Speed",667,1067,"Final Corner Downhill",1333,"After",3,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron!","Budding Blossom","Shooting For Victory"],["Taiki Shuttle","Nishino Flower","Red Maru","Fantasy Pasa"]),
  T("Chukyo","2000","Medium","Turf","Left","-",833,1333,"Corner Downhill",1667,"After",4,3,["Shrewd Step","Let's Pump Some Iron","Moving Past and Beyond","Angling and Scheming","Red Shift/LP1211-M"],["X. Oguri","SMaru","Red Maru","Fantasy Pasa"]),
  T("Chukyo","2200","Medium","Turf","Left","Stamina",917,1467,"Corner Downhill",1833,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["X. Oguri","SMaru","Kitasan"]),
  T("Chukyo","1400","Sprint","Dirt","Left","-",583,933,"Final Corner Downhill",1167,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Budding Blossom","Shooting for Victory"],["Taiki Shuttle"]),
  T("Chukyo","1800","Mile","Dirt","Left","Stamina",750,1200,"Final Corner Downhill",1500,"After",4,3,["Shrewd Step","Red Shift/LP1211-M","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["Red Maru","Fantasy Pasa"]),

  T("Fukushima","1200","Sprint","Turf","Right","-",500,800,"Final Corner",1000,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Shooting for Victory","Budding Blossom"],["Red Maru","Fantasy Pasa","Nishino Flower"]),
  T("Fukushima","1800","Mile","Turf","Right","Stamina",750,1200,"Corner",1500,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],[]),
  T("Fukushima","2000","Medium","Turf","Right","Stamina",833,1333,"Corner",1667,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["X. Oguri","SMaru","Kitasan"]),
  T("Fukushima","2600","Long","Turf","Right","-",1083,1733,"Straight",2167,"Before",6,4,["Straightaway Spurt","Victory Cheer","Break It Down!"],["Kitasan","Ballroom Seiun"]),
  T("Fukushima","1150","Sprint","Dirt","Right","-",476,767,"Final Corner",958,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Shooting for Victory","Budding Blossom"],["Fantasy Pasa","Red Maru","Nishino Flower"]),
  T("Fukushima","1700","Mile","Dirt","Right","Power",708,1133,"Corner",1417,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],[]),

  T("Hakodate","1000","Sprint","Turf","Right","-",417,667,"Final Corner",833,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Budding Blossom","Shooting for Victory"],["Taiki Shuttle","Nishino Flower"]),
  T("Hakodate","1200","Sprint","Turf","Right","-",500,800,"Final Corner",1000,"After",2,2,["Angling and Scheming","Let's Pump Some Iron"],["Red Maru","Fantasy Pasa"]),
  T("Hakodate","1800","Mile","Turf","Right","Power",750,1200,"Corner Uphill",1500,"After",4,3,["Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["Kitasan"]),
  T("Hakodate","2000","Medium","Turf","Right","Speed",833,1333,"Corner Uphill",1667,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["X. Oguri","SMaru","Kitasan"]),
  T("Hakodate","2600","Long","Turf","Right","Stamina",1083,1733,"Straight Uphill",2167,"Before",6,4,["Shrewd Step","Straightaway Spurt","Victory Cheer","Break It Down!"],["Kitasan","Ballroom Seiun"]),
  T("Hakodate","1700","Mile","Dirt","Right","-",708,1133,"Corner Uphill",1417,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],[]),

  T("Hanshin","1200","Sprint","Turf","Right","-",500,800,"Final Corner Downhill",1000,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Budding Blossom"],["Nishino Flower"]),
  T("Hanshin","1400","Sprint","Turf","Right","-",583,933,"Final Corner Downhill",1167,"After",2,2,["Angling and Scheming","Let's Pump Some Iron","Budding Blossom","Shooting for Victory"],["Taiki Shuttle","Nishino Flower"]),
  T("Hanshin","1600","Mile","Turf","Right","Power",667,1067,"Final Corner Downhill",1333,"After",2,2,["Angling and Scheming","Let's Pump Some Iron","Budding Blossom"],["Taiki Shuttle","Nishino Flower"]),
  T("Hanshin","1800","Mile","Turf","Right","Power",750,1200,"Final Corner Downhill",1500,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Budding Blossom","Shooting for Victory"],["Taiki Shuttle","Nishino Flower"]),
  T("Hanshin","2000","Medium","Turf","Right","Guts",833,1333,"Corner Downhill",1667,"After",4,3,["Shrewd Step","Let's Pump Some Iron","Moving Past and Beyond","Angling and Scheming","Red Shift/LP1211-M"],["X. Oguri","SMaru","Red Maru","Fantasy Pasa"]),
  T("Hanshin","2200","Medium","Turf","Right","Speed",917,1467,"Corner Downhill",1833,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["X. Oguri","SMaru"]),
  T("Hanshin","2400","Medium","Turf","Right","Power",1000,1600,"Final Corner",2000,"After",4,2,["Shrewd Step","Red Shift/LP1211-M","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["Red Maru","Fantasy Pasa","X. Oguri"]),
  T("Hanshin","2600","Long","Turf","Right","-",1083,1733,"Corner",2167,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond","Red Shift/LP1211-M"],[]),
  T("Hanshin","3000","Long","Turf","Right","Power",1250,2000,"Straight",2500,"Before",6,4,["Shrewd Step","Straightaway Spurt","Victory Cheer","Break It Down!","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["Kitasan","Ballroom Seiun"]),
  T("Hanshin","3200","Long","Turf","Right","-",1333,2133,"Straight",2667,"Before",6,4,["Shrewd Step","Straightaway Spurt","Victory Cheer","Break It Down!"],["Kitasan","Ballroom Seiun"]),
  T("Hanshin","1400","Sprint","Dirt","Right","-",583,933,"Final Corner",1167,"After",2,2,["Angling and Scheming","Let's Pump Some Iron","Shooting for Victory","Budding Blossom"],["Taiki Shuttle"]),
  T("Hanshin","1800","Mile","Dirt","Right","-",750,1200,"Final Corner",1500,"After",4,3,["Shrewd Step","Red Shift/LP1211-M","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["Red Maru","Fantasy Pasa"]),
  T("Hanshin","2000","Medium","Dirt","Right","Stamina/Power",833,1333,"Corner",1667,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["X. Oguri","SMaru"]),

  T("Kokura","1200","Sprint","Turf","Right","Speed",500,800,"Final Corner",1000,"After",2,2,["Angling and Scheming","Let's Pump Some Iron!","Shooting For Victory","Budding Blossom"],["Taiki Shuttle","Nishino Flower"]),
  T("Kokura","1800","Mile","Turf","Right","-",750,1200,"Corner",1500,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["Kitasan"]),
  T("Kokura","2000","Medium","Turf","Right","Power",833,1333,"Corner",1667,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["X. Oguri","SMaru","Kitasan"]),
  T("Kokura","2600","Long","Turf","Right","Stamina",1083,1733,"Straight",2167,"Before",6,4,["Shrewd Step","Straightaway Spurt","Victory Cheer","Break It Down!"],["Kitasan","Ballroom Seiun"]),
  T("Kokura","1700","Mile","Dirt","Right","-",708,1133,"Corner",1417,"After",4,3,["Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],[]),

  T("Kyoto","1200","Sprint","Turf","Right","-",500,800,"Final Corner",1000,"After",2,2,["Angling and Scheming","Let's Pump Some Iron","Budding Blossom"],["Taiki Shuttle","Nishino Flower"]),
  T("Kyoto","1800","Mile","Turf","Right","-",750,1200,"Final Corner",1500,"After",2,2,["Angling and Scheming","Let's Pump Some Iron","Red Shift/LP1211-M","Moving Past and Beyond"],["Red Maru","Fantasy Pasa"]),
  T("Kyoto","2000","Medium","Turf","Right","Power",833,1333,"Corner Downhill",1667,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["X. Oguri","SMaru","Kitasan"]),
  T("Kyoto","2200","Medium","Turf","Right","Speed",917,1467,"Corner Downhill",1833,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["X. Oguri","SMaru","Kitasan"]),
  T("Kyoto","2400","Medium","Turf","Right","Power",1000,1600,"Corner Downhill",2000,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["Kitasan","X. Oguri"]),
  T("Kyoto","3000","Long","Turf","Right","Power/Wit",1250,2000,"Straight Uphill",2500,"Before",6,4,["Shrewd Step","Straightaway Spurt","Victory Cheer","Break It Down!"],["Kitasan","Ballroom Seiun"]),
  T("Kyoto","3200","Long","Turf","Right","-",1333,2133,"Straight Uphill",2667,"Before",6,4,["Shrewd Step","Straightaway Spurt","Victory Cheer","Break It Down!"],["Kitasan","Ballroom Seiun"]),
  T("Kyoto (Inner)","1400","Sprint","Turf","Right","-",583,933,"Final Corner",1167,"After",2,2,["Angling and Scheming","Let's Pump Some Iron","Shooting for Victory","Budding Blossom"],["Taiki Shuttle","Nishino Flower"]),
  T("Kyoto (Outer)","1400","Sprint","Turf","Right","-",583,933,"Final Corner",1167,"After",2,2,["Angling and Scheming","Let's Pump Some Iron","Budding Blossom","Shooting for Victory"],["Taiki Shuttle","Nishino Flower"]),
  T("Kyoto (Inner)","1600","Mile","Turf","Right","Speed",667,1067,"Final Corner",1333,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron"],["Red Maru","Fantasy Pasa"]),
  T("Kyoto (Outer)","1600","Mile","Turf","Right","Speed",667,1067,"Final Corner",1333,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Shooting for Victory","Budding Blossom"],["Taiki Shuttle","Red Maru","Nishino Flower"]),
  T("Kyoto","1200","Sprint","Dirt","Right","-",500,800,"Final Corner",1000,"After",2,2,["Angling and Scheming","Let's Pump Some Iron","Budding Blossom"],["Taiki Shuttle"]),
  T("Kyoto","1400","Sprint","Dirt","Right","-",583,933,"Final Corner",1167,"After",2,2,["Angling and Scheming","Let's Pump Some Iron","Shooting for Victory","Budding Blossom"],["Taiki Shuttle","Red Maru","Fantasy Pasa"]),
  T("Kyoto","1800","Mile","Dirt","Right","-",750,1200,"Corner Downhill",1500,"After",4,3,["Shrewd Step","Let's Pump Some Iron","Moving Past and Beyond","Angling and Scheming","Red Shift/LP1211-M"],["Red Maru"]),
  T("Kyoto","1900","Medium","Dirt","Right","-",792,1267,"Corner Downhill",1583,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["X. Oguri","SMaru"]),

  T("Nakayama","1200","Sprint","Turf","Right","-",500,800,"Final Corner",1000,"After",2,1,["Angling and Scheming","Let's Pump Some Iron","Budding Blossom","Shooting for Victory"],["Taiki Shuttle","Nishino Flower"]),
  T("Nakayama","1600","Mile","Turf","Right","Power",667,1067,"Final Corner",1333,"After",3,1,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Red Shift/LP1211-M","Moving Past and Beyond"],["Red Maru","Fantasy Pasa"]),
  T("Nakayama","1800","Mile","Turf","Right","-",750,1200,"Corner",1500,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],[]),
  T("Nakayama","2000","Medium","Turf","Right","Speed",833,1333,"Corner",1667,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["X. Oguri","SMaru","Kitasan"]),
  T("Nakayama","2200","Medium","Turf","Right","Stamina/Guts",917,1467,"Corner",1833,"After",4,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["X. Oguri","SMaru","Kitasan"]),
  T("Nakayama","2500","Long","Turf","Right","Stamina/Guts",1042,1667,"Straight",2083,"Before",6,3,["Shrewd Step","Straightaway Spurt","Victory Cheer","Break It Down!","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["Kitasan","Ballroom Seiun"]),
  T("Nakayama","3600","Long","Turf","Right","Stamina",1500,2400,"Corner Downhill",3000,"After",8,5,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond","Straightaway Spurt","Victory Cheer"],[]),
  T("Nakayama","1200","Sprint","Dirt","Right","Power",500,800,"Final Corner",1000,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Shooting for Victory","Budding Blossom"],["Taiki Shuttle"]),
  T("Nakayama","1800","Mile","Dirt","Right","Power",750,1200,"Corner",1500,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],[]),

  T("Niigata","1000","Sprint","Turf","Straight","Power",417,667,"Final Straight",833,"-",0,2,["Straightaway Spurt"],[]),
  T("Niigata","1200","Sprint","Turf","Left","-",500,800,"Final Corner",1000,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Budding Blossom"],["Taiki Shuttle","Nishino Flower"]),
  T("Niigata","1400","Sprint","Turf","Left","-",583,933,"Corner",1167,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Shooting for Victory","Nishino Flower"],["Taiki Shuttle","Red Maru","Fantasy Pasa","Nishino Flower"]),
  T("Niigata","1600","Mile","Turf","Left","-",667,1067,"Final Straight",1333,"-",2,2,["Shrewd Step","Straightaway Spurt","Budding Blossom"],["Nishino Flower"]),
  T("Niigata","1800","Mile","Turf","Left","Power",750,1200,"Final Straight",1500,"-",2,2,["Shrewd Step","Straightaway Spurt","Budding Blossom","Victoria por plancha"],["Nishino Flower"]),
  T("Niigata","2200","Medium","Turf","Left","Speed",917,1467,"Corner",1833,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond","Victory Cheer"],[]),
  T("Niigata","2400","Medium","Turf","Left","-",1000,1600,"Straight",2000,"Before",4,3,["Shrewd Step","Straightaway Spurt","Victory Cheer","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["Kitasan","X. Oguri"]),
  T("Niigata (Inner)","2000","Medium","Turf","Left","Stamina/Power",833,1333,"Corner",1667,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["X. Oguri","SMaru","Kitasan"]),
  T("Niigata (Outer)","2000","Medium","Turf","Left","Stamina/Power",833,1333,"Final Corner",1667,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Budding Blossom","Straightaway Spurt","Victoria por plancha"],["X. Oguri","SMaru","Taiki Shuttle","Nishino Flower(??)"]),
  T("Niigata","1200","Sprint","Dirt","Left","-",500,800,"Final Corner",1000,"After",2,2,["Angling and Scheming","Let's Pump Some Iron","Budding Blossom"],["Red Maru","Fantasy Pasa","Nishino Flower","Taiki Shuttle"]),
  T("Niigata","1800","Mile","Dirt","Left","Wit",750,1200,"Corner",1500,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],[]),

  T("Ooi","1200","Sprint","Dirt","Right","Guts/Wit",500,800,"N/A",1000,"-",2,2,["Victoria por plancha","Straightaway Spurt"],["Taiki Shuttle"]),
  T("Ooi","1800","Mile","Dirt","Right","Power",750,1200,"Corner",1500,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],[]),
  T("Ooi","2000","Medium","Dirt","Right","Stamina",833,1333,"Corner",1667,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond","Victory Cheer"],["X. Oguri","SMaru"]),

  T("Sapporo","1200","Sprint","Turf","Right","-",500,800,"Final Corner",1000,"After",2,2,["Angling and Scheming","Let's Pump Some Iron!","Budding Blossom","Shooting For Victory"],["Nishino Flower","Taiki Shuttle"]),
  T("Sapporo","1500","Mile","Turf","Right","-",625,1000,"Final Corner",1250,"After",3,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond","Red Shift/LP1211-M"],["Red Maru","Fantasy Pasa"]),
  T("Sapporo","1800","Mile","Turf","Right","-",750,1200,"Corner",1500,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond","Victory Cheer"],[]),
  T("Sapporo","2000","Medium","Turf","Right","Power",833,1333,"Corner",1667,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond","Victory Cheer"],["X. Oguri","SMaru","Kitasan"]),
  T("Sapporo","2600","Long","Turf","Right","Stamina",1083,1733,"Straight",2167,"Before",6,4,["Shrewd Step","Straightaway Spurt","Victory Cheer","Break It Down!","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["Kitasan","Ballroom Seiun"]),
  T("Sapporo","1700","Mile","Dirt","Right","Speed",708,1133,"Corner",1417,"After",4,3,["Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],[]),

  T("Tokyo","1400","Sprint","Turf","Left","Stamina/Power",583,933,"Final Straight",1167,"-",2,2,["Budding Blossom","Straightaway Spurt","Victoria por plancha"],["Nishino Flower"]),
  T("Tokyo","1600","Mile","Turf","Left","Stamina/Guts",667,1067,"Final Corner",1333,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Budding Blossom","Straightaway Spurt","Victoria por plancha"],["Nishino Flower","Taiki Shuttle"]),
  T("Tokyo","1800","Mile","Turf","Left","Speed",750,1200,"Final Corner",1500,"After",3,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Budding Blossom","Shooting for Victory"],["Taiki Shuttle","Nishino Flower"]),
  T("Tokyo","2000","Medium","Turf","Left","-",833,1333,"Final Corner",1667,"After",3,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Shooting for Victory","Budding Blossom"],["X. Oguri","SMaru","Red Maru","Fantasy Pasa","Taiki Shuttle","Nishino Flower(??)"]),
  T("Tokyo","2300","Medium","Turf","Left","Power",958,1533,"Final Corner",1917,"After",4,3,["Red Shift/LP1211-M","Angling and Scheming","Let's Pump Some Iron","Moving Past and Beyond"],["Red Maru","Fantasy Pasa","X. Oguri","SMaru"]),
  T("Tokyo","2400","Medium","Turf","Left","-",1000,1600,"Corner",2000,"After",4,3,["Shrewd Step","Let's Pump Some Iron","Moving Past and Beyond","Angling and Scheming","Red Shift/LP1211-M"],["Red Maru","Fantasy Pasa","X. Oguri"]),
  T("Tokyo","2500","Long","Turf","Left","Stamina",1042,1667,"Corner",2083,"After",4,3,["Shrewd Step","Let's Pump Some Iron","Moving Past and Beyond","Angling and Scheming"],[]),
  T("Tokyo","3400","Long","Turf","Left","-",1417,2267,"Straight Downhill",2833,"Before",6,4,["Shrewd Step","Straightaway Spurt","Victory Cheer","Break It Down!"],["Kitasan","Ballroom Seiun"]),
  T("Tokyo","1300","Sprint","Dirt","Left","Speed",542,867,"Final Straight Uphill",1083,"-",2,2,["Budding Blossom","Straightaway Spurt","Victoria por plancha"],[]),
  T("Tokyo","1400","Sprint","Dirt","Left","Stamina",583,933,"Final Straight Uphill",1167,"-",2,2,["Budding Blossom","Straightaway Spurt","Victoria por plancha"],[]),
  T("Tokyo","1600","Mile","Dirt","Left","Speed/Stamina",667,1067,"Final Corner",1333,"After",2,2,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Budding Blossom","Shooting for Victory","Straightaway Spurt","Victoria por plancha"],["Taiki Shuttle"]),
  T("Tokyo","2100","Medium","Dirt","Left","-",875,1400,"Final Corner",1750,"After",4,3,["Shrewd Step","Angling and Scheming","Let's Pump Some Iron","Red Shift/LP1211-M","Moving Past and Beyond"],["X. Oguri","SMaru","Red Maru","Fantasy Pasa"]),
]

export const LOCATIONS = [...new Set(TRACKS.map(t => t.location))].sort()
export const SURFACES = [...new Set(TRACKS.map(t => t.surface))].sort()
export const TYPES = [...new Set(TRACKS.map(t => t.type))].sort()
export const HANDEDS = [...new Set(TRACKS.map(t => t.handed))].sort()

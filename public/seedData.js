// Seed data for the South African Solar Invoice & Bundler App
// Prices represent realistic distributor/wholesale trade prices in South African Rand (ZAR)

export const SEED_CATEGORIES = [
  "Inverters",
  "Lithium Batteries",
  "Solar Panels",
  "Mounting Equipment",
  "AC/DC DB Boards & Protection",
  "Cabling & Accessories",
  "Labor & Professional Services"
];

export const SEED_CATALOG = [
  // --- INVERTERS ---
  {
    id: "sunsynk-5kw",
    code: "SUN-5K-SG01HP1",
    name: "Sunsynk 5kW Single Phase Hybrid Inverter",
    brand: "Sunsynk",
    category: "Inverters",
    costPrice: 20500,
    unit: "Unit",
    description: "Sunsynk 5kW hybrid inverter. Max PV power 6500W. IP65 rated."
  },
  {
    id: "sunsynk-8kw",
    code: "SUN-8K-SG01HP1",
    name: "Sunsynk 8kW Single Phase Hybrid Inverter",
    brand: "Sunsynk",
    category: "Inverters",
    costPrice: 29800,
    unit: "Unit",
    description: "Sunsynk 8kW hybrid inverter. Max PV power 10400W. Dual MPPT."
  },
  {
    id: "deye-8kw",
    code: "DY-8K-SG01",
    name: "Deye 8kW Single Phase Hybrid Inverter",
    brand: "Deye",
    category: "Inverters",
    costPrice: 27900,
    unit: "Unit",
    description: "Deye 8kW hybrid inverter. IP65 touch screen interface, smart load."
  },
  {
    id: "deye-12kw-3p",
    code: "DY-12K-SG04-3P",
    name: "Deye 12kW Three Phase Hybrid Inverter",
    brand: "Deye",
    category: "Inverters",
    costPrice: 42500,
    unit: "Unit",
    description: "Deye 12kW three phase hybrid inverter. Perfect for commercial installations."
  },
  {
    id: "victron-multi-5k",
    code: "VIC-PMP48502",
    name: "Victron MultiPlus-II 48/5000/70-50",
    brand: "Victron Energy",
    category: "Inverters",
    costPrice: 23200,
    unit: "Unit",
    description: "Victron 5kVA inverter/charger. Premium engineering, expandable."
  },

  // --- LITHIUM BATTERIES ---
  {
    id: "hubble-am2",
    code: "HUB-AM2-5.5",
    name: "Hubble AM-2 5.5kWh Lithium Battery",
    brand: "Hubble Lithium",
    category: "Lithium Batteries",
    costPrice: 24900,
    unit: "Unit",
    description: "51.2V LiFePO4 battery. 1.0C rating. Parallel up to 15 units."
  },
  {
    id: "hubble-am10",
    code: "HUB-AM10-10",
    name: "Hubble AM-10 10kWh Lithium Battery",
    brand: "Hubble Lithium",
    category: "Lithium Batteries",
    costPrice: 43500,
    unit: "Unit",
    description: "51.2V 200Ah wall-mount battery. High cycle life, integrated BMS."
  },
  {
    id: "freedomwon-home-5",
    code: "FW-LITE-HOME-5-4",
    name: "Freedom Won Lite Home 5/4 Lithium Battery",
    brand: "Freedom Won",
    category: "Lithium Batteries",
    costPrice: 22800,
    unit: "Unit",
    description: "5kWh capacity battery. Premium South African manufactured. 10-year warranty."
  },
  {
    id: "freedomwon-home-10",
    code: "FW-LITE-HOME-10-8",
    name: "Freedom Won Lite Home 10/8 Lithium Battery",
    brand: "Freedom Won",
    category: "Lithium Batteries",
    costPrice: 39500,
    unit: "Unit",
    description: "10kWh premium home energy storage battery. Ultra reliable."
  },
  {
    id: "pylontech-us3000c",
    code: "PYL-US3000C-3.5",
    name: "Pylontech US3000C 3.55kWh Lithium Battery",
    brand: "Pylontech",
    category: "Lithium Batteries",
    costPrice: 16500,
    unit: "Unit",
    description: "48V lithium battery. Modular stackable system. 95% depth of discharge."
  },

  // --- SOLAR PANELS ---
  {
    id: "canadian-550w",
    code: "CS-550-MS-EVO2",
    name: "Canadian Solar 550W Mono Crystalline",
    brand: "Canadian Solar",
    category: "Solar Panels",
    costPrice: 1850,
    unit: "Panel",
    description: "550W mono PERC solar panel. High efficiency EVO2 connectors."
  },
  {
    id: "ja-solar-545w",
    code: "JA-545-MR-11BB",
    name: "JA Solar 545W Mono Crystalline PERC",
    brand: "JA Solar",
    category: "Solar Panels",
    costPrice: 1780,
    unit: "Panel",
    description: "545W premium half-cell assembly. Excellent low-light performance."
  },
  {
    id: "jinko-550w",
    code: "JK-550-TIGER-PRO",
    name: "Jinko 550W Tiger Pro Mono Crystalline",
    brand: "Jinko Solar",
    category: "Solar Panels",
    costPrice: 1820,
    unit: "Panel",
    description: "550W multi-busbar technology. Lower hot spot loss."
  },

  // --- MOUNTING EQUIPMENT ---
  {
    id: "mount-tile-1",
    code: "MNT-TILE-SINGLE",
    name: "Tile Roof Mounting Structure (Per Panel)",
    brand: "Generic",
    category: "Mounting Equipment",
    costPrice: 650,
    unit: "Set",
    description: "Aluminum rails, stainless steel tile roof hooks, and clamps."
  },
  {
    id: "mount-ibr-1",
    code: "MNT-IBR-SINGLE",
    name: "IBR Metal Roof Mounting Structure (Per Panel)",
    brand: "Generic",
    category: "Mounting Equipment",
    costPrice: 420,
    unit: "Set",
    description: "Aluminum mounting bracket for IBR corrugated profile roofs."
  },

  // --- AC/DC DB BOARDS & PROTECTION ---
  {
    id: "db-board-1ph",
    code: "DB-SOLAR-1PH-1MPPT",
    name: "AC/DC DB Board (Single Phase, 1 MPPT)",
    brand: "SolarSafe",
    category: "AC/DC DB Boards & Protection",
    costPrice: 3200,
    unit: "Unit",
    description: "Pre-wired board. Includes DC fuses, AC surge arrestor, changeover switch, and breakers."
  },
  {
    id: "db-board-2mppt",
    code: "DB-SOLAR-1PH-2MPPT",
    name: "AC/DC DB Board (Single Phase, 2 MPPT)",
    brand: "SolarSafe",
    category: "AC/DC DB Boards & Protection",
    costPrice: 4500,
    unit: "Unit",
    description: "Pre-wired board for dual-string arrays. Multi-breakers & dual DC surge arrestors."
  },

  // --- CABLING & ACCESSORIES ---
  {
    id: "dc-cable-6mm",
    code: "CAB-DC-6MM-BLACK",
    name: "6mm Solar PV DC Cable (Per Meter)",
    brand: "Generic",
    category: "Cabling & Accessories",
    costPrice: 16,
    unit: "Meter",
    description: "TUV approved 6mm solar cable, UV-stabilized black/red insulation."
  },
  {
    id: "earth-cable-10mm",
    code: "CAB-EARTH-10MM",
    name: "10mm Copper Earth Wire (Per Meter)",
    brand: "Generic",
    category: "Cabling & Accessories",
    costPrice: 22,
    unit: "Meter",
    description: "Bare copper/green PVC insulated earth wire for lightning/PV protection."
  },
  {
    id: "battery-cables",
    code: "CAB-BAT-35MM-SET",
    name: "35mm Flexible Copper Battery Cables (1.5m Set)",
    brand: "Generic",
    category: "Cabling & Accessories",
    costPrice: 750,
    unit: "Set",
    description: "Red and Black set of flexible welding cables with lugs. M8 size."
  },

  // --- LABOR & PROFESSIONAL SERVICES ---
  {
    id: "labor-standard",
    code: "SRV-LABOR-STD",
    name: "Standard Installation Labor & Commissioning",
    brand: "Installer",
    category: "Labor & Professional Services",
    costPrice: 9500,
    unit: "Job",
    description: "Standard mechanical mounting, electrical wiring, inverter programming, and testing."
  },
  {
    id: "labor-commercial",
    code: "SRV-LABOR-COMM",
    name: "Three-Phase Commercial Installation Labor",
    brand: "Installer",
    category: "Labor & Professional Services",
    costPrice: 18500,
    unit: "Job",
    description: "Complex three-phase solar and battery integration & electrical balancing."
  },
  {
    id: "coc-certificate",
    code: "SRV-COC-ELECTRICAL",
    name: "Electrical COC (Certificate of Compliance)",
    brand: "Installer",
    category: "Labor & Professional Services",
    costPrice: 2500,
    unit: "Job",
    description: "Mandatory inspection, testing, and sign-off by a registered Master Electrician."
  }
];

export const SEED_BUNDLES = [
  {
    id: "bundle-5kw-lite",
    name: "Lite 5kW Starter Pack (Tile Roof)",
    description: "Perfect for small homes/townhouses looking to beat load-shedding and run basic appliances.",
    items: [
      { id: "sunsynk-5kw", qty: 1 },
      { id: "pylontech-us3000c", qty: 1 },
      { id: "canadian-550w", qty: 6 },
      { id: "mount-tile-1", qty: 6 },
      { id: "db-board-1ph", qty: 1 },
      { id: "dc-cable-6mm", qty: 50 },
      { id: "earth-cable-10mm", qty: 30 },
      { id: "battery-cables", qty: 1 },
      { id: "labor-standard", qty: 1 },
      { id: "coc-certificate", qty: 1 }
    ]
  },
  {
    id: "bundle-8kw-premium",
    name: "Standard 8kW Hybrid Pack (Tile Roof)",
    description: "The sweet spot for medium-sized families. Runs geysers, pool pumps, and general plugs.",
    items: [
      { id: "sunsynk-8kw", qty: 1 },
      { id: "hubble-am2", qty: 1 },
      { id: "canadian-550w", qty: 10 },
      { id: "mount-tile-1", qty: 10 },
      { id: "db-board-2mppt", qty: 1 },
      { id: "dc-cable-6mm", qty: 80 },
      { id: "earth-cable-10mm", qty: 40 },
      { id: "battery-cables", qty: 1 },
      { id: "labor-standard", qty: 1 },
      { id: "coc-certificate", qty: 1 }
    ]
  },
  {
    id: "bundle-12kw-commercial",
    name: "Elite 12kW Off-Grid Commercial Pack (IBR Roof)",
    description: "Heavy-duty three-phase setup. Ideal for large luxury homes or light commercial offices.",
    items: [
      { id: "deye-12kw-3p", qty: 1 },
      { id: "freedomwon-home-10", qty: 2 },
      { id: "canadian-550w", qty: 18 },
      { id: "mount-ibr-1", qty: 18 },
      { id: "db-board-2mppt", qty: 1 },
      { id: "dc-cable-6mm", qty: 150 },
      { id: "earth-cable-10mm", qty: 60 },
      { id: "battery-cables", qty: 2 },
      { id: "labor-commercial", qty: 1 },
      { id: "coc-certificate", qty: 1 }
    ]
  }
];

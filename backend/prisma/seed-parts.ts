import { PrismaClient } from '@prisma/client';
import bwipjs from 'bwip-js';

const prisma = new PrismaClient();

// Part definitions: [name, systemCode, componentCode, isCommon]
const PART_DEFS: [string, string, string, boolean][] = [
  // Engine (EN)
  ['Oil Filter', 'EN', 'OL', true],
  ['Air Filter', 'EN', 'IN', true],
  ['Spark Plug', 'EN', 'SP', true],
  ['Timing Belt', 'EN', 'BT', false],
  ['Water Pump', 'EN', 'WP', false],
  ['Thermostat', 'EN', 'TH', false],
  ['Fuel Injector', 'EN', 'SE', false],
  ['Ignition Coil', 'EN', 'IG', true],
  ['Serpentine Belt', 'EN', 'BT', true],
  ['Valve Cover Gasket', 'EN', 'GB', false],
  ['PCV Valve', 'EN', 'VL', true],
  ['Intake Manifold Gasket', 'EN', 'GB', false],
  ['Exhaust Manifold Gasket', 'EN', 'GB', false],
  ['Oil Pan Gasket', 'EN', 'GB', false],
  ['Camshaft Sensor', 'EN', 'SE', false],
  ['Crankshaft Sensor', 'EN', 'SE', false],
  ['MAF Sensor', 'EN', 'SE', false],
  ['Throttle Body', 'EN', 'TH', false],
  ['EGR Valve', 'EN', 'VL', false],
  ['Oil Pressure Sensor', 'EN', 'SE', false],
  // Brakes (BR)
  ['Front Brake Pads', 'BR', 'PD', true],
  ['Rear Brake Pads', 'BR', 'PD', true],
  ['Front Brake Rotors', 'BR', 'RT', true],
  ['Rear Brake Rotors', 'BR', 'RT', true],
  ['Brake Caliper', 'BR', 'CL', false],
  ['Brake Hose', 'BR', 'BH', false],
  ['Brake Master Cylinder', 'BR', 'MC', false],
  ['Brake Booster', 'BR', 'BB', false],
  ['Parking Brake Cable', 'BR', 'PB', false],
  ['ABS Sensor', 'BR', 'AB', false],
  ['Brake Drum', 'BR', 'DR', false],
  ['Brake Shoes', 'BR', 'SH', false],
  // Suspension (SU)
  ['Strut Assembly', 'SU', 'ST', false],
  ['Shock Absorber', 'SU', 'SH', false],
  ['Control Arm', 'SU', 'CA', false],
  ['Ball Joint', 'SU', 'BJ', false],
  ['Tie Rod End', 'SU', 'BJ', false],
  ['Sway Bar Link', 'SU', 'SL', true],
  ['Wheel Bearing', 'SU', 'BU', false],
  ['Coil Spring', 'SU', 'CS', false],
  ['Strut Mount', 'SU', 'SM', false],
  ['Stabilizer Bar Bushing', 'SU', 'BU', true],
  // Electrical (EL)
  ['Alternator', 'EL', 'BT', false],
  ['Starter Motor', 'EL', 'BT', false],
  ['Battery Cable', 'EL', 'BT', true],
  ['Ignition Switch', 'EL', 'SW', false],
  ['Window Motor', 'EL', 'WM', false],
  ['Blower Motor', 'EL', 'BM', false],
  ['Headlight Assembly', 'EL', 'HL', false],
  ['Tail Light Assembly', 'EL', 'TL', false],
  ['Turn Signal Switch', 'EL', 'TS', false],
  ['Wiper Motor', 'EL', 'WM', false],
  ['Horn', 'EL', 'RL', false],
  ['Fuse Box', 'EL', 'FB', false],
  ['Relay', 'EL', 'RL', true],
  // Cooling (CL)
  ['Radiator', 'CL', 'RD', false],
  ['Upper Radiator Hose', 'CL', 'RH', true],
  ['Lower Radiator Hose', 'CL', 'RH', true],
  ['Coolant Reservoir', 'CL', 'CR', false],
  ['Radiator Fan', 'CL', 'RF', false],
  ['Thermostat Housing', 'CL', 'TH', false],
  ['Heater Core', 'CL', 'HC', false],
  ['Heater Hose', 'CL', 'RH', true],
  ['Coolant Temp Sensor', 'CL', 'CT', false],
  ['Water Outlet', 'CL', 'WP', false],
  // Fuel (FA)
  ['Fuel Pump', 'FA', 'FP', false],
  ['Fuel Filter', 'FA', 'FF', true],
  ['Fuel Pressure Regulator', 'FA', 'PR', false],
  ['Fuel Rail', 'FA', 'FR', false],
  ['Fuel Tank', 'FA', 'FT', false],
  ['Fuel Sending Unit', 'FA', 'FP', false],
  ['Fuel Cap', 'FA', 'FT', true],
  ['Fuel Line', 'FA', 'FP', false],
  // Transmission (TR)
  ['Transmission Mount', 'TR', 'MO', false],
  ['Clutch Disc', 'TR', 'CL', false],
  ['Clutch Pressure Plate', 'TR', 'CL', false],
  ['Flywheel', 'TR', 'FW', false],
  ['CV Axle', 'TR', 'CV', false],
  ['U-Joint', 'TR', 'UJ', true],
  ['Transmission Filter', 'TR', 'FL', true],
  ['Shift Cable', 'TR', 'SL', false],
  ['Torque Converter', 'TR', 'TC', false],
  // Exhaust (EX)
  ['Catalytic Converter', 'EX', 'CC', false],
  ['Muffler', 'EX', 'MF', false],
  ['Exhaust Pipe', 'EX', 'EP', false],
  ['Exhaust Manifold', 'EX', 'EM', false],
  ['O2 Sensor', 'EX', 'OS', true],
  ['Exhaust Gasket', 'EX', 'EG', true],
  ['Resonator', 'EX', 'RS', false],
  ['Flex Pipe', 'EX', 'FP', false],
  // Steering (ST)
  ['Power Steering Pump', 'ST', 'PP', false],
  ['Steering Rack', 'ST', 'RP', false],
  ['Steering Column', 'ST', 'SC', false],
  ['Steering Wheel', 'ST', 'SW', false],
  ['PS Fluid Reservoir', 'ST', 'PR', false],
  ['PS Hose', 'ST', 'PH', false],
  ['Steering Gear', 'ST', 'SG', false],
  // Body (BD)
  ['Side Mirror', 'BD', 'MR', false],
  ['Door Handle', 'BD', 'DH', false],
  ['Window Regulator', 'BD', 'DS', false],
  ['Door Lock Actuator', 'BD', 'DS', false],
  ['Hood Latch', 'BD', 'HD', false],
  ['Trunk Latch', 'BD', 'TL', false],
  ['Bumper Cover', 'BD', 'BC', false],
  ['Fender', 'BD', 'FN', false],
  ['Weatherstrip', 'BD', 'DS', true],
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateBarcode(text: string): Promise<string> {
  const buf = await bwipjs.toBuffer({
    bcid: 'code128',
    text,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: 'center',
  });
  return buf.toString('base64');
}

async function main() {
  console.log('🔧 Starting parts seed...');

  // Load reference data
  const vehicles = await prisma.vehicle.findMany();
  const makeCodes = await prisma.makeCode.findMany();
  const modelCodesDB = await prisma.modelCode.findMany();
  const location = (await prisma.location.findFirst()) ||
    (await prisma.location.create({ data: { name: 'Main Warehouse' } }));
  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user found - seed users first');

  const makeCodeMap = new Map(makeCodes.map(m => [m.make, m.code]));
  const modelCodeMap = new Map(modelCodesDB.map(m => [`${m.make}|${m.model}`, m.code]));
  const usedModelCodes = new Map<string, Set<string>>();
  for (const m of modelCodesDB) {
    if (!usedModelCodes.has(m.make)) usedModelCodes.set(m.make, new Set());
    usedModelCodes.get(m.make)!.add(m.code);
  }

  async function getModelCode(make: string, model: string): Promise<string> {
    const key = `${make}|${model}`;
    if (modelCodeMap.has(key)) return modelCodeMap.get(key)!;

    // Generate 3-char code
    let code = model.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase();
    if (code.length < 3) code = code.padEnd(3, 'X');

    const used = usedModelCodes.get(make) || new Set();
    let attempt = 0;
    while (used.has(code)) {
      attempt++;
      code = model.replace(/[^A-Za-z]/g, '').substring(0, 2).toUpperCase() + attempt.toString().padStart(1, '0');
      if (code.length > 3) code = code.substring(0, 3);
    }

    await prisma.modelCode.create({ data: { make, model, code } });
    modelCodeMap.set(key, code);
    if (!usedModelCodes.has(make)) usedModelCodes.set(make, new Set());
    usedModelCodes.get(make)!.add(code);
    return code;
  }

  let created = 0;
  let skipped = 0;
  const skuSet = new Set<string>();

  for (let i = 0; i < 500; i++) {
    const [partName, systemCode, componentCode, isCommon] = PART_DEFS[i % PART_DEFS.length];
    const vehicle = rand(vehicles);
    const makeCode = makeCodeMap.get(vehicle.make);
    if (!makeCode) { skipped++; continue; }

    const modelCode = await getModelCode(vehicle.make, vehicle.model);
    const yearCode = (vehicle.year % 100).toString().padStart(2, '0');
    const sku = `${makeCode}-${modelCode}-${yearCode}-${systemCode}${componentCode}`;

    if (skuSet.has(sku)) { skipped++; i--; continue; }
    skuSet.add(sku);

    const fullName = `${partName} - ${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    const skuDecoded = JSON.stringify({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      system: systemCode,
      component: componentCode,
    });

    try {
      const barcodeData = await generateBarcode(sku);

      const part = await prisma.part.create({
        data: {
          sku,
          name: fullName,
          description: `${partName} compatible with ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          barcodeData,
          skuDecoded,
        },
      });

      // Primary fitment
      await prisma.partFitment.create({
        data: { partId: part.id, vehicleId: vehicle.id },
      });

      // Inventory event
      await prisma.inventoryEvent.create({
        data: {
          type: 'RECEIVE',
          qtyDelta: randInt(1, 20),
          partId: part.id,
          locationId: location.id,
          reason: 'Initial inventory seed',
          createdBy: user.id,
        },
      });

      // Extra fitments for common parts
      if (isCommon) {
        const extraCount = randInt(1, 3);
        const sameMakeVehicles = vehicles.filter(
          v => v.make === vehicle.make && v.id !== vehicle.id
        );
        for (let j = 0; j < Math.min(extraCount, sameMakeVehicles.length); j++) {
          const extraVehicle = rand(sameMakeVehicles);
          try {
            await prisma.partFitment.create({
              data: { partId: part.id, vehicleId: extraVehicle.id },
            });
          } catch { /* duplicate fitment, skip */ }
        }
      }

      created++;
      if (created % 50 === 0) console.log(`  ✅ ${created}/500 parts created...`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        skipped++;
        skuSet.delete(sku);
        i--;
      } else {
        console.error(`Error creating part ${sku}:`, e.message);
        skipped++;
      }
    }
  }

  console.log(`\n🎉 Done! Created ${created} parts (${skipped} skipped/retried)`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});

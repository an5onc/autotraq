import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const makeCodes = [
  { make: 'Ford', code: 'FD' },
  { make: 'Chevrolet', code: 'CH' },
  { make: 'GMC', code: 'GM' },
  { make: 'Dodge', code: 'DG' },
  { make: 'Ram', code: 'RM' },
  { make: 'Chrysler', code: 'CR' },
  { make: 'Jeep', code: 'JP' },
  { make: 'Lincoln', code: 'LN' },
  { make: 'Cadillac', code: 'CD' },
  { make: 'Buick', code: 'BK' },
  { make: 'Pontiac', code: 'PN' },
  { make: 'Saturn', code: 'ST' },
  { make: 'Oldsmobile', code: 'OL' },
  { make: 'Mercury', code: 'MC' },
  { make: 'Hummer', code: 'HM' },
  { make: 'Tesla', code: 'TS' },
];

const systemCodes = [
  { name: 'Engine', code: 'EN', description: 'Engine and engine components' },
  { name: 'Transmission', code: 'TR', description: 'Transmission and drivetrain' },
  { name: 'Steering', code: 'ST', description: 'Steering system components' },
  { name: 'Brakes', code: 'BR', description: 'Brake system components' },
  { name: 'Suspension', code: 'SU', description: 'Suspension system components' },
  { name: 'Electrical', code: 'EL', description: 'Electrical system components' },
  { name: 'Fuel/Air', code: 'FA', description: 'Fuel and air intake components' },
  { name: 'Exhaust', code: 'EX', description: 'Exhaust system components' },
  { name: 'Cooling', code: 'CL', description: 'Cooling system components' },
  { name: 'Body', code: 'BD', description: 'Body panels and structural components' },
  { name: 'Interior', code: 'IN', description: 'Interior components and trim' },
  { name: 'Wheels/Tires', code: 'WH', description: 'Wheels, tires, and related components' },
];

const componentCodes: { systemCode: string; name: string; code: string }[] = [
  // Engine (EN)
  { systemCode: 'EN', name: 'Block', code: 'BL' },
  { systemCode: 'EN', name: 'Head', code: 'HD' },
  { systemCode: 'EN', name: 'Valve', code: 'VL' },
  { systemCode: 'EN', name: 'Piston', code: 'PS' },
  { systemCode: 'EN', name: 'Camshaft', code: 'CM' },
  { systemCode: 'EN', name: 'Crankshaft', code: 'CR' },
  { systemCode: 'EN', name: 'Oil Pump', code: 'OL' },
  { systemCode: 'EN', name: 'Water Pump', code: 'WP' },
  { systemCode: 'EN', name: 'Intake Manifold', code: 'IN' },
  { systemCode: 'EN', name: 'Throttle Body', code: 'TH' },
  { systemCode: 'EN', name: 'Turbocharger', code: 'TB' },
  { systemCode: 'EN', name: 'Supercharger', code: 'SC' },
  { systemCode: 'EN', name: 'Gasket', code: 'GB' },
  { systemCode: 'EN', name: 'Belt', code: 'BT' },
  { systemCode: 'EN', name: 'Timing Chain', code: 'CH' },
  { systemCode: 'EN', name: 'Motor Mount', code: 'MO' },
  { systemCode: 'EN', name: 'Sensor', code: 'SE' },
  { systemCode: 'EN', name: 'Spark Plug', code: 'SP' },
  { systemCode: 'EN', name: 'Ignition Coil', code: 'IG' },
  { systemCode: 'EN', name: 'Starter', code: 'ST' },
  { systemCode: 'EN', name: 'Alternator', code: 'AL' },
  // Transmission (TR)
  { systemCode: 'TR', name: 'Torque Converter', code: 'TC' },
  { systemCode: 'TR', name: 'Clutch', code: 'CL' },
  { systemCode: 'TR', name: 'Flywheel', code: 'FW' },
  { systemCode: 'TR', name: 'Shift Linkage', code: 'SL' },
  { systemCode: 'TR', name: 'Transfer Case', code: 'TF' },
  { systemCode: 'TR', name: 'Driveshaft', code: 'DS' },
  { systemCode: 'TR', name: 'CV Axle', code: 'CV' },
  { systemCode: 'TR', name: 'Differential', code: 'DF' },
  { systemCode: 'TR', name: 'Transmission Mount', code: 'MO' },
  { systemCode: 'TR', name: 'Valve Body', code: 'VB' },
  { systemCode: 'TR', name: 'Solenoid', code: 'SO' },
  { systemCode: 'TR', name: 'Filter', code: 'FL' },
  { systemCode: 'TR', name: 'Seal', code: 'SE' },
  { systemCode: 'TR', name: 'Gear Set', code: 'GS' },
  { systemCode: 'TR', name: 'U-Joint', code: 'UJ' },
  // Steering (ST)
  { systemCode: 'ST', name: 'Rack and Pinion', code: 'RP' },
  { systemCode: 'ST', name: 'Power Steering Pump', code: 'PP' },
  { systemCode: 'ST', name: 'Tie Rod', code: 'TR' },
  { systemCode: 'ST', name: 'Steering Column', code: 'SC' },
  { systemCode: 'ST', name: 'Steering Wheel', code: 'SW' },
  { systemCode: 'ST', name: 'Pitman Arm', code: 'PA' },
  { systemCode: 'ST', name: 'Idler Arm', code: 'IA' },
  { systemCode: 'ST', name: 'Center Link', code: 'CL' },
  { systemCode: 'ST', name: 'Steering Gear', code: 'SG' },
  { systemCode: 'ST', name: 'PS Hose', code: 'PH' },
  { systemCode: 'ST', name: 'PS Reservoir', code: 'PR' },
  { systemCode: 'ST', name: 'Steering Knuckle', code: 'SK' },
  // Brakes (BR)
  { systemCode: 'BR', name: 'Brake Pad', code: 'PD' },
  { systemCode: 'BR', name: 'Brake Rotor', code: 'RT' },
  { systemCode: 'BR', name: 'Brake Caliper', code: 'CL' },
  { systemCode: 'BR', name: 'Brake Drum', code: 'DR' },
  { systemCode: 'BR', name: 'Brake Shoe', code: 'SH' },
  { systemCode: 'BR', name: 'Master Cylinder', code: 'MC' },
  { systemCode: 'BR', name: 'Brake Booster', code: 'BB' },
  { systemCode: 'BR', name: 'Brake Line', code: 'BL' },
  { systemCode: 'BR', name: 'Brake Hose', code: 'BH' },
  { systemCode: 'BR', name: 'ABS Module', code: 'AB' },
  { systemCode: 'BR', name: 'Parking Brake', code: 'PB' },
  { systemCode: 'BR', name: 'Wheel Cylinder', code: 'WC' },
  // Suspension (SU)
  { systemCode: 'SU', name: 'Shock Absorber', code: 'SH' },
  { systemCode: 'SU', name: 'Strut', code: 'ST' },
  { systemCode: 'SU', name: 'Control Arm', code: 'CA' },
  { systemCode: 'SU', name: 'Ball Joint', code: 'BJ' },
  { systemCode: 'SU', name: 'Sway Bar Link', code: 'SL' },
  { systemCode: 'SU', name: 'Sway Bar', code: 'SB' },
  { systemCode: 'SU', name: 'Coil Spring', code: 'CS' },
  { systemCode: 'SU', name: 'Leaf Spring', code: 'LS' },
  { systemCode: 'SU', name: 'Strut Mount', code: 'SM' },
  { systemCode: 'SU', name: 'Bushing', code: 'BU' },
  { systemCode: 'SU', name: 'Torsion Bar', code: 'TB' },
  { systemCode: 'SU', name: 'Air Spring', code: 'AS' },
  // Electrical (EL)
  { systemCode: 'EL', name: 'Battery', code: 'BT' },
  { systemCode: 'EL', name: 'Fuse Box', code: 'FB' },
  { systemCode: 'EL', name: 'Wiring Harness', code: 'WH' },
  { systemCode: 'EL', name: 'Relay', code: 'RL' },
  { systemCode: 'EL', name: 'Switch', code: 'SW' },
  { systemCode: 'EL', name: 'ECU/PCM', code: 'EC' },
  { systemCode: 'EL', name: 'Headlight', code: 'HL' },
  { systemCode: 'EL', name: 'Tail Light', code: 'TL' },
  { systemCode: 'EL', name: 'Turn Signal', code: 'TS' },
  { systemCode: 'EL', name: 'Window Motor', code: 'WM' },
  { systemCode: 'EL', name: 'Door Lock Actuator', code: 'DL' },
  { systemCode: 'EL', name: 'Blower Motor', code: 'BM' },
  // Fuel/Air (FA)
  { systemCode: 'FA', name: 'Fuel Pump', code: 'FP' },
  { systemCode: 'FA', name: 'Fuel Injector', code: 'FI' },
  { systemCode: 'FA', name: 'Fuel Filter', code: 'FF' },
  { systemCode: 'FA', name: 'Fuel Tank', code: 'FT' },
  { systemCode: 'FA', name: 'Air Filter', code: 'AF' },
  { systemCode: 'FA', name: 'Air Box', code: 'AB' },
  { systemCode: 'FA', name: 'MAF Sensor', code: 'MA' },
  { systemCode: 'FA', name: 'O2 Sensor', code: 'O2' },
  { systemCode: 'FA', name: 'Fuel Rail', code: 'FR' },
  { systemCode: 'FA', name: 'Fuel Pressure Regulator', code: 'PR' },
  { systemCode: 'FA', name: 'PCV Valve', code: 'PV' },
  { systemCode: 'FA', name: 'EGR Valve', code: 'EG' },
  // Exhaust (EX)
  { systemCode: 'EX', name: 'Exhaust Manifold', code: 'EM' },
  { systemCode: 'EX', name: 'Catalytic Converter', code: 'CC' },
  { systemCode: 'EX', name: 'Muffler', code: 'MF' },
  { systemCode: 'EX', name: 'Resonator', code: 'RS' },
  { systemCode: 'EX', name: 'Exhaust Pipe', code: 'EP' },
  { systemCode: 'EX', name: 'Flex Pipe', code: 'FP' },
  { systemCode: 'EX', name: 'Exhaust Tip', code: 'ET' },
  { systemCode: 'EX', name: 'Oxygen Sensor', code: 'OS' },
  { systemCode: 'EX', name: 'Heat Shield', code: 'HS' },
  { systemCode: 'EX', name: 'Exhaust Gasket', code: 'EG' },
  { systemCode: 'EX', name: 'Downpipe', code: 'DP' },
  { systemCode: 'EX', name: 'EGR Pipe', code: 'ER' },
  // Cooling (CL)
  { systemCode: 'CL', name: 'Radiator', code: 'RD' },
  { systemCode: 'CL', name: 'Thermostat', code: 'TH' },
  { systemCode: 'CL', name: 'Water Pump', code: 'WP' },
  { systemCode: 'CL', name: 'Radiator Hose', code: 'RH' },
  { systemCode: 'CL', name: 'Coolant Reservoir', code: 'CR' },
  { systemCode: 'CL', name: 'Radiator Fan', code: 'RF' },
  { systemCode: 'CL', name: 'Fan Clutch', code: 'FC' },
  { systemCode: 'CL', name: 'Heater Core', code: 'HC' },
  { systemCode: 'CL', name: 'Oil Cooler', code: 'OC' },
  { systemCode: 'CL', name: 'Intercooler', code: 'IC' },
  { systemCode: 'CL', name: 'Coolant Temp Sensor', code: 'CT' },
  { systemCode: 'CL', name: 'Expansion Valve', code: 'EV' },
  // Body (BD)
  { systemCode: 'BD', name: 'Fender', code: 'FN' },
  { systemCode: 'BD', name: 'Hood', code: 'HD' },
  { systemCode: 'BD', name: 'Trunk Lid', code: 'TL' },
  { systemCode: 'BD', name: 'Door Shell', code: 'DS' },
  { systemCode: 'BD', name: 'Bumper Cover', code: 'BC' },
  { systemCode: 'BD', name: 'Grille', code: 'GR' },
  { systemCode: 'BD', name: 'Mirror', code: 'MR' },
  { systemCode: 'BD', name: 'Quarter Panel', code: 'QP' },
  { systemCode: 'BD', name: 'Rocker Panel', code: 'RP' },
  { systemCode: 'BD', name: 'Windshield', code: 'WS' },
  { systemCode: 'BD', name: 'Door Handle', code: 'DH' },
  { systemCode: 'BD', name: 'Tailgate', code: 'TG' },
  // Interior (IN)
  { systemCode: 'IN', name: 'Seat', code: 'SE' },
  { systemCode: 'IN', name: 'Dashboard', code: 'DB' },
  { systemCode: 'IN', name: 'Center Console', code: 'CC' },
  { systemCode: 'IN', name: 'Steering Wheel', code: 'SW' },
  { systemCode: 'IN', name: 'Carpet', code: 'CP' },
  { systemCode: 'IN', name: 'Headliner', code: 'HL' },
  { systemCode: 'IN', name: 'Door Panel', code: 'DP' },
  { systemCode: 'IN', name: 'Sun Visor', code: 'SV' },
  { systemCode: 'IN', name: 'Gauge Cluster', code: 'GC' },
  { systemCode: 'IN', name: 'Radio/Infotainment', code: 'RD' },
  { systemCode: 'IN', name: 'AC Controls', code: 'AC' },
  { systemCode: 'IN', name: 'Glove Box', code: 'GB' },
  // Wheels/Tires (WH)
  { systemCode: 'WH', name: 'Wheel/Rim', code: 'WR' },
  { systemCode: 'WH', name: 'Tire', code: 'TR' },
  { systemCode: 'WH', name: 'Wheel Bearing', code: 'WB' },
  { systemCode: 'WH', name: 'Hub Assembly', code: 'HA' },
  { systemCode: 'WH', name: 'Lug Nut', code: 'LN' },
  { systemCode: 'WH', name: 'Wheel Stud', code: 'WS' },
  { systemCode: 'WH', name: 'Center Cap', code: 'CC' },
  { systemCode: 'WH', name: 'Wheel Cover', code: 'WC' },
  { systemCode: 'WH', name: 'TPMS Sensor', code: 'TP' },
  { systemCode: 'WH', name: 'Valve Stem', code: 'VS' },
  { systemCode: 'WH', name: 'Wheel Spacer', code: 'SP' },
  { systemCode: 'WH', name: 'Wheel Lock', code: 'WL' },
];

async function main() {
  console.log('Seeding SKU code tables...');

  for (const mc of makeCodes) {
    await prisma.makeCode.upsert({
      where: { code: mc.code },
      update: {},
      create: mc,
    });
  }
  console.log(`Seeded ${makeCodes.length} make codes`);

  for (const sc of systemCodes) {
    await prisma.systemCode.upsert({
      where: { code: sc.code },
      update: {},
      create: sc,
    });
  }
  console.log(`Seeded ${systemCodes.length} system codes`);

  for (const cc of componentCodes) {
    await prisma.componentCode.upsert({
      where: { systemCode_code: { systemCode: cc.systemCode, code: cc.code } },
      update: {},
      create: cc,
    });
  }
  console.log(`Seeded ${componentCodes.length} component codes`);

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

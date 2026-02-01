import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DOMESTIC_MAKES = [
  'Ford', 'Chevrolet', 'GMC', 'Dodge', 'Ram', 'Chrysler', 'Jeep',
  'Lincoln', 'Cadillac', 'Buick', 'Pontiac', 'Saturn', 'Oldsmobile',
  'Mercury', 'Hummer', 'Tesla'
];

const VEHICLE_TYPES = [
  'Passenger Car',
  'Truck',
  'Multipurpose Passenger Vehicle (MPV)'
];

const START_YEAR = 2000;
const END_YEAR = 2026;

async function getModelsForMakeYear(make: string, year: number): Promise<string[]> {
  const allModels = new Set<string>();

  for (const vtype of VEHICLE_TYPES) {
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}/vehicletype/${encodeURIComponent(vtype)}?format=json`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      for (const r of data.Results || []) {
        if (r.Model_Name) allModels.add(r.Model_Name);
      }
    } catch (err) {
      console.error(`  Error fetching ${make} ${year} ${vtype}:`, (err as Error).message);
    }
  }

  return Array.from(allModels);
}

async function main() {
  console.log('🚗 Seeding US domestic vehicles (2000-2026) from NHTSA API...\n');

  let totalVehicles = 0;
  let skipped = 0;

  for (const make of DOMESTIC_MAKES) {
    console.log(`\n📦 ${make}:`);

    for (let year = START_YEAR; year <= END_YEAR; year++) {
      const models = await getModelsForMakeYear(make, year);

      for (const model of models) {
        // Check if already exists
        const existing = await prisma.vehicle.findFirst({
          where: { year, make, model }
        });

        if (existing) {
          skipped++;
          continue;
        }

        try {
          await prisma.vehicle.create({
            data: { year, make, model }
          });
          totalVehicles++;
        } catch (err) {
          // Skip duplicates
          skipped++;
        }
      }

      if (models.length > 0) {
        process.stdout.write(`  ${year}: ${models.length} models  `);
      }
    }
    console.log();
  }

  console.log(`\n✅ Done! Created ${totalVehicles} vehicles (${skipped} already existed)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

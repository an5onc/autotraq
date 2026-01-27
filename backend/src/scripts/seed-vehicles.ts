/**
 * NHTSA Vehicle Seed Script
 *
 * Fetches USA car makes from NHTSA, then for each make+year combo (2000–2026),
 * fetches models and inserts unique (year, make, model) into vehicles table.
 *
 * Usage: npm run db:seed-vehicles
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const MIN_YEAR = 2000;
const MAX_YEAR = 2026;
const BATCH_SIZE = 500;
const REQUEST_DELAY_MS = 300; // be polite to NHTSA

// USA-based manufacturers only
const USA_MAKES = new Set([
  'FORD', 'CHEVROLET', 'GMC', 'CADILLAC', 'BUICK', 'LINCOLN',
  'DODGE', 'CHRYSLER', 'JEEP', 'RAM', 'TESLA',
  'CORVETTE', 'HUMMER', 'SATURN', 'PONTIAC', 'OLDSMOBILE',
  'MERCURY', 'PLYMOUTH', 'SCION',
]);

interface NHTSAMake {
  MakeId: number;
  MakeName: string;
}

interface NHTSAModel {
  Model_ID: number;
  Model_Name: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NHTSA fetch failed: ${res.status} ${url}`);
  return res.json() as Promise<T>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAllMakes(): Promise<NHTSAMake[]> {
  console.log('Fetching all car makes from NHTSA...');
  const data = await fetchJson<{ Results: NHTSAMake[] }>(
    `${NHTSA_BASE}/GetMakesForVehicleType/car?format=json`
  );
  console.log(`Found ${data.Results.length} makes`);
  return data.Results;
}

async function getModelsForMakeYear(makeId: number, year: number): Promise<NHTSAModel[]> {
  const data = await fetchJson<{ Results: NHTSAModel[] }>(
    `${NHTSA_BASE}/GetModelsForMakeIdYear/makeId/${makeId}/modelyear/${year}?format=json`
  );
  return data.Results;
}

async function main() {
  console.log(`Seeding vehicles from NHTSA (years ${MIN_YEAR}–${MAX_YEAR})...`);

  const allMakes = await getAllMakes();
  const makes = allMakes.filter((m) => USA_MAKES.has(m.MakeName.trim().toUpperCase()));
  console.log(`Filtered to ${makes.length} USA makes: ${makes.map((m) => m.MakeName).join(', ')}`);

  // Collect all vehicle records to insert
  const vehicleBatch: { year: number; make: string; model: string }[] = [];
  let totalFetched = 0;

  for (const make of makes) {
    const makeName = make.MakeName.trim();
    if (!makeName) continue;

    for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
      try {
        const models = await getModelsForMakeYear(make.MakeId, year);
        for (const m of models) {
          const modelName = m.Model_Name?.trim();
          if (!modelName) continue;
          vehicleBatch.push({ year, make: makeName, model: modelName });
        }
        totalFetched++;
        if (totalFetched % 50 === 0) {
          console.log(`  Fetched ${totalFetched} make/year combos (${vehicleBatch.length} vehicles so far)...`);
        }
      } catch (err) {
        // Log and continue — some make/year combos may 404
        console.warn(`  Warning: Failed for ${makeName} ${year}: ${(err as Error).message}`);
      }
      await sleep(REQUEST_DELAY_MS);
    }
  }

  console.log(`\nTotal vehicle records collected: ${vehicleBatch.length}`);
  console.log('Inserting into database (skipping duplicates)...');

  // Insert in batches using createMany with skipDuplicates
  let inserted = 0;
  for (let i = 0; i < vehicleBatch.length; i += BATCH_SIZE) {
    const batch = vehicleBatch.slice(i, i + BATCH_SIZE);
    const result = await prisma.vehicle.createMany({
      data: batch,
      skipDuplicates: true,
    });
    inserted += result.count;
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: inserted ${result.count} rows`);
  }

  const totalInDb = await prisma.vehicle.count();
  console.log(`\nDone! Inserted ${inserted} new vehicles. Total in DB: ${totalInDb}`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

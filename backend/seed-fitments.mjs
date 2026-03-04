import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const parts = await p.part.findMany({ select: { id:true, sku:true, name:true } });
const vehicles = await p.vehicle.findMany({ select: { id:true, year:true, make:true, model:true } });
const existingFitments = await p.partFitment.findMany({ select: { partId:true, vehicleId:true } });

// Build lookup: "YEAR|MAKE|MODEL" -> vehicleId
const vehicleMap = {};
for (const v of vehicles) {
  const key = `${v.year}|${v.make.toLowerCase()}|${v.model.toLowerCase()}`;
  vehicleMap[key] = v.id;
}

// Already-existing fitment set
const existingSet = new Set(existingFitments.map(f => `${f.partId}-${f.vehicleId}`));

console.log(`Parts: ${parts.length} | Vehicles: ${vehicles.length} | Existing fitments: ${existingFitments.length}`);

// ── STEP 1: Parse part name to find vehicle ──
// Pattern: "Part Name - YYYY Make Model" or "Part Name - Make Model YYYY"
const yearRe = /\b(20\d{2}|19\d{2})\b/;
const toInsert = [];
let matched = 0, unmatched = 0;

for (const part of parts) {
  const yearMatch = part.name.match(yearRe);
  if (!yearMatch) { unmatched++; continue; }
  const year = parseInt(yearMatch[1]);

  // Remove year and common suffixes from name to get make/model
  const stripped = part.name
    .replace(yearRe, '')
    .replace(/^[^-]+-\s*/, '')  // remove part description before dash
    .replace(/\(.*?\)/g, '')    // remove parentheticals
    .replace(/[-–]/g, ' ')
    .trim()
    .toLowerCase();

  // Try to match make + model against vehicle map
  let vehicleId = null;
  for (const v of vehicles) {
    if (v.year !== year) continue;
    const makeLower = v.make.toLowerCase();
    const modelLower = v.model.toLowerCase();
    if (stripped.includes(makeLower) && stripped.includes(modelLower)) {
      vehicleId = v.id;
      break;
    }
    // Try just make match if model is compound (e.g. "Encore GX")
    if (stripped.includes(makeLower) && modelLower.split(' ').every(w => stripped.includes(w))) {
      vehicleId = v.id;
      break;
    }
  }

  if (vehicleId && !existingSet.has(`${part.id}-${vehicleId}`)) {
    toInsert.push({ partId: part.id, vehicleId });
    existingSet.add(`${part.id}-${vehicleId}`);
    matched++;
  } else if (!vehicleId) {
    unmatched++;
  }
}

console.log(`Matched: ${matched} | Unmatched: ${unmatched}`);

// Insert in chunks
const CHUNK = 200;
for (let i = 0; i < toInsert.length; i += CHUNK) {
  await p.partFitment.createMany({ data: toInsert.slice(i, i+CHUNK), skipDuplicates: true });
  process.stdout.write(`\r  Fitments: ${Math.min(i+CHUNK, toInsert.length)}/${toInsert.length}`);
}
console.log('\nFitments done.');

// ── STEP 2: Build interchange groups by part type ──
// Group parts by their "type" (extracted from name before the dash/year)
const partTypeMap = {};
for (const part of parts) {
  // Extract part type: everything before " - YYYY" or before the vehicle name
  const typeName = part.name
    .replace(/\s*[-–]\s*(20\d{2}|19\d{2}).*$/, '')  // "Brake Pads - 2020 Ford..." -> "Brake Pads"
    .replace(/\s*\(.*?\)/g, '')
    .trim();
  if (!partTypeMap[typeName]) partTypeMap[typeName] = [];
  partTypeMap[typeName].push(part.id);
}

// Only create groups for types with 2+ parts
const groupTypes = Object.entries(partTypeMap).filter(([, ids]) => ids.length >= 2);
console.log(`\nCreating ${groupTypes.length} interchange groups...`);

// Clear existing group members first
await p.interchangeGroupMember.deleteMany({});
await p.interchangeGroup.deleteMany({});

let groupsCreated = 0;
for (const [typeName, partIds] of groupTypes) {
  const group = await p.interchangeGroup.create({
    data: {
      name: typeName,
      description: `Interchange group for ${typeName} — cross-compatible fitment`,
      members: { create: partIds.map(partId => ({ partId })) }
    }
  });
  groupsCreated++;
  if (groupsCreated % 20 === 0) process.stdout.write(`\r  Groups: ${groupsCreated}/${groupTypes.length}`);
}
console.log(`\n${groupsCreated} interchange groups created.`);

// ── Summary ──
const [totalFitments, totalGroups] = await Promise.all([
  p.partFitment.count(),
  p.interchangeGroup.count(),
]);
console.log(`\n── Final state ──`);
console.log(`  Fitments: ${totalFitments.toLocaleString()}`);
console.log(`  Interchange groups: ${totalGroups}`);

await p.$disconnect();
console.log('Done!');

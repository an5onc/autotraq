import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const locs = await p.location.findMany({ select: { id:true, name:true } });
console.log('Locations:', locs.map(l=>`${l.id}:${l.name}`).join(', '));

const admin = await p.user.findFirst({ where:{ role:'admin' }, select:{ id:true } });

// Distribution weights
const weights = {};
for (const loc of locs) {
  const n = loc.name.toLowerCase();
  if (n.includes('main') || n.includes('greeley')) weights[loc.id] = 0.35;
  else if (n.includes('denver')) weights[loc.id] = 0.25;
  else if (n.includes('fort')) weights[loc.id] = 0.18;
  else if (n.includes('longmont')) weights[loc.id] = 0.15;
  else weights[loc.id] = 0.07;
}
console.log('Weights:', JSON.stringify(weights));

// Get existing on-hand per part per location
const existing = await p.inventoryEvent.groupBy({ by:['partId','locationId'], _sum:{ qtyDelta:true } });
const onHand = {};
for (const e of existing) {
  if (!onHand[e.partId]) onHand[e.partId] = {};
  onHand[e.partId][e.locationId] = (onHand[e.partId][e.locationId]||0) + (e._sum.qtyDelta||0);
}
const totals = {};
for (const [pid, lmap] of Object.entries(onHand)) {
  totals[pid] = Object.values(lmap).reduce((a,b)=>a+b, 0);
}

const parts = await p.part.findMany({ select:{ id:true } });
console.log(`Parts with inventory: ${Object.keys(totals).length} / ${parts.length}`);

// Build all distribution events
const toInsert = [];
for (const part of parts) {
  const total = totals[part.id] || 0;
  if (total === 0) continue;
  const existingLocIds = onHand[part.id] ? Object.keys(onHand[part.id]).map(Number) : [];
  const missingLocs = locs.filter(l => !existingLocIds.includes(l.id));
  for (const loc of missingLocs) {
    const qty = Math.max(1, Math.round(total * weights[loc.id]));
    toInsert.push({ type:'RECEIVE', qtyDelta:qty, partId:part.id, locationId:loc.id, reason:'Initial warehouse distribution', createdBy:admin.id });
  }
}

console.log(`Inserting ${toInsert.length} events in batches...`);
const CHUNK = 500;
for (let i = 0; i < toInsert.length; i += CHUNK) {
  await p.inventoryEvent.createMany({ data: toInsert.slice(i, i+CHUNK) });
  console.log(`  ${Math.min(i+CHUNK, toInsert.length)}/${toInsert.length}`);
}

// Summary
const summary = await p.inventoryEvent.groupBy({ by:['locationId'], _sum:{ qtyDelta:true } });
console.log('\n── Inventory by location ──');
for (const row of summary.sort((a,b)=>(b._sum.qtyDelta||0)-(a._sum.qtyDelta||0))) {
  const loc = locs.find(l=>l.id===row.locationId);
  console.log(`  ${loc?.name}: ${row._sum.qtyDelta?.toLocaleString()} units`);
}

await p.$disconnect();
console.log('Done!');

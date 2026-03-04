import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const MULTIPLIERS = { NEW:1.75, EXCELLENT:1.5, GOOD:1.4, FAIR:1.3, POOR:1.15, CORE:1.1, SALVAGE:1.0, UNKNOWN:1.75 };

const locs = await p.location.findMany({ select: { id:true, name:true } });
console.log('Locations:', locs.map(l=>`${l.id}:${l.name}`).join(', '));

const admin = await p.user.findFirst({ where:{ role:'admin' }, select:{ id:true, name:true } });
console.log('Admin:', admin.name);

const parts = await p.part.findMany({ select:{ id:true, condition:true, costCents:true, retailPriceCents:true } });
console.log(`Parts: ${parts.length}, already priced: ${parts.filter(p=>p.retailPriceCents).length}`);

// ── STEP 1: Bulk price update ──
const unpriced = parts.filter(p=>!p.retailPriceCents);
console.log(`Pricing ${unpriced.length} parts...`);

// Use raw SQL for bulk update grouped by condition — much faster
for (const [cond, mult] of Object.entries(MULTIPLIERS)) {
  const result = await p.$executeRaw`
    UPDATE parts 
    SET retail_price_cents = ROUND(COALESCE(cost_cents, 3000) * ${mult} / 100) * 100
    WHERE condition = ${cond} AND retail_price_cents IS NULL
  `;
  if (result > 0) console.log(`  ${cond}: updated ${result} parts (×${mult})`);
}

// ── STEP 2: Distribution weights ──
const weights = {};
for (const loc of locs) {
  const n = loc.name.toLowerCase();
  if (n.includes('main') || n.includes('greeley')) weights[loc.id] = 0.35;
  else if (n.includes('denver')) weights[loc.id] = 0.25;
  else if (n.includes('fort')) weights[loc.id] = 0.18;
  else if (n.includes('longmont')) weights[loc.id] = 0.15;
  else weights[loc.id] = 0.07; // test bay
}
console.log('Weights:', JSON.stringify(weights));

// ── STEP 3: Get existing on-hand per part per location ──
const existing = await p.inventoryEvent.groupBy({ by:['partId','locationId'], _sum:{ qtyDelta:true } });
const onHand = {}; // partId -> { locId -> qty }
for (const e of existing) {
  if (!onHand[e.partId]) onHand[e.partId] = {};
  onHand[e.partId][e.locationId] = (onHand[e.partId][e.locationId] || 0) + (e._sum.qtyDelta || 0);
}
// Total per part
const totals = {};
for (const [pid, lmap] of Object.entries(onHand)) {
  totals[pid] = Object.values(lmap).reduce((a,b)=>a+b,0);
}

// ── STEP 4: Build bulk insert data ──
const toInsert = [];
for (const part of parts) {
  const total = totals[part.id] || 0;
  if (total === 0) continue;
  const existingLocs = onHand[part.id] ? Object.keys(onHand[part.id]).map(Number) : [];
  const missingLocs = locs.filter(l => !existingLocs.includes(l.id));
  for (const loc of missingLocs) {
    const qty = Math.max(1, Math.round(total * weights[loc.id]));
    toInsert.push({ type:'RECEIVE', qtyDelta:qty, partId:part.id, locationId:loc.id, reason:'Initial warehouse distribution', createdBy:admin.id });
  }
}

console.log(`Inserting ${toInsert.length} distribution events...`);

// Batch in chunks of 200
const CHUNK = 200;
for (let i = 0; i < toInsert.length; i += CHUNK) {
  const chunk = toInsert.slice(i, i + CHUNK);
  await p.inventoryEvent.createMany({ data: chunk });
  process.stdout.write(`\r  ${Math.min(i+CHUNK, toInsert.length)}/${toInsert.length} events`);
}
console.log('\nDone!');

// ── Summary ──
const summary = await p.inventoryEvent.groupBy({ by:['locationId'], _sum:{ qtyDelta:true } });
for (const row of summary.sort((a,b)=>(b._sum.qtyDelta||0)-(a._sum.qtyDelta||0))) {
  const loc = locs.find(l=>l.id===row.locationId);
  console.log(`  ${loc?.name || row.locationId}: ${row._sum.qtyDelta?.toLocaleString()} units`);
}

const totalVal = await p.$queryRaw`SELECT SUM(retail_price_cents)/100 as total FROM parts WHERE retail_price_cents IS NOT NULL`;
console.log(`Total catalog retail value: $${Number(totalVal[0].total).toLocaleString()}`);

await p.$disconnect();

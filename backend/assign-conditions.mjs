import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Weighted random — reflects a realistic used parts yard distribution
const CONDITIONS = [
  { value: 'NEW',       weight: 15 },
  { value: 'EXCELLENT', weight: 20 },
  { value: 'GOOD',      weight: 30 },
  { value: 'FAIR',      weight: 20 },
  { value: 'POOR',      weight: 8  },
  { value: 'CORE',      weight: 4  },
  { value: 'SALVAGE',   weight: 3  },
];

const total = CONDITIONS.reduce((s, c) => s + c.weight, 0);
function randomCondition() {
  let r = Math.random() * total;
  for (const c of CONDITIONS) { r -= c.weight; if (r <= 0) return c.value; }
  return 'GOOD';
}

const parts = await p.part.findMany({ select: { id: true, condition: true } });
console.log(`Randomizing conditions for ${parts.length} parts...`);

const counts = {};
const CHUNK = 100;
for (let i = 0; i < parts.length; i += CHUNK) {
  const chunk = parts.slice(i, i + CHUNK);
  await Promise.all(chunk.map(part => {
    const cond = randomCondition();
    counts[cond] = (counts[cond] || 0) + 1;
    return p.part.update({ where: { id: part.id }, data: { condition: cond } });
  }));
  process.stdout.write(`\r  ${Math.min(i + CHUNK, parts.length)}/${parts.length}`);
}

console.log('\n\n── Condition breakdown ──');
for (const [cond, count] of Object.entries(counts).sort((a,b) => b[1]-a[1])) {
  const bar = '█'.repeat(Math.round(count / parts.length * 40));
  console.log(`  ${cond.padEnd(10)} ${String(count).padStart(3)}  ${bar}`);
}

await p.$disconnect();
console.log('\nDone.');

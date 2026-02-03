import prisma from '../repositories/prisma.js';

interface SkuInput {
  make: string;
  model: string;
  year: number;
  systemCode: string;
  componentCode: string;
  position?: string | null;
}

interface SkuResult {
  sku: string;
  decoded: {
    make: string;
    model: string;
    year: number;
    system: string;
    component: string;
    position: string | null;
  };
}

const POSITION_CODES: Record<string, string> = {
  LF: 'Left Front',
  RF: 'Right Front',
  LR: 'Left Rear',
  RR: 'Right Rear',
  L: 'Left',
  R: 'Right',
  F: 'Front',
  RE: 'Rear',
};

export async function generateSku(input: SkuInput): Promise<SkuResult> {
  // Look up make code
  const makeEntry = await prisma.makeCode.findUnique({ where: { make: input.make } });
  if (!makeEntry) throw new Error(`Unknown make: ${input.make}`);

  // Get or create model code
  let modelEntry = await prisma.modelCode.findUnique({
    where: { make_model: { make: input.make, model: input.model } },
  });
  if (!modelEntry) {
    const code = await generateModelCode(input.make, input.model);
    modelEntry = await prisma.modelCode.create({
      data: { make: input.make, model: input.model, code },
    });
  }

  // Look up system
  const systemEntry = await prisma.systemCode.findUnique({ where: { code: input.systemCode } });
  if (!systemEntry) throw new Error(`Unknown system code: ${input.systemCode}`);

  // Look up component
  const componentEntry = await prisma.componentCode.findFirst({
    where: { systemCode: input.systemCode, code: input.componentCode },
  });
  if (!componentEntry) throw new Error(`Unknown component code: ${input.componentCode} in system ${input.systemCode}`);

  const yearCode = String(input.year).slice(-2);
  let baseSku = `${makeEntry.code}-${modelEntry.code}-${yearCode}-${input.systemCode}${input.componentCode}`;
  if (input.position) {
    baseSku += `-${input.position}`;
  }

  // Check for existing parts with same base SKU and auto-increment sequence
  const existingParts = await prisma.part.findMany({
    where: {
      OR: [
        { sku: baseSku },
        { sku: { startsWith: `${baseSku}-` } },
      ],
    },
    select: { sku: true },
  });

  let sku = baseSku;
  if (existingParts.length > 0) {
    // Find the highest sequence number
    let maxSeq = 0;
    for (const p of existingParts) {
      if (p.sku === baseSku) {
        maxSeq = Math.max(maxSeq, 1); // The original counts as 1
      }
      const seqMatch = p.sku.match(new RegExp(`^${baseSku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d{3})$`));
      if (seqMatch) {
        maxSeq = Math.max(maxSeq, parseInt(seqMatch[1], 10));
      }
    }
    const nextSeq = maxSeq + 1;
    sku = `${baseSku}-${String(nextSeq).padStart(3, '0')}`;
  }

  return {
    sku,
    decoded: {
      make: input.make,
      model: input.model,
      year: input.year,
      system: systemEntry.name,
      component: componentEntry.name,
      position: input.position ? (POSITION_CODES[input.position] || input.position) : null,
    },
  };
}

async function generateModelCode(make: string, model: string): Promise<string> {
  // Clean model name: remove hyphens, spaces, etc.
  const clean = model.replace(/[-\s/]/g, '').toUpperCase();
  let candidate = clean.slice(0, 3);
  if (candidate.length < 3) candidate = candidate.padEnd(3, 'X');

  // Check collision
  const existing = await prisma.modelCode.findFirst({
    where: { make, code: candidate },
  });
  if (!existing) return candidate;

  // Try subsequent letters
  for (let i = 3; i < clean.length; i++) {
    candidate = clean.slice(0, 2) + clean[i];
    const exists = await prisma.modelCode.findFirst({
      where: { make, code: candidate },
    });
    if (!exists) return candidate;
  }

  // Fallback: append number
  for (let n = 1; n <= 9; n++) {
    candidate = clean.slice(0, 2) + String(n);
    const exists = await prisma.modelCode.findFirst({
      where: { make, code: candidate },
    });
    if (!exists) return candidate;
  }

  throw new Error(`Cannot generate unique model code for ${make} ${model}`);
}

export async function lookupSku(sku: string): Promise<SkuResult['decoded'] | null> {
  // Parse: MM-MMM-YY-PPCC[-POS]
  const parts = sku.split('-');
  if (parts.length < 4 || parts.length > 5) return null;

  const makeCode = parts[0];
  const modelCode = parts[1];
  const yearCode = parts[2];
  const systemComponent = parts[3];
  const positionCode = parts[4] || null;

  if (systemComponent.length !== 4) return null;
  const systemCode = systemComponent.slice(0, 2);
  const componentCode = systemComponent.slice(2, 4);

  const makeEntry = await prisma.makeCode.findUnique({ where: { code: makeCode } });
  if (!makeEntry) return null;

  const modelEntry = await prisma.modelCode.findFirst({
    where: { make: makeEntry.make, code: modelCode },
  });

  const systemEntry = await prisma.systemCode.findUnique({ where: { code: systemCode } });
  const componentEntry = await prisma.componentCode.findFirst({
    where: { systemCode, code: componentCode },
  });

  const year = parseInt(yearCode, 10);
  const fullYear = year >= 50 ? 1900 + year : 2000 + year;

  return {
    make: makeEntry.make,
    model: modelEntry?.model || `Unknown (${modelCode})`,
    year: fullYear,
    system: systemEntry?.name || `Unknown (${systemCode})`,
    component: componentEntry?.name || `Unknown (${componentCode})`,
    position: positionCode ? (POSITION_CODES[positionCode] || positionCode) : null,
  };
}

export async function getMakeCodes() {
  return prisma.makeCode.findMany({ orderBy: { make: 'asc' } });
}

export async function getModelCodes(make?: string) {
  return prisma.modelCode.findMany({
    where: make ? { make } : undefined,
    orderBy: { model: 'asc' },
  });
}

export async function getSystemCodes() {
  return prisma.systemCode.findMany({ orderBy: { name: 'asc' } });
}

export async function getComponentCodes(systemCode?: string) {
  return prisma.componentCode.findMany({
    where: systemCode ? { systemCode } : undefined,
    orderBy: { name: 'asc' },
  });
}

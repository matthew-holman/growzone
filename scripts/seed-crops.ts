import 'dotenv/config';
import { readFileSync } from 'fs';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { db, crops, cropMethods } from '../src/db/index.js';

const CropMethodSchema = z.object({
  id:                        z.string().min(1),
  label:                     z.object({ sv: z.string(), en: z.string() }),
  germinationMinSoilTempC:   z.number().int().nullable(),
  germinationOptSoilTempC:   z.number().int().nullable(),
  daysToGerminationMin:      z.number().int().nullable(),
  daysToGerminationMax:      z.number().int().nullable(),
  daysToMaturityMin:         z.number().int().nullable(),
  daysToMaturityMax:         z.number().int().nullable(),
  transplantTolerance:       z.enum(['good', 'poor', 'none', 'direct-only']),
  gddRequired:               z.number().int().nullable(),
  plantBeforeFirstFrostDays: z.number().int().nullable(),
  sortOrder:                 z.number().int(),
});

const CropSchema = z.object({
  id:                   z.string().min(1),
  name:                 z.object({ sv: z.string(), en: z.string() }),
  lifecycle:            z.enum(['annual', 'overwintered', 'biennial', 'perennial']),
  frostTolerance:       z.enum(['none', 'light', 'hard']),
  minNightTempC:        z.number().int().nullable(),
  daylengthRequirement: z.enum(['neutral', 'long', 'short']),
  notes:                z.object({ sv: z.string(), en: z.string() }).optional(),
  methods:              z.array(CropMethodSchema).min(1),
});

const CropsFileSchema = z.array(CropSchema).min(1);

const JSON_PATH = 'src/data/crops-v2.json';

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(JSON_PATH, 'utf-8'));
} catch {
  console.error(`Error: ${JSON_PATH} not found or is not valid JSON.`);
  process.exit(1);
}

const parsed = CropsFileSchema.safeParse(raw);
if (!parsed.success) {
  console.error('Validation failed:');
  for (const issue of parsed.error.issues) {
    const cropIndex = issue.path[0];
    const rest = issue.path.slice(1).join('.');
    console.error(` - crops[${cropIndex}]${rest ? '.' + rest : ''}: ${issue.message}`);
  }
  process.exit(1);
}

const cropData = parsed.data;

const cropRows = cropData.map((c) => ({
  id:                   c.id,
  nameSv:               c.name.sv,
  nameEn:               c.name.en,
  lifecycle:            c.lifecycle,
  frostTolerance:       c.frostTolerance,
  minNightTempC:        c.minNightTempC,
  daylengthRequirement: c.daylengthRequirement,
  notesSv:              c.notes?.sv ?? null,
  notesEn:              c.notes?.en ?? null,
}));

const methodRows = cropData.flatMap((c) =>
  c.methods.map((m) => ({
    id:                        m.id,
    cropId:                    c.id,
    labelSv:                   m.label.sv,
    labelEn:                   m.label.en,
    germinationMinSoilTempC:   m.germinationMinSoilTempC,
    germinationOptSoilTempC:   m.germinationOptSoilTempC,
    daysToGerminationMin:      m.daysToGerminationMin,
    daysToGerminationMax:      m.daysToGerminationMax,
    daysToMaturityMin:         m.daysToMaturityMin,
    daysToMaturityMax:         m.daysToMaturityMax,
    transplantTolerance:       m.transplantTolerance,
    gddRequired:               m.gddRequired,
    plantBeforeFirstFrostDays: m.plantBeforeFirstFrostDays,
    sortOrder:                 m.sortOrder,
  }))
);

console.log('Seeding crops...');

await db.insert(crops)
  .values(cropRows)
  .onConflictDoUpdate({
    target: crops.id,
    set: {
      nameSv:               sql`excluded.name_sv`,
      nameEn:               sql`excluded.name_en`,
      lifecycle:            sql`excluded.lifecycle`,
      frostTolerance:       sql`excluded.frost_tolerance`,
      minNightTempC:        sql`excluded.min_night_temp_c`,
      daylengthRequirement: sql`excluded.daylength_requirement`,
      notesSv:              sql`excluded.notes_sv`,
      notesEn:              sql`excluded.notes_en`,
    },
  });

await db.insert(cropMethods)
  .values(methodRows)
  .onConflictDoUpdate({
    target: cropMethods.id,
    set: {
      cropId:                    sql`excluded.crop_id`,
      labelSv:                   sql`excluded.label_sv`,
      labelEn:                   sql`excluded.label_en`,
      germinationMinSoilTempC:   sql`excluded.germination_min_soil_temp_c`,
      germinationOptSoilTempC:   sql`excluded.germination_opt_soil_temp_c`,
      daysToGerminationMin:      sql`excluded.days_to_germination_min`,
      daysToGerminationMax:      sql`excluded.days_to_germination_max`,
      daysToMaturityMin:         sql`excluded.days_to_maturity_min`,
      daysToMaturityMax:         sql`excluded.days_to_maturity_max`,
      transplantTolerance:       sql`excluded.transplant_tolerance`,
      gddRequired:               sql`excluded.gdd_required`,
      plantBeforeFirstFrostDays: sql`excluded.plant_before_first_frost_days`,
      sortOrder:                 sql`excluded.sort_order`,
    },
  });

for (const c of cropData) {
  console.log(`  ✓ ${c.id} (${c.methods.length} method${c.methods.length === 1 ? '' : 's'})`);
}

console.log(`Done. Seeded ${cropData.length} crops and ${methodRows.length} methods.`);
process.exit(0);

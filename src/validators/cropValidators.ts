import { z } from 'zod'

export const CropBodySchema = z.object({
  id:                   z.string().min(1).regex(/^[a-z-]+$/, 'id must be lowercase letters and hyphens only'),
  nameSv:               z.string().min(1),
  nameEn:               z.string().min(1),
  lifecycle:            z.enum(['annual', 'overwintered', 'biennial', 'perennial']),
  frostTolerance:       z.enum(['none', 'light', 'hard']),
  minNightTempC:        z.number().int().min(-10).max(25).nullable(),
  daylengthRequirement: z.enum(['neutral', 'long', 'short']),
  notesSv:              z.string().nullable().optional(),
  notesEn:              z.string().nullable().optional(),
})

export const CropUpdateSchema = CropBodySchema.omit({ id: true })

export const CropMethodBodySchema = z.object({
  id:                        z.string().min(1).regex(/^[a-z-]+$/, 'id must be lowercase letters and hyphens only'),
  cropId:                    z.string().min(1),
  labelSv:                   z.string().min(1),
  labelEn:                   z.string().min(1),
  germinationMinSoilTempC:   z.number().int().min(0).max(40).nullable(),
  germinationOptSoilTempC:   z.number().int().min(0).max(40).nullable(),
  daysToGerminationMin:      z.number().int().min(1).max(60).nullable(),
  daysToGerminationMax:      z.number().int().min(1).max(60).nullable(),
  daysToMaturityMin:         z.number().int().min(1).max(365).nullable(),
  daysToMaturityMax:         z.number().int().min(1).max(365).nullable(),
  transplantTolerance:       z.enum(['good', 'poor', 'none', 'direct-only']),
  gddRequired:               z.number().int().min(0).max(5000).nullable(),
  plantBeforeFirstFrostDays: z.number().int().min(1).max(90).nullable(),
  sortOrder:                 z.number().int().min(0).default(0),
})

export const CropMethodUpdateSchema = CropMethodBodySchema.omit({
  id: true,
  cropId: true,
})

export type CropBody     = z.infer<typeof CropBodySchema>
export type CropUpdate   = z.infer<typeof CropUpdateSchema>
export type MethodBody   = z.infer<typeof CropMethodBodySchema>
export type MethodUpdate = z.infer<typeof CropMethodUpdateSchema>

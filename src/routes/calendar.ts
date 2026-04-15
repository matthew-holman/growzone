import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import type { RouteHandler } from '@hono/zod-openapi'
import { getAllCropsWithMethods } from '../repositories/cropRepository.js'
import { generateCalendar } from '../services/calendarEngine.js'
import { resolveClimateProfile } from '../services/climateResolver.js'
import { findNearestStations, PostcodeNotFoundError, InsufficientStationsError } from '../services/stationLookup.js'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const PostcodeQuery = z.object({
  postcode: z
    .string({ required_error: 'postcode query parameter is required' })
    .min(4, 'postcode too short')
    .max(6, 'postcode too long')
    .regex(/^\d+$/, 'postcode must contain only digits')
    .openapi({ example: '11346' }),
})

const CalendarWindowSchema = z.object({
  startMonth: z.number().int().min(1).max(12),
  startDay:   z.number().int().min(1).max(31),
  endMonth:   z.number().int().min(1).max(12),
  endDay:     z.number().int().min(1).max(31),
}).openapi('CalendarWindow')

const MethodCalendarSchema = z.object({
  methodId:          z.string(),
  methodLabelSv:     z.string(),
  methodLabelEn:     z.string(),
  feasibility:       z.enum(['feasible', 'marginal', 'infeasible']),
  feasibilityReason: z.string().nullable(),
  sowIndoors:        CalendarWindowSchema.nullable(),
  directSow:         CalendarWindowSchema.nullable(),
  transplant:        CalendarWindowSchema.nullable(),
  harvest:           CalendarWindowSchema.nullable(),
}).openapi('MethodCalendar')

const CropCalendarSchema = z.object({
  cropId:     z.string(),
  cropNameSv: z.string(),
  cropNameEn: z.string(),
  lifecycle:  z.string(),
  methods:    z.array(MethodCalendarSchema),
}).openapi('CropCalendar')

const CalendarResponseSchema = z.object({
  postcode: z.string().openapi({ example: '11346' }),
  location: z.object({
    lat:        z.number().openapi({ example: 59.334 }),
    lng:        z.number().openapi({ example: 18.063 }),
    elevationM: z.number().int().openapi({ example: 28 }),
  }),
  climate: z.object({
    lastFrostDoy:     z.number().int(),
    lastFrostP90:     z.number().int(),
    firstFrostDoy:    z.number().int(),
    firstFrostP10:    z.number().int(),
    growingDays:      z.number().int(),
    gddAnnual:        z.number(),
    gddP10:           z.number(),
    gddP90:           z.number(),
    gddCv:            z.number(),
    monthlyMeanTemps: z.array(z.number()),
  }),
  crops: z.array(CropCalendarSchema),
}).openapi('CalendarResponse')

const ErrorSchema = z.object({
  error:   z.string().openapi({ example: 'postcode_not_found' }),
  message: z.string().openapi({ example: 'Postcode 00000 was not found in the database.' }),
}).openapi('Error')

// ---------------------------------------------------------------------------
// Route definition
// ---------------------------------------------------------------------------

const getCalendarRoute = createRoute({
  method: 'get',
  path:   '/calendar',
  summary:     'Get growing calendar for a Swedish postcode',
  description: 'Resolves the nearest SMHI weather stations for the postcode, derives a climate profile via inverse distance weighting, and returns a structured growing calendar for all crops in the database.',
  tags: ['Calendar'],
  request: {
    query: PostcodeQuery,
  },
  responses: {
    200: {
      content:     { 'application/json': { schema: CalendarResponseSchema } },
      description: 'Growing calendar for the given postcode',
    },
    400: {
      content:     { 'application/json': { schema: ErrorSchema } },
      description: 'Invalid or missing postcode',
    },
    404: {
      content:     { 'application/json': { schema: ErrorSchema } },
      description: 'Postcode not found in the database',
    },
    503: {
      content:     { 'application/json': { schema: ErrorSchema } },
      description: 'Not enough weather station data for this location',
    },
  },
})

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

const getCalendarHandler: RouteHandler<typeof getCalendarRoute> = async (c) => {
  const { postcode } = c.req.valid('query')

  try {
    const { location, stations } = await findNearestStations(postcode)
    const profile  = resolveClimateProfile(location, stations)
    const cropData = await getAllCropsWithMethods()
    const calendar = generateCalendar(profile, cropData)

    return c.json({
      postcode: profile.postcode,
      location: {
        lat:        location.lat,
        lng:        location.lng,
        elevationM: location.elevationM,
      },
      climate: {
        lastFrostDoy:     profile.lastFrostDoy,
        lastFrostP90:     profile.lastFrostP90,
        firstFrostDoy:    profile.firstFrostDoy,
        firstFrostP10:    profile.firstFrostP10,
        growingDays:      profile.growingDays,
        gddAnnual:        profile.gddAnnual,
        gddP10:           profile.gddP10,
        gddP90:           profile.gddP90,
        gddCv:            profile.gddCv,
        monthlyMeanTemps: profile.monthlyMeanTemps,
      },
      crops: calendar,
    }, 200)

  } catch (error) {
    if (error instanceof PostcodeNotFoundError) {
      return c.json({
        error:   'postcode_not_found',
        message: `Postcode ${postcode} was not found in the database.`,
      }, 404)
    }
    if (error instanceof InsufficientStationsError) {
      return c.json({
        error:   'insufficient_station_data',
        message: 'Not enough weather station data to generate a calendar for this location.',
      }, 503)
    }
    throw error
  }
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const calendar = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json({
        error:   'invalid_postcode',
        message: result.error.issues[0]?.message ?? 'Invalid postcode.',
      }, 400)
    }
  },
})

calendar.openapi(getCalendarRoute, getCalendarHandler)

export default calendar

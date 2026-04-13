import { pgTable, text, numeric, smallint, integer, timestamp } from "drizzle-orm/pg-core";

export const postcodeZones = pgTable("postcode_zones", {
  postcode: text("postcode").primaryKey(),
  lat: numeric("lat", { precision: 9, scale: 6 }).notNull(),
  lng: numeric("lng", { precision: 9, scale: 6 }).notNull(),
  zoneId: smallint("zone_id").notNull(),
  placeName: text("place_name").notNull(),
  adminName1: text("admin_name1"),
  elevationM: smallint("elevation_m").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const weatherStations = pgTable('weather_stations', {
  id:               integer('id').primaryKey(),
  name:             text('name').notNull(),
  lat:              numeric('lat', { precision: 9, scale: 6 }).notNull(),
  lng:              numeric('lng', { precision: 9, scale: 6 }).notNull(),
  elevationM:       numeric('elevation_m', { precision: 7, scale: 3 }).notNull(),
  lastFrostDoy:     smallint('last_frost_doy'),
  lastFrostP90:     smallint('last_frost_p90'),
  firstFrostDoy:    smallint('first_frost_doy'),
  firstFrostP10:    smallint('first_frost_p10'),
  growingDays:      smallint('growing_days'),
  gddAnnual:        numeric('gdd_annual', { precision: 7, scale: 1 }),
  gddP10:           numeric('gdd_p10', { precision: 7, scale: 1 }),
  gddP90:           numeric('gdd_p90', { precision: 7, scale: 1 }),
  gddCv:            numeric('gdd_cv', { precision: 4, scale: 2 }),
  monthlyMeanTemps: numeric('monthly_mean_temps', { precision: 4, scale: 1 })
                      .array()
                      .notNull(),
  createdAt:        timestamp('created_at', { withTimezone: true })
                      .notNull()
                      .defaultNow(),
});

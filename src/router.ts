import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, postcodeZones } from "./db/index.js";
import { geocodeSwedishPostcode } from "./geocoder.js";
import { classifyZone, type Zone } from "./zoneClassifier.js";
import { getCalendar } from "./calendarLookup.js";

const app = new Hono();

const postcodeSchema = z
  .string()
  .regex(/^\d{5}$/, "Postcode must be exactly 5 digits");

app.get("/calendar", async (c) => {
  const rawPostcode = c.req.query("postcode");

  const parsed = postcodeSchema.safeParse(rawPostcode);
  if (!parsed.success) {
    return c.json(
      { error: "validation_error", message: parsed.error.errors[0].message },
      400
    );
  }

  const postcode = parsed.data;

  try {
    // Check DB cache first
    const cached = await db
      .select()
      .from(postcodeZones)
      .where(eq(postcodeZones.postcode, postcode))
      .limit(1);

    let zone: Zone;

    if (cached.length > 0) {
      zone = cached[0].zoneId as Zone;
    } else {
      const location = await geocodeSwedishPostcode(postcode);
      if (!location) {
        return c.json(
          {
            error: "not_found",
            message: `No location found for postcode ${postcode}`,
          },
          404
        );
      }

      const resolvedZone = classifyZone(location.lat, location.lng);
      if (!resolvedZone) {
        return c.json(
          {
            error: "not_found",
            message: `Postcode ${postcode} does not map to a Swedish growing zone`,
          },
          404
        );
      }

      zone = resolvedZone;

      await db.insert(postcodeZones).values({
        postcode,
        lat: String(location.lat),
        lng: String(location.lng),
        zoneId: zone,
      });
    }

    const crops = getCalendar(zone);

    return c.json({ postcode, zone, crops });
  } catch (err) {
    console.error(err);
    return c.json(
      { error: "internal_error", message: "An unexpected error occurred" },
      500
    );
  }
});

export default app;

import { Hono } from "hono";
import { z } from "zod";
import { geocodeSwedishPostcode } from "./geocoder.js";
import { classifyZone, type Zone } from "./zoneClassifier.js";
import { getCalendar } from "./calendarLookup.js";
import { getZoneByPostcode, savePostcodeZone } from "./repositories/postcodeZoneRepository.js";

const app = new Hono();

const postcodeSchema = z
    .string()
    .regex(/^\d{5}$/, "Postcode must be exactly 5 digits");

app.get("/calendar", async (c) => {
  const rawPostcode = c.req.query("postcode");

  if (rawPostcode === undefined) {
    return c.json(
        { error: "validation_error", message: "postcode query parameter is required" },
        400
    );
  }

  const parsed = postcodeSchema.safeParse(rawPostcode);
  if (!parsed.success) {
    return c.json(
        { error: "validation_error", message: parsed.error.issues[0].message },
        400
    );
  }

  const postcode = parsed.data;

  try {
    let zone: Zone;

    const cached = await getZoneByPostcode(postcode);
    if (cached !== null) {
      zone = cached;
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
      await savePostcodeZone(postcode, location.lat, location.lng, zone);
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

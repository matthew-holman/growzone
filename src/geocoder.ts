const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const contact = process.env.NOMINATIM_CONTACT ?? "";
if (!contact) {
  throw new Error("NOMINATIM_CONTACT env var is required (e.g. your@email.com)");
}
const USER_AGENT = "growzone/1.0";

export interface GeocodedLocation {
  lat: number;
  lng: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
}

export async function geocodeSwedishPostcode(
  postcode: string
): Promise<GeocodedLocation | null> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("postalcode", postcode);
  url.searchParams.set("country", "sweden");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("email", contact);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const results: NominatimResult[] = await response.json();
  if (results.length === 0) return null;

  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
  };
}

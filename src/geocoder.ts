const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "growzone/1.0 (contact@example.com)";

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
  url.searchParams.set("countrycodes", "se");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT },
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

// Haversine formula — returns miles between two lat/lng points
export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Fetch lat/lng for a ZIP code using free zippopotam.us API (no key needed)
export async function zipToCoords(zip: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!r.ok) return null;
    const d: any = await r.json();
    return { lat: parseFloat(d.places[0].latitude), lng: parseFloat(d.places[0].longitude) };
  } catch { return null; }
}
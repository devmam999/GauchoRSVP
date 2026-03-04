export interface UserLocation {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;
const KM_TO_MILES = 0.621371;
const WALK_MPH = 3;
const BIKE_MPH = 10;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceMilesBetween(
  a: UserLocation,
  b: UserLocation
): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const hav =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
  const km = EARTH_RADIUS_KM * c;
  return km * KM_TO_MILES;
}

export function minutesForDistance(distanceMiles: number, mph: number): number {
  if (distanceMiles <= 0) return 0;
  return Math.max(1, Math.round((distanceMiles / mph) * 60));
}

export function estimateTravel(distanceMiles: number) {
  return {
    distanceMiles: Number(distanceMiles.toFixed(1)),
    walkMinutes: minutesForDistance(distanceMiles, WALK_MPH),
    bikeMinutes: minutesForDistance(distanceMiles, BIKE_MPH),
  };
}

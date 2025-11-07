// lib/campusConfig.ts

export type CampusZoneName = "All" | "Library" | "Hostel Area" | "Sports Complex" | "Mess 1" | "Academic Block";

export const DEFAULT_CAMPUS_COORDS: [number, number] = [23.21065963774903, 72.68441996838412];

export const campusZonesConfig: { [key in CampusZoneName]: { coords: [number, number]; zoom: number; radius: number } } = {
  "All": { coords: DEFAULT_CAMPUS_COORDS, zoom: 16, radius: 9999 },
  "Library": { coords: [23.213755699842107, 72.6865986583907], zoom: 18, radius: 100 },
  "Hostel Area": { coords: [23.210620913196614, 72.68516633105374], zoom: 17.5, radius: 200 },
  "Sports Complex": { coords: [23.211534623489253, 72.68818652075808], zoom: 17, radius: 250 },
  "Mess 1": { coords: [23.210860881912076, 72.68570839257683], zoom: 18, radius: 80 },
  "Academic Block": { coords: [23.214092328794994, 72.68480312782248], zoom: 17, radius: 200 },
};
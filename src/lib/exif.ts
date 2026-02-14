import ExifReader from "exifreader";
import type { PhotoMeta } from "./photobook";

function dmsToDecimal(
  dms: { value: number }[],
  ref: string,
): number | undefined {
  if (!dms || dms.length < 3) return undefined;
  const d = dms[0].value + dms[1].value / 60 + dms[2].value / 3600;
  return ref === "S" || ref === "W" ? -d : d;
}

export async function extractPhotoMeta(file: File): Promise<PhotoMeta | undefined> {
  try {
    const buffer = await file.arrayBuffer();
    const tags = ExifReader.load(buffer, { expanded: true });

    const meta: PhotoMeta = {};

    // Date
    const dateTag =
      tags.exif?.DateTimeOriginal?.description ??
      tags.exif?.DateTime?.description;
    if (dateTag) {
      // "2024:03:15 14:30:00" → "2024-03-15"
      const match = dateTag.match(/^(\d{4}):(\d{2}):(\d{2})/);
      if (match) {
        meta.date = `${match[1]}-${match[2]}-${match[3]}`;
      }
    }

    // GPS
    const gps = tags.gps;
    if (gps?.Latitude && gps?.Longitude) {
      meta.lat = typeof gps.Latitude === "number" ? gps.Latitude : undefined;
      meta.lng = typeof gps.Longitude === "number" ? gps.Longitude : undefined;
    }
    if (meta.lat == null && tags.exif?.GPSLatitude && tags.exif?.GPSLongitude) {
      const latValues = tags.exif.GPSLatitude.value as unknown as { value: number }[];
      const lngValues = tags.exif.GPSLongitude.value as unknown as { value: number }[];
      const latRef = (tags.exif.GPSLatitudeRef?.value as string[])?.[0] ?? "N";
      const lngRef = (tags.exif.GPSLongitudeRef?.value as string[])?.[0] ?? "E";
      meta.lat = dmsToDecimal(latValues, latRef);
      meta.lng = dmsToDecimal(lngValues, lngRef);
    }

    if (!meta.date && meta.lat == null) return undefined;

    // Reverse geocode
    if (meta.lat != null && meta.lng != null) {
      meta.locationName = await reverseGeocode(meta.lat, meta.lng);
    }

    return meta;
  } catch {
    return undefined;
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&accept-language=ja`,
      { headers: { "User-Agent": "tarie/1.0" } },
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    const addr = data.address;
    if (!addr) return undefined;
    // Build a short location name: city/town + state/province
    const place = addr.city || addr.town || addr.village || addr.suburb || addr.county || "";
    const region = addr.state || addr.province || "";
    if (place && region) return `${region} ${place}`;
    return place || region || undefined;
  } catch {
    return undefined;
  }
}

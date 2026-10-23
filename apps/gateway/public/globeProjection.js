const radians = degrees => degrees * Math.PI / 180;
const degrees = radiansValue => radiansValue * 180 / Math.PI;

export function projectGlobe([longitude, latitude], centerLongitude, centerLatitude) {
  const lon = radians(longitude - centerLongitude), lat = radians(latitude), center = radians(centerLatitude);
  const x = Math.cos(lat) * Math.sin(lon);
  const y = Math.cos(center) * Math.sin(lat) - Math.sin(center) * Math.cos(lat) * Math.cos(lon);
  const depth = Math.sin(center) * Math.sin(lat) + Math.cos(center) * Math.cos(lat) * Math.cos(lon);
  return { x, y, depth };
}

export function unprojectGlobe(x, y, centerLongitude, centerLatitude) {
  const distance = x * x + y * y;
  if (distance > 1) return null;
  const depth = Math.sqrt(Math.max(0, 1 - distance));
  const center = radians(centerLatitude);
  const latitude = Math.asin(depth * Math.sin(center) + y * Math.cos(center));
  const longitude = radians(centerLongitude) + Math.atan2(x, depth * Math.cos(center) - y * Math.sin(center));
  return [((degrees(longitude) + 180) % 360 + 360) % 360 - 180, degrees(latitude)];
}

export function solarPosition(date) {
  const day = Math.floor((date - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86_400_000);
  return { latitude: 23.44 * Math.sin(2 * Math.PI * (day - 81) / 365),
    longitude: (12 - (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600)) * 15 };
}

export function sunlit(longitude, latitude, sun) {
  const lat = radians(latitude), sunLat = radians(sun.latitude);
  return Math.sin(lat) * Math.sin(sunLat) + Math.cos(lat) * Math.cos(sunLat) * Math.cos(radians(longitude - sun.longitude));
}

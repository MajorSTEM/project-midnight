import type { FalloutPlume, LatLng } from '../types';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Generate a simplified Gaussian fallout plume as a polygon.
 *
 * The plume is an elongated ellipse extending downwind from the strike point.
 * Length scales with sqrt(yieldKt/1000) relative to 1 Mt baseline of ~300 km.
 * Width is ~10% of length at max.
 */
export function generateFalloutPlume(
  strikeLocation: LatLng,
  yieldKt: number,
  windDirectionDeg: number, // meteorological: 0 = wind FROM north, 180 = wind FROM south
  windSpeedKmh: number
): FalloutPlume {
  // Wind coming FROM a direction means plume goes in OPPOSITE direction
  // e.g., wind from the north (0°) means plume extends southward (180°)
  const plumeDirectionDeg = (windDirectionDeg + 180) % 360;
  const plumeDir = plumeDirectionDeg * DEG_TO_RAD;

  // Scale plume dimensions by yield (baseline: 1000 kt = 1 Mt → 300 km long, 30 km wide)
  const yieldMt = yieldKt / 1000;
  const lengthKm = 300 * Math.sqrt(yieldMt);
  const maxWidthKm = 30 * Math.sqrt(yieldMt);

  // Wind speed scaling: higher wind = longer, narrower plume
  const windFactor = Math.max(0.5, Math.min(2.0, windSpeedKmh / 30));
  const adjustedLength = lengthKm * windFactor;
  const adjustedWidth = maxWidthKm / windFactor;

  // Generate polygon points (ellipse approximation with ~30 vertices)
  const points: LatLng[] = [];
  const numSegments = 32;

  for (let i = 0; i <= numSegments; i++) {
    const t = i / numSegments; // 0 to 1 along plume length

    // Gaussian width profile: widest at ~1/3 from origin, tapering to 0 at ends
    const gaussianT = 3 * t - 0.5; // shift for max width at ~1/3
    const widthFraction = Math.exp(-gaussianT * gaussianT * 0.5);
    const halfWidth = adjustedWidth * 0.5 * widthFraction;

    const distAlong = t * adjustedLength;

    // Right edge
    const rightAngle = plumeDir + Math.PI / 2;
    const rightPt = offsetLatLng(strikeLocation, plumeDir, distAlong, rightAngle, halfWidth);
    points.push(rightPt);
  }

  // Left side (reverse order)
  for (let i = numSegments; i >= 0; i--) {
    const t = i / numSegments;
    const gaussianT = 3 * t - 0.5;
    const widthFraction = Math.exp(-gaussianT * gaussianT * 0.5);
    const halfWidth = adjustedWidth * 0.5 * widthFraction;

    const distAlong = t * adjustedLength;
    const leftAngle = plumeDir - Math.PI / 2;
    const leftPt = offsetLatLng(strikeLocation, plumeDir, distAlong, leftAngle, halfWidth);
    points.push(leftPt);
  }

  return {
    points,
    lengthKm: adjustedLength,
    widthKm: adjustedWidth,
  };
}

/**
 * Offset a lat/lng point by a forward distance along a bearing, then
 * laterally by a perpendicular distance.
 */
function offsetLatLng(
  origin: LatLng,
  forwardBearing: number,
  forwardKm: number,
  lateralBearing: number,
  lateralKm: number
): LatLng {
  const R = 6371; // Earth radius km

  // Move forward
  const lat1 = origin.lat * DEG_TO_RAD;
  const lng1 = origin.lng * DEG_TO_RAD;

  const angDistFwd = forwardKm / R;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angDistFwd) +
    Math.cos(lat1) * Math.sin(angDistFwd) * Math.cos(forwardBearing)
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(forwardBearing) * Math.sin(angDistFwd) * Math.cos(lat1),
    Math.cos(angDistFwd) - Math.sin(lat1) * Math.sin(lat2)
  );

  // Move laterally
  const angDistLat = lateralKm / R;
  const lat3 = Math.asin(
    Math.sin(lat2) * Math.cos(angDistLat) +
    Math.cos(lat2) * Math.sin(angDistLat) * Math.cos(lateralBearing)
  );
  const lng3 = lng2 + Math.atan2(
    Math.sin(lateralBearing) * Math.sin(angDistLat) * Math.cos(lat2),
    Math.cos(angDistLat) - Math.sin(lat2) * Math.sin(lat3)
  );

  return {
    lat: lat3 * RAD_TO_DEG,
    lng: lng3 * RAD_TO_DEG,
  };
}

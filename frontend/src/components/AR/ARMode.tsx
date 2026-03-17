/**
 * AR Mode — Camera overlay with blast radius visualization
 * Uses: getUserMedia (camera), DeviceOrientationEvent (compass), Canvas (overlay)
 */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

interface ARModeProps {
  onClose: () => void;
  /** Strike location — latitude */
  strikeLat?: number;
  /** Strike location — longitude */
  strikeLng?: number;
  /** Weapon yield in kilotons (for ring scaling) */
  yieldKt?: number;
  /** Label for the strike location */
  strikeLabel?: string;
}

interface GeoPosition {
  lat: number;
  lng: number;
}

/** Convert degrees to radians */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in km */
function haversineKm(a: GeoPosition, b: GeoPosition): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.asin(Math.sqrt(h));
}

/** Bearing in degrees (0 = North, clockwise) */
function bearingDeg(from: GeoPosition, to: GeoPosition): number {
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Approximate blast radii in km for a given yield in kt.
 * Returns [fireball, heavyBlast, moderateBlast, lightBlast] radii in km.
 */
function blastRadii(yieldKt: number): number[] {
  const kt = Math.max(1, yieldKt);
  const cbrt = Math.cbrt(kt);
  return [
    0.05 * cbrt,   // fireball (~100m for 1kt)
    0.5 * cbrt,    // heavy blast (20 psi)
    1.5 * cbrt,    // moderate blast (5 psi)
    4.0 * cbrt,    // light blast (1 psi)
  ];
}

interface RingStyle {
  color: string;
  label: string;
  alpha: number;
}

const RING_STYLES: RingStyle[] = [
  { color: '#ff2244', label: 'FIREBALL', alpha: 0.7 },
  { color: '#ff6600', label: 'HEAVY BLAST', alpha: 0.55 },
  { color: '#ffbb00', label: 'MODERATE BLAST', alpha: 0.4 },
  { color: '#00ff88', label: 'LIGHT BLAST', alpha: 0.3 },
];

function drawBlastOverlay(
  canvas: HTMLCanvasElement,
  compassHeading: number,
  userPos: GeoPosition | null,
  strikePosOrNull: GeoPosition | null,
  yieldKt: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;

  if (!userPos || !strikePosOrNull) {
    // No positioning data — draw decorative rings centered
    const radii = blastRadii(yieldKt);
    radii.forEach((radiusKm, i) => {
      const style = RING_STYLES[i];
      const screenR = (radiusKm / radii[radii.length - 1]) * (Math.min(width, height) * 0.35);
      ctx.beginPath();
      ctx.arc(cx, cy, screenR, 0, Math.PI * 2);
      ctx.strokeStyle = style.color;
      ctx.globalAlpha = style.alpha;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = style.alpha * 0.15;
      ctx.fillStyle = style.color;
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    return;
  }

  const distKm = haversineKm(userPos, strikePosOrNull);
  const bearing = bearingDeg(userPos, strikePosOrNull);
  // Relative bearing from camera orientation
  const relBearing = ((bearing - compassHeading + 360) % 360) * (Math.PI / 180);

  const radii = blastRadii(yieldKt);
  const maxRadiusKm = radii[radii.length - 1];

  // Perspective scale: if strike is at distance D km,
  // and max blast ring is R km, that ring subtends R/D radians.
  // Map to screen: 1 radian ≈ half screen width.
  const screenScale = (Math.min(width, height) * 0.5) / Math.max(distKm, 0.5);

  // Project strike center onto screen
  const strikeScreenX = cx + Math.sin(relBearing) * screenScale * distKm;
  const strikeScreenY = cy - Math.cos(relBearing) * screenScale * distKm;

  radii.forEach((radiusKm, i) => {
    const style = RING_STYLES[i];
    const screenR = radiusKm * screenScale;
    ctx.beginPath();
    ctx.arc(strikeScreenX, strikeScreenY, screenR, 0, Math.PI * 2);
    ctx.strokeStyle = style.color;
    ctx.globalAlpha = style.alpha;
    ctx.lineWidth = i === 0 ? 3 : 2;
    ctx.stroke();
    ctx.globalAlpha = style.alpha * 0.12;
    ctx.fillStyle = style.color;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // Direction indicator line from center to strike
  if (distKm > maxRadiusKm) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const lineLen = Math.min(80, Math.sqrt((strikeScreenX - cx) ** 2 + (strikeScreenY - cy) ** 2));
    const angle = Math.atan2(strikeScreenY - cy, strikeScreenX - cx);
    ctx.lineTo(cx + Math.cos(angle) * lineLen, cy + Math.sin(angle) * lineLen);
    ctx.strokeStyle = '#ff2244';
    ctx.globalAlpha = 0.8;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
}

export const ARMode: React.FC<ARModeProps> = ({
  onClose,
  strikeLat,
  strikeLng,
  yieldKt = 100,
  strikeLabel,
}) => {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [compassHeading, setCompassHeading] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<GeoPosition | null>(null);
  const [permissionState, setPermissionState] = useState<
    'pending' | 'granted' | 'denied'
  >('pending');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const headingRef = useRef(0);
  const userPosRef = useRef<GeoPosition | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const strikePos: GeoPosition | null =
    strikeLat !== undefined && strikeLng !== undefined
      ? { lat: strikeLat, lng: strikeLng }
      : null;

  // Check support
  useEffect(() => {
    const hasCamera = !!navigator.mediaDevices?.getUserMedia;
    if (!hasCamera) {
      setIsSupported(false);
      setError('AR Mode requires a mobile device with camera and compass.');
    }
  }, []);

  // Request camera
  useEffect(() => {
    if (!isSupported) return;

    let active = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraStream(stream);
        setPermissionState('granted');
      } catch (err) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'Camera access denied';
        setError(`Camera error: ${msg}`);
        setPermissionState('denied');
      }
    };

    startCamera();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [isSupported]);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Device orientation (compass)
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading is available on iOS
      const iosHeading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading;
      if (iosHeading !== undefined && iosHeading !== null) {
        headingRef.current = iosHeading;
        setCompassHeading(Math.round(iosHeading));
      } else if (e.alpha !== null) {
        headingRef.current = e.alpha;
        setCompassHeading(Math.round(e.alpha));
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) return;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const gp: GeoPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        userPosRef.current = gp;
        setUserPos(gp);
      },
      () => {
        // Geolocation unavailable — AR still shows decorative rings
      },
      { enableHighAccuracy: true },
    );

    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // Canvas render loop
  const renderLoop = useCallback(() => {
    if (canvasRef.current) {
      drawBlastOverlay(
        canvasRef.current,
        headingRef.current,
        userPosRef.current,
        strikePos,
        yieldKt,
      );
    }
    animFrameRef.current = requestAnimationFrame(renderLoop);
  }, [strikePos, yieldKt]);

  useEffect(() => {
    if (permissionState === 'granted') {
      animFrameRef.current = requestAnimationFrame(renderLoop);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [permissionState, renderLoop]);

  // Sync canvas size to container
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Distance for display
  const distanceKm =
    userPos && strikePos ? haversineKm(userPos, strikePos) : null;
  const bearingDisplay =
    userPos && strikePos ? Math.round(bearingDeg(userPos, strikePos)) : null;

  const yieldLabel =
    yieldKt >= 1000
      ? `${(yieldKt / 1000).toFixed(1)} Mt`
      : `${yieldKt} kt`;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ background: '#000' }}
    >
      {/* Camera video */}
      {cameraStream && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.85 }}
        />
      )}

      {/* Canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* No camera support / error fallback */}
      {(!isSupported || (permissionState === 'denied' && !cameraStream)) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-lg border p-6 max-w-sm text-center space-y-3"
            style={{
              background: 'rgba(10,10,15,0.95)',
              borderColor: '#ff4444' + '40',
            }}
          >
            <span className="text-3xl block">📷</span>
            <p
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: '#ff4444' }}
            >
              Camera Unavailable
            </p>
            <p className="font-mono text-[11px]" style={{ color: '#8b949e' }}>
              {error ??
                'AR Mode requires a mobile device with camera and compass access. Blast rings will display in simulation mode.'}
            </p>
            <p className="font-mono text-[10px]" style={{ color: '#00ff88' + '80' }}>
              Showing directional overlay based on coordinates.
            </p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: '#ff2244',
              boxShadow: '0 0 8px #ff2244',
              animation: 'pulse 1.5s infinite',
            }}
          />
          <span
            className="font-mono font-bold text-sm uppercase tracking-widest"
            style={{ color: '#e6edf3' }}
          >
            AR MODE
          </span>
        </div>
        <button
          onClick={onClose}
          className="font-mono text-sm font-bold px-3 py-1 rounded border transition-colors"
          style={{
            color: '#e6edf3',
            borderColor: '#e6edf3' + '40',
            background: 'rgba(0,0,0,0.5)',
          }}
          aria-label="Close AR Mode"
        >
          [X]
        </button>
      </div>

      {/* Compass bar */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center gap-3 py-2 px-4"
        style={{
          bottom: '140px',
          background: 'rgba(0,0,0,0.5)',
        }}
      >
        {['NW', 'W', 'SW', 'S', 'SE', 'E', 'NE', 'N', 'NE', 'E'].map((dir, i) => {
          const isNorth =
            dir === 'N' && i === 7;
          return (
            <span
              key={i}
              className="font-mono text-[10px] font-bold"
              style={{
                color: isNorth ? '#ff2244' : '#8b949e',
                opacity: isNorth ? 1 : 0.6,
              }}
            >
              {isNorth ? '◆' : '·'} {dir}
            </span>
          );
        })}
        <span
          className="font-mono text-[10px] font-bold ml-2"
          style={{ color: '#00ff88' }}
        >
          {compassHeading}°
        </span>
      </div>

      {/* Info overlay — bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 py-4 space-y-2"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
        }}
      >
        {/* Strike info */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: '#8b949e' }}
              >
                Strike:
              </span>
              <span className="font-mono text-xs font-bold" style={{ color: '#e6edf3' }}>
                {strikeLabel ??
                  (strikePos
                    ? `${strikePos.lat.toFixed(3)}°, ${strikePos.lng.toFixed(3)}°`
                    : 'No strike configured')}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs" style={{ color: '#e6edf3' }}>
                <span style={{ color: '#8b949e' }}>Yield: </span>
                {yieldLabel}
              </span>
              {distanceKm !== null && (
                <span className="font-mono text-xs" style={{ color: '#e6edf3' }}>
                  <span style={{ color: '#8b949e' }}>Dist: </span>
                  {distanceKm < 1
                    ? `${(distanceKm * 1000).toFixed(0)} m`
                    : `${distanceKm.toFixed(1)} km`}
                </span>
              )}
              {bearingDisplay !== null && (
                <span className="font-mono text-xs" style={{ color: '#e6edf3' }}>
                  <span style={{ color: '#8b949e' }}>Bearing: </span>
                  {bearingDisplay}°
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ring legend */}
        <div className="flex items-center gap-3 flex-wrap">
          {RING_STYLES.map((style, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className="w-3 h-1 rounded"
                style={{ background: style.color }}
              />
              <span className="font-mono text-[9px]" style={{ color: style.color }}>
                {style.label}
              </span>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div
          className="rounded border px-3 py-1.5"
          style={{ borderColor: '#ffbb00' + '30', background: '#ffbb00' + '08' }}
        >
          <p className="font-mono text-[9px]" style={{ color: '#8b949e' }}>
            ⚠ Educational simulation only — blast rings are approximate and not
            to scale for real-world emergency planning.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default ARMode;

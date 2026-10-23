import { useEffect, useId, useState } from "react";
import { brand } from "../../../../app/config/brand";

/**
 * Real-time Bastak school construction scene.
 * Solar lighting uses Bastak (27.2°N, 54.36°E), Asia/Tehran (UTC+03:30).
 * No weather or prayer-time API is required. Moon placement is decorative.
 */
type Rgb = [number, number, number];
type Lighting = {
  skyTop: string;
  skyBottom: string;
  haze: string;
  ground: string;
  road: string;
  night: number;
  lamps: number;
  sunX: number;
  sunY: number;
  sunAlpha: number;
  shadowDx: number;
  shadowLength: number;
  stars: number;
  elevation: number;
  label: string;
  clock: string;
};
const BASTAK_LAT = 27.2;
const BASTAK_LON = 54.36;
const TEHRAN_OFFSET_HOURS = 3.5;
const clamp = (n: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const blend = (a: Rgb, b: Rgb, t: number): Rgb =>
  a.map((x, i) => Math.round(mix(x, b[i], t))) as Rgb;
const rgb = (v: Rgb) => `rgb(${v.join(",")})`;

function getLighting(now: Date): Lighting {
  // Iran no longer observes daylight saving; Asia/Tehran is UTC+03:30.
  const local = new Date(now.getTime() + TEHRAN_OFFSET_HOURS * 3600000);
  const year = local.getUTCFullYear();
  const day =
    Math.floor(
      (Date.UTC(year, local.getUTCMonth(), local.getUTCDate()) - Date.UTC(year, 0, 1)) / 86400000,
    ) + 1;
  const hour = local.getUTCHours() + local.getUTCMinutes() / 60 + local.getUTCSeconds() / 3600;
  const gamma = ((2 * Math.PI) / 365) * (day - 1 + (hour - 12) / 24);
  // NOAA fractional-year solar approximation: equation of time and declination.
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const trueSolarMinutes = hour * 60 + eqTime + 4 * BASTAK_LON - 60 * TEHRAN_OFFSET_HOURS;
  const hourAngleDegrees = trueSolarMinutes / 4 - 180;
  const ha = (hourAngleDegrees * Math.PI) / 180;
  const lat = (BASTAK_LAT * Math.PI) / 180;
  const elevation =
    (Math.asin(Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(ha)) *
      180) /
    Math.PI;
  const morning = hourAngleDegrees < 0;

  // Continuous 10+ visual transitions based on solar altitude, not arbitrary 5 clock buckets.
  const stops: { alt: number; top: Rgb; bottom: Rgb; haze: Rgb }[] = [
    { alt: -20, top: [8, 16, 42], bottom: [19, 31, 63], haze: [25, 36, 67] },
    { alt: -13, top: [13, 25, 55], bottom: [37, 45, 83], haze: [51, 49, 79] },
    { alt: -8, top: [25, 40, 79], bottom: [104, 68, 104], haze: [118, 72, 94] },
    {
      alt: -4,
      top: [54, 67, 105],
      bottom: morning ? [190, 105, 103] : [205, 89, 92],
      haze: [219, 118, 95],
    },
    {
      alt: 0,
      top: [96, 128, 165],
      bottom: morning ? [247, 164, 115] : [249, 121, 86],
      haze: [250, 172, 119],
    },
    { alt: 5, top: [133, 187, 208], bottom: [251, 204, 145], haze: [246, 197, 135] },
    { alt: 12, top: [146, 201, 225], bottom: [243, 219, 182], haze: [233, 211, 175] },
    { alt: 25, top: [121, 193, 229], bottom: [229, 227, 205], haze: [224, 212, 173] },
    { alt: 50, top: [90, 177, 231], bottom: [203, 226, 235], haze: [226, 205, 165] },
    { alt: 90, top: [68, 160, 225], bottom: [191, 219, 239], haze: [224, 202, 163] },
  ];
  let lo = stops[0],
    hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (elevation < stops[i + 1].alt) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const t = clamp((elevation - lo.alt) / (hi.alt - lo.alt));
  const night = clamp((-elevation - 1) / 11);
  const lamps = clamp((3 - elevation) / 9);
  const shadowLength =
    clamp(70 / Math.max(0.22, Math.tan((Math.max(3, elevation) * Math.PI) / 180)), 16, 170) *
    clamp((elevation + 5) / 12);
  const sunX = 380 + clamp(hourAngleDegrees / 110, -1, 1) * 314;
  const sunY = 228 - Math.sin((clamp(elevation, 0, 85) * Math.PI) / 180) * 185;
  const hourLabel =
    elevation < -12
      ? "شب"
      : elevation < -6
        ? morning
          ? "پیش از سپیده‌دم"
          : "آغاز شب"
        : elevation < 0
          ? morning
            ? "سپیده‌دم"
            : "گرگ‌ومیش"
          : elevation < 9
            ? morning
              ? "طلوع آفتاب"
              : "غروب آفتاب"
            : elevation < 22
              ? morning
                ? "صبح زود"
                : "عصر"
              : elevation < 45
                ? morning
                  ? "صبح"
                  : "بعدازظهر"
                : "ظهر";
  return {
    skyTop: rgb(blend(lo.top, hi.top, t)),
    skyBottom: rgb(blend(lo.bottom, hi.bottom, t)),
    haze: rgb(blend(lo.haze, hi.haze, t)),
    ground: rgb(blend([222, 181, 130], [64, 69, 83], night)),
    road: rgb(blend([81, 91, 91], [25, 34, 53], night)),
    night,
    lamps,
    stars: clamp((-elevation - 4) / 10),
    elevation,
    sunX,
    sunY,
    sunAlpha: clamp((elevation + 2) / 7),
    shadowDx: (morning ? 1 : -1) * shadowLength,
    shadowLength,
    label: hourLabel,
    clock: `${String(local.getUTCHours()).padStart(2, "0")}:${String(local.getUTCMinutes()).padStart(2, "0")}`,
  };
}

export type ConstructionSceneProps = {
  /** Test a time in Bastak, e.g. 0 for midnight, 6.5 for dawn, 18 for sunset. Omit for live time. */
  previewHour?: number;
  /** Show a compact Persian local-time status inside the illustration. */
  showClock?: boolean;
};

export default function ConstructionScene({
  previewHour,
  showClock = true,
}: ConstructionSceneProps = {}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (previewHour !== undefined) return;
    const timer = window.setInterval(() => setNow(new Date()), 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(new Date());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [previewHour]);
  const displayedDate =
    previewHour === undefined
      ? now
      : (() => {
          const local = new Date(now.getTime() + TEHRAN_OFFSET_HOURS * 3600000);
          const startUtc = Date.UTC(
            local.getUTCFullYear(),
            local.getUTCMonth(),
            local.getUTCDate(),
          );
          return new Date(startUtc + previewHour * 3600000 - TEHRAN_OFFSET_HOURS * 3600000);
        })();
  const light = getLighting(displayedDate);
  const uid = useId().replace(/:/g, "");
  const ids = {
    clip: `${uid}-clip`,
    sky: `${uid}-sky`,
    sand: `${uid}-sand`,
    adobe: `${uid}-adobe`,
    door: `${uid}-door`,
    tile: `${uid}-tile`,
    sunGlow: `${uid}-sun-glow`,
    moonGlow: `${uid}-moon-glow`,
    lampGlow: `${uid}-lamp-glow`,
  };

  const archWindow = (x: number, y: number, key: string, delay: number) => (
    <g key={key}>
      <path
        d={`M${x - 2} ${y + 30}V${y + 13}Q${x - 2} ${y + 2} ${x + 11} ${y - 5}Q${x + 24} ${y + 2} ${x + 24} ${y + 13}V${y + 30}Z`}
        fill="#b77949"
      />
      <path
        d={`M${x + 1} ${y + 28}V${y + 13}Q${x + 1} ${y + 5} ${x + 11} ${y - 1}Q${x + 21} ${y + 5} ${x + 21} ${y + 13}V${y + 28}Z`}
        fill="#244c55"
        className="cs-window"
        style={{ animationDelay: `${delay}s` }}
      />
      <path d={`M${x + 11} ${y + 1}V${y + 28}`} stroke="#82bdb3" strokeWidth="1.3" opacity=".8" />
      <path d={`M${x + 2} ${y + 17}H${x + 20}`} stroke="#82bdb3" strokeWidth="1.2" opacity=".65" />
      <path
        d={`M${x - 4} ${y + 31}H${x + 26}`}
        stroke="#e9bc83"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>
  );

  const worker = (name: string, vest: string, skin: string, mirrored = false) => (
    <g className={`cs-worker cs-${name}`}>
      <ellipse rx="15" ry="3" cy="0" fill="#593b2d" opacity=".19" />
      <g transform={mirrored ? "scale(-1 1)" : undefined}>
        <g className="cs-worker-bob">
          {/* SVG transforms are handled through CSS transform-box + transform-origin. */}
          <g className="cs-leg-back">
            <path
              d="M-4-20L-5-9L-6-2"
              stroke="#344453"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M-10-1H-3" stroke="#24313d" strokeWidth="4" strokeLinecap="round" />
          </g>
          <g className="cs-leg-front">
            <path
              d="M4-20L5-9L7-2"
              stroke="#344453"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M3-1H11" stroke="#24313d" strokeWidth="4" strokeLinecap="round" />
          </g>
          <g className="cs-arm-back">
            <path
              d="M-8-43L-13-31L-10-24"
              stroke={skin}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          <path d="M-10-45Q0-49 10-45L8-20H-8Z" fill={vest} />
          <path d="M-4-44L-3-25M4-44L3-25" stroke="#f8df9a" strokeWidth="2.4" opacity=".95" />
          <path d="M-8-26H8" stroke="#f8df9a" strokeWidth="2.5" />
          <g className="cs-arm-front">
            <path
              d="M9-42L15-32L12-25"
              stroke={skin}
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          <path d="M-3-52V-46H3V-52" fill={skin} />
          <circle cy="-58" r="9" fill={skin} />
          {/* Safety helmet. No facial features. */}
          <path d="M-10-60Q-10-70 0-70Q10-70 10-60Z" fill="#eeb54d" />
          <path d="M-12-60H12" stroke="#be792e" strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
    </g>
  );

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 760 390"
      role="img"
      aria-label={`نمای متحرک ساخت ${brand.name.fa} با معماری گرم کویری ایرانی، نخل، بادگیر، جرثقیل و کارگران`}
      className="construction-scene mx-auto block h-auto w-full max-w-[760px]"
    >
      <defs>
        <clipPath id={ids.clip}>
          <rect x="12" y="2" width="736" height="380" rx="16" />
        </clipPath>
        <linearGradient id={ids.sky} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={light.skyTop} />
          <stop offset=".66" stopColor={light.skyBottom} />
          <stop offset="1" stopColor={light.skyBottom} />
        </linearGradient>
        <linearGradient id={ids.sand} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#e9c18a" />
          <stop offset="1" stopColor="#d5a46f" />
        </linearGradient>
        <linearGradient id={ids.adobe} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#efd2a1" />
          <stop offset=".54" stopColor="#ddb480" />
          <stop offset="1" stopColor="#c88f60" />
        </linearGradient>
        <linearGradient id={ids.door} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#674633" />
          <stop offset="1" stopColor="#392c2a" />
        </linearGradient>
        <radialGradient id={ids.sunGlow}>
          <stop stopColor="#ffeab2" stopOpacity=".65" />
          <stop offset="1" stopColor="#ffca75" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ids.lampGlow}>
          <stop stopColor="#fff6b8" stopOpacity=".6" />
          <stop offset="1" stopColor="#ffdb7e" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ids.moonGlow}>
          <stop stopColor="#d9e9ff" stopOpacity=".26" />
          <stop offset="1" stopColor="#d9e9ff" stopOpacity="0" />
        </radialGradient>
        <pattern id={ids.tile} width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill="#176b70" />
          <path d="M7 1L13 7L7 13L1 7Z" fill="none" stroke="#a7ddd0" strokeWidth="1.3" />
          <circle cx="7" cy="7" r="1.7" fill="#efcb7c" />
        </pattern>
      </defs>

      <g clipPath={`url(#${ids.clip})`}>
        {/* Warm desert sky and distant mountains */}
        <rect x="12" y="2" width="736" height="380" fill={`url(#${ids.sky})`} />
        {/* Celestial positions are local-solar-time driven. */}
        <g opacity={light.sunAlpha}>
          <circle cx={light.sunX} cy={light.sunY} r="85" fill={`url(#${ids.sunGlow})`} />
          <circle cx={light.sunX} cy={light.sunY} r="23" fill="#ffe5a3" />
        </g>
        <g opacity={light.stars}>
          {Array.from({ length: 32 }, (_, i) => {
            const x = 33 + ((i * 119) % 687);
            const y = 14 + ((i * 47) % 160);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={i % 4 === 0 ? 1.5 : 0.8}
                fill="#e5efff"
                opacity={0.5 + (i % 4) * 0.13}
              />
            );
          })}
          <circle cx="126" cy="65" r="39" fill={`url(#${ids.moonGlow})`} />
          <circle cx="126" cy="65" r="15" fill="#e3eafb" />
          <circle cx="132" cy="59" r="15" fill={light.skyTop} />
        </g>
        <g className="cs-cloud" opacity={0.38 * (1 - light.night * 0.7)} fill="#fff8e6">
          <ellipse cx="162" cy="53" rx="41" ry="9" />
          <circle cx="151" cy="46" r="15" />
          <circle cx="177" cy="48" r="12" />
        </g>
        <g className="cs-cloud cs-cloud-two" opacity={0.4 * (1 - light.night * 0.7)} fill="#fff8e6">
          <ellipse cx="588" cy="80" rx="40" ry="9" />
          <circle cx="575" cy="73" r="15" />
          <circle cx="599" cy="74" r="12" />
        </g>
        <path
          d="M12 218L90 167L154 203L238 165L312 211L391 176L482 221L572 168L651 205L715 173L748 205V292H12Z"
          fill="#c58b65"
          opacity=".23"
        />
        <path
          d="M12 246L93 209L180 234L284 210L377 244L498 210L598 242L698 211L748 226V305H12Z"
          fill="#b57f5b"
          opacity=".17"
        />

        {/* Courtyard surface and masonry outline */}
        <rect x="12" y="287" width="736" height="39" fill={light.ground} />
        <path d="M12 287H748" stroke="#ad7e56" strokeWidth="2" opacity=".6" />
        <path
          d="M40 312H720"
          stroke="#f7dfb4"
          strokeWidth="2"
          strokeDasharray="26 12"
          opacity=".4"
        />

        {/* Solar-projected building and palm shadows: short at noon, long at low sun. */}
        <g opacity={(1 - light.night) * 0.21} fill="#523e34" pointerEvents="none">
          <path
            d={`M208 288H497L${497 + light.shadowDx} ${288 + Math.min(35, light.shadowLength * 0.24)}H${208 + light.shadowDx}Z`}
          />
          <path
            d={`M146 290L${146 + light.shadowDx * 0.8} ${290 + Math.min(35, light.shadowLength * 0.22)}L${153 + light.shadowDx * 0.8} ${292 + Math.min(35, light.shadowLength * 0.22)}Z`}
          />
          <path
            d={`M582 290L${582 + light.shadowDx * 0.8} ${290 + Math.min(35, light.shadowLength * 0.22)}L${589 + light.shadowDx * 0.8} ${292 + Math.min(35, light.shadowLength * 0.22)}Z`}
          />
        </g>
        {/* Scaffolding, positioned BEHIND the school */}
        <g stroke="#8a705a" strokeWidth="2.6" opacity=".55" fill="none">
          {[202, 244, 286, 328, 370, 412, 454].map((x) => (
            <path key={x} d={`M${x} 126V288`} />
          ))}
          {[130, 170, 210, 250, 286].map((y) => (
            <path key={y} d={`M196 ${y}H460`} />
          ))}
          <path d="M202 130L244 170L202 210L244 250M454 130L412 170L454 210L412 250" />
        </g>

        {/* Small side settlements, inspired by adobe desert architecture */}
        <g opacity=".6">
          <rect x="43" y="238" width="92" height="50" fill="#d3a577" />
          <path d="M38 237H139" stroke="#a97850" strokeWidth="6" />
          <path d="M57 257Q70 237 83 257V284H57Z" fill="#9b6d50" />
          <rect x="621" y="226" width="105" height="62" fill="#d3a577" />
          <path d="M617 226H730" stroke="#a97850" strokeWidth="6" />
          <path d="M660 250Q676 226 692 250V285H660Z" fill="#996a4e" />
        </g>

        {/* School building: sand-colored adobe, windcatcher, tilework, iwans */}
        <g className="cs-building">
          <ellipse cx="334" cy="292" rx="145" ry="9" fill="#704b37" opacity=".15" />

          {/* Windcatcher (badgir) on left roof */}
          <g>
            <rect x="239" y="74" width="46" height="67" fill="#d7a374" />
            <path d="M235 72H289V80H235Z" fill="#a97652" />
            <path d="M245 91H280" stroke="#efd2a1" strokeWidth="2" />
            {[249, 260, 271].map((x) => (
              <rect key={x} x={x} y="94" width="7" height="27" rx="1" fill="#5e5149" />
            ))}
            <path d="M243 127H281" stroke="#996c50" strokeWidth="4" />
            <path d="M240 69L262 56L286 69Z" fill="#bd895b" />
            <path d="M260 58V72" stroke="#f0d1a5" strokeWidth="2" />
          </g>

          {/* Right rectangular tower with traditional crescent finial */}
          <g>
            <rect x="461" y="141" width="48" height="147" fill="#cf9b6b" />
            <path
              d="M463 152H507M463 183H507M463 215H507M463 248H507"
              stroke="#a8754f"
              strokeOpacity=".35"
            />
            <rect x="457" y="132" width="56" height="13" fill="#ac7854" />
            {[466, 482, 498].map((x) => (
              <rect key={x} x={x} y="124" width="11" height="9" fill="#c18d60" />
            ))}
            <rect x="471" y="185" width="28" height="11" fill={`url(#${ids.tile})`} />
            {[207, 245].map((y) => (
              <path
                key={y}
                d={`M477 ${y + 19}V${y + 6}Q485 ${y - 4} 493 ${y + 6}V${y + 19}Z`}
                fill="#244c55"
              />
            ))}
            <path d="M485 124V96" stroke="#916748" strokeWidth="3" />
            <path d="M485 78A12 12 0 1 0 494 98A10 10 0 1 1 485 78Z" fill="#f8dc98" />
          </g>
          {/* Adobe facade and subtle horizontal brick courses */}
          <rect x="213" y="141" width="243" height="147" rx="2" fill={`url(#${ids.adobe})`} />
          {[161, 194, 227, 259].map((y) => (
            <path key={y} d={`M218 ${y}H451`} stroke="#a8754f" strokeWidth="1.1" opacity=".15" />
          ))}
          <path d="M222 149V286M447 149V286" stroke="#ffdfb3" strokeWidth="3" opacity=".65" />
          <rect x="208" y="135" width="253" height="13" rx="2" fill="#ad7651" />
          <path d="M210 135H460" stroke="#f7dfb4" strokeWidth="2" />

          {/* Adobe roof merlons */}
          {Array.from({ length: 10 }, (_, i) => (
            <path key={i} d={`M${216 + i * 24} 135V128H${230 + i * 24}V135Z`} fill="#ba875c" />
          ))}

          {/* Decorative central parapet */}
          <path d="M288 136V117Q288 108 297 105H371Q380 108 380 117V136Z" fill="#b9855b" />
          <path d="M294 133V118Q294 112 302 111H366Q374 112 374 118V133Z" fill="#e2b783" />
          <path d="M304 133V118H364V133" fill="#176b70" />

          {/* Persian school sign: displayed as real SVG text */}
          <g className="cs-sign">
            <rect
              x="229"
              y="149"
              width="211"
              height="29"
              rx="3"
              fill="#f7e6bd"
              stroke="#a66d46"
              strokeWidth="2"
            />
            <path d="M234 154H435M234 173H435" stroke="#c18b5e" strokeWidth="1" />
            <path d="M241 163l5-5 5 5-5 5ZM419 163l5-5 5 5-5 5Z" fill="#08767b" />
            <text
              x="334.5"
              y="167.5"
              textAnchor="middle"
              fontSize="12.6"
              fontWeight="800"
              fill="#513e31"
              direction="rtl"
              unicodeBidi="plaintext"
              style={{ fontFamily: 'Vazirmatn, "Noto Naskh Arabic", Tahoma, sans-serif' }}
            >
              {brand.name.fa}
            </text>
          </g>

          {/* Full-width turquoise geometric tile frieze */}
          <rect x="222" y="182" width="225" height="13" fill={`url(#${ids.tile})`} />
          <path d="M222 181H447M222 195H447" stroke="#f6e2b4" strokeWidth="2" />

          {/* Window openings on both sides, clear of central iwan */}
          {[232, 269, 376, 413].map((x, i) => archWindow(x, 211, `upper-${i}`, i * 0.22))}
          {[232, 269, 376, 413].map((x, i) => archWindow(x, 251, `lower-${i}`, (i + 4) * 0.22))}

          {/* Main pishtaq / iwan: tall recessed pointed portal */}
          <path d="M296 288V223Q296 202 334 193Q372 202 372 223V288Z" fill="#ac7452" />
          <path d="M301 288V225Q301 207 334 199Q367 207 367 225V288Z" fill={`url(#${ids.tile})`} />
          <path d="M307 288V228Q307 214 334 207Q361 214 361 228V288Z" fill="#edc997" />
          <path d="M313 288V237Q313 224 334 216Q355 224 355 237V288Z" fill={`url(#${ids.door})`} />
          <path d="M334 217V288" stroke="#ab7958" strokeWidth="2" />
          <path d="M316 241Q334 227 352 241" fill="none" stroke="#d7a96e" strokeWidth="1.5" />
          <circle cx="330" cy="264" r="2" fill="#edc27e" />
          <circle cx="338" cy="264" r="2" fill="#edc27e" />
          <path
            d="M295 288V224Q295 202 334 192Q373 202 373 224V288"
            fill="none"
            stroke="#f4dfb4"
            strokeWidth="3"
          />
          <rect x="206" y="286" width="257" height="5" rx="1" fill="#9f7256" />
          <path d="M313 290H355L363 295H305Z" fill="#caa078" />
        </g>

        {/* Palm trees, signature feature of warm southern Iranian landscapes */}
        <g transform="translate(146 290)" className="cs-palm">
          <path
            d="M0 0Q-7-46 7-100"
            stroke="#95633f"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M3-101Q-41-127-71-103Q-44-112-5-91M4-102Q-18-143-42-144Q-16-133 8-93M6-101Q39-135 75-118Q45-123 12-91M6-100Q47-94 61-72Q32-88 7-91M7-102Q7-143 20-151Q21-119 10-90"
            fill="#2b7c51"
            stroke="#256a44"
            strokeWidth="2"
          />
          <path d="M-2-85l14-9" stroke="#c38b56" strokeWidth="2" />
        </g>
        <g transform="translate(582 289) scale(.82)" className="cs-palm cs-palm-two">
          <path
            d="M0 0Q6-44-7-98"
            stroke="#95633f"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M-7-99Q-44-132-69-114Q-41-120-7-88M-7-99Q0-145-18-149Q-5-121-7-91M-8-99Q33-137 64-124Q40-125-6-89M-7-99Q38-92 61-69Q24-85-7-89M-7-100Q10-138 29-139Q10-116-6-91"
            fill="#327b4b"
            stroke="#256a44"
            strokeWidth="2"
          />
        </g>

        {/* Crane and cable; animation moves cable and load together */}
        <g stroke="#c88736" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M537 290V44" strokeWidth="9" />
          <path d="M537 47H666M537 47H352" strokeWidth="8" />
          <path d="M537 47L449 18L352 47M537 47L613 18L666 47" strokeWidth="3.6" />
          {[74, 110, 146, 182, 218, 254].map((y) => (
            <path key={y} d={`M533 ${y}l8 36m0 -36l-8 36`} strokeWidth="2" opacity=".75" />
          ))}
          <path d="M537 37V20" strokeWidth="6" />
        </g>
        <rect x="525" y="24" width="25" height="18" rx="3" fill="#f1b955" />
        <g className="cs-load">
          <path d="M398 48V112" stroke="#635b51" strokeWidth="2.5" strokeDasharray="5 3" />
          <path
            d="M398 112L381 133M398 112L415 133"
            stroke="#635b51"
            strokeWidth="2.5"
            fill="none"
          />
          <rect x="368" y="132" width="60" height="24" rx="3" fill="#d99b4e" />
          <path d="M374 139H422M374 148H422" stroke="#f6d69e" strokeWidth="2" />
        </g>

        {/* Safety equipment */}
        <g>
          <rect x="59" y="276" width="73" height="12" rx="2" fill="#df9b51" />
          {[68, 89, 110].map((x) => (
            <path key={x} d={`M${x} 276l-8 12`} stroke="#fff2cf" strokeWidth="5" />
          ))}
          <path d="M69 288v20m54-20v20" stroke="#756251" strokeWidth="5" />
          {[184, 607].map((x) => (
            <g key={x}>
              <path d={`M${x} 311l10-27 10 27Z`} fill="#e18a40" />
              <path d={`M${x + 5} 300h10`} stroke="#fff6e5" strokeWidth="3" />
              <path d={`M${x - 3} 312h26`} stroke="#594d42" strokeWidth="4" />
            </g>
          ))}
        </g>

        {/* Workers walk along ground with alternating arms/legs */}
        {worker("one", "#15876e", "#d9a87e")}
        {worker("two", "#477ea1", "#c58f6b", true)}

        {/* Foreground road */}
        <rect x="12" y="326" width="736" height="56" fill={light.road} />
        <path d="M12 326H748" stroke="#d6b98a" strokeWidth="3" />
        <path
          d="M23 355H736"
          stroke="#fff0cf"
          strokeWidth="2.5"
          strokeDasharray="31 25"
          opacity=".7"
        />

        {/* Truck faces LEFT, moving right to left */}
        <g className="cs-truck">
          <rect x="0" y="2" width="155" height="5" rx="2" fill="#5d5752" />
          <path d="M5-22H43V4H0V-12L5-22Z" fill="#cf8942" />
          <path d="M9-19H30V-7H3V-12Z" fill="#bfe5e6" />
          <rect x="-5" y="-3" width="10" height="6" rx="2" fill="#716a60" />
          <rect x="-2" y="-13" width="5" height="6" rx="1" fill="#fff0a6" />
          <rect x="43" y="-29" width="112" height="33" rx="4" fill="#d6a268" />
          <path d="M50-23H148M50-4H148" stroke="#edc58d" strokeWidth="2" />
          {[23, 72, 135].map((x) => (
            <g key={x}>
              <circle cx={x} cy="6" r="10" fill="#252f33" />
              <circle cx={x} cy="6" r="4" fill="#a3a29b" />
            </g>
          ))}
        </g>

        {/* Passenger vehicle faces RIGHT, moving left to right */}
        <g className="cs-car">
          <path d="M1-9h19l14-17h42l17 17h15a8 8 0 0 1 8 8V7H-4V0a9 9 0 0 1 5-9Z" fill="#237c74" />
          <path d="M35-22h38l11 13H24Z" fill="#c4ede0" />
          <path d="M55-22v13" stroke="#176b65" strokeWidth="2" />
          <rect x="-4" y="3" width="120" height="5" rx="2" fill="#175f5d" />
          {[24, 91].map((x) => (
            <g key={x}>
              <circle cx={x} cy="7" r="10" fill="#252f33" />
              <circle cx={x} cy="7" r="4" fill="#a3a29b" />
            </g>
          ))}
          <rect x="110" y="-4" width="6" height="5" rx="1" fill="#fff1ad" />
        </g>
        {/* Night darkening, applied across all objects, below artificial lights. */}
        <rect
          x="12"
          y="2"
          width="736"
          height="380"
          fill="#06142c"
          opacity={light.night * 0.53}
          pointerEvents="none"
        />

        {/* Facade windows turn on progressively as the sun sets. */}
        <g opacity={light.lamps} pointerEvents="none">
          {[232, 269, 376, 413].flatMap((x, i) =>
            [211, 251].map((y, j) => (
              <g key={`${i}-${j}`} opacity={0.65 + ((i + j) % 3) * 0.15}>
                <path
                  d={`M${x + 2} ${y + 26}V${y + 14}Q${x + 2} ${y + 8} ${x + 11} ${y + 3}Q${x + 20} ${y + 8} ${x + 20} ${y + 14}V${y + 26}Z`}
                  fill="#ffda8d"
                />
                <path d={`M${x + 11} ${y + 4}V${y + 26}`} stroke="#906444" strokeWidth="1.4" />
              </g>
            )),
          )}
          {[207, 245].map((y) => (
            <path
              key={y}
              d={`M479 ${y + 17}V${y + 8}Q485 ${y + 1} 491 ${y + 8}V${y + 17}Z`}
              fill="#ffd57b"
            />
          ))}
          <ellipse cx="333" cy="285" rx="57" ry="9" fill="#ffe29c" opacity=".35" />
          <path d="M316 239Q334 217 352 239V284H316Z" fill="#df9c47" opacity=".18" />
        </g>

        {/* Street lamps with real-time halos and cast pools of light. */}
        {[173, 617].map((x, i) => (
          <g key={x} pointerEvents="none">
            <path
              d={`M${x} 325V${i ? 217 : 225}Q${x} ${i ? 207 : 215} ${x + (i ? -16 : 16)} ${i ? 207 : 215}`}
              stroke={light.night > 0.5 ? "#72839b" : "#786b5a"}
              strokeWidth="4"
              fill="none"
            />
            <path d={`M${x + (i ? -24 : 10)} ${i ? 208 : 216}h16v7h-16Z`} fill="#344b5d" />
            <ellipse
              cx={x}
              cy="322"
              rx="50"
              ry="12"
              fill={`url(#${ids.lampGlow})`}
              opacity={light.lamps * 0.75}
            />
            <circle
              cx={x + (i ? -16 : 18)}
              cy={i ? 216 : 224}
              r="47"
              fill={`url(#${ids.lampGlow})`}
              opacity={light.lamps}
            />
            <path
              d={`M${x + (i ? -24 : 10)} ${i ? 215 : 223}h16`}
              stroke="#fff0ab"
              strokeWidth="3"
              opacity={light.lamps}
            />
          </g>
        ))}

        {/* Vehicle headlights and beam cones appear at night, moving with the cars. */}
        <g className="cs-truck" pointerEvents="none" opacity={light.lamps}>
          <path d="M0-12L-88-40V22L0-8Z" fill="#ffe8ab" opacity=".25" />
          <circle cx="-1" cy="-11" r="5" fill="#fff9ce" />
        </g>
        <g className="cs-car" pointerEvents="none" opacity={light.lamps}>
          <path d="M110-4L200-33V25L110 0Z" fill="#fff2bb" opacity=".22" />
          <circle cx="114" cy="-3" r="4" fill="#fff6c0" />
        </g>

        {/* Interactive-time debugging label can be hidden in production. */}
        {showClock && (
          <g>
            <rect x="24" y="14" width="170" height="28" rx="12" fill="#12223b" opacity=".82" />
            <text
              x="109"
              y="32"
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#f9eacf"
              style={{ fontFamily: "Vazirmatn, Tahoma, sans-serif" }}
            >
              {light.clock} | {light.label} · بستک
            </text>
          </g>
        )}
      </g>

      <style>{`
        .construction-scene .cs-cloud { animation: cs-drift 10s ease-in-out infinite alternate; }
        .construction-scene .cs-cloud-two { animation-duration: 13s; animation-direction: alternate-reverse; }
        .construction-scene .cs-building { transform-box: fill-box; transform-origin: center bottom; animation: cs-build 1.5s cubic-bezier(.2,.8,.2,1) both; }
        .construction-scene .cs-window { animation: cs-light 3.5s ease-in-out infinite; }
        .construction-scene .cs-load { animation: cs-hoist 5s ease-in-out infinite; }
        .construction-scene .cs-palm { transform-box: fill-box; transform-origin: center bottom; animation: cs-palm-sway 5s ease-in-out infinite alternate; }
        .construction-scene .cs-palm-two { animation-delay: -2s; }
        .construction-scene .cs-sign { animation: cs-sign-glow 4.5s ease-in-out infinite; }
        .construction-scene .cs-one { animation: cs-walk-one 13s linear infinite; }
        .construction-scene .cs-two { animation: cs-walk-two 16s linear infinite; }
        .construction-scene .cs-worker-bob { animation: cs-step .64s ease-in-out infinite; }
        .construction-scene .cs-two .cs-worker-bob { animation-delay: -.32s; }
        .construction-scene .cs-leg-front, .construction-scene .cs-leg-back,
        .construction-scene .cs-arm-front, .construction-scene .cs-arm-back {
          transform-box: view-box;
          animation-duration: .64s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
        .construction-scene .cs-leg-front { transform-origin: 4px -20px; animation-name: cs-swing-forward; }
        .construction-scene .cs-leg-back { transform-origin: -4px -20px; animation-name: cs-swing-backward; }
        .construction-scene .cs-arm-front { transform-origin: 9px -42px; animation-name: cs-swing-backward; }
        .construction-scene .cs-arm-back { transform-origin: -8px -43px; animation-name: cs-swing-forward; }
        .construction-scene .cs-two .cs-leg-front, .construction-scene .cs-two .cs-leg-back,
        .construction-scene .cs-two .cs-arm-front, .construction-scene .cs-two .cs-arm-back { animation-delay: -.32s; }
        .construction-scene .cs-truck { animation: cs-truck-move 10s linear infinite; }
        .construction-scene .cs-car { animation: cs-car-move 8s linear infinite; }
        @keyframes cs-drift { to { transform: translateX(25px); } }
        @keyframes cs-build { from { opacity: 0; transform: translateY(30px) scaleY(.84); } to { opacity: 1; transform: translateY(0) scaleY(1); } }
        @keyframes cs-light { 0%,100% { opacity: .8; } 50% { opacity: 1; } }
        @keyframes cs-hoist { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-31px); } }
        @keyframes cs-palm-sway { from { rotate: -1.3deg; } to { rotate: 1.3deg; } }
        @keyframes cs-sign-glow { 0%,100% { filter: drop-shadow(0 0 0 transparent); } 50% { filter: drop-shadow(0 0 3px rgba(245,186,85,.55)); } }
        @keyframes cs-step { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes cs-swing-forward { 0%,100% { transform: rotate(-23deg); } 50% { transform: rotate(23deg); } }
        @keyframes cs-swing-backward { 0%,100% { transform: rotate(23deg); } 50% { transform: rotate(-23deg); } }
        @keyframes cs-walk-one { 0% { transform: translate(65px,310px); opacity:0; } 7%,93% { opacity:1; } 100% { transform:translate(620px,310px); opacity:0; } }
        @keyframes cs-walk-two { 0% { transform: translate(680px,310px); opacity:0; } 7%,93% { opacity:1; } 100% { transform:translate(140px,310px); opacity:0; } }
        @keyframes cs-truck-move { 0% { transform: translate(780px,343px); opacity:0; } 6%,94% { opacity:1; } 100% { transform:translate(-180px,343px); opacity:0; } }
        @keyframes cs-car-move { 0% { transform: translate(-150px,374px); opacity:0; } 6%,94% { opacity:1; } 100% { transform:translate(800px,374px); opacity:0; } }
        @media (prefers-reduced-motion: reduce) {
          .construction-scene * { animation: none !important; }
          .construction-scene .cs-one { transform: translate(100px,310px); }
          .construction-scene .cs-two { transform: translate(625px,310px); }
          .construction-scene .cs-truck { transform: translate(105px,343px); }
          .construction-scene .cs-car { transform: translate(465px,374px); }
        }
      `}</style>
    </svg>
  );
}

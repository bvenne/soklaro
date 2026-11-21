import { interpretWmo } from '@/lib/weather/wmo';

const cloudShape = 'M17 43h30a9 9 0 0 0 0-18h-2a13 13 0 0 0-24-3 10.5 10.5 0 0 0-4 21Z';

function Snowflake({ x, y, size = 1 }: { x: number; y: number; size?: number }) {
  const shape = 'M0-7V7M-6-3.5l12 7M-6 3.5l12-7M-2-5l2 2 2-2M-2 5l2-2 2 2';
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`} strokeLinecap="round" strokeLinejoin="round">
      <path d={shape} stroke="#616d74" strokeWidth="4" />
      <path d={shape} stroke="#fff" strokeWidth="2.4" />
    </g>
  );
}

/** Full-color symbols for the light theme. */
export function ColorWeatherIcon({
  code,
  isDay = true,
  sunShowers = false,
}: {
  code: number;
  isDay?: boolean;
  sunShowers?: boolean;
}) {
  const { kind } = interpretWmo(code);
  const clear = kind === 'clear';
  const showSunOrMoon = clear || kind === 'mostly-clear' || kind === 'partly-cloudy' || sunShowers;
  const storm = kind === 'thunderstorm' || kind === 'extreme';
  const fog = kind === 'fog';
  const layeredCloud = kind === 'overcast' || kind === 'showers' || kind === 'snow-showers';
  const cloudOffset = kind === 'mostly-clear' ? 'translate(11 11) scale(.78)'
    : kind === 'partly-cloudy' ? 'translate(2 5)'
    : kind === 'overcast' ? 'translate(0 4)'
    : 'translate(0 -3)';

  return (
    <svg className="color-weather-icon" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
      {showSunOrMoon && (isDay ? (
        <g transform={clear ? 'translate(3 5) scale(1.25)' : undefined} stroke="#b4740c" strokeWidth="2.6" strokeLinecap="round">
          <path d="M23 3v4m0 27v4M6 21h4m26 0h4M11 9l3 3m18 18 3 3m0-24-3 3M14 30l-3 3" />
          <circle cx="23" cy="21" r="9.5" fill="#ffcc4b" />
        </g>
      ) : (
        <path
          d="M23 4a16 16 0 1 0 16 23A15 15 0 0 1 23 4Z"
          transform={clear ? 'translate(4 9) scale(1.18)' : undefined}
          fill="#909be1" stroke="#4c5a9b" strokeWidth="2.2" strokeLinejoin="round"
        />
      ))}

      {layeredCloud && (
        <path d="M29 30h23a8 8 0 0 0 0-16h-4a11 11 0 0 0-20 3" fill="#b1c6d3" stroke="#587684" strokeWidth="2.2" strokeLinejoin="round" />
      )}
      {!clear && kind !== 'fallback' && (
        <path
          d={cloudShape}
          transform={cloudOffset}
          fill={storm ? '#9bacc4' : layeredCloud ? '#aec7d5' : '#dfecf2'}
          stroke={storm ? '#4d5472' : '#587684'}
          strokeWidth="2.3"
          strokeLinejoin="round"
        />
      )}

      {fog && (
        <>
          <path d="M11 46h42M16 52h32M21 58h22" stroke="#526d7b" strokeWidth="2.7" strokeLinecap="round" />
          {code === 48 && <Snowflake x={53} y={55} size={0.75} />}
        </>
      )}
      {kind === 'drizzle' && (
        <path d="M21 46l-2 2m12-2-2 2m12-2-2 2m-14 5-2 2m12-2-2 2m12-2-2 2" stroke="#277ca7" strokeWidth="2.7" strokeLinecap="round" />
      )}
      {kind === 'rain' && (
        <path d="M22 44c-1 3-4 6-4 8a4 4 0 0 0 8 0c0-2-3-5-4-8Zm10 4c-1 3-4 6-4 8a4 4 0 0 0 8 0c0-2-3-5-4-8Zm10-4c-1 3-4 6-4 8a4 4 0 0 0 8 0c0-2-3-5-4-8Z" fill="#4da4d1" stroke="#176487" strokeWidth="1.6" />
      )}
      {kind === 'showers' && (
        <path d="M21 46l-6 10m17-11-7 13m18-12-6 10m16-11-7 13" stroke="#176994" strokeWidth="3.3" strokeLinecap="round" />
      )}
      {kind === 'freezing' && (
        <>
          <path d="M23 44c-1 3-5 7-5 10a5 5 0 0 0 10 0c0-3-4-7-5-10Z" fill="#888ed0" stroke="#525b99" strokeWidth="1.8" />
          <Snowflake x={42} y={52} />
        </>
      )}
      {kind === 'snow' && (code === 77 ? (
        <path d="m21 44 3 3-3 3-3-3Zm11 4 3 3-3 3-3-3Zm11-4 3 3-3 3-3-3Zm-20 9 3 3-3 3-3-3Zm17 0 3 3-3 3-3-3Z" fill="#fff" stroke="#616d74" strokeWidth="1.5" strokeLinejoin="round" />
      ) : (
        <>
          <Snowflake x={22} y={52} />
          <Snowflake x={42} y={52} />
        </>
      ))}
      {kind === 'snow-showers' && (
        <>
          <Snowflake x={18} y={49} size={0.82} />
          <Snowflake x={32} y={55} size={0.82} />
          <Snowflake x={46} y={49} size={0.82} />
        </>
      )}
      {storm && (
        <path d="M33 36 24 50h8l-4 11 15-17h-9l6-8Z" fill="#ffcb48" stroke="#986309" strokeWidth="1.8" strokeLinejoin="round" />
      )}
      {kind === 'extreme' && (
        <g fill="#bec1e3" stroke="#535986" strokeWidth="1.7">
          <rect x="12" y="49" width="6" height="6" rx="1.5" />
          <rect x="46" y="49" width="6" height="6" rx="1.5" />
          <rect x="40" y="56" width="6" height="6" rx="1.5" />
        </g>
      )}
      {kind === 'fallback' && (
        <g stroke="#587684" strokeWidth="2.5" strokeLinecap="round">
          <circle cx="32" cy="32" r="18" fill="#e8f0f3" />
          <path d="M26 26a6 6 0 1 1 9 5c-2 1-3 2-3 5m0 5v.2" />
        </g>
      )}
    </svg>
  );
}

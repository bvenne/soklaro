'use client';
import { useLocale } from '@/lib/i18n/use-locale';
import { setAppTheme, useAppTheme, type AppTheme } from '@/lib/theme';

import { lazy, Suspense, useEffect, useEffectEvent, useRef, useState } from 'react';
import { Radar } from 'lucide-react';
import { ArrowLeft, ChevronDown, CloudSunRain, Cloud, CloudRain, CloudSun, Droplets, Gauge, LocateFixed, MapPin, Menu, RefreshCw, Search, Sun, Sunrise, Sunset, Wind, X } from 'lucide-react';
import { SoklaroMark } from '@/app/components/soklaro-mark';
import { ColorWeatherIcon } from '@/app/components/color-weather-icon';
import { ThemeColor } from '@/app/components/theme-color';
import { useWeatherPhoto } from '@/app/components/use-weather-photo';
import { backgroundFor, interpretWmo, statusBarColorFor } from '@/lib/weather/wmo';
import { clearLocalData, forgetPlace, readCachedForecast, readGeolocationDefault, readLastPlace, readLocationPrecisionDefault, readSavedPlaces, rememberPlace, saveLastPlace, setGeolocationDefault, setLocationPrecisionDefault } from '@/lib/weather/cache';
import { loadForecast } from '@/lib/weather/load-forecast';
import type { WeatherFailure } from '@/lib/weather/request-error';
import { requestLocation, roundCoordinates, type GeolocationResult, type LocationPrecision } from '@/lib/weather/geolocation';
import { daySummary, sunProgress } from '@/lib/weather/day-summary';
import { hourSummary } from '@/lib/weather/hour-summary';
import { periodSummaries } from '@/lib/weather/period-summary';
import { deriveInsight } from '@/lib/weather/insights';
import { hamburg, mockForecast } from '@/lib/weather/mock';
import { setWeatherPhotosEnabled, useWeatherPhotosEnabled } from '@/lib/weather/photo-preference';
import { OpenMeteoGeocodingProvider, OpenMeteoWeatherProvider } from '@/lib/weather/open-meteo';
import { reverseGeocode } from '@/lib/weather/reverse-geocoding';
import type { Place, WeatherForecast } from '@/lib/weather/types';
import { InstallPrompt } from './install-prompt';
import { PwaRegister } from './pwa-register';
import { SettingsPanel } from './settings-panel';
import { WiCloudy, WiDayCloudy, WiDaySunny, WiDaySunnyOvercast, WiFog, WiNa, WiNightClear, WiNightCloudy, WiNightFog, WiNightPartlyCloudy, WiNightRain, WiNightShowers, WiNightSnow, WiNightSprinkle, WiNightThunderstorm, WiRain, WiShowers, WiSleet, WiSnow, WiSprinkle, WiStormShowers, WiThunderstorm } from 'react-icons/wi';

const weatherProvider = new OpenMeteoWeatherProvider();
const RainRadar = lazy(() => import('@/app/components/rain-radar'));
const geocodingProvider = new OpenMeteoGeocodingProvider();
const failureMessages: Record<WeatherFailure, string> = {
  timeout: 'Die Wetteranfrage dauert zu lange. Bitte erneut versuchen.',
  network: 'Verbindung zum Wetterdienst fehlgeschlagen. Bitte erneut versuchen.',
  'rate-limit': 'Der Wetterdienst erhält zu viele Anfragen. Bitte später erneut versuchen.',
  http: 'Der Wetterdienst ist derzeit nicht verfügbar. Bitte später erneut versuchen.',
  'invalid-data': 'Die Antwort des Wetterdienstes konnte nicht gelesen werden.',
};

function localIsoMinute(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}`;
}

function WeatherBackdrop({ forecast }: { forecast: WeatherForecast }) {
  const { kind } = interpretWmo(forecast.current.weatherCode);
  const period = forecast.current.isDay ? 'day' : 'night';
  return (
    <picture className="weather-backdrop" aria-hidden="true">
      <source type="image/avif" srcSet={`/weather/${kind}-${period}-640.avif 640w, /weather/${kind}-${period}-1280.avif 1280w, /weather/${kind}-${period}-1920.avif 1920w`} sizes="100vw" />
      <source type="image/webp" srcSet={`/weather/${kind}-${period}-640.webp 640w, /weather/${kind}-${period}-1280.webp 1280w, /weather/${kind}-${period}-1920.webp 1920w`} sizes="100vw" />
      <img src={backgroundFor(forecast.current.weatherCode, forecast.current.isDay)} alt="" fetchPriority="high" />
    </picture>
  );
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <button className="icon-button" aria-label={label} title={label} onClick={onClick}>{children}</button>;
}

function SearchPanel({ onSelect, onClose }: { onSelect: (place: Place) => void; onClose: () => void }) {
  const { t, locale } = useLocale();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      controller.current?.abort(); controller.current = new AbortController(); setBusy(true);
      try { setResults(await geocodingProvider.search(query, controller.current.signal)); } catch { setResults([]); } finally { setBusy(false); }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, locale]);
  return (
    <div className="search-panel" role="dialog" aria-modal="true" aria-labelledby="search-title">
      <div className="search-head"><IconButton label={t("Suche schließen")} onClick={onClose}><ArrowLeft /></IconButton><h2 id="search-title">{t("Ort suchen")}</h2></div>
      <label className="search-box"><Search aria-hidden="true" /><span className="sr-only">{t("Stadt oder Ort")}</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Stadt oder Ort")} /><button aria-label={t("Eingabe löschen")} onClick={() => setQuery('')}><X /></button></label>
      <p className="search-privacy">{t("Die Suche überträgt nur deinen Suchbegriff an Open‑Meteo. Keine Werbung, kein Profiling.")}</p>
      <div className="search-results" aria-live="polite">
        {busy && <p>{t("Suche läuft …")}</p>}
        {!busy && query.length >= 2 && results.length === 0 && <p>{t("Kein passender Ort gefunden.")}</p>}
        {results.map((place) => <button key={place.id} onClick={() => onSelect(place)}><MapPin aria-hidden="true" /><span><strong>{place.name}</strong><small>{[place.admin, place.country].filter(Boolean).join(', ')}</small></span></button>)}
      </div>
    </div>
  );
}

function DataPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="data-pill"><span aria-hidden="true">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function WeatherIcon({ code, isDay = true, theme, sunShowers = false }: { code: number; isDay?: boolean; theme: AppTheme; sunShowers?: boolean }) {
  if (theme === 'light') return <ColorWeatherIcon code={code} isDay={isDay} sunShowers={sunShowers} />;
  if (sunShowers) return <CloudSunRain aria-hidden="true" />;
  const kind = interpretWmo(code).kind;
  const icons = {
    clear: isDay ? WiDaySunny : WiNightClear,
    'mostly-clear': isDay ? WiDaySunnyOvercast : WiNightPartlyCloudy,
    'partly-cloudy': isDay ? WiDayCloudy : WiNightCloudy,
    overcast: WiCloudy,
    fog: isDay ? WiFog : WiNightFog,
    drizzle: isDay ? WiSprinkle : WiNightSprinkle,
    rain: isDay ? WiRain : WiNightRain,
    showers: isDay ? WiShowers : WiNightShowers,
    thunderstorm: isDay ? WiThunderstorm : WiNightThunderstorm,
    snow: isDay ? WiSnow : WiNightSnow,
    'snow-showers': isDay ? WiSnow : WiNightSnow,
    freezing: WiSleet,
    extreme: WiStormShowers,
    fallback: WiNa,
  } as const;
  const Icon = icons[kind];
  return <Icon aria-hidden="true" />;
}

export default function WeatherApp() {
  const { t, locale, number } = useLocale();
  const theme = useAppTheme();
  const photosEnabled = useWeatherPhotosEnabled();
  const [mounted, setMounted] = useState(false);
  const [loadedPhotoUrl, setLoadedPhotoUrl] = useState<string | null>(null);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const [clock, setClock] = useState<Date | null>(null);
  const [place, setPlace] = useState<Place>(hamburg);
  const [forecast, setForecast] = useState<WeatherForecast>(() => mockForecast());
  const [searchOpen, setSearchOpen] = useState(false);
  const [radarOpen, setRadarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [geolocationDefault, setGeolocationDefaultState] = useState(false);
  const [precision, setPrecision] = useState<LocationPrecision>('private');
  const [status, setStatus] = useState<'idle' | 'loading' | 'offline' | 'error'>('idle');
  const [requestFailure, setRequestFailure] = useState<WeatherFailure | null>(null);
  const [locationStatus, setLocationStatus] = useState<GeolocationResult['status'] | null>(null);
  const [locating, setLocating] = useState(false);
  const locationInProgress = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const load = async (nextPlace = place) => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setStatus('loading');
    setRequestFailure(null);
    try {
      const result = await loadForecast(weatherProvider, nextPlace, controller.signal);
      if (activeRequest.current !== controller || controller.signal.aborted) return;
      setForecast(result.forecast);
      setRequestFailure(result.failure);
      setStatus(result.status === 'error' && !navigator.onLine ? 'offline' : result.status);
    } catch {
      // Cancelled and superseded requests must not replace the newly selected place's forecast.
      if (activeRequest.current !== controller || controller.signal.aborted) return;
      setRequestFailure('invalid-data');
      setStatus('error');
    }
  };

  const choosePlace = (next: Place) => {
    saveLastPlace(next);
    setSavedPlaces(rememberPlace(next));
    setPlace(next);
    setSearchOpen(false);
    void load(next);
  };

  const locate = async (makeDefault = false, requestedPrecision = precision): Promise<boolean> => {
    if (locationInProgress.current) return false;
    locationInProgress.current = true;
    setLocating(true);
    try {
    setLocationStatus(null);
    const result = await requestLocation();
    setLocationStatus(result.status);
    if (result.status !== 'allowed') return false;
    if (makeDefault) {
      setGeolocationDefault(true);
      setLocationPrecisionDefault(requestedPrecision);
      setGeolocationDefaultState(true);
    }
    const coordinates = roundCoordinates(result.coordinates, requestedPrecision);
    let namedPlace: Pick<Place, 'name' | 'admin' | 'country'> = { name: t("Dein Standort") };
    try {
      namedPlace = await reverseGeocode(coordinates) ?? namedPlace;
    } catch { /* Die Wetterabfrage funktioniert auch, wenn die Ortsbenennung nicht erreichbar ist. */ }
    choosePlace({ id: `geo:${coordinates.latitude},${coordinates.longitude}`, ...namedPlace, ...coordinates });
    return true;
    } catch {
      setLocationStatus('unavailable');
      return false;
    } finally {
      locationInProgress.current = false;
      setLocating(false);
    }
  };
  const locateOnStartup = useEffectEvent(locate);

  const switchPlace = (direction: -1 | 1) => {
    if (savedPlaces.length < 2) return;
    const currentIndex = savedPlaces.findIndex((saved) => saved.id === place.id);
    const nextIndex = (Math.max(0, currentIndex) + direction + savedPlaces.length) % savedPlaces.length;
    choosePlace(savedPlaces[nextIndex]);
  };

  const disableGeolocation = () => {
    setGeolocationDefault(false);
    setLocationPrecisionDefault(null);
    setGeolocationDefaultState(false);
    if (place.id.startsWith('geo:')) choosePlace(savedPlaces.find((saved) => !saved.id.startsWith('geo:')) ?? hamburg);
  };

  const removePlace = (placeId: string) => {
    const remaining = forgetPlace(placeId);
    setSavedPlaces(remaining);
    if (placeId.startsWith('geo:')) {
      setGeolocationDefault(false);
      setLocationPrecisionDefault(null);
      setGeolocationDefaultState(false);
    }
    if (placeId !== place.id) return;
    const next = remaining[0] ?? hamburg;
    saveLastPlace(next);
    setPlace(next);
    void load(next);
  };

  useEffect(() => {
    setMounted(true);
    setClock(new Date());
    const clockInterval = window.setInterval(() => setClock(new Date()), 60_000);
    const initialPlace = readLastPlace() ?? hamburg;
    const storedPlaces = readSavedPlaces();
    const places = storedPlaces.some((saved) => saved.id === initialPlace.id)
      ? storedPlaces
      : rememberPlace(initialPlace);
    const useGeolocation = readGeolocationDefault();
    const storedPrecision = useGeolocation ? readLocationPrecisionDefault() : 'private';
    const cached = readCachedForecast(initialPlace.id);
    setPlace(initialPlace);
    setSavedPlaces(places);
    setGeolocationDefaultState(useGeolocation);
    setPrecision(storedPrecision);
    if (cached) setForecast(cached.forecast);
    if (useGeolocation) {
      void locateOnStartup(false, storedPrecision).then((located) => { if (!located) void load(initialPlace); });
    } else void load(initialPlace);
    return () => {
      window.clearInterval(clockInterval);
      activeRequest.current?.abort();
    };
  }, []);
  useEffect(() => { const offline = () => setStatus('offline'); window.addEventListener('offline', offline); return () => window.removeEventListener('offline', offline); }, []);

  const condition = interpretWmo(forecast.current.weatherCode);
  const photo = useWeatherPhoto(place, condition.kind, forecast.current.isDay,
    photosEnabled && forecast.place.id === place.id && forecast.source !== 'mock');
  const photoVisible = photo !== null && loadedPhotoUrl === photo.url && failedPhotoUrl !== photo.url;
  const insight = clock ? deriveInsight(forecast, localIsoMinute(clock, forecast.timezone)) : '';
  const today = forecast.daily.find((day) => clock && day.date === localIsoMinute(clock, forecast.timezone).slice(0, 10)) ?? forecast.daily[0];
  const sunPosition = clock ? sunProgress(today, localIsoMinute(clock, forecast.timezone)) : null;
  const time = forecast.current.time.slice(11, 16);
  const updated = forecast.current.time.slice(11, 16);
  if (!mounted) {
    return <main className="weather-app app-boot" aria-busy="true"><div className="boot-mark" aria-hidden="true"><SoklaroMark /></div><p>{t("soklaro lädt das Wetter …")}</p></main>;
  }

  return (
    <main className="weather-app" data-theme={theme} data-weather-kind={condition.kind}><PwaRegister /><InstallPrompt /><ThemeColor color={settingsOpen ? (theme === 'light' ? '#f5f8f6' : '#102c32') : theme === 'light' ? '#e9f5ff' : statusBarColorFor(forecast.current.weatherCode, forecast.current.isDay)} />
      {theme === 'dark' && <WeatherBackdrop forecast={forecast} />}
      {photo && failedPhotoUrl !== photo.url && <picture className={`weather-photo${photoVisible ? ' is-loaded' : ''}`}><img src={photo.url} alt="" loading="lazy" decoding="async" fetchPriority="low" onLoad={() => setLoadedPhotoUrl(photo.url)} onError={() => setFailedPhotoUrl(photo.url)} /></picture>}
      {(theme === 'dark' || photoVisible) && <div className="weather-overlay" aria-hidden="true" />}
      <header className="app-header"><a className="brand-mark" href="/" aria-label={t("soklaro Startseite")}><span><SoklaroMark /></span>soklaro</a><nav><IconButton label={t("Ort suchen")} onClick={() => setSearchOpen(true)}><Search /></IconButton><IconButton label={t("Menü öffnen")} onClick={() => setSettingsOpen(true)}><Menu /></IconButton></nav></header>
      {(status === 'offline' || status === 'error') && <div className="status-banner" role="status">{requestFailure ? `${t(failureMessages[requestFailure])} ${forecast.source === 'cache' ? t('Gespeicherte Prognose wird angezeigt.') : t('Beispieldaten werden angezeigt.')}` : t("Offline – zuletzt gespeicherte oder Beispieldaten")}</div>}
      <section className="weather-hero" aria-labelledby="place-name" onTouchStart={(event) => { const touch = event.touches[0]; swipeStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={(event) => { const start = swipeStart.current; const touch = event.changedTouches[0]; swipeStart.current = null; if (!start) return; const x = touch.clientX - start.x; const y = touch.clientY - start.y; if (Math.abs(x) >= 60 && Math.abs(x) > Math.abs(y) * 1.25) switchPlace(x < 0 ? 1 : -1); }}>
        <div className="place-row"><div><p className="eyebrow">{t("Dein Wetter")}</p><div className="place-title">{place.id.startsWith('geo:') && <LocateFixed aria-label={t("Per GPS ermittelter Ort")} />}<h1 id="place-name">{place.name}</h1></div><p>{time} · {t(condition.label)}</p></div><IconButton label={t("Wetter aktualisieren")} onClick={() => void load()}><RefreshCw className={status === 'loading' ? 'spinning' : ''} /></IconButton></div>
        {savedPlaces.length > 1 && <nav className="place-switcher" aria-label={t("Gespeicherte Orte")} onTouchStart={(event) => event.stopPropagation()} onTouchEnd={(event) => event.stopPropagation()}>{savedPlaces.map((saved) => <button key={saved.id} aria-current={saved.id === place.id ? 'location' : undefined} onClick={() => choosePlace(saved)}>{saved.id.startsWith('geo:') ? <LocateFixed aria-hidden="true" /> : <MapPin aria-hidden="true" />}{saved.name}</button>)}</nav>}
        <div className="temperature" aria-label={t('{{temperature}} Grad Celsius', { temperature: number(forecast.current.temperature) })}><span>{Math.round(forecast.current.temperature)}</span><sup>°</sup></div>
        <p className="feels">{t("Gefühlt")} {Math.round(forecast.current.apparentTemperature)}{t("° · H")} {Math.round(today.temperatureMax)}{t("° / T")} {Math.round(today.temperatureMin)}°</p>
        <div className="insight-actions"><div className="insight">{insight.startsWith('Regen wahrscheinlich') ? <CloudRain aria-hidden="true" /> : <CloudSun aria-hidden="true" />}<strong>{t(insight)}</strong></div><button className="radar-trigger" aria-label={t('Regenradar öffnen')} title={t('Regenradar öffnen')} aria-haspopup="dialog" onClick={() => setRadarOpen(true)}><Radar aria-hidden="true" /></button></div>
        <p className="updated">{t("Aktualisiert")} {updated} · {forecast.source === 'live' ? t("Open‑Meteo Live-Daten") : forecast.source === 'cache' ? t("gespeicherte Daten") : t("Beispieldaten")}</p>
        {photo && photoVisible && <footer className="photo-credit">{t("Foto:")} <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">{photo.artist} · Wikimedia Commons</a> · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer">{photo.license}</a> · {t("Bildausschnitt")}</footer>}
      </section>

      {radarOpen && <Suspense fallback={<p role="status">{t('Radar wird geöffnet …')}</p>}><RainRadar place={place} onClose={() => setRadarOpen(false)} /></Suspense>}
      <section className="forecast-content">
        <div className="section-heading"><div><p className="eyebrow">{t("Nächste Stunden")}</p><h2>{t("Der Tag im Blick")}</h2></div><p>{t("48 Stunden")}</p></div>
        <div className="hourly" tabIndex={0} aria-label={t("Horizontale 48-Stunden-Prognose")}>
          {forecast.hourly.map((hour, index) => { const summary = hourSummary(hour); return <article key={`${hour.time}-${index}`} className={index === 0 ? 'now' : ''}><time>{index === 0 ? t("Jetzt") : hour.time.slice(11, 16)}</time><span className="weather-glyph" role="img" aria-label={t(summary.label)} title={t(summary.label)} data-weather-kind={interpretWmo(summary.code).kind}><WeatherIcon code={summary.code} isDay={hour.isDay} theme={theme} /></span><strong>{Math.round(hour.temperature)}°</strong><small>{hour.precipitationProbability}%</small>{hour.isDay && hour.sunshineDuration != null && <small hidden title={t("Sonnenschein in der Stunde ab der angezeigten Uhrzeit")}>☀ {Math.round(hour.sunshineDuration / 60)} min</small>}</article>; })}
        </div>
        <div className="detail-grid">
          <DataPill icon={<Droplets />} label={t("Luftfeuchte")} value={`${forecast.current.humidity}%`} />
          <DataPill icon={<CloudRain />} label={t("Niederschlag")} value={`${number(forecast.current.precipitation, 1)} mm`} />
          <DataPill icon={<Cloud />} label={t("Bewölkung")} value={`${forecast.current.cloudCover}%`} />
          <DataPill icon={<Wind />} label={t("Wind · Böen")} value={`${Math.round(forecast.current.windSpeed)} · ${Math.round(forecast.current.windGusts)} km/h`} />
          <DataPill icon={<Gauge />} label={t("Luftdruck")} value={`${Math.round(forecast.current.pressure)} hPa`} />
          <DataPill icon={<Sunrise />} label={t("UV-Index")} value={number(forecast.current.uvIndex, 1)} />
        </div>
        <div className="sun-card"><div><Sunrise aria-hidden="true" /><small>{t("Sonnenaufgang")}</small><strong>{today.sunrise.slice(11, 16)}</strong></div><div className="sun-arc" aria-hidden="true"><svg viewBox="0 0 200 90" preserveAspectRatio="none"><path d="M10 80 Q100 -60 190 80" fill="none" stroke="currentColor" strokeDasharray="3 4" /></svg>{sunPosition !== null && <Sun className="sun-position" style={{ left: `${5 + 90 * sunPosition}%`, top: `${(80 - 280 * sunPosition * (1 - sunPosition)) / 90 * 100}%` }} />}</div><div><Sunset aria-hidden="true" /><small>{t("Sonnenuntergang")}</small><strong>{today.sunset.slice(11, 16)}</strong></div></div>
        <section className="days">
          <div className="section-heading"><div><p className="eyebrow">{t("Ausblick")}</p><h2>{t("14 Tage")}</h2></div></div>
          {forecast.daily.map((day, index) => {
            const summary = daySummary(day);
            const periods = periodSummaries(day.date, forecast.detailHourly ?? forecast.hourly);
            const value = (amount: number | null, unit: string, digits = 0) => amount == null ? '—' : `${number(amount, digits)}${unit}`;
            return <details className="day-forecast" key={`${forecast.place.id}-${day.date}`}>
              <summary className="day-toggle">
                <time dateTime={day.date}>{index === 0 ? t("Heute") : new Intl.DateTimeFormat(locale, { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(new Date(`${day.date}T12:00:00Z`))}</time>
                <span className="daily-condition" role="img" aria-label={t(summary.label)} title={`${t(summary.label)} · ${t('Stärkstes Tagesereignis')}: ${t(interpretWmo(day.weatherCode).label)}`} ><WeatherIcon code={summary.code} theme={theme} sunShowers={summary.label === 'Sonne und Schauer'} /><small>{t(summary.label)}</small></span>
                <span className="daily-metrics"><small title={t("Regenwahrscheinlichkeit")}><CloudRain aria-hidden="true" />{day.precipitationProbability}%</small><small title={t("Erwartete Niederschlagsmenge")}><Droplets aria-hidden="true" />{number(day.precipitationSum, 1)} mm</small><small title={t("Sonnenscheindauer")}><Sun aria-hidden="true" />{number(day.sunshineDuration / 3600, 1)} h</small></span>
                <strong>{Math.round(day.temperatureMax)}° <em>{Math.round(day.temperatureMin)}°</em></strong>
                <ChevronDown className="day-chevron" aria-hidden="true" />
              </summary>
              <div className="day-periods">
                {periods.map(period => <div className="day-period" key={period.name}>
                  <h3>{t(period.name)}</h3><small className="period-time">{t(period.range)}</small>
                  <span className="period-symbol" role="img" aria-label={t(period.label)}><WeatherIcon code={period.code} isDay={period.isDay} theme={theme} /></span>
                  <p className="period-description">{t(period.label)}</p>
                  <strong className="period-temperature">{value(period.temperatureMin, '°')} – {value(period.temperatureMax, '°')}</strong>
                  <dl>
                    <div><dt><CloudRain aria-hidden="true" />{t("Regenrisiko")}</dt><dd>{value(period.precipitationProbability, '%')}</dd></div>
                    <div><dt><Droplets aria-hidden="true" />{t("Niederschlag")}</dt><dd>{value(period.precipitation, ' mm', 1)}</dd></div>
                    <div><dt><Wind aria-hidden="true" />{t("Wind Ø")}</dt><dd>{value(period.windSpeed, ' km/h')}</dd></div>
                  </dl>
                </div>)}
              </div>
            </details>;
          })}
        </section>
        <footer className="app-footer"><p>{t("Wetterdaten:")} <a href="https://open-meteo.com/" rel="noreferrer">Open‑Meteo</a> · <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer">CC BY 4.0</a> {t("· Ortsnamen bei GPS-Nutzung: ©")} <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">{t("OpenStreetMap-Mitwirkende")}</a>.</p><nav aria-label={t("Rechtliches")}><a href="/privacy">{t("Datenschutz")}</a><a href="/impressum">{t("Impressum")}</a></nav></footer>
      </section>

      {searchOpen && <SearchPanel onSelect={choosePlace} onClose={() => setSearchOpen(false)} />}
      {settingsOpen && <SettingsPanel
        theme={theme} photosEnabled={photosEnabled} savedPlaces={savedPlaces} placeId={place.id}
        geolocationDefault={geolocationDefault} precision={precision} locating={locating} locationStatus={locationStatus}
        onClose={() => setSettingsOpen(false)} onTheme={setAppTheme} onPhotos={setWeatherPhotosEnabled}
        onChoosePlace={(saved) => { choosePlace(saved); setSettingsOpen(false); }} onRemovePlace={removePlace}
        onSearch={() => { setSettingsOpen(false); setSearchOpen(true); }}
        onGpsDefault={(enabled) => { if (enabled) void locate(true); else disableGeolocation(); }}
        onPrecision={(next) => {
          setPrecision(next);
          if (geolocationDefault) {
            setLocationPrecisionDefault(next);
            if (place.id.startsWith('geo:')) void locate(false, next);
          }
        }}
        onLocate={() => void locate(false)}
        onReset={() => {
          clearLocalData(); setAppTheme('dark', false); setWeatherPhotosEnabled(true, false);
          setSavedPlaces([]); setGeolocationDefaultState(false); setLocationStatus(null); setPrecision('private');
          setPlace(hamburg); void load(hamburg); setSettingsOpen(false);
        }}
      />}
    </main>
  );
}

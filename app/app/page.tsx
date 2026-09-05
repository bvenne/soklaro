'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { ArrowLeft, Cloud, CloudRain, CloudSun, Droplets, Gauge, LocateFixed, MapPin, Menu, Navigation, RefreshCw, Search, Sun, Sunrise, Sunset, Wind, X } from 'lucide-react';
import { SoklaroMark } from '@/app/components/soklaro-mark';
import { backgroundFor, interpretWmo } from '@/lib/weather/wmo';
import { cacheForecast, clearLocalData, forgetPlace, readCachedForecast, readGeolocationDefault, readLastPlace, readSavedPlaces, rememberPlace, saveLastPlace, setGeolocationDefault } from '@/lib/weather/cache';
import { requestLocation, roundCoordinates, type GeolocationResult, type LocationPrecision } from '@/lib/weather/geolocation';
import { deriveInsight } from '@/lib/weather/insights';
import { berlin, mockForecast } from '@/lib/weather/mock';
import { OpenMeteoGeocodingProvider, OpenMeteoWeatherProvider } from '@/lib/weather/open-meteo';
import { reverseGeocode } from '@/lib/weather/reverse-geocoding';
import type { Place, WeatherForecast } from '@/lib/weather/types';
import { PwaRegister } from './pwa-register';
import { WiCloudy, WiDayCloudy, WiDaySunny, WiDaySunnyOvercast, WiFog, WiNa, WiNightClear, WiNightCloudy, WiNightFog, WiNightPartlyCloudy, WiNightRain, WiNightShowers, WiNightSnow, WiNightSprinkle, WiNightThunderstorm, WiRain, WiShowers, WiSleet, WiSnow, WiSprinkle, WiStormShowers, WiThunderstorm } from 'react-icons/wi';

const weatherProvider = new OpenMeteoWeatherProvider();
const geocodingProvider = new OpenMeteoGeocodingProvider();

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
  }, [query]);
  return (
    <div className="search-panel" role="dialog" aria-modal="true" aria-labelledby="search-title">
      <div className="search-head"><IconButton label="Suche schließen" onClick={onClose}><ArrowLeft /></IconButton><h2 id="search-title">Ort suchen</h2></div>
      <label className="search-box"><Search aria-hidden="true" /><span className="sr-only">Stadt oder Ort</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Stadt oder Ort" /><button aria-label="Eingabe löschen" onClick={() => setQuery('')}><X /></button></label>
      <p className="search-privacy">Die Suche überträgt nur deinen Suchbegriff an Open‑Meteo. Keine Werbung, kein Profiling.</p>
      <div className="search-results" aria-live="polite">
        {busy && <p>Suche läuft …</p>}
        {!busy && query.length >= 2 && results.length === 0 && <p>Kein passender Ort gefunden.</p>}
        {results.map((place) => <button key={place.id} onClick={() => onSelect(place)}><MapPin aria-hidden="true" /><span><strong>{place.name}</strong><small>{[place.admin, place.country].filter(Boolean).join(', ')}</small></span></button>)}
      </div>
    </div>
  );
}

function DataPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="data-pill"><span aria-hidden="true">{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div>;
}

function WeatherIcon({ code, isDay = true }: { code: number; isDay?: boolean }) {
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
  const [mounted, setMounted] = useState(false);
  const [clock, setClock] = useState<Date | null>(null);
  const [place, setPlace] = useState<Place>(berlin);
  const [forecast, setForecast] = useState<WeatherForecast>(() => mockForecast());
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [geolocationDefault, setGeolocationDefaultState] = useState(false);
  const [precision, setPrecision] = useState<LocationPrecision>('private');
  const [status, setStatus] = useState<'idle' | 'loading' | 'offline' | 'error'>('idle');
  const [locationStatus, setLocationStatus] = useState<GeolocationResult['status'] | null>(null);
  const activeRequest = useRef<AbortController | null>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  const load = async (nextPlace = place) => {
    activeRequest.current?.abort(); activeRequest.current = new AbortController(); setStatus('loading');
    try {
      const next = await weatherProvider.getForecast(nextPlace, activeRequest.current.signal);
      setForecast(next); cacheForecast(next); setStatus('idle');
    } catch {
      const cached = readCachedForecast(nextPlace.id);
      if (cached) { setForecast(cached.forecast); setStatus('offline'); }
      else { setForecast(mockForecast(nextPlace)); setStatus(navigator.onLine ? 'error' : 'offline'); }
    }
  };

  const choosePlace = (next: Place) => {
    saveLastPlace(next);
    setSavedPlaces(rememberPlace(next));
    setPlace(next);
    setSearchOpen(false);
    void load(next);
  };

  const locate = async (makeDefault = false): Promise<boolean> => {
    setLocationStatus(null);
    const result = await requestLocation();
    setLocationStatus(result.status);
    if (result.status !== 'allowed') return false;
    if (makeDefault) {
      setGeolocationDefault(true);
      setGeolocationDefaultState(true);
    }
    const coordinates = roundCoordinates(result.coordinates, precision);
    let namedPlace: Pick<Place, 'name' | 'admin' | 'country'> = { name: 'Dein Standort' };
    try {
      namedPlace = await reverseGeocode(coordinates) ?? namedPlace;
    } catch { /* Die Wetterabfrage funktioniert auch, wenn die Ortsbenennung nicht erreichbar ist. */ }
    choosePlace({ id: `geo:${coordinates.latitude},${coordinates.longitude}`, ...namedPlace, ...coordinates });
    return true;
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
    setGeolocationDefaultState(false);
    if (place.id.startsWith('geo:')) choosePlace(savedPlaces.find((saved) => !saved.id.startsWith('geo:')) ?? berlin);
  };

  const removePlace = (placeId: string) => {
    const remaining = forgetPlace(placeId);
    setSavedPlaces(remaining);
    if (placeId.startsWith('geo:')) {
      setGeolocationDefault(false);
      setGeolocationDefaultState(false);
    }
    if (placeId !== place.id) return;
    const next = remaining[0] ?? berlin;
    saveLastPlace(next);
    setPlace(next);
    void load(next);
  };

  useEffect(() => {
    setMounted(true);
    setClock(new Date());
    const clockInterval = window.setInterval(() => setClock(new Date()), 60_000);
    const initialPlace = readLastPlace() ?? berlin;
    const storedPlaces = readSavedPlaces();
    const places = storedPlaces.some((saved) => saved.id === initialPlace.id)
      ? storedPlaces
      : rememberPlace(initialPlace);
    const useGeolocation = readGeolocationDefault();
    const cached = readCachedForecast(initialPlace.id);
    setPlace(initialPlace);
    setSavedPlaces(places);
    setGeolocationDefaultState(useGeolocation);
    if (cached) setForecast(cached.forecast);
    if (useGeolocation) {
      void locateOnStartup().then((located) => { if (!located) void load(initialPlace); });
    } else void load(initialPlace);
    return () => {
      window.clearInterval(clockInterval);
      activeRequest.current?.abort();
    };
  }, []);
  useEffect(() => { const offline = () => setStatus('offline'); window.addEventListener('offline', offline); return () => window.removeEventListener('offline', offline); }, []);

  const condition = interpretWmo(forecast.current.weatherCode);
  const insight = clock ? deriveInsight(forecast, localIsoMinute(clock, forecast.timezone)) : '';
  const today = forecast.daily[0];
  const time = forecast.current.time.slice(11, 16);
  const updated = forecast.current.time.slice(11, 16);

  if (!mounted) {
    return <main className="weather-app app-boot" aria-busy="true"><div className="boot-mark" aria-hidden="true"><SoklaroMark /></div><p>soklaro lädt das Wetter …</p></main>;
  }

  return (
    <main className="weather-app"><PwaRegister />
      <WeatherBackdrop forecast={forecast} /><div className="weather-overlay" aria-hidden="true" />
      <header className="app-header"><a className="brand-mark" href="/" aria-label="soklaro Startseite"><span><SoklaroMark /></span>soklaro</a><nav><IconButton label="Ort suchen" onClick={() => setSearchOpen(true)}><Search /></IconButton><IconButton label="Menü öffnen" onClick={() => setSettingsOpen(true)}><Menu /></IconButton></nav></header>
      {(status === 'offline' || status === 'error') && <div className="status-banner" role="status">{status === 'offline' ? 'Offline – zuletzt gespeicherte oder Beispieldaten' : 'Live-Daten nicht erreichbar – Beispieldaten'}</div>}
      <section className="weather-hero" aria-labelledby="place-name" onTouchStart={(event) => { const touch = event.touches[0]; swipeStart.current = { x: touch.clientX, y: touch.clientY }; }} onTouchEnd={(event) => { const start = swipeStart.current; const touch = event.changedTouches[0]; swipeStart.current = null; if (!start) return; const x = touch.clientX - start.x; const y = touch.clientY - start.y; if (Math.abs(x) >= 60 && Math.abs(x) > Math.abs(y) * 1.25) switchPlace(x < 0 ? 1 : -1); }}>
        <div className="place-row"><div><p className="eyebrow">Dein Wetter</p><div className="place-title">{place.id.startsWith('geo:') && <LocateFixed aria-label="Per GPS ermittelter Ort" />}<h1 id="place-name">{place.name}</h1></div><p>{time} · {condition.label}</p></div><IconButton label="Wetter aktualisieren" onClick={() => void load()}><RefreshCw className={status === 'loading' ? 'spinning' : ''} /></IconButton></div>
        {savedPlaces.length > 1 && <nav className="place-switcher" aria-label="Gespeicherte Orte" onTouchStart={(event) => event.stopPropagation()} onTouchEnd={(event) => event.stopPropagation()}>{savedPlaces.map((saved) => <button key={saved.id} aria-current={saved.id === place.id ? 'location' : undefined} onClick={() => choosePlace(saved)}>{saved.id.startsWith('geo:') ? <LocateFixed aria-hidden="true" /> : <MapPin aria-hidden="true" />}{saved.name}</button>)}</nav>}
        <div className="temperature" aria-label={`${Math.round(forecast.current.temperature)} Grad Celsius`}><span>{Math.round(forecast.current.temperature)}</span><sup>°</sup></div>
        <p className="feels">Gefühlt {Math.round(forecast.current.apparentTemperature)}° · H {Math.round(today.temperatureMax)}° / T {Math.round(today.temperatureMin)}°</p>
        <div className="insight">{insight.startsWith('Regen wahrscheinlich') ? <CloudRain aria-hidden="true" /> : <CloudSun aria-hidden="true" />}<strong>{insight}</strong></div>
        <p className="updated">Aktualisiert {updated} · {forecast.source === 'live' ? 'Open‑Meteo Live-Daten' : forecast.source === 'cache' ? 'gespeicherte Daten' : 'Beispieldaten'}</p>
      </section>

      <section className="forecast-content">
        <div className="section-heading"><div><p className="eyebrow">Nächste Stunden</p><h2>Der Tag im Blick</h2></div><p>48 Stunden</p></div>
        <div className="hourly" tabIndex={0} aria-label="Horizontale 48-Stunden-Prognose">
          {forecast.hourly.map((hour, index) => <article key={`${hour.time}-${index}`} className={index === 0 ? 'now' : ''}><time>{index === 0 ? 'Jetzt' : hour.time.slice(11, 16)}</time><span className="weather-glyph" role="img" aria-label={interpretWmo(hour.weatherCode).label} data-weather-kind={interpretWmo(hour.weatherCode).kind}><WeatherIcon code={hour.weatherCode} isDay={hour.isDay} /></span><strong>{Math.round(hour.temperature)}°</strong><small>{hour.precipitationProbability}%</small></article>)}
        </div>
        <div className="detail-grid">
          <DataPill icon={<Droplets />} label="Luftfeuchte" value={`${forecast.current.humidity}%`} />
          <DataPill icon={<CloudRain />} label="Niederschlag" value={`${forecast.current.precipitation.toFixed(1)} mm`} />
          <DataPill icon={<Cloud />} label="Bewölkung" value={`${forecast.current.cloudCover}%`} />
          <DataPill icon={<Wind />} label="Wind · Böen" value={`${Math.round(forecast.current.windSpeed)} · ${Math.round(forecast.current.windGusts)} km/h`} />
          <DataPill icon={<Gauge />} label="Luftdruck" value={`${Math.round(forecast.current.pressure)} hPa`} />
          <DataPill icon={<Sunrise />} label="UV-Index" value={forecast.current.uvIndex.toFixed(1)} />
        </div>
        <div className="sun-card"><div><Sunrise aria-hidden="true" /><small>Sonnenaufgang</small><strong>{today.sunrise.slice(11, 16)}</strong></div><div className="sun-arc" aria-hidden="true"><span /></div><div><Sunset aria-hidden="true" /><small>Sonnenuntergang</small><strong>{today.sunset.slice(11, 16)}</strong></div></div>
        <section className="days"><div className="section-heading"><div><p className="eyebrow">Ausblick</p><h2>14 Tage</h2></div></div>{forecast.daily.map((day, index) => <article key={day.date}><time>{index === 0 ? 'Heute' : new Intl.DateTimeFormat('de', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(`${day.date}T12:00:00`))}</time><span className="daily-condition" role="img" aria-label={interpretWmo(day.weatherCode).label}><WeatherIcon code={day.weatherCode} /><small>{interpretWmo(day.weatherCode).label}</small></span><span className="daily-metrics"><small title="Regenwahrscheinlichkeit"><CloudRain aria-hidden="true" />{day.precipitationProbability}%</small><small title="Erwartete Niederschlagsmenge"><Droplets aria-hidden="true" />{day.precipitationSum.toFixed(1)} mm</small><small title="Sonnenscheindauer"><Sun aria-hidden="true" />{(day.sunshineDuration / 3600).toFixed(1)} h</small></span><strong>{Math.round(day.temperatureMax)}° <em>{Math.round(day.temperatureMin)}°</em></strong></article>)}</section>
        <footer className="app-footer"><p>Wetterdaten: <a href="https://open-meteo.com/" rel="noreferrer">Open‑Meteo</a> · <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer">CC BY 4.0</a> · Ortsnamen bei GPS-Nutzung: © <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">OpenStreetMap-Mitwirkende</a>.</p><nav aria-label="Rechtliches"><a href="/privacy">Netzwerk & Datenschutz</a><a href="/impressum">Impressum</a></nav></footer>
      </section>

      {searchOpen && <SearchPanel onSelect={choosePlace} onClose={() => setSearchOpen(false)} />}
      {settingsOpen && <div className="drawer-backdrop" onClick={() => setSettingsOpen(false)}><aside className="settings-drawer" aria-label="Einstellungen" onClick={(event) => event.stopPropagation()}><div className="drawer-title"><h2>Privat. Von Anfang an.</h2><IconButton label="Menü schließen" onClick={() => setSettingsOpen(false)}><X /></IconButton></div><p>Standortzugriff erfolgt nur nach deiner Aktion. Die gewählten oder gerundeten Koordinaten gehen an Open‑Meteo und zur einmaligen Ortsbenennung an OpenStreetMap.</p><div className="location-default"><input id="geolocation-default" type="checkbox" aria-describedby="geolocation-default-help" checked={geolocationDefault} onChange={(event) => { if (event.target.checked) void locate(true); else disableGeolocation(); }} /><label htmlFor="geolocation-default"><strong>GPS-Standort als Standard</strong><small id="geolocation-default-help">Nach Aktivierung wird der Standort bei künftigen Starts automatisch aktualisiert.</small></label></div><fieldset><legend>Koordinatengenauigkeit</legend>{(['exact', 'approximate', 'private'] as const).map((item) => <label key={item}><input type="radio" name="precision" value={item} checked={precision === item} onChange={() => setPrecision(item)} /><span><strong>{item === 'exact' ? 'Exakt' : item === 'approximate' ? 'Ungefähr · ca. 1 km' : 'Privat · ca. 5 km'}</strong>{item === 'private' && <small>Kann an Küsten und in Bergen die Prognose beeinflussen.</small>}</span></label>)}</fieldset><button className="primary-button" onClick={() => void locate(!geolocationDefault)}><LocateFixed />{geolocationDefault ? 'Standort aktualisieren' : 'Meinen Standort verwenden'}</button>{locationStatus && locationStatus !== 'allowed' && <p role="status">Standortstatus: {locationStatus}</p>}{savedPlaces.length > 0 && <section className="saved-places-settings" aria-labelledby="saved-places-title"><h3 id="saved-places-title">Gespeicherte Orte</h3>{savedPlaces.map((saved) => <div key={saved.id}><button className="saved-place-name" onClick={() => { choosePlace(saved); setSettingsOpen(false); }}>{saved.id.startsWith('geo:') ? <LocateFixed aria-hidden="true" /> : <MapPin aria-hidden="true" />}<span>{saved.name}</span></button><button className="remove-place" aria-label={`${saved.name} entfernen`} onClick={() => removePlace(saved.id)}><X aria-hidden="true" /></button></div>)}</section>}<a className="secondary-link" href="/privacy"><Navigation />Netzwerk & Datenschutz</a><button className="danger-button" onClick={() => { clearLocalData(); setSavedPlaces([]); setGeolocationDefaultState(false); setLocationStatus(null); setPlace(berlin); void load(berlin); setSettingsOpen(false); }}>Alle lokalen Daten löschen</button></aside></div>}
    </main>
  );
}

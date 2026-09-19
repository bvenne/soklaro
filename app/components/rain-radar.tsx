'use client';
import { useEffect, useRef, useState } from 'react';
import { LocateFixed, Pause, Play, RefreshCw, X } from 'lucide-react';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocale } from '@/lib/i18n/use-locale';
import { loadRadarTimes, nearestRadarFrame, RADAR_LAYER, RADAR_URL, RADAR_WINDOW, type RadarFrame } from '@/lib/weather/radar';
import type { Place } from '@/lib/weather/types';

export default function RainRadar({ place, onClose }: { place: Place; onClose: () => void }) {
  const { t, locale } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const [ready, setReady] = useState(false);
  const [times, setTimes] = useState<RadarFrame[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [target, setTarget] = useState(() => Date.now() - 20 * 60000);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [baseError, setBaseError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [view, setView] = useState(0);
  const [displayed, setDisplayed] = useState<RadarFrame | null>(null);
  const outside = place.latitude < 47 || place.latitude > 55 || place.longitude < 5.5 || place.longitude > 15.5;
  const selected = nearestRadarFrame(times, target);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.current?.showModal(); document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, []);

  useEffect(() => {
    let disposed = false;
    void import('leaflet').then(L => {
      if (disposed || !container.current) return;
      leaflet.current = L;
      const instance = L.map(container.current, { minZoom: 5, maxZoom: 12, zoomControl: true }).setView(outside ? [51, 10] : [place.latitude, place.longitude], outside ? 6 : 8);
      map.current = instance;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19,
        keepBuffer: 0, updateWhenIdle: true,
      }).on('tileerror', () => setBaseError(true)).addTo(instance);
      if (!outside) L.circleMarker([place.latitude, place.longitude], { radius: 7, color: '#fff', weight: 3, fillColor: '#173e43', fillOpacity: 1 }).addTo(instance).bindTooltip(() => { const label = document.createElement('span'); label.textContent = place.name; return label; });
      instance.on('movestart', () => setPlaying(false));
      instance.on('moveend', () => setView(value => value + 1));
      instance.on('resize', () => setView(value => value + 1));
      instance.invalidateSize(); setReady(true);
    }).catch(() => { setError(true); setBusy(false); });
    return () => { disposed = true; map.current?.remove(); map.current = null; };
  }, [place.latitude, place.longitude, place.name, outside]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    let active = true;
    setBusy(true); setError(false); setPlaying(false);
    loadRadarTimes(controller.signal).then(frames => {
      if (active) { setTimes(frames); setNow(Date.now()); setTarget(Date.now() - 20 * 60000); }
    }).catch(() => { if (active) { setError(true); setBusy(false); } }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [retry]);

  // One viewport image per observation; time label changes only once that image loads.
  useEffect(() => {
    const instance = map.current, L = leaflet.current;
    if (!ready || !instance || !L) return;
    if (!selected) { setDisplayed(null); if (times.length) setBusy(false); return; }
    setBusy(true); setError(false); setDisplayed(null);
    const bounds = instance.getBounds(), size = instance.getSize();
    const sw = L.CRS.EPSG3857.project(bounds.getSouthWest()), ne = L.CRS.EPSG3857.project(bounds.getNorthEast());
    const params = new URLSearchParams({ service: 'WMS', version: '1.1.1', request: 'GetMap', layers: RADAR_LAYER, styles: '', format: 'image/png', transparent: 'true', srs: 'EPSG:3857', bbox: `${sw.x},${sw.y},${ne.x},${ne.y}`, width: String(Math.round(size.x)), height: String(Math.round(size.y)), time: new Date(selected.time).toISOString(), dim_reference_time: new Date(selected.reference).toISOString() });
    let active = true;
    const overlay = L.imageOverlay(`${RADAR_URL}?${params}`, bounds, { opacity: .72, interactive: false });
    const fail = () => { if (active) { active = false; setError(true); setBusy(false); setPlaying(false); overlay.remove(); } };
    const timeout = window.setTimeout(fail, 20000);
    overlay.on('load', () => { clearTimeout(timeout); if (active) { setDisplayed(selected); setBusy(false); } });
    overlay.on('error', () => { clearTimeout(timeout); fail(); });
    overlay.addTo(instance);
    return () => { active = false; clearTimeout(timeout); overlay.remove(); };
  }, [selected, ready, view, retry, times.length]);

  useEffect(() => {
    if (!playing || busy || error || times.length < 2) return;
    const timer = window.setTimeout(() => setTarget(value => {
      const next = times.find(frame => frame.time > value + 150000);
      return next?.time ?? times[0].time;
    }), 750);
    return () => clearTimeout(timer);
  }, [playing, busy, error, times, target]);
  useEffect(() => {
    const pause = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);

  const timeLabel = (time: number) => new Intl.DateTimeFormat(locale, { timeZone: place.timezone || 'Europe/Berlin', hour: '2-digit', minute: '2-digit' }).format(time);
  const latestObservation = times.filter(frame => !frame.forecast).at(-1)?.time;
  const stale = latestObservation !== undefined && now - latestObservation > 30 * 60000;
  const hasForecast = times.some(frame => frame.forecast && frame.time > now);
  return <dialog className="radar-dialog" ref={dialog} aria-labelledby="radar-title" onCancel={onClose}>
    <header className="radar-header"><div><h2 id="radar-title">{t('Regenradar')}</h2><p>{outside ? t('Deutschland') : place.name} · {t('Verlauf & Vorhersage')}</p></div><button className="radar-button" onClick={onClose} aria-label={t('Radar schließen')}><X /></button></header>
    <div className="radar-map-wrap"><div className="radar-map" ref={container} aria-label={t('Niederschlagskarte')} />
      <button className="radar-center radar-button" aria-label={t('Karte zentrieren')} onClick={() => map.current?.setView(outside ? [51, 10] : [place.latitude, place.longitude], outside ? 6 : 8)}><LocateFixed /></button>
      <div className="radar-map-status" role="status">{error ? t('Radardaten nicht verfügbar. Bitte erneut versuchen.') : busy ? t('Radardaten werden geladen …') : displayed !== null ? `${t(displayed.forecast ? 'Vorhersage' : 'Messung')} ${timeLabel(displayed.time)}` : t('Für diesen Zeitpunkt sind keine Radardaten verfügbar.')}</div>
    </div>
    <div className="radar-controls"><button className="radar-button" disabled={!times.length || error} onClick={() => setPlaying(value => !value)} aria-label={playing ? t('Pause') : t('Abspielen')}>{playing ? <Pause /> : <Play />}</button><div className="radar-timeline"><div className="radar-range"><input type="range" min={now - RADAR_WINDOW} max={now + RADAR_WINDOW} step="any" value={Math.max(now - RADAR_WINDOW, Math.min(now + RADAR_WINDOW, target))} disabled={!times.length} aria-label={t('Radarzeit')} aria-valuetext={timeLabel(target)} onChange={event => { setPlaying(false); setTarget(Number(event.target.value)); }} /><span className="radar-now-tick" aria-hidden="true" /></div><div className="radar-time-labels"><span>{timeLabel(now - RADAR_WINDOW)}</span><button onClick={() => { setPlaying(false); setTarget(now); }}>{t('Jetzt')}<small>{timeLabel(now)}</small></button><span>{timeLabel(now + RADAR_WINDOW)}</span></div></div><button className="radar-button" onClick={() => { setRetry(value => value + 1); setView(value => value + 1); }} aria-label={t('Radar aktualisieren')}><RefreshCw /></button></div>
    <div className="radar-notes">{!busy && !error && !hasForecast && <p role="status">{t('Aktuell ist keine Radarvorhersage verfügbar.')}</p>}{outside && <p role="status">{t('Für diesen Ort sind keine DWD-Radardaten verfügbar. Die Karte zeigt Deutschland.')}</p>}{stale && <p role="status">{t('Die letzte Radarmessung ist älter als 30 Minuten.')}</p>}{baseError && <p role="status">{t('Die Hintergrundkarte konnte nicht vollständig geladen werden.')}</p>}<p>{t('Messungen und Radarvorhersage bis etwa zwei Stunden voraus. Abdeckung: Deutschland und Grenzregionen. Die Vorhersage wird mit zunehmendem Abstand unsicherer. Ungefärbte Flächen können auch fehlende Messdaten bedeuten.')}</p>
      <details><summary>{t('Niederschlagslegende')}</summary><img src={`${RADAR_URL}?service=WMS&version=1.3.0&request=GetLegendGraphic&format=image/png&layer=${RADAR_LAYER}`} alt={t('DWD-Farbskala: Niederschlagsintensität in mm pro Stunde')} loading="lazy" /></details>
      <p>© <a href="https://www.dwd.de/DE/service/copyright/copyright_node.html" target="_blank" rel="noreferrer">Deutscher Wetterdienst</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · {t('Kartendarstellung angepasst')} · <a href="/privacy">{t('Datenschutz')}</a></p>
    </div>
  </dialog>;
}

'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LocateFixed,
  Pause,
  Play,
  RefreshCw,
  X,
} from 'lucide-react';
import type * as Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocale } from '@/lib/i18n/use-locale';
import {
  loadRadarTimes,
  nearestRadarFrame,
  nextRadarFrame,
  radarImageUrl,
  radarPrefetchFrames,
  RADAR_WINDOW,
  type RadarFrame,
} from '@/lib/weather/radar';
import {
  RadarImageCache,
  loadRadarImage,
} from '@/lib/weather/radar-image-cache';
import type { Place } from '@/lib/weather/types';
import { RADAR_RAIN_PALETTE } from '@/lib/weather/radar-palette';

// Reopening reuses a small buffer; requests only run while the player is open.
const imageCache = new RadarImageCache(loadRadarImage);

export default function RainRadar({
  place,
  onClose,
}: {
  place: Place;
  onClose: () => void;
}) {
  const { t, locale } = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const visibleLayer = useRef<Leaflet.ImageOverlay | null>(null);
  const viewTimer = useRef<number | undefined>(undefined);
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
  const [speed, setSpeed] = useState(750);
  const [dragging, setDragging] = useState(false);
  const outside =
    place.latitude < 47 ||
    place.latitude > 55 ||
    place.longitude < 5.5 ||
    place.longitude > 15.5;
  const selected = nearestRadarFrame(times, target);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflow = document.body.style.overflow;
    const element = dialog.current;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    void import('leaflet')
      .then((L) => {
        if (disposed || !container.current) return;
        leaflet.current = L;
        const instance = L.map(container.current, {
          minZoom: 5,
          maxZoom: 12,
        }).setView(
          outside ? [51, 10] : [place.latitude, place.longitude],
          outside ? 6 : 8,
        );
        map.current = instance;
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          keepBuffer: 1,
          updateWhenIdle: true,
          updateWhenZooming: false,
        })
          .on('tileerror', () => setBaseError(true))
          .addTo(instance);
        if (!outside)
          L.circleMarker([place.latitude, place.longitude], {
            radius: 7,
            color: '#fff',
            weight: 3,
            fillColor: '#173e43',
            fillOpacity: 1,
          })
            .addTo(instance)
            .bindTooltip(() => {
              const label = document.createElement('span');
              label.textContent = place.name;
              return label;
            });
        const updateView = () => {
          window.clearTimeout(viewTimer.current);
          viewTimer.current = window.setTimeout(
            () => setView((value) => value + 1),
            180,
          );
        };
        instance.on('movestart', () => {
          setPlaying(false);
          imageCache.retainRequests(new Set());
        });
        instance.on('moveend', updateView);
        instance.on('resize', updateView);
        instance.invalidateSize();
        setReady(true);
      })
      .catch(() => {
        setError(true);
        setBusy(false);
      });
    return () => {
      disposed = true;
      window.clearTimeout(viewTimer.current);
      imageCache.stop();
      map.current?.remove();
      map.current = null;
      visibleLayer.current = null;
    };
  }, [place.latitude, place.longitude, place.name, outside]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    let active = true;
    loadRadarTimes(controller.signal, retry > 0)
      .then((frames) => {
        if (active) {
          setTimes(frames);
          setNow(Date.now());
          setTarget(Date.now() - 20 * 60000);
        }
      })
      .catch(() => {
        if (active) {
          setError(true);
          setBusy(false);
        }
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [retry]);

  useEffect(() => {
    const instance = map.current,
      L = leaflet.current;
    if (!ready || !instance || !L) return;
    if (!selected) {
      visibleLayer.current?.remove();
      visibleLayer.current = null;
      imageCache.stop();
      let active = true;
      queueMicrotask(() => {
        if (!active) return;
        setDisplayed(null);
        if (times.length) setBusy(false);
      });
      return () => {
        active = false;
      };
    }
    const bounds = instance.getBounds(),
      size = instance.getSize();
    if (size.x <= 0 || size.y <= 0) return;
    const sw = L.CRS.EPSG3857.project(bounds.getSouthWest()),
      ne = L.CRS.EPSG3857.project(bounds.getNorthEast());
    const viewport = {
      west: sw.x,
      south: sw.y,
      east: ne.x,
      north: ne.y,
      width: size.x,
      height: size.y,
    };
    const url = radarImageUrl(selected, viewport);
    const neighbours = radarPrefetchFrames(times, selected).map((frame) =>
      radarImageUrl(frame, viewport),
    );
    imageCache.retainRequests(new Set([url, ...neighbours]));
    let active = true;
    let pendingLayer: Leaflet.ImageOverlay | null = null;
    // Keep the last finished image visible while the requested frame is prepared.
    const timer = window.setTimeout(
      () => {
        setBusy(true);
        setError(false);
        void imageCache
          .load(url, true)
          .then((image) => {
            if (!active) return;
            const layer = L.imageOverlay(image.url, bounds, {
              opacity: 0.76,
              interactive: false,
            });
            pendingLayer = layer;
            layer.once('load', () => {
              if (!active) {
                layer.remove();
                return;
              }
              visibleLayer.current?.remove();
              visibleLayer.current = layer;
              pendingLayer = null;
              imageCache.pin(url);
              setDisplayed(selected);
              setBusy(false);
              const connection = (
                navigator as Navigator & {
                  connection?: { saveData?: boolean; effectiveType?: string };
                }
              ).connection;
              if (
                !dragging &&
                !connection?.saveData &&
                !['slow-2g', '2g'].includes(connection?.effectiveType ?? '')
              ) {
                for (const nextUrl of neighbours)
                  void imageCache.load(nextUrl).catch(() => {});
              }
            });
            layer.once('error', () => {
              if (!active) return;
              layer.remove();
              pendingLayer = null;
              setError(true);
              setBusy(false);
              setPlaying(false);
            });
            layer.addTo(instance);
          })
          .catch((failure: unknown) => {
            if (!active) return;
            if (
              failure instanceof DOMException &&
              failure.name === 'AbortError'
            ) {
              setBusy(false);
              return;
            }
            setError(true);
            setBusy(false);
            setPlaying(false);
          });
      },
      imageCache.has(url) ? 0 : dragging ? 160 : 40,
    );
    return () => {
      active = false;
      clearTimeout(timer);
      pendingLayer?.remove();
    };
  }, [selected, ready, view, retry, times, dragging]);

  useEffect(() => {
    if (!playing || busy || error || !displayed || times.length < 2) return;
    const timer = window.setTimeout(() => {
      const next = nextRadarFrame(times, displayed.time);
      if (next) setTarget(next.time);
    }, speed);
    return () => clearTimeout(timer);
  }, [playing, busy, error, times, displayed, speed]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) {
        setPlaying(false);
        imageCache.retainRequests(new Set());
      } else {
        setView((value) => value + 1);
      }
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);

  const timeLabel = (time: number) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: place.timezone || 'Europe/Berlin',
      hour: '2-digit',
      minute: '2-digit',
    }).format(time);
  const latestObservation = times
    .filter((frame) => !frame.forecast)
    .at(-1)?.time;
  const stale =
    latestObservation !== undefined && now - latestObservation > 30 * 60000;
  const hasForecast = times.some((frame) => frame.forecast && frame.time > now);
  const stepFrame = (direction: -1 | 1) => {
    setPlaying(false);
    const index = times.indexOf(selected ?? times[0]);
    const frame =
      times[Math.max(0, Math.min(times.length - 1, index + direction))];
    if (frame) setTarget(frame.time);
  };
  return (
    <dialog
      className="radar-dialog"
      ref={dialog}
      aria-labelledby="radar-title"
      onCancel={onClose}
    >
      <header className="radar-header">
        <div>
          <h2 id="radar-title">{t('Regenradar')}</h2>
          <p>
            {outside ? t('Deutschland') : place.name} ·{' '}
            {t('Verlauf & Vorhersage')}
          </p>
        </div>
        <button
          type="button"
          className="radar-button"
          onClick={onClose}
          aria-label={t('Radar schließen')}
        >
          <X aria-hidden="true" />
        </button>
      </header>
      <div className="radar-map-wrap">
        <div
          className="radar-map"
          ref={container}
          aria-label={t('Niederschlagskarte')}
        />
        <button
          type="button"
          className="radar-center radar-button"
          aria-label={t('Karte zentrieren')}
          onClick={() =>
            map.current?.setView(
              outside ? [51, 10] : [place.latitude, place.longitude],
              outside ? 6 : 8,
            )
          }
        >
          <LocateFixed aria-hidden="true" />
        </button>
        <output
          className={`radar-map-status${busy ? ' is-loading' : ''}`}
          aria-live="polite"
        >
          {displayed && (
            <span>
              {t(displayed.forecast ? 'Vorhersage' : 'Messung')}{' '}
              <strong>{timeLabel(displayed.time)}</strong>
            </span>
          )}
          {error ? (
            <span>
              {t('Radardaten nicht verfügbar. Bitte erneut versuchen.')}
            </span>
          ) : busy ? (
            <span>
              {t(
                displayed
                  ? 'Nächstes Radarbild wird geladen …'
                  : 'Radardaten werden geladen …',
              )}
            </span>
          ) : (
            !displayed && (
              <span>
                {t('Für diesen Zeitpunkt sind keine Radardaten verfügbar.')}
              </span>
            )
          )}
        </output>
      </div>
      <div className="radar-controls">
        <button
          type="button"
          className="radar-button radar-play"
          disabled={!times.length || error}
          onClick={() => {
            if (!selected && times.length) setTarget(times[0].time);
            setPlaying((value) => !value);
          }}
          aria-label={playing ? t('Pause') : t('Abspielen')}
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
        <div className="radar-timeline">
          <div className="radar-range">
            <input
              type="range"
              min={now - RADAR_WINDOW}
              max={now + RADAR_WINDOW}
              step={300000}
              value={Math.max(
                now - RADAR_WINDOW,
                Math.min(now + RADAR_WINDOW, target),
              )}
              disabled={!times.length}
              aria-label={t('Radarzeit')}
              aria-valuetext={timeLabel(selected?.time ?? target)}
              onPointerDown={() => setDragging(true)}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
              onBlur={() => setDragging(false)}
              onChange={(event) => {
                setPlaying(false);
                setTarget(Number(event.target.value));
              }}
            />
            <span className="radar-now-tick" aria-hidden="true" />
          </div>
          <div className="radar-time-labels">
            <span>{timeLabel(now - RADAR_WINDOW)}</span>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setTarget(now);
              }}
            >
              {t('Jetzt')}
              <small>{timeLabel(now)}</small>
            </button>
            <span>{timeLabel(now + RADAR_WINDOW)}</span>
          </div>
        </div>
        <button
          type="button"
          className="radar-button"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError(false);
            setPlaying(false);
            setRetry((value) => value + 1);
          }}
          aria-label={t('Radar aktualisieren')}
        >
          <RefreshCw aria-hidden="true" />
        </button>
      </div>
      <div className="radar-playback-options">
        <div>
          <button
            type="button"
            className="radar-button"
            disabled={!times.length}
            onClick={() => stepFrame(-1)}
            aria-label={t('Vorheriges Radarbild')}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <span>{timeLabel(selected?.time ?? target)}</span>
          <button
            type="button"
            className="radar-button"
            disabled={!times.length}
            onClick={() => stepFrame(1)}
            aria-label={t('Nächstes Radarbild')}
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
        <label htmlFor="radar-speed">
          {t('Tempo')}
          <select
            id="radar-speed"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          >
            <option value={1100}>{t('Langsam')}</option>
            <option value={750}>{t('Normal')}</option>
            <option value={350}>{t('Schnell')}</option>
          </select>
        </label>
      </div>
      <div className="radar-notes">
        {!busy && !error && !hasForecast && (
          <p>{t('Aktuell ist keine Radarvorhersage verfügbar.')}</p>
        )}
        {outside && (
          <p>
            {t(
              'Für diesen Ort sind keine DWD-Radardaten verfügbar. Die Karte zeigt Deutschland.',
            )}
          </p>
        )}
        {stale && (
          <p>{t('Die letzte Radarmessung ist älter als 30 Minuten.')}</p>
        )}
        {baseError && (
          <p>
            {t('Die Hintergrundkarte konnte nicht vollständig geladen werden.')}
          </p>
        )}
        <details>
          <summary>{t('Niederschlagslegende & Hinweise')}</summary>
          <div className="radar-blue-legend">
            <p>{t('Niederschlagsintensität (mm/h)')}</p>
            <ul
              aria-label={t(
                'Blaue Niederschlagsskala: hell = schwach, dunkel = stark',
              )}
            >
              {RADAR_RAIN_PALETTE.map((entry) => (
                <li key={entry.source}>
                  <span
                    style={{ backgroundColor: entry.color }}
                    aria-hidden="true"
                  />
                  <span>
                    {entry.label.replaceAll('.', locale === 'de' ? ',' : '.')}
                  </span>
                </li>
              ))}
            </ul>
            <p className="radar-no-data-key">
              <span aria-hidden="true" />
              {t('Grau: keine Radardaten')}
            </p>
          </div>
          <p>
            {t(
              'Messungen und Radarvorhersage bis etwa zwei Stunden voraus. Abdeckung: Deutschland und Grenzregionen. Die Vorhersage wird mit zunehmendem Abstand unsicherer. Ungefärbte Flächen können auch fehlende Messdaten bedeuten.',
            )}
          </p>
        </details>
        <p>
          ©{' '}
          <a
            href="https://www.dwd.de/DE/service/copyright/copyright_node.html"
            target="_blank"
            rel="noreferrer"
          >
            Deutscher Wetterdienst
          </a>{' '}
          ·{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY 4.0
          </a>{' '}
          · {t('Kartendarstellung angepasst')} ·{' '}
          {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- Shared with the standalone Capacitor build, without the Next router. */}
          <a href="/privacy">{t('Datenschutz')}</a>
        </p>
      </div>
    </dialog>
  );
}

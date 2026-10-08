'use client';

import {
  Check,
  ChevronDown,
  ChevronRight,
  LocateFixed,
  MapPin,
  Moon,
  Plus,
  RefreshCw,
  Sun,
  X,
} from 'lucide-react';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useLocale } from '@/lib/i18n/use-locale';
import type { AppTheme } from '@/lib/theme';
import type {
  GeolocationResult,
  LocationPrecision,
} from '@/lib/weather/geolocation';
import type { Place } from '@/lib/weather/types';

interface SettingsPanelProps {
  theme: AppTheme;
  photosEnabled: boolean;
  savedPlaces: Place[];
  placeId: string;
  geolocationDefault: boolean;
  precision: LocationPrecision;
  locating: boolean;
  locationStatus: GeolocationResult['status'] | null;
  onClose: () => void;
  onTheme: (theme: AppTheme) => void;
  onPhotos: (enabled: boolean) => void;
  onChoosePlace: (place: Place) => void;
  onRemovePlace: (id: string) => void;
  onSearch: () => void;
  onGpsDefault: (enabled: boolean) => void;
  onPrecision: (precision: LocationPrecision) => void;
  onLocate: () => void;
  onReset: () => void;
}

export function SettingsPanel(props: SettingsPanelProps) {
  const { t, preference, setLanguage } = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const closeFromBackdrop = useEffectEvent((event: MouseEvent) => {
    if (event.target === dialogRef.current) props.onClose();
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    dialog?.addEventListener('click', closeFromBackdrop);
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      dialog?.removeEventListener('click', closeFromBackdrop);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  const locationFeedback = props.locating
    ? t('Standort wird ermittelt …')
    : props.locationStatus === 'allowed'
      ? t('Standort aktualisiert')
      : props.locationStatus
        ? t(
            {
              denied:
                'Erlaube den Standortzugriff in den Einstellungen deines Browsers.',
              blocked:
                'Erlaube den Standortzugriff in den Einstellungen deines Browsers.',
              unavailable:
                'Dein Standort ist gerade nicht verfügbar. Versuche es erneut oder suche einen Ort.',
              timeout:
                'Die Standortsuche dauert zu lange. Bitte erneut versuchen.',
              inaccurate:
                'Der Standort ist zu ungenau. Suche deinen Ort oder versuche es erneut.',
            }[props.locationStatus],
          )
        : '';

  return (
    <dialog
      ref={dialogRef}
      className="settings-drawer"
      data-theme={props.theme}
      aria-labelledby="settings-title"
      onCancel={props.onClose}
    >
      <div className="settings-surface">
        <header className="drawer-title">
          <div>
            <h2 id="settings-title">{t('Einstellungen')}</h2>
            <p>{t('Dein Wetter. Deine Vorlieben.')}</p>
          </div>
          <button
            type="button"
            className="settings-close"
            aria-label={t('Menü schließen')}
            onClick={props.onClose}
            autoFocus
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="settings-body">
          <section
            className="settings-section"
            aria-labelledby="settings-general-title"
          >
            <h3 id="settings-general-title">{t('Sprache & Orte')}</h3>
            <label className="settings-language" htmlFor="settings-language">
              <span>{t('Sprache')}</span>
              <select
                id="settings-language"
                value={preference}
                onChange={(event) => setLanguage(event.target.value)}
              >
                <option value="auto">{t('Automatisch (Browser)')}</option>
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </label>
            <div className="settings-places">
              <h4>{t('Gespeicherte Orte')}</h4>
              {props.savedPlaces.map((saved) => (
                <div
                  className={`settings-place${saved.id === props.placeId ? ' is-active' : ''}`}
                  key={saved.id}
                >
                  <button
                    type="button"
                    className="settings-place-select"
                    aria-current={
                      saved.id === props.placeId ? 'location' : undefined
                    }
                    onClick={() => props.onChoosePlace(saved)}
                  >
                    {saved.id.startsWith('geo:') ? (
                      <LocateFixed aria-hidden="true" />
                    ) : (
                      <MapPin aria-hidden="true" />
                    )}
                    <span>
                      <strong>{saved.name}</strong>
                      {(saved.admin || saved.country) && (
                        <small>
                          {[saved.admin, saved.country]
                            .filter(Boolean)
                            .join(', ')}
                        </small>
                      )}
                    </span>
                    {saved.id === props.placeId && (
                      <Check
                        className="settings-place-check"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                  <button
                    type="button"
                    className="settings-place-remove"
                    aria-label={t('{{name}} entfernen', { name: saved.name })}
                    onClick={() => props.onRemovePlace(saved.id)}
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
              ))}
              {props.savedPlaces.length === 0 && (
                <p className="settings-help">
                  {t('Gesuchte Orte werden hier automatisch gespeichert.')}
                </p>
              )}
              <button
                type="button"
                className="settings-add-place"
                onClick={props.onSearch}
              >
                <Plus aria-hidden="true" />
                {t('Ort hinzufügen')}
              </button>
            </div>
          </section>

          <section
            className="settings-section"
            aria-labelledby="settings-appearance-title"
          >
            <h3 id="settings-appearance-title">{t('Darstellung')}</h3>
            <fieldset className="settings-segmented">
              <legend className="sr-only">{t('Darstellung')}</legend>
              <div>
                {(['light', 'dark'] as const).map((theme) => (
                  <button
                    type="button"
                    key={theme}
                    aria-pressed={props.theme === theme}
                    onClick={() => props.onTheme(theme)}
                  >
                    {theme === 'light' ? (
                      <Sun aria-hidden="true" />
                    ) : (
                      <Moon aria-hidden="true" />
                    )}
                    {theme === 'light' ? t('Hell') : t('Dunkel')}
                    {props.theme === theme && <Check aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </fieldset>
            <label
              className="settings-switch-row"
              htmlFor="settings-photos"
              aria-label={t('Wetterfotos anzeigen')}
            >
              <span>
                <strong>{t('Wetterfotos anzeigen')}</strong>
                <small>{t('Passende Bilder zu Ort und Wetter.')}</small>
              </span>
              <input
                id="settings-photos"
                type="checkbox"
                role="switch"
                aria-checked={props.photosEnabled}
                aria-label={t('Wetterfotos anzeigen')}
                checked={props.photosEnabled}
                onChange={(event) => props.onPhotos(event.target.checked)}
                aria-describedby="settings-photo-help"
              />
              <span className="settings-switch" aria-hidden="true" />
            </label>
            <p id="settings-photo-help" className="settings-help">
              {t(
                'Bilder von Wikimedia Commons. Dabei werden IP-Adresse, Ortsname und Wetterlage übertragen.',
              )}
            </p>
          </section>

          <section
            className="settings-section"
            aria-labelledby="settings-location-title"
          >
            <h3 id="settings-location-title">{t('Standort')}</h3>
            <label
              className="settings-switch-row"
              htmlFor="settings-gps"
              aria-label={t('GPS-Standort als Standard')}
            >
              <span>
                <strong>{t('GPS-Standort als Standard')}</strong>
                <small>
                  {t('Beim Start automatisch deinen Standort verwenden.')}
                </small>
              </span>
              <input
                id="settings-gps"
                type="checkbox"
                role="switch"
                aria-checked={props.geolocationDefault}
                aria-label={t('GPS-Standort als Standard')}
                checked={props.geolocationDefault}
                disabled={props.locating}
                onChange={(event) => props.onGpsDefault(event.target.checked)}
              />
              <span className="settings-switch" aria-hidden="true" />
            </label>
            <fieldset
              className="settings-precision"
              disabled={props.locating}
              aria-describedby="settings-precision-help"
            >
              <legend>{t('Koordinatengenauigkeit')}</legend>
              <div>
                {(['private', 'approximate', 'exact'] as const).map(
                  (precision) => (
                    <label
                      key={precision}
                      htmlFor={`settings-precision-${precision}`}
                      aria-label={
                        precision === 'private'
                          ? t('Privat')
                          : precision === 'approximate'
                            ? t('Ungefähr')
                            : t('Exakt')
                      }
                    >
                      <input
                        id={`settings-precision-${precision}`}
                        type="radio"
                        name="precision"
                        value={precision}
                        checked={props.precision === precision}
                        onChange={() => props.onPrecision(precision)}
                      />
                      <span>
                        <strong>
                          {precision === 'private'
                            ? t('Privat')
                            : precision === 'approximate'
                              ? t('Ungefähr')
                              : t('Exakt')}
                        </strong>
                        <small>
                          {precision === 'private'
                            ? t('ca. 5 km')
                            : precision === 'approximate'
                              ? t('ca. 1 km')
                              : t('GPS')}
                        </small>
                      </span>
                    </label>
                  ),
                )}
              </div>
              <p id="settings-precision-help" className="settings-help">
                {t(
                  'Gerundete Koordinaten schützen deine Privatsphäre. Exakt kann an Küsten und in Bergen hilfreicher sein.',
                )}
              </p>
            </fieldset>
            <button
              type="button"
              className="settings-location-button"
              disabled={props.locating}
              onClick={props.onLocate}
            >
              {props.locating ? (
                <RefreshCw className="spinning" aria-hidden="true" />
              ) : (
                <LocateFixed aria-hidden="true" />
              )}
              {props.locating
                ? t('Standort wird ermittelt …')
                : props.geolocationDefault
                  ? t('Standort aktualisieren')
                  : t('Meinen Standort verwenden')}
            </button>
            <output
              aria-live="polite"
              className={`settings-location-status${props.locationStatus && props.locationStatus !== 'allowed' ? ' is-error' : ''}`}
            >
              {locationFeedback}
            </output>
            <details className="settings-disclosure">
              <summary>
                {t('Wie wird mein Standort verwendet?')}
                <ChevronDown aria-hidden="true" />
              </summary>
              <p>
                {t(
                  'Die gewählten oder gerundeten Koordinaten gehen an Open‑Meteo und zur Ortsbenennung an OpenStreetMap. GPS wird bei künftigen Starts nur mit aktiviertem Standard automatisch abgefragt.',
                )}
              </p>
            </details>
          </section>

          <section
            className="settings-section settings-data"
            aria-labelledby="settings-data-title"
          >
            <h3 id="settings-data-title">{t('Datenschutz & Daten')}</h3>
            {/* oxlint-disable-next-line nextjs/no-html-link-for-pages -- Shared with the standalone Capacitor build, without the Next router. */}
            <a className="settings-privacy-link" href="/privacy">
              {t('Datenschutz')}
              <ChevronRight aria-hidden="true" />
            </a>
            {confirmReset ? (
              <div className="settings-reset-confirm">
                <p>
                  <strong>{t('Lokale Daten wirklich löschen?')}</strong>
                </p>
                <p>
                  {t(
                    'Gespeicherte Orte und Einstellungen werden zurückgesetzt. Dieser Schritt lässt sich nicht rückgängig machen.',
                  )}
                </p>
                <div>
                  <button type="button" onClick={() => setConfirmReset(false)}>
                    {t('Abbrechen')}
                  </button>
                  <button
                    type="button"
                    className="settings-reset-action"
                    disabled={props.locating}
                    onClick={() => {
                      setLanguage('auto');
                      props.onReset();
                    }}
                  >
                    {t('Daten löschen')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="settings-reset"
                onClick={() => setConfirmReset(true)}
              >
                {t('Alle lokalen Daten löschen')}
              </button>
            )}
          </section>
          <p className="settings-save-note">
            {t(
              'Einstellungen werden automatisch auf diesem Gerät gespeichert.',
            )}
          </p>
        </div>
      </div>
    </dialog>
  );
}

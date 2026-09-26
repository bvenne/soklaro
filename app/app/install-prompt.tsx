'use client';

import { Capacitor } from '@capacitor/core';
import { Share, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SoklaroMark } from '@/app/components/soklaro-mark';
import { useLocale } from '@/lib/i18n/use-locale';

const INSTALL_PROMPT_SEEN_KEY = 'soklaro:pwa-install-prompt-seen';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type InstallPlatform = 'android' | 'ios';

function wasInstallPromptSeen(): boolean {
  try {
    return localStorage.getItem(INSTALL_PROMPT_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
}

function rememberInstallPrompt(): void {
  try {
    localStorage.setItem(INSTALL_PROMPT_SEEN_KEY, 'true');
  } catch {
    // The prompt can still be dismissed when browser storage is unavailable.
  }
}

function isStandalone(): boolean {
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
}

function isIosOrIpados(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function InstallPrompt() {
  const { t } = useLocale();
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const dismiss = () => {
    rememberInstallPrompt();
    setVisible(false);
    setDeferredPrompt(null);
  };

  useEffect(() => {
    if (Capacitor.isNativePlatform() || isStandalone() || wasInstallPromptSeen()) return;

    let revealTimer: number | undefined;
    const reveal = (nextPlatform: InstallPlatform) => {
      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => {
        setPlatform(nextPlatform);
        setVisible(true);
      }, 900);
    };

    if (isIosOrIpados()) {
      reveal('ios');
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      if (!/Android/i.test(navigator.userAgent)) return;
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      reveal('android');
    };
    const handleInstalled = () => {
      rememberInstallPrompt();
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.clearTimeout(revealTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';
    dialog?.showModal();
    titleRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      dialog?.close();
      previousFocus?.focus();
    };
  }, [visible]);

  const install = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      // Browser UI may be cancelled or become unavailable between event and click.
    } finally {
      setInstalling(false);
      dismiss();
    }
  };

  if (!visible || !platform) return null;

  return (
    <dialog ref={dialogRef} className="install-prompt-backdrop" aria-labelledby="install-prompt-title" onCancel={(event) => { event.preventDefault(); dismiss(); }}>
      <section className="install-prompt">
        <button className="install-prompt-close" aria-label={t('Installationshinweis schließen')} onClick={dismiss}><X aria-hidden="true" /></button>
        <div className="install-prompt-logo" aria-hidden="true"><SoklaroMark /></div>
        <h2 id="install-prompt-title" ref={titleRef} tabIndex={-1}>{t('soklaro installieren')}</h2>
        {platform === 'android' ? (
          <p>{t('Installiere soklaro für schnellen Zugriff direkt auf deinem Home-Bildschirm.')}</p>
        ) : (
          <>
            <p>{t('Tippe auf:')}</p>
            <div className="ios-install-step"><Share aria-hidden="true" /><strong>{t('Teilen')}</strong><span aria-hidden="true">→</span><strong>{t('Zum Home-Bildschirm')}</strong></div>
          </>
        )}
        <div className="install-prompt-actions">
          {platform === 'android' && <button className="install-prompt-primary" disabled={installing} onClick={() => void install()}>{installing ? t('Installationsdialog wird geöffnet …') : t('App installieren')}</button>}
          <button className="install-prompt-secondary" onClick={dismiss}>{platform === 'ios' ? t('Verstanden') : t('Nicht jetzt')}</button>
        </div>
      </section>
    </dialog>
  );
}

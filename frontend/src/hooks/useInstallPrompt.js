import { useEffect, useState, useCallback } from 'react';

/**
 * Hook para gerenciar instalação do PWA.
 * --------------------------------------------------------------
 * Estados:
 *  - canInstall: true se o navegador suporta e o usuário ainda não instalou
 *  - isStandalone: true se o app já está rodando como instalado (tela cheia)
 *  - isIOS: true em iOS (precisa de instrução manual, não tem prompt automático)
 *  - prompt(): dispara o prompt nativo (Android/Chrome/Edge)
 *  - dismiss(): marca como dispensado por 7 dias (não mostra banner de novo)
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Detecta se já está instalado (standalone mode)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);

    // Detecta iOS — só Safari permite instalar PWA, e não há prompt automático
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(ios);

    // Verifica se o usuário dispensou recentemente
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
      if (elapsed < SEVEN_DAYS) {
        setDismissed(true);
      }
    }

    // Captura o evento beforeinstallprompt — só roda em Android/Chrome/Edge
    function handleBeforeInstall(e) {
      e.preventDefault(); // Impede o prompt automático do navegador
      setDeferredPrompt(e); // Guarda pra disparar quando o usuário quiser
    }

    function handleInstalled() {
      setDeferredPrompt(null);
      setIsStandalone(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const prompt = useCallback(async () => {
    if (!deferredPrompt) return null;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null); // Só pode ser usado uma vez
    return outcome; // 'accepted' | 'dismissed'
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
    setDismissed(true);
  }, []);

  // Pode instalar se: tem prompt OU é iOS (usuário precisa fazer manualmente)
  const canInstall = !isStandalone && !dismissed && (!!deferredPrompt || isIOS);

  return { canInstall, isStandalone, isIOS, prompt, dismiss };
}

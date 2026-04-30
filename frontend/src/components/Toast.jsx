import { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

/**
 * Toast flutuante — desaparece após N segundos.
 * Posicionado no topo (mobile) ou canto superior direito (desktop).
 * Mantém o aesthetic neo-brutalista: borda preta, sombra dura.
 */
export default function Toast({ message, onClose, duration = 4500, icon: Icon = Sparkles }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div
      className="fixed z-50 left-4 right-4 top-4 md:left-auto md:right-6 md:top-6 md:max-w-sm
                 bg-accent border-2 border-ink-900 shadow-flat-sm md:shadow-flat
                 p-3 md:p-4 flex items-start gap-3 animate-slide-up"
      role="status"
      aria-live="polite"
    >
      <div className="w-9 h-9 bg-ink-900 text-accent flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5" strokeWidth={2.5} />
      </div>
      <p className="flex-1 text-sm font-semibold text-ink-900 leading-snug">{message}</p>
      <button
        onClick={onClose}
        className="w-7 h-7 flex items-center justify-center hover:bg-ink-900/10 transition-colors flex-shrink-0"
        aria-label="Fechar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

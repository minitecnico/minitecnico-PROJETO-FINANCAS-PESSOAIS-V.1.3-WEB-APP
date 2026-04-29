import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal responsivo:
 *  - Mobile: ocupa 95% da altura, surge de baixo (bottom-sheet style)
 *  - Desktop: modal centralizado tradicional
 *
 * Fecha com ESC, clique fora, ou botão X.
 * Trava scroll do body enquanto aberto.
 */
export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'md:max-w-sm',
    md: 'md:max-w-md',
    lg: 'md:max-w-2xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" />

      {/* Conteúdo */}
      <div
        className={`relative bg-white border-2 border-ink-900 shadow-flat w-full
                    max-h-[95vh] md:max-h-[90vh] overflow-y-auto
                    ${sizes[size]} animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b-2 border-ink-900">
          <h2 className="font-display text-xl md:text-2xl font-bold truncate pr-4">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center hover:bg-ink-100 transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}

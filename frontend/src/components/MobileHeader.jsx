import { Wallet, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Header mobile — visível apenas em telas < md.
 * Substitui parcialmente a função da sidebar (branding + logout).
 * Sticky no topo para sempre estar acessível.
 */
export default function MobileHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="md:hidden sticky top-0 z-20 bg-ink-900 text-ink-50 border-b-2 border-ink-900 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 bg-accent flex items-center justify-center border-2 border-ink-50 flex-shrink-0">
          <Wallet className="w-4 h-4 text-ink-900" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-lg font-bold leading-none">Cofre</h1>
          <p className="text-[9px] uppercase tracking-widest text-ink-300 mt-0.5 truncate">
            {user?.name}
          </p>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-10 h-10 flex items-center justify-center text-ink-300 hover:bg-ink-800 hover:text-negative transition-colors"
        aria-label="Sair"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </header>
  );
}

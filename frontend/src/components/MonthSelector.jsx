import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useMonth } from '../context/MonthContext';

/**
 * Seletor de mês — barra horizontal com:
 *  - Setinha "←" para mês anterior
 *  - Nome do mês selecionado (clique vai pra hoje, se não for o mês atual)
 *  - Setinha "→" para próximo mês
 *
 * Mantém o aesthetic neo-brutalista do app: borda preta sólida, sombra dura.
 */
export default function MonthSelector() {
  const { label, shortLabel, isCurrentMonth, goToPrevious, goToNext, goToCurrent } = useMonth();

  return (
    <div className="card-flat bg-white p-2 flex items-center gap-1 sm:gap-2">
      <button
        onClick={goToPrevious}
        className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center hover:bg-ink-100 active:bg-accent transition-colors flex-shrink-0"
        aria-label="Mês anterior"
        title="Mês anterior"
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
      </button>

      <button
        onClick={goToCurrent}
        disabled={isCurrentMonth}
        className={`flex-1 flex items-center justify-center gap-2 min-h-[40px] px-3 py-2 font-semibold transition-colors ${
          isCurrentMonth
            ? 'text-ink-900 cursor-default'
            : 'text-ink-700 hover:bg-accent hover:text-ink-900 cursor-pointer'
        }`}
        title={isCurrentMonth ? 'Você está no mês atual' : 'Voltar ao mês atual'}
      >
        <Calendar className="w-4 h-4 flex-shrink-0" />
        <span className="font-display text-base md:text-lg truncate">
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{shortLabel}</span>
        </span>
        {!isCurrentMonth && (
          <span className="hidden md:inline text-[10px] uppercase tracking-widest font-bold text-ink-500 ml-1">
            · ir pra hoje
          </span>
        )}
      </button>

      <button
        onClick={goToNext}
        className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center hover:bg-ink-100 active:bg-accent transition-colors flex-shrink-0"
        aria-label="Próximo mês"
        title="Próximo mês"
      >
        <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

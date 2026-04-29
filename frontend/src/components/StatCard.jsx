import { formatCurrency } from '../utils/format';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * Card de estatística — usado no topo do dashboard.
 * variant: 'balance' | 'income' | 'expense'
 *
 * Tipografia escala: text-2xl no mobile → text-4xl no desktop.
 * Padding e ícones também ajustam.
 */
export default function StatCard({ label, value, variant = 'balance', icon: Icon, trend, sublabel }) {
  const variants = {
    balance: 'bg-ink-900 text-ink-50',
    income: 'bg-accent text-ink-900',
    expense: 'bg-white text-ink-900',
  };

  const numColor =
    variant === 'expense'
      ? value < 0
        ? 'text-negative'
        : 'text-ink-900'
      : value < 0
        ? 'text-negative'
        : '';

  return (
    <div className={`card-flat p-4 md:p-6 ${variants[variant]}`}>
      <div className="flex items-start justify-between mb-3 md:mb-4 gap-3">
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] md:text-[11px] uppercase font-semibold tracking-widest ${
            variant === 'balance' ? 'text-ink-300' : 'text-ink-700'
          }`}>
            {label}
          </p>
          {sublabel && (
            <p className={`text-xs mt-0.5 truncate ${
              variant === 'balance' ? 'text-ink-400' : 'text-ink-500'
            }`}>
              {sublabel}
            </p>
          )}
        </div>
        {Icon && (
          <div
            className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center flex-shrink-0 ${
              variant === 'income'
                ? 'bg-ink-900 text-accent'
                : variant === 'balance'
                  ? 'bg-accent text-ink-900'
                  : 'bg-ink-100'
            }`}
          >
            <Icon className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
          </div>
        )}
      </div>

      <div className={`stat-number text-2xl sm:text-3xl md:text-4xl break-all ${numColor}`}>
        {formatCurrency(value)}
      </div>

      {trend !== undefined && (
        <div className="mt-2 md:mt-3 flex items-center gap-1 text-xs md:text-sm">
          {trend > 0 ? (
            <ArrowUpRight className="w-4 h-4 text-positive" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-negative" />
          )}
          <span className={`font-medium ${trend > 0 ? 'text-positive' : 'text-negative'}`}>
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className={`truncate ${variant === 'balance' ? 'text-ink-400' : 'text-ink-500'}`}>
            vs período anterior
          </span>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Pencil, Trash2, CreditCard as CardIcon } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/format';
import Modal from './Modal';
import TransactionForm from './TransactionForm';

/**
 * Lista de transações.
 * --------------------------------------------------------------
 * Mobile: layout vertical, botões sempre visíveis, valor em destaque
 * Desktop: layout horizontal compacto, botões aparecem no hover
 */
export default function TransactionList({ items, loading, onChange, onDelete, emptyMessage = 'Nenhuma transação encontrada' }) {
  const [editing, setEditing] = useState(null);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 md:h-16 bg-ink-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card-flat p-8 md:p-12 text-center">
        <p className="text-ink-500 font-medium text-sm md:text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border-2 border-ink-900 shadow-flat-sm md:shadow-flat divide-y-2 divide-ink-100">
        {items.map((t) => {
          const isIncome = t.type === 'income';
          const cat = t.category || {};
          const card = t.credit_card || null;
          return (
            <div
              key={t.id}
              className="group flex items-stretch hover:bg-ink-50 transition-colors"
            >
              {/* Indicador de cor categoria (vertical, sempre visível) */}
              <div
                className="w-1 flex-shrink-0"
                style={{ backgroundColor: cat.color || '#64748b' }}
              />

              {/* Conteúdo */}
              <div className="flex-1 min-w-0 p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                {/* Detalhes (sempre primeiro) */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-medium text-ink-900 text-sm md:text-base truncate">
                      {t.description}
                    </h4>
                    {card && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                        style={{ backgroundColor: card.color || '#1e293b' }}
                      >
                        <CardIcon className="w-3 h-3" /> {card.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-500 flex-wrap">
                    <span className="font-medium" style={{ color: cat.color }}>
                      {cat.name}
                    </span>
                    <span>·</span>
                    <span>{formatDate(t.date, 'long')}</span>
                  </div>
                </div>

                {/* Valor + ações (linha separada no mobile, ao lado no desktop) */}
                <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 mt-1 md:mt-0">
                  <div className={`stat-number text-base md:text-lg font-semibold whitespace-nowrap ${isIncome ? 'text-positive' : 'text-negative'}`}>
                    {isIncome ? '+' : '−'} {formatCurrency(t.amount)}
                  </div>

                  {/* Ações: sempre visíveis no mobile, hover no desktop */}
                  <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditing(t)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-ink-200 transition-colors"
                      aria-label="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Excluir "${t.description}"?`)) onDelete(t.id);
                      }}
                      className="w-9 h-9 flex items-center justify-center text-negative hover:bg-red-50 transition-colors"
                      aria-label="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Editar transação">
        {editing && (
          <TransactionForm
            initial={editing}
            onSaved={() => {
              setEditing(null);
              onChange?.();
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  );
}

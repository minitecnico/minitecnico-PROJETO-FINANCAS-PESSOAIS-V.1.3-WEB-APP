import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Plus, Filter } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import TransactionList from '../components/TransactionList';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import { useDisclosure } from '../hooks/useDisclosure';
import { formatCurrency } from '../utils/format';

export default function TransactionListPage({ type = 'income' }) {
  const isIncome = type === 'income';
  const [filter, setFilter] = useState({ period: 'all' });
  const { isOpen, open, close } = useDisclosure();

  const dateRange = (() => {
    const now = new Date();
    if (filter.period === 'today') {
      const start = new Date(now.setHours(0, 0, 0, 0));
      return { startDate: start.toISOString().slice(0, 10) };
    }
    if (filter.period === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { startDate: d.toISOString().slice(0, 10) };
    }
    if (filter.period === 'month') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: d.toISOString().slice(0, 10) };
    }
    return {};
  })();

  const { items, total, loading, refresh, remove } = useTransactions({
    type,
    limit: 100,
    ...dateRange,
  });

  const totalAmount = items.reduce((s, t) => s + Number(t.amount), 0);

  const Icon = isIncome ? ArrowUpCircle : ArrowDownCircle;
  const accentClass = isIncome ? 'text-positive' : 'text-negative';
  const bgAccent = isIncome ? 'bg-accent text-ink-900' : 'bg-ink-900 text-white';

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 md:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-ink-500 font-semibold">
            {isIncome ? 'Entradas' : 'Saídas'}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-1 leading-tight flex items-center gap-2 md:gap-3">
            <Icon className={`w-7 h-7 md:w-10 md:h-10 ${accentClass} flex-shrink-0`} />
            <span className="truncate">{isIncome ? 'Receitas' : 'Despesas'}</span>
          </h1>
        </div>

        <button onClick={open} className={`px-4 md:px-5 py-2.5 md:py-3 min-h-[44px] font-semibold border-2 border-ink-900 shadow-flat-sm hover:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all ${bgAccent} self-start sm:self-end flex-shrink-0`}>
          <span className="flex items-center gap-2 text-sm md:text-base">
            <Plus className="w-5 h-5" />
            <span className="whitespace-nowrap">Nova {isIncome ? 'receita' : 'despesa'}</span>
          </span>
        </button>
      </div>

      {/* Resumo + filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
        <div className={`card-flat p-4 md:p-6 ${isIncome ? 'bg-accent' : 'bg-ink-900 text-ink-50'}`}>
          <p className={`text-[10px] md:text-xs uppercase font-semibold tracking-widest ${isIncome ? 'text-ink-700' : 'text-ink-300'}`}>
            Total no período
          </p>
          <p className="stat-number text-3xl md:text-4xl mt-2 md:mt-3 break-all">{formatCurrency(totalAmount)}</p>
          <p className={`text-xs md:text-sm mt-2 ${isIncome ? 'text-ink-700' : 'text-ink-400'}`}>
            {total} {total === 1 ? 'transação' : 'transações'}
          </p>
        </div>

        <div className="card-flat p-4 md:p-6 md:col-span-2">
          <div className="flex items-center gap-2 mb-2 md:mb-3">
            <Filter className="w-4 h-4" />
            <p className="text-[10px] md:text-xs uppercase font-semibold tracking-widest">
              Filtrar por período
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { value: 'all', label: 'Tudo' },
              { value: 'today', label: 'Hoje' },
              { value: 'week', label: 'Semana' },
              { value: 'month', label: 'Mês' },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setFilter({ period: p.value })}
                className={`py-2.5 min-h-[44px] text-sm font-medium border-2 transition-all ${
                  filter.period === p.value
                    ? 'bg-ink-900 text-white border-ink-900'
                    : 'bg-white text-ink-700 border-ink-300 hover:border-ink-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      <TransactionList
        items={items}
        loading={loading}
        onChange={refresh}
        onDelete={remove}
        emptyMessage={`Nenhuma ${isIncome ? 'receita' : 'despesa'} encontrada para o período selecionado.`}
      />

      {/* Modal nova transação */}
      <Modal isOpen={isOpen} onClose={close} title={`Nova ${isIncome ? 'receita' : 'despesa'}`}>
        <TransactionForm
          defaultType={type}
          onSaved={() => {
            close();
            refresh();
          }}
          onCancel={close}
        />
      </Modal>
    </div>
  );
}

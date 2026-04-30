import { useEffect, useState } from 'react';
import { Repeat, Plus, Pause, Play, Trash2, Pencil, ArrowUpCircle, ArrowDownCircle, CreditCard as CardIcon } from 'lucide-react';
import { recurringService, categoryService, cardService } from '../services';
import { formatCurrency, parseAmount } from '../utils/format';
import Modal from '../components/Modal';
import { useDisclosure } from '../hooks/useDisclosure';

/**
 * Página de gerenciamento de transações recorrentes.
 * --------------------------------------------------------------
 * Lista todas as recorrências (ativas e pausadas), permite:
 *   - Criar nova
 *   - Editar (não muda transações passadas)
 *   - Pausar/retomar
 *   - Excluir (transações já criadas viram avulsas)
 */

function RecurringForm({ initial, onSaved, onCancel }) {
  const isEdit = !!initial;
  const [type, setType] = useState(initial?.type || 'expense');
  const [amount, setAmount] = useState(initial?.amount?.toString().replace('.', ',') || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [dayOfMonth, setDayOfMonth] = useState(initial?.day_of_month || 5);
  const [categoryId, setCategoryId] = useState(initial?.category?.id || '');
  const [creditCardId, setCreditCardId] = useState(initial?.credit_card?.id || '');
  const [paymentMethod, setPaymentMethod] = useState(initial?.credit_card ? 'card' : 'account');

  const [categories, setCategories] = useState([]);
  const [cards, setCards] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    categoryService.list(type).then(setCategories).catch(() => setCategories([]));
  }, [type]);

  useEffect(() => {
    if (type === 'expense') {
      cardService.list().then(setCards).catch(() => setCards([]));
    }
  }, [type]);

  useEffect(() => {
    if (categories.length > 0 && !categories.find((c) => c.id === categoryId)) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        type,
        amount: parseAmount(amount),
        description: description.trim(),
        category_id: categoryId,
        credit_card_id: type === 'expense' && paymentMethod === 'card' ? creditCardId : null,
        day_of_month: parseInt(dayOfMonth, 10),
      };
      if (!payload.amount || payload.amount <= 0) throw new Error('Informe um valor válido');
      if (!payload.description) throw new Error('Informe uma descrição');
      if (!payload.category_id) throw new Error('Selecione uma categoria');
      if (payload.day_of_month < 1 || payload.day_of_month > 31) {
        throw new Error('Dia do mês deve ser entre 1 e 31');
      }

      if (isEdit) {
        await recurringService.update(initial.id, payload);
      } else {
        const today = new Date();
        const startMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        await recurringService.create({ ...payload, start_month: startMonth });
      }
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
      {!isEdit && (
        <div className="grid grid-cols-2 gap-0 border-2 border-ink-900">
          <button
            type="button"
            onClick={() => setType('income')}
            className={`py-3 min-h-[44px] font-semibold text-sm uppercase tracking-wider transition-colors ${
              type === 'income' ? 'bg-accent text-ink-900' : 'bg-white text-ink-500 hover:bg-ink-50'
            }`}
          >
            ↑ Receita
          </button>
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`py-3 min-h-[44px] font-semibold text-sm uppercase tracking-wider transition-colors border-l-2 border-ink-900 ${
              type === 'expense' ? 'bg-ink-900 text-white' : 'bg-white text-ink-500 hover:bg-ink-50'
            }`}
          >
            ↓ Despesa
          </button>
        </div>
      )}

      <div>
        <label className="label">Valor</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-ink-500">R$</span>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            className="input-field pl-12 text-xl md:text-2xl font-mono font-semibold"
            autoFocus
          />
        </div>
      </div>

      <div>
        <label className="label">Descrição</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={type === 'income' ? 'Ex: Salário' : 'Ex: Aluguel'}
          className="input-field"
          maxLength={100}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Dia do mês</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
            className="input-field"
            required
          />
          <p className="text-[10px] text-ink-500 mt-1">
            Se o mês não tiver esse dia (ex: 31 em fev), usa o último dia do mês.
          </p>
        </div>
        <div>
          <label className="label">Categoria</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input-field"
          >
            {categories.length === 0 && <option value="">— Carregando —</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {type === 'expense' && (
        <div>
          <label className="label">Forma de pagamento</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('account')}
              className={`px-3 py-2.5 min-h-[44px] text-sm font-medium border-2 transition-all ${
                paymentMethod === 'account'
                  ? 'bg-ink-900 text-white border-ink-900'
                  : 'bg-white text-ink-700 border-ink-300 hover:border-ink-900'
              }`}
            >
              Conta / dinheiro
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`px-3 py-2.5 min-h-[44px] text-sm font-medium border-2 transition-all ${
                paymentMethod === 'card'
                  ? 'bg-ink-900 text-white border-ink-900'
                  : 'bg-white text-ink-700 border-ink-300 hover:border-ink-900'
              }`}
            >
              Cartão de crédito
            </button>
          </div>
          {paymentMethod === 'card' && (
            <select
              value={creditCardId}
              onChange={(e) => setCreditCardId(e.target.value)}
              className="input-field mt-3"
            >
              <option value="">Selecione um cartão</option>
              {cards.map(({ card }) => (
                <option key={card.id} value={card.id}>{card.name}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {error && (
        <div className="px-4 py-3 bg-red-50 border-2 border-negative text-negative text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancelar
        </button>
        <button type="submit" disabled={submitting} className="btn-accent flex-1 disabled:opacity-60">
          {submitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar recorrência'}
        </button>
      </div>
    </form>
  );
}

export default function RecurringPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const { isOpen, open, close } = useDisclosure();

  async function load() {
    setLoading(true);
    try {
      const data = await recurringService.list();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleToggleActive(item) {
    await recurringService.toggleActive(item.id, !item.active);
    load();
  }

  async function handleDelete(item) {
    if (!confirm(
      `Excluir a recorrência "${item.description}"?\n\n` +
      `As transações já criadas em meses anteriores serão preservadas (apenas perdem o vínculo). ` +
      `Mas nenhuma nova será gerada nos próximos meses.`
    )) return;
    await recurringService.remove(item.id);
    load();
  }

  const activeItems = items.filter((i) => i.active);
  const pausedItems = items.filter((i) => !i.active);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 md:gap-4">
        <div>
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-ink-500 font-semibold">
            Automação
          </p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-1 leading-tight flex items-center gap-2 md:gap-3">
            <Repeat className="w-7 h-7 md:w-10 md:h-10 flex-shrink-0" strokeWidth={2.5} />
            <span>Recorrências</span>
          </h1>
        </div>

        <button onClick={() => { setEditing(null); open(); }} className="btn-accent self-start flex-shrink-0">
          <Plus className="w-5 h-5" /> Nova recorrência
        </button>
      </div>

      <div className="card-flat p-4 md:p-5 bg-ink-900 text-ink-50">
        <p className="text-xs md:text-sm leading-relaxed">
          💡 <strong className="text-accent">Como funciona:</strong> recorrências são criadas
          automaticamente todo mês, no dia que você definir. Elas aparecem nas suas listas
          de receitas/despesas com a etiqueta <strong className="text-accent">Recorrente</strong>.
          Pausar = para de criar nas próximas. Excluir = mesmo, mas remove o modelo de vez.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-ink-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card-flat p-8 md:p-12 text-center">
          <Repeat className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 text-ink-300" />
          <p className="font-display text-lg md:text-xl font-bold mb-2">Nenhuma recorrência</p>
          <p className="text-xs md:text-sm text-ink-500 mb-4">
            Crie modelos para receitas e despesas que se repetem todo mês — salário, aluguel, assinaturas…
          </p>
          <button onClick={() => { setEditing(null); open(); }} className="btn-accent">
            <Plus className="w-5 h-5" /> Criar primeira recorrência
          </button>
        </div>
      ) : (
        <>
          {/* Ativas */}
          {activeItems.length > 0 && (
            <div>
              <h3 className="font-display text-lg md:text-xl font-bold mb-3 md:mb-4">
                Ativas <span className="text-sm font-mono text-ink-500">({activeItems.length})</span>
              </h3>
              <div className="bg-white border-2 border-ink-900 shadow-flat-sm md:shadow-flat divide-y-2 divide-ink-100">
                {activeItems.map((item) => (
                  <RecurringRow
                    key={item.id}
                    item={item}
                    onEdit={(it) => { setEditing(it); open(); }}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pausadas */}
          {pausedItems.length > 0 && (
            <div>
              <h3 className="font-display text-lg md:text-xl font-bold mb-3 md:mb-4 text-ink-500">
                Pausadas <span className="text-sm font-mono">({pausedItems.length})</span>
              </h3>
              <div className="bg-white border-2 border-ink-900 shadow-flat-sm md:shadow-flat divide-y-2 divide-ink-100 opacity-60">
                {pausedItems.map((item) => (
                  <RecurringRow
                    key={item.id}
                    item={item}
                    onEdit={(it) => { setEditing(it); open(); }}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isOpen}
        onClose={close}
        title={editing ? 'Editar recorrência' : 'Nova recorrência'}
      >
        <RecurringForm
          initial={editing}
          onSaved={() => { close(); load(); }}
          onCancel={close}
        />
      </Modal>
    </div>
  );
}

function RecurringRow({ item, onEdit, onToggleActive, onDelete }) {
  const isIncome = item.type === 'income';
  const Icon = isIncome ? ArrowUpCircle : ArrowDownCircle;
  const colorClass = isIncome ? 'text-positive' : 'text-negative';
  const cat = item.category || {};
  const card = item.credit_card;

  return (
    <div className="flex items-stretch hover:bg-ink-50 transition-colors">
      <div className="w-1 flex-shrink-0" style={{ backgroundColor: cat.color || '#64748b' }} />

      <div className="flex-1 min-w-0 p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Icon className={`w-4 h-4 ${colorClass} flex-shrink-0`} />
            <h4 className="font-medium text-ink-900 text-sm md:text-base truncate">
              {item.description}
            </h4>
            {card && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white whitespace-nowrap"
                style={{ backgroundColor: card.color || '#1e293b' }}
              >
                <CardIcon className="w-3 h-3" /> {card.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-500 flex-wrap">
            <span className="font-medium" style={{ color: cat.color }}>{cat.name}</span>
            <span>·</span>
            <span>Todo dia {item.day_of_month}</span>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 mt-1 md:mt-0">
          <div className={`stat-number text-base md:text-lg font-semibold whitespace-nowrap ${colorClass}`}>
            {isIncome ? '+' : '−'} {formatCurrency(item.amount)}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleActive(item)}
              className="w-9 h-9 flex items-center justify-center hover:bg-ink-200 transition-colors"
              aria-label={item.active ? 'Pausar' : 'Retomar'}
              title={item.active ? 'Pausar (não gera mais)' : 'Retomar'}
            >
              {item.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onEdit(item)}
              className="w-9 h-9 flex items-center justify-center hover:bg-ink-200 transition-colors"
              aria-label="Editar"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(item)}
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
}

import { useState, useEffect } from 'react';
import { Repeat } from 'lucide-react';
import { categoryService, transactionService, cardService, recurringService } from '../services';
import { parseAmount } from '../utils/format';
import { useMonth } from '../context/MonthContext';

/**
 * Formulário de transação.
 * --------------------------------------------------------------
 * Suporta:
 *  - Receitas e despesas
 *  - Cartão de crédito (apenas despesas)
 *  - Recorrência mensal (cria modelo + transação do mês atual)
 *
 * Recorrência só aparece em modo "criação", não em edição.
 * Editar uma transação avulsa não a transforma em recorrente.
 */
export default function TransactionForm({ initial = null, onSaved, onCancel, defaultType = 'expense' }) {
  const isEdit = !!initial;
  const { isCurrentMonth, startDate: monthStart, month: currentMonthString } = useMonth();

  const defaultDate = initial?.date
    || (isCurrentMonth ? new Date().toISOString().slice(0, 10) : monthStart);

  const [type, setType] = useState(initial?.type || defaultType);
  const [amount, setAmount] = useState(initial?.amount?.toString().replace('.', ',') || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [date, setDate] = useState(defaultDate);
  const [categoryId, setCategoryId] = useState(initial?.category?.id || '');
  const [creditCardId, setCreditCardId] = useState(initial?.credit_card?.id || '');
  const [paymentMethod, setPaymentMethod] = useState(initial?.credit_card ? 'card' : 'account');
  const [isRecurring, setIsRecurring] = useState(false);

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
      const parsedAmount = parseAmount(amount);
      const trimmedDesc = description.trim();
      const payload = {
        type,
        amount: parsedAmount,
        description: trimmedDesc,
        date,
        category_id: categoryId,
        credit_card_id: type === 'expense' && paymentMethod === 'card' ? creditCardId : null,
      };

      if (!payload.amount || payload.amount <= 0) throw new Error('Informe um valor válido');
      if (!payload.description) throw new Error('Informe uma descrição');
      if (!payload.category_id) throw new Error('Selecione uma categoria');
      if (type === 'expense' && paymentMethod === 'card' && !creditCardId) {
        throw new Error('Selecione um cartão');
      }

      if (isEdit) {
        await transactionService.update(initial.id, payload);
      } else if (isRecurring) {
        // 1. Cria o MODELO recorrente
        const dayOfMonth = new Date(date + 'T00:00:00').getDate();
        const startMonth = `${currentMonthString}-01`;
        const recurring = await recurringService.create({
          type,
          amount: parsedAmount,
          description: trimmedDesc,
          category_id: categoryId,
          credit_card_id: payload.credit_card_id,
          day_of_month: dayOfMonth,
          start_month: startMonth,
        });
        // 2. Cria a transação do mês atual já linkada ao modelo
        // (chamando direto o supabase pra incluir recurring_id)
        const { supabase } = await import('../services/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        const { error: txErr } = await supabase.from('transactions').insert({
          user_id: user.id,
          type,
          amount: parsedAmount,
          description: trimmedDesc,
          date,
          category_id: categoryId,
          credit_card_id: payload.credit_card_id,
          recurring_id: recurring.id,
          paid: type === 'income', // receita já vem como recebida
        });
        if (txErr) throw txErr;
      } else {
        await transactionService.create(payload);
      }

      onSaved?.();
    } catch (err) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
      {/* Toggle Receita/Despesa */}
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
          placeholder={type === 'income' ? 'Ex: Salário' : 'Ex: Supermercado'}
          className="input-field"
          maxLength={100}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field"
          />
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
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Forma de pagamento — apenas para despesas */}
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
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Recorrência — só aparece em modo criação */}
      {!isEdit && (
        <label
          className={`flex items-start gap-3 p-3 md:p-4 border-2 cursor-pointer transition-colors ${
            isRecurring ? 'border-ink-900 bg-accent/30' : 'border-ink-300 hover:border-ink-900 bg-white'
          }`}
        >
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="mt-0.5 w-5 h-5 accent-ink-900 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Repeat className="w-4 h-4" strokeWidth={2.5} />
              É recorrente?
            </div>
            <p className="text-xs text-ink-600 mt-0.5">
              {isRecurring
                ? `Será criada automaticamente todo mês no mesmo dia (${
                    new Date(date + 'T00:00:00').getDate()
                  }).`
                : 'Marque para repetir essa transação todos os meses.'}
            </p>
          </div>
        </label>
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
          {submitting
            ? 'Salvando…'
            : isEdit
              ? 'Salvar alterações'
              : isRecurring
                ? 'Criar recorrência'
                : 'Adicionar transação'}
        </button>
      </div>
    </form>
  );
}

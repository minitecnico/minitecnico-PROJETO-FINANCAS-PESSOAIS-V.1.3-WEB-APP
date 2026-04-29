import { useEffect, useState } from 'react';
import { CreditCard as CardIcon, Plus, Calendar, AlertTriangle, Trash2, Pencil } from 'lucide-react';
import { cardService } from '../services';
import { formatCurrency, formatPercent, formatDate } from '../utils/format';
import Modal from '../components/Modal';
import { useDisclosure } from '../hooks/useDisclosure';

const BRAND_OPTIONS = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'elo', label: 'Elo' },
  { value: 'amex', label: 'American Express' },
  { value: 'hipercard', label: 'Hipercard' },
  { value: 'other', label: 'Outro' },
];

const PRESET_COLORS = ['#820ad1', '#ff7a00', '#1e293b', '#dc2626', '#16a34a', '#0ea5e9', '#f59e0b'];

function CardForm({ initial, onSaved, onCancel }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name || '',
    brand: initial?.brand || 'mastercard',
    lastDigits: initial?.last_digits || '',
    limit: initial?.card_limit || '',
    closingDay: initial?.closing_day || 25,
    dueDay: initial?.due_day || 5,
    color: initial?.color || PRESET_COLORS[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        limit: parseFloat(form.limit) || 0,
        closingDay: parseInt(form.closingDay, 10),
        dueDay: parseInt(form.dueDay, 10),
      };
      if (isEdit) await cardService.update(initial.id, payload);
      else await cardService.create(payload);
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nome do cartão</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input-field"
          placeholder="Ex: Nubank Roxinho"
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Bandeira</label>
          <select
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="input-field"
          >
            {BRAND_OPTIONS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Últimos 4 dígitos</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={form.lastDigits}
            onChange={(e) => setForm({ ...form, lastDigits: e.target.value.replace(/\D/g, '') })}
            className="input-field font-mono"
            placeholder="1234"
          />
        </div>
      </div>

      <div>
        <label className="label">Limite total</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-ink-500">R$</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={form.limit}
            onChange={(e) => setForm({ ...form, limit: e.target.value })}
            className="input-field pl-12"
            placeholder="5000.00"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Fechamento</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={form.closingDay}
            onChange={(e) => setForm({ ...form, closingDay: e.target.value })}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="label">Vencimento</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={form.dueDay}
            onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
            className="input-field"
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Cor</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className={`w-11 h-11 border-2 transition-all ${
                form.color === c ? 'border-ink-900 scale-110' : 'border-ink-300 hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>
      </div>

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
          {submitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Adicionar cartão'}
        </button>
      </div>
    </form>
  );
}

function CardItem({ summary, onEdit, onDelete, onSelect, selected }) {
  const { card, available, currentBill, utilizationPercent, cycleEnd } = summary;
  const isHighUsage = utilizationPercent > 80;

  return (
    <div
      className={`relative p-5 md:p-6 cursor-pointer transition-all border-2 border-ink-900 shadow-flat-sm md:shadow-flat ${
        selected ? 'ring-4 ring-accent' : ''
      }`}
      style={{ backgroundColor: card.color, color: '#fff' }}
      onClick={() => onSelect(card.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6 md:mb-8 gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] md:text-xs uppercase tracking-widest opacity-80">{card.brand}</p>
          <h3 className="font-display text-xl md:text-2xl font-bold mt-1 truncate">{card.name}</h3>
        </div>
        <CardIcon className="w-6 h-6 md:w-7 md:h-7 opacity-90 flex-shrink-0" />
      </div>

      {/* Número estilizado */}
      <p className="font-mono text-base md:text-lg tracking-widest opacity-80 mb-5 md:mb-6">
        •••• •••• •••• {card.last_digits || '----'}
      </p>

      {/* Métricas */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Fatura</p>
            <p className="stat-number text-base md:text-xl break-all">{formatCurrency(currentBill)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1">Disponível</p>
            <p className="stat-number text-base md:text-xl break-all">{formatCurrency(available)}</p>
          </div>
        </div>

        {/* Barra de uso */}
        <div>
          <div className="flex items-center justify-between text-xs opacity-80 mb-1">
            <span>Uso do limite</span>
            <span className="font-mono font-semibold">{formatPercent(utilizationPercent)}</span>
          </div>
          <div className="h-2 bg-black/30 overflow-hidden">
            <div
              className={`h-full transition-all ${isHighUsage ? 'bg-warn' : 'bg-accent'}`}
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] md:text-xs opacity-80 pt-2">
          <Calendar className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">Fecha {formatDate(cycleEnd, 'long')}</span>
        </div>
      </div>

      {isHighUsage && (
        <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-warn text-ink-900 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>Limite quase no topo</span>
        </div>
      )}

      {/* Ações: sempre visíveis no mobile */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(card); }}
          className="w-9 h-9 bg-white/20 hover:bg-white/30 flex items-center justify-center"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
          className="w-9 h-9 bg-white/20 hover:bg-negative flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function CardHistory({ cardId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    cardService
      .history(cardId)
      .then((data) => setHistory(data))
      .finally(() => setLoading(false));
  }, [cardId]);

  if (loading) return <div className="h-20 bg-ink-100 animate-pulse" />;
  if (history.length === 0) {
    return (
      <div className="card-flat p-6 md:p-8 text-center">
        <p className="text-ink-500 text-sm">Nenhuma compra registrada neste cartão.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-ink-900 shadow-flat-sm md:shadow-flat divide-y-2 divide-ink-100">
      {history.map((t) => (
        <div key={t.id} className="flex items-center justify-between gap-3 p-3 md:p-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm md:text-base truncate">{t.description}</p>
            <p className="text-xs text-ink-500 mt-0.5 truncate">
              <span style={{ color: t.category?.color }}>{t.category?.name}</span>
              {' · '}{formatDate(t.date, 'long')}
            </p>
          </div>
          <p className="font-mono font-semibold text-negative whitespace-nowrap text-sm md:text-base">
            − {formatCurrency(t.amount)}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function CardsPage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const { isOpen, open, close } = useDisclosure();

  async function load() {
    setLoading(true);
    try {
      const data = await cardService.list();
      setCards(data);
      if (data.length > 0 && !selectedId) setSelectedId(data[0].card.id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id) {
    if (!confirm('Remover este cartão? O histórico de transações será preservado.')) return;
    await cardService.remove(id);
    setSelectedId(null);
    load();
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 md:gap-4">
        <div>
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-ink-500 font-semibold">
            Pagamentos
          </p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mt-1 leading-tight">
            Cartões
          </h1>
        </div>

        <button onClick={() => { setEditing(null); open(); }} className="btn-accent self-start flex-shrink-0">
          <Plus className="w-5 h-5" /> Novo cartão
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-56 md:h-64 bg-ink-100 animate-pulse" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="card-flat p-8 md:p-12 text-center">
          <CardIcon className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 text-ink-300" />
          <p className="font-display text-lg md:text-xl font-bold mb-2">Nenhum cartão cadastrado</p>
          <p className="text-xs md:text-sm text-ink-500 mb-4">
            Cadastre seu primeiro cartão para acompanhar limite e fatura em tempo real.
          </p>
          <button onClick={() => { setEditing(null); open(); }} className="btn-accent">
            <Plus className="w-5 h-5" /> Adicionar cartão
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
            {cards.map((summary) => (
              <CardItem
                key={summary.card.id}
                summary={summary}
                onEdit={(c) => { setEditing(c); open(); }}
                onDelete={handleDelete}
                onSelect={setSelectedId}
                selected={selectedId === summary.card.id}
              />
            ))}
          </div>

          {selectedId && (
            <div>
              <h3 className="font-display text-xl md:text-2xl font-bold mb-3 md:mb-4">
                Histórico de compras
              </h3>
              <CardHistory cardId={selectedId} />
            </div>
          )}
        </>
      )}

      <Modal isOpen={isOpen} onClose={close} title={editing ? 'Editar cartão' : 'Novo cartão'}>
        <CardForm
          initial={editing}
          onSaved={() => { close(); load(); }}
          onCancel={close}
        />
      </Modal>
    </div>
  );
}

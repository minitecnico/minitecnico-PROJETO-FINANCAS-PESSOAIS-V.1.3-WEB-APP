import { useState, useEffect, useCallback } from 'react';
import { transactionService } from '../services';
import { useMonth } from '../context/MonthContext';

/**
 * Hook de listagem de transações.
 * --------------------------------------------------------------
 * Por padrão FILTRA pelo mês selecionado no MonthContext.
 *
 * Se passar `respectMonth: false` nos filtros, ignora o filtro mensal
 * (útil para listas globais, mas no nosso caso sempre queremos por mês).
 */
export function useTransactions(filters = {}) {
  const { startDate: monthStart, endDate: monthEnd } = useMonth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mescla filtros do mês com os passados pelo componente (componente vence)
  const finalFilters = {
    startDate: monthStart,
    endDate: monthEnd,
    ...filters, // sobrescreve startDate/endDate se o componente passar
  };

  // Estabiliza filters via JSON.stringify para evitar refetches desnecessários
  const filtersKey = JSON.stringify(finalFilters);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { transactions, total } = await transactionService.list(JSON.parse(filtersKey));
      setItems(transactions);
      setTotal(total);
      setError(null);
    } catch (err) {
      setError(err.message || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [filtersKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function create(payload) {
    await transactionService.create(payload);
    await fetchData();
  }

  async function update(id, payload) {
    await transactionService.update(id, payload);
    await fetchData();
  }

  async function remove(id) {
    await transactionService.remove(id);
    await fetchData();
  }

  /**
   * Atualização otimista: muda o estado localmente antes da resposta do servidor.
   * Se der erro, reverte e refaz fetch.
   */
  async function togglePaid(id, currentPaid) {
    const newPaid = !currentPaid;

    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, paid: newPaid } : t)));

    try {
      await transactionService.togglePaid(id, newPaid);
    } catch (err) {
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, paid: currentPaid } : t)));
      setError(err.message || 'Erro ao atualizar status');
    }
  }

  return { items, total, loading, error, refresh: fetchData, create, update, remove, togglePaid };
}

import { useState, useEffect, useCallback } from 'react';
import { transactionService } from '../services';

export function useTransactions(filters = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estabiliza filters via JSON.stringify para evitar refetches desnecessários
  const filtersKey = JSON.stringify(filters);

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

  return { items, total, loading, error, refresh: fetchData, create, update, remove };
}

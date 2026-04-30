import { useEffect, useState, useCallback } from 'react';
import { dashboardService } from '../services';
import { useMonth } from '../context/MonthContext';

/**
 * Encapsula o fetching dos dados do dashboard.
 * Atualiza automaticamente quando o mês selecionado muda.
 */
export function useDashboard(period = 'month') {
  const { month } = useMonth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await dashboardService.summary(period, month);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  }, [period, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

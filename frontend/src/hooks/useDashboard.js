import { useEffect, useState, useCallback } from 'react';
import { dashboardService } from '../services';

/**
 * Encapsula o fetching dos dados do dashboard.
 * Expõe `refresh()` para reagir após mutations (ex: nova transação).
 */
export function useDashboard(period = 'month') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await dashboardService.summary(period);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

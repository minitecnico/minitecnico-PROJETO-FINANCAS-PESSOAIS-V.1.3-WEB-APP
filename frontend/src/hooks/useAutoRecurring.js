import { useEffect, useRef, useState } from 'react';
import { recurringService } from '../services';
import { useMonth } from '../context/MonthContext';

/**
 * Hook que dispara a auto-geração de transações recorrentes ao mudar de mês.
 * --------------------------------------------------------------
 * Comportamento:
 *  1. Sempre que o mês selecionado muda, chama generateForMonth()
 *  2. Se a função criar transações novas, expõe `created` (número)
 *     para o componente decidir se mostra o toast e refresca a lista
 *  3. Cache local pra não chamar 2x pro mesmo mês na mesma sessão
 *
 * Uso típico:
 *   const { created, ack } = useAutoRecurring();
 *   useEffect(() => { if (created > 0) refresh(); ack(); }, [created]);
 */
export function useAutoRecurring() {
  const { month } = useMonth();
  const [created, setCreated] = useState(0);
  const [error, setError] = useState(null);

  // Cache de meses já processados nesta sessão (evita chamada redundante)
  const processedRef = useRef(new Set());

  useEffect(() => {
    if (processedRef.current.has(month)) return;

    let cancelled = false;
    (async () => {
      try {
        const count = await recurringService.generateForMonth(month);
        if (cancelled) return;
        processedRef.current.add(month);
        if (count > 0) {
          setCreated(count);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Erro ao gerar recorrências');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [month]);

  // Componente chama isso depois de processar a notificação
  function ack() {
    setCreated(0);
  }

  return { created, error, ack };
}

/**
 * Formata valor em Reais (BRL).
 */
export function formatCurrency(value, options = {}) {
  const { showSign = false, compact = false } = options;
  const num = Number(value) || 0;

  if (compact && Math.abs(num) >= 1000) {
    const formatted = new Intl.NumberFormat('pt-BR', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(num);
    return `R$ ${formatted}`;
  }

  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Math.abs(num));

  if (showSign && num !== 0) {
    return `${num > 0 ? '+' : '−'} ${formatted}`;
  }
  return num < 0 ? `− ${formatted}` : formatted;
}

export function formatDate(date, pattern = 'short') {
  const d = new Date(date);
  if (pattern === 'short') {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }
  if (pattern === 'long') {
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
  return d.toLocaleDateString('pt-BR');
}

export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

/**
 * Converte string "1.234,56" → 1234.56
 */
export function parseAmount(input) {
  if (typeof input === 'number') return input;
  const cleaned = String(input).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

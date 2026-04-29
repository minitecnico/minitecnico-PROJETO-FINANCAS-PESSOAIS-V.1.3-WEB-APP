import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../utils/format';

const monthLabel = (key) => {
  const [, m] = key.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[parseInt(m, 10) - 1];
};

export function MonthlyChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="card-flat p-6 md:p-8 text-center">
        <p className="text-ink-500 text-sm md:text-base">Sem dados suficientes para exibir o histórico mensal.</p>
      </div>
    );
  }

  const formatted = data.map((d) => ({
    ...d,
    monthLabel: monthLabel(d.month),
  }));

  return (
    <div className="card-flat p-4 md:p-6">
      <div className="mb-3 md:mb-4">
        <h3 className="font-display text-xl md:text-2xl font-bold">Últimos 6 meses</h3>
        <p className="text-xs md:text-sm text-ink-500">Receitas vs Despesas</p>
      </div>
      <ResponsiveContainer width="100%" height={220} className="md:!h-[280px]">
        <BarChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="monthLabel"
            stroke="#161610"
            tick={{ fontSize: 11, fontWeight: 500 }}
            tickLine={false}
            axisLine={{ stroke: '#161610', strokeWidth: 2 }}
          />
          <YAxis
            stroke="#83836f"
            tick={{ fontSize: 10 }}
            tickFormatter={(v) => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#161610',
              border: '2px solid #161610',
              borderRadius: 0,
              color: '#fff',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
            }}
            formatter={(value, name) => [formatCurrency(value), name === 'income' ? 'Receitas' : 'Despesas']}
            labelStyle={{ color: '#c4f542', fontWeight: 600 }}
            cursor={{ fill: 'rgba(196, 245, 66, 0.1)' }}
          />
          <Bar dataKey="income" fill="#c4f542" stroke="#161610" strokeWidth={2} />
          <Bar dataKey="expense" fill="#161610" stroke="#161610" strokeWidth={2} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="card-flat p-6 md:p-8 text-center">
        <p className="text-ink-500 text-sm md:text-base">Sem despesas no período.</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="card-flat p-4 md:p-6">
      <div className="mb-3 md:mb-4">
        <h3 className="font-display text-xl md:text-2xl font-bold">Gastos por categoria</h3>
        <p className="text-xs md:text-sm text-ink-500">Distribuição do mês atual</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 md:gap-6 items-center">
        <ResponsiveContainer width="100%" height={180} className="md:!h-[220px]">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              stroke="#161610"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color || '#64748b'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#161610',
                border: '2px solid #161610',
                borderRadius: 0,
                color: '#fff',
                fontSize: 12,
              }}
              formatter={(value) => formatCurrency(value)}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="space-y-1.5 md:space-y-2 max-h-[200px] overflow-y-auto">
          {data.slice(0, 8).map((c) => {
            const pct = total > 0 ? (c.total / total) * 100 : 0;
            return (
              <div key={c.categoryId} className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                <div
                  className="w-3 h-3 border border-ink-900 flex-shrink-0"
                  style={{ backgroundColor: c.color }}
                />
                <span className="flex-1 truncate text-ink-700">{c.name}</span>
                <span className="font-mono text-ink-900 font-semibold whitespace-nowrap">
                  {formatCurrency(c.total, { compact: true })}
                </span>
                <span className="text-[10px] md:text-xs text-ink-500 w-9 text-right flex-shrink-0">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

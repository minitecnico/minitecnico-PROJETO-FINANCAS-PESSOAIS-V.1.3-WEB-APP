import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowDownCircle, ArrowUpCircle, CreditCard, Tag } from 'lucide-react';

const links = [
  { to: '/', label: 'Início', icon: LayoutDashboard, end: true },
  { to: '/incomes', label: 'Receitas', icon: ArrowUpCircle },
  { to: '/expenses', label: 'Despesas', icon: ArrowDownCircle },
  { to: '/cards', label: 'Cartões', icon: CreditCard },
  { to: '/categories', label: 'Mais', icon: Tag },
];

/**
 * BottomNav — barra de navegação fixa no rodapé.
 * Visível apenas em telas < md (mobile).
 *
 * Itens distribuídos uniformemente, com indicador visual no ativo.
 * Altura fixa de 64px + safe-area-inset (notch de iPhones).
 */
export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-ink-900 border-t-2 border-ink-900 grid grid-cols-5"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] transition-colors ${
              isActive ? 'text-accent' : 'text-ink-300 hover:text-ink-50'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] uppercase tracking-wider ${isActive ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

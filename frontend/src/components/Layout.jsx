import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';
import FloatingAddButton from './FloatingAddButton';

/**
 * Layout principal — adapta automaticamente para mobile/tablet/desktop:
 *  - Mobile (< 768px): MobileHeader no topo + BottomNav no rodapé + conteúdo no meio
 *  - Tablet/Desktop (≥ 768px): Sidebar à esquerda + conteúdo à direita
 *
 * Padding-bottom no main em mobile evita conteúdo ficar atrás do BottomNav.
 */
export default function Layout() {
  const [tick, setTick] = useState(0);

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar (md+) */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header (mobile) */}
        <MobileHeader />

        {/* Conteúdo principal */}
        <main className="flex-1 p-4 sm:p-5 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-[1400px] w-full mx-auto md:mx-0">
          <Outlet key={tick} />
        </main>
      </div>

      {/* Bottom Nav (mobile) */}
      <BottomNav />

      {/* Botão flutuante de adicionar */}
      <FloatingAddButton onAdded={() => setTick((t) => t + 1)} />
    </div>
  );
}

import { Plus } from 'lucide-react';
import { useDisclosure } from '../hooks/useDisclosure';
import Modal from './Modal';
import TransactionForm from './TransactionForm';

/**
 * Botão flutuante global "Adicionar".
 * --------------------------------------------------------------
 * Mobile: posicionado 80px acima do bottom (acima do BottomNav)
 * Desktop: canto inferior direito padrão (24px)
 * Tamanho aumenta levemente em desktop para combinar com a sidebar.
 */
export default function FloatingAddButton({ onAdded }) {
  const { isOpen, open, close } = useDisclosure();

  return (
    <>
      <button
        onClick={open}
        className="fab"
        aria-label="Adicionar transação"
      >
        <Plus
          className="w-6 h-6 md:w-7 md:h-7 text-ink-900 group-hover:rotate-90 transition-transform duration-300"
          strokeWidth={2.5}
        />
      </button>

      <Modal isOpen={isOpen} onClose={close} title="Nova transação">
        <TransactionForm
          onSaved={() => {
            close();
            onAdded?.();
          }}
          onCancel={close}
        />
      </Modal>
    </>
  );
}

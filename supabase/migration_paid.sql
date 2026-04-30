-- ============================================================================
-- Migration: adicionar status "pago" às despesas
-- ============================================================================
-- Execute este script no SQL Editor do Supabase (uma vez só, depois do schema.sql)
-- Idempotente: pode rodar várias vezes sem quebrar.
-- ============================================================================

-- Adiciona a coluna 'paid' (default false = pendente)
alter table public.transactions
  add column if not exists paid boolean not null default false;

-- Índice para acelerar filtros "só pendentes" / "só pagas"
create index if not exists idx_transactions_paid
  on public.transactions(user_id, paid)
  where type = 'expense';

-- Receitas não têm sentido ter status "pago" — sempre marcam como true
-- (você só cadastra receita depois de receber). Isso evita query estranha.
update public.transactions set paid = true where type = 'income' and paid = false;

-- ============================================================================
-- Migration: Transações Recorrentes (Despesas e Receitas)
-- ============================================================================
-- Execute no SQL Editor do Supabase. Idempotente.
--
-- COMO FUNCIONA (Abordagem "Lazy Generation"):
--   1. Usuário cadastra uma despesa marcando "É recorrente?"
--   2. Frontend cria uma linha em recurring_transactions (modelo) E uma
--      transação normal no mês atual (linkada via recurring_id).
--   3. Quando o usuário abre QUALQUER mês, o frontend chama
--      generate_recurring_for_month() — que cria as transações daquele mês
--      para todos os modelos ativos que ainda não foram aplicados ali.
--   4. Edita o modelo? Só meses NOVOS pegam a mudança. Histórico preservado.
--   5. Pausa/exclui o modelo? Para de gerar nos próximos meses.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. TABELA — recurring_transactions
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.recurring_transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  type            text not null check (type in ('income', 'expense')),
  amount          numeric(12, 2) not null check (amount > 0),
  description     text not null,
  category_id     uuid not null references public.categories(id) on delete restrict,
  credit_card_id  uuid references public.credit_cards(id) on delete set null,

  -- Dia do mês em que a transação cai (1-31). Se 31 e o mês só tiver 30,
  -- ajustamos pro último dia (ex: fev → 28/29).
  day_of_month    int not null check (day_of_month between 1 and 31),

  -- Quando começou (mês/ano da primeira ocorrência) — não geramos antes disso
  start_month     date not null default current_date,

  -- Pausada? Se true, deixa de gerar (mas preserva o modelo)
  active          boolean not null default true,

  notes           text,
  created_at      timestamptz default now()
);

create index if not exists idx_recurring_user
  on public.recurring_transactions(user_id) where active = true;

-- RLS — só o dono vê/altera
alter table public.recurring_transactions enable row level security;

drop policy if exists "recorrentes_dono" on public.recurring_transactions;
create policy "recorrentes_dono"
  on public.recurring_transactions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. COLUNA EM transactions — link com o modelo
-- ─────────────────────────────────────────────────────────────────────────
-- Se preenchida: essa transação foi gerada por uma recorrência.
-- ON DELETE SET NULL: se o modelo for excluído, a transação vira "avulsa"
-- (não some — o histórico é sagrado).
alter table public.transactions
  add column if not exists recurring_id uuid
  references public.recurring_transactions(id) on delete set null;

create index if not exists idx_transactions_recurring
  on public.transactions(recurring_id) where recurring_id is not null;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. FUNÇÃO — gera as transações recorrentes do mês especificado
-- ─────────────────────────────────────────────────────────────────────────
-- Chamada pelo frontend ao abrir um mês.
-- Retorna a quantidade de transações criadas (0 se já estavam todas geradas).
-- Idempotente: se chamar duas vezes pro mesmo mês, não duplica.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.generate_recurring_for_month(p_month text)
returns int
language plpgsql
security invoker
volatile
as $$
declare
  v_month_start date;
  v_month_end date;
  v_last_day int;
  v_target_day int;
  v_target_date date;
  v_created int := 0;
  v_recurring record;
begin
  -- Valida e parseia o mês alvo
  v_month_start := to_date(p_month || '-01', 'YYYY-MM-DD');
  v_month_end := (v_month_start + interval '1 month')::date;
  v_last_day := extract(day from (v_month_end - interval '1 day'))::int;

  -- Itera por cada modelo ativo do usuário que começou no mês alvo OU antes
  for v_recurring in
    select *
    from public.recurring_transactions
    where user_id = auth.uid()
      and active = true
      and start_month <= v_month_start
  loop
    -- Determina o dia: respeita day_of_month, ajustando pro último dia
    -- caso o mês alvo seja menor (ex: dia 31 em fevereiro → dia 28/29)
    v_target_day := least(v_recurring.day_of_month, v_last_day);
    v_target_date := v_month_start + (v_target_day - 1) * interval '1 day';

    -- Já existe uma transação desse modelo no mês alvo? Se sim, pula.
    if not exists (
      select 1 from public.transactions
      where user_id = auth.uid()
        and recurring_id = v_recurring.id
        and date >= v_month_start
        and date < v_month_end
    ) then
      insert into public.transactions (
        user_id, type, amount, description, date,
        category_id, credit_card_id, recurring_id, paid
      )
      values (
        auth.uid(),
        v_recurring.type,
        v_recurring.amount,
        v_recurring.description,
        v_target_date,
        v_recurring.category_id,
        v_recurring.credit_card_id,
        v_recurring.id,
        v_recurring.type = 'income' -- receitas já vêm marcadas como "pagas/recebidas"
      );
      v_created := v_created + 1;
    end if;
  end loop;

  return v_created;
end;
$$;

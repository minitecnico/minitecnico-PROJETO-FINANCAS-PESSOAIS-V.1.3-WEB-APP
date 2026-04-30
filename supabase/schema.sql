-- ============================================================================
-- Cofre Finance Dashboard — Schema Supabase
-- ============================================================================
-- Execute este script no SQL Editor do Supabase (uma vez só, após criar o projeto)
-- Cria: tabelas, índices, Row Level Security, triggers, functions de agregação
-- ============================================================================
--
-- 📌 REGRA DE NEGÓCIO — CÁLCULO DO SALDO
-- ----------------------------------------------------------------------------
-- Toda despesa diminui o saldo no MOMENTO DO CADASTRO, independente da forma
-- de pagamento (conta, dinheiro, débito ou cartão de crédito).
--
-- O cartão de crédito vira apenas uma "etiqueta organizacional": permite ver
-- fatura, limite e ciclo, mas o impacto no saldo é imediato.
--
-- Fórmula: saldo = Σ receitas − Σ despesas
--
-- Vantagem: não há "falsa sensação de saldo alto" por compras no cartão
-- ainda não pagas.
-- ============================================================================

-- ============================================================================
-- 1. TABELAS
-- ============================================================================

-- Categorias (income | expense), personalizáveis por usuário
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  type        text not null check (type in ('income', 'expense')),
  color       text not null default '#64748b',
  icon        text default 'tag',
  created_at  timestamptz default now(),
  unique (user_id, name, type)
);

-- Cartões de crédito
create table public.credit_cards (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  brand       text default 'other' check (brand in ('visa','mastercard','elo','amex','hipercard','other')),
  last_digits text,
  card_limit  numeric(12, 2) not null default 0 check (card_limit >= 0),
  closing_day int not null check (closing_day between 1 and 31),
  due_day     int not null check (due_day between 1 and 31),
  color       text default '#1e293b',
  active      boolean default true,
  created_at  timestamptz default now()
);

-- Transações (income | expense unificadas)
create table public.transactions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  type            text not null check (type in ('income', 'expense')),
  amount          numeric(12, 2) not null check (amount > 0),
  description     text not null,
  date            date not null default current_date,
  category_id     uuid not null references public.categories(id) on delete restrict,
  credit_card_id  uuid references public.credit_cards(id) on delete set null,
  notes           text,
  installments    int default 1,
  installment_no  int default 1,
  paid            boolean not null default false,
  created_at      timestamptz default now()
);

-- Índices para queries comuns (filtro por usuário + período)
create index idx_transactions_user_date on public.transactions(user_id, date desc);
create index idx_transactions_user_type on public.transactions(user_id, type);
create index idx_transactions_card on public.transactions(credit_card_id) where credit_card_id is not null;
create index idx_transactions_paid on public.transactions(user_id, paid) where type = 'expense';
create index idx_categories_user on public.categories(user_id);
create index idx_cards_user on public.credit_cards(user_id) where active = true;

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
-- Cada usuário só pode ver/modificar seus próprios dados.
-- Isso é a base da segurança do Supabase — sem RLS, qualquer usuário poderia
-- ler dados de outros, já que o frontend conversa direto com o banco.
-- ============================================================================

alter table public.categories     enable row level security;
alter table public.credit_cards   enable row level security;
alter table public.transactions   enable row level security;

-- Política única que cobre SELECT/INSERT/UPDATE/DELETE: só o dono do registro
create policy "categorias_dono"
  on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cartoes_dono"
  on public.credit_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transacoes_dono"
  on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- 3. TRIGGER — categorias padrão ao criar usuário
-- ----------------------------------------------------------------------------
-- Quando alguém faz signup, criamos automaticamente as 10 categorias padrão.
-- Roda em SECURITY DEFINER pra contornar o RLS (o usuário ainda não está
-- "autenticado" no momento exato do signup).
-- ============================================================================

create or replace function public.create_default_categories()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.categories (user_id, name, type, color, icon) values
    (new.id, 'Salário',       'income',  '#10b981', 'wallet'),
    (new.id, 'Freelance',     'income',  '#06b6d4', 'briefcase'),
    (new.id, 'Investimentos', 'income',  '#8b5cf6', 'trending-up'),
    (new.id, 'Alimentação',   'expense', '#f59e0b', 'utensils'),
    (new.id, 'Moradia',       'expense', '#ef4444', 'home'),
    (new.id, 'Transporte',    'expense', '#3b82f6', 'car'),
    (new.id, 'Lazer',         'expense', '#ec4899', 'gamepad-2'),
    (new.id, 'Saúde',         'expense', '#14b8a6', 'heart'),
    (new.id, 'Educação',      'expense', '#6366f1', 'book'),
    (new.id, 'Outros',        'expense', '#64748b', 'tag');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_default_categories();

-- ============================================================================
-- 4. RPC FUNCTIONS — cálculos do dashboard
-- ----------------------------------------------------------------------------
-- O frontend chama via supabase.rpc('nome_da_funcao').
-- Cada função respeita o usuário autenticado (auth.uid()).
-- ============================================================================

-- Saldo total: receitas - TODAS as despesas (incluindo cartão)
-- Premissa: despesa no cartão já é considerada "saída" no momento do cadastro,
-- pois o usuário já se comprometeu com o gasto.
create or replace function public.get_balance()
returns table (balance numeric, total_income numeric, total_expense numeric)
language sql
security invoker -- respeita RLS do usuário chamador
stable
as $$
  select
    coalesce(sum(case when type = 'income'  then amount else 0 end), 0)
      - coalesce(sum(case when type = 'expense' then amount else 0 end), 0) as balance,
    coalesce(sum(case when type = 'income'  then amount else 0 end), 0) as total_income,
    coalesce(sum(case when type = 'expense' then amount else 0 end), 0) as total_expense
  from public.transactions
  where user_id = auth.uid();
$$;

-- Resumo do período (day | week | month)
create or replace function public.get_period_summary(p_period text default 'month')
returns table (income numeric, expense numeric, balance numeric, tx_count bigint)
language plpgsql
security invoker
stable
as $$
declare
  v_start timestamptz;
  v_end   timestamptz;
begin
  if p_period = 'day' then
    v_start := date_trunc('day', now());
    v_end   := v_start + interval '1 day';
  elsif p_period = 'week' then
    v_start := date_trunc('week', now());
    v_end   := v_start + interval '1 week';
  else
    v_start := date_trunc('month', now());
    v_end   := v_start + interval '1 month';
  end if;

  return query
    select
      coalesce(sum(case when type = 'income'  then amount else 0 end), 0),
      coalesce(sum(case when type = 'expense' then amount else 0 end), 0),
      coalesce(sum(case when type = 'income'  then amount else -amount end), 0),
      count(*)::bigint
    from public.transactions
    where user_id = auth.uid()
      and date >= v_start::date
      and date <  v_end::date;
end;
$$;

-- Despesas agrupadas por categoria (mês atual)
create or replace function public.get_expenses_by_category()
returns table (
  category_id uuid,
  name text,
  color text,
  icon text,
  total numeric,
  tx_count bigint
)
language sql
security invoker
stable
as $$
  select
    c.id,
    c.name,
    c.color,
    c.icon,
    coalesce(sum(t.amount), 0) as total,
    count(t.id)::bigint
  from public.transactions t
  join public.categories c on c.id = t.category_id
  where t.user_id = auth.uid()
    and t.type = 'expense'
    and t.date >= date_trunc('month', now())::date
  group by c.id, c.name, c.color, c.icon
  order by total desc;
$$;

-- Histórico mensal dos últimos N meses
create or replace function public.get_monthly_history(p_months int default 6)
returns table (month text, income numeric, expense numeric, balance numeric)
language sql
security invoker
stable
as $$
  with periods as (
    select to_char(date_trunc('month', d), 'YYYY-MM') as month_label,
           date_trunc('month', d)::date as month_start
    from generate_series(
      date_trunc('month', now() - (p_months - 1) * interval '1 month'),
      date_trunc('month', now()),
      interval '1 month'
    ) d
  )
  select
    p.month_label,
    coalesce(sum(case when t.type = 'income'  then t.amount end), 0) as income,
    coalesce(sum(case when t.type = 'expense' then t.amount end), 0) as expense,
    coalesce(sum(case when t.type = 'income'  then t.amount else -t.amount end), 0) as balance
  from periods p
  left join public.transactions t
    on t.user_id = auth.uid()
   and date_trunc('month', t.date)::date = p.month_start
  group by p.month_label, p.month_start
  order by p.month_start;
$$;

-- Resumo do cartão (limite usado, fatura atual, etc) — calculado em tempo real
create or replace function public.get_card_summary(p_card_id uuid)
returns table (
  card_id uuid,
  current_bill numeric,
  total_used numeric,
  available numeric,
  utilization_percent numeric,
  cycle_start date,
  cycle_end date,
  purchase_count bigint
)
language plpgsql
security invoker
stable
as $$
declare
  v_card public.credit_cards%rowtype;
  v_today date := current_date;
  v_cycle_end date;
  v_cycle_start date;
begin
  select * into v_card from public.credit_cards
   where id = p_card_id and user_id = auth.uid();

  if not found then
    return;
  end if;

  -- Calcula ciclo de fatura atual
  if extract(day from v_today) <= v_card.closing_day then
    v_cycle_end := make_date(
      extract(year from v_today)::int,
      extract(month from v_today)::int,
      least(v_card.closing_day, extract(day from (date_trunc('month', v_today) + interval '1 month - 1 day'))::int)
    );
  else
    v_cycle_end := make_date(
      extract(year from (v_today + interval '1 month'))::int,
      extract(month from (v_today + interval '1 month'))::int,
      least(v_card.closing_day, extract(day from (date_trunc('month', v_today + interval '1 month') + interval '1 month - 1 day'))::int)
    );
  end if;
  v_cycle_start := (v_cycle_end - interval '1 month' + interval '1 day')::date;

  return query
    select
      v_card.id,
      coalesce((select sum(amount) from public.transactions
                 where user_id = auth.uid()
                   and credit_card_id = v_card.id
                   and date between v_cycle_start and v_cycle_end), 0)::numeric as current_bill,
      coalesce((select sum(amount) from public.transactions
                 where user_id = auth.uid()
                   and credit_card_id = v_card.id), 0)::numeric as total_used,
      v_card.card_limit - coalesce((select sum(amount) from public.transactions
                                     where user_id = auth.uid()
                                       and credit_card_id = v_card.id
                                       and date between v_cycle_start and v_cycle_end), 0)::numeric as available,
      case when v_card.card_limit > 0 then
        (coalesce((select sum(amount) from public.transactions
                    where user_id = auth.uid()
                      and credit_card_id = v_card.id
                      and date between v_cycle_start and v_cycle_end), 0) / v_card.card_limit) * 100
        else 0 end as utilization_percent,
      v_cycle_start,
      v_cycle_end,
      coalesce((select count(*) from public.transactions
                 where user_id = auth.uid()
                   and credit_card_id = v_card.id
                   and date between v_cycle_start and v_cycle_end), 0)::bigint;
end;
$$;

-- Projeção de saldo para os próximos N meses
create or replace function public.get_balance_forecast(p_months int default 3)
returns table (month text, projected numeric, avg_income numeric, avg_expense numeric)
language plpgsql
security invoker
stable
as $$
declare
  v_avg_income numeric;
  v_avg_expense numeric;
  v_current_balance numeric;
  v_monthly_delta numeric;
  v_running numeric;
  i int;
begin
  -- Médias dos últimos 3 meses
  select
    coalesce(avg(case when type = 'income'  then amount else 0 end) * 30, 0),
    coalesce(avg(case when type = 'expense' then amount else 0 end) * 30, 0)
    into v_avg_income, v_avg_expense
  from public.transactions
  where user_id = auth.uid()
    and date >= (now() - interval '3 months')::date;

  v_avg_income := coalesce(v_avg_income, 0);
  v_avg_expense := coalesce(v_avg_expense, 0);

  select balance into v_current_balance from public.get_balance();
  v_monthly_delta := v_avg_income - v_avg_expense;
  v_running := v_current_balance;

  for i in 1..p_months loop
    v_running := v_running + v_monthly_delta;
    return query select
      to_char(date_trunc('month', now() + (i || ' months')::interval), 'YYYY-MM'),
      round(v_running, 2),
      round(v_avg_income, 2),
      round(v_avg_expense, 2);
  end loop;
end;
$$;

-- ============================================================================
-- ✅ Schema completo. Próximo passo: copie sua URL e ANON KEY do Supabase
-- (Settings → API) e cole no .env do frontend como VITE_SUPABASE_URL e
-- VITE_SUPABASE_ANON_KEY.
-- ============================================================================

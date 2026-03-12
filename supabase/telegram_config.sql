-- ============================================================
-- TABELA telegram_config — Configurações do Bot Telegram
-- Execute este script na aba "SQL Editor" do Supabase.
-- ============================================================

create table if not exists public.telegram_config (
  chave text primary key,
  valor text not null default '',
  atualizado_em timestamptz default now(),
  atualizado_por text
);

-- RLS: somente admin_master pode ler e editar
alter table public.telegram_config enable row level security;

create policy "admin_master lê config telegram"
  on public.telegram_config for select to authenticated
  using ((select role from public.perfis where id = auth.uid()) = 'admin_master');

create policy "admin_master insere config telegram"
  on public.telegram_config for insert to authenticated
  with check ((select role from public.perfis where id = auth.uid()) = 'admin_master');

create policy "admin_master atualiza config telegram"
  on public.telegram_config for update to authenticated
  using ((select role from public.perfis where id = auth.uid()) = 'admin_master');

create policy "admin_master deleta config telegram"
  on public.telegram_config for delete to authenticated
  using ((select role from public.perfis where id = auth.uid()) = 'admin_master');

-- Dados iniciais (valores vazios — o admin_master preencherá pela UI)
insert into public.telegram_config (chave, valor) values
  ('BOT_TOKEN', ''),
  ('GROUP_NORTE', ''),
  ('GROUP_SUL', ''),
  ('GROUP_SERRA', ''),
  ('GROUP_TAQUARI', '')
on conflict (chave) do nothing;

# Guia de Deploy — TTKs Fibrasil V2

## Estrutura do Projeto

```
/ (raiz — Cloudflare Pages ou GitHub Pages)
├── index.html                          ← Página de login
└── app/
    ├── assets/
    │   ├── css/style.css
    │   ├── img/
    │   └── js/
    │       ├── supabase-config.js
    │       ├── auth.js
    │       ├── painel.js
    │       └── form.js
    └── pages/
        ├── painel/painel.html
        ├── formulario/formulario.html
        ├── gestao/gestao.html
        ├── regioes/regioes.html
        └── acesso-negado/acesso-negado.html
```

---

## 1. Cloudflare Pages (Recomendado)

1. Acesse https://pages.cloudflare.com
2. Conecte ao repositório GitHub
3. **Build settings:**
   - Framework preset: `None`
   - Build command: (deixar vazio)
   - Build output directory: `/` (raiz)
4. Publique.

> O Cloudflare Pages serve arquivos estáticos com HTTPS automático e CDN global.

---

## 2. GitHub Pages (Alternativa)

1. Faça push do projeto para um repositório GitHub
2. Settings → Pages → Source: `main` branch, pasta `/` (root)
3. O site estará em `https://seu-usuario.github.io/nome-do-repo/`

> **Atenção GitHub Pages:** os caminhos absolutos `/index.html` e `/app/pages/...`
> só funcionam corretamente se o site estiver na raiz do domínio.
> Se estiver em um subdiretório (ex: `/nome-do-repo/`), será necessário
> usar um domínio customizado no GitHub Pages.
> **Recomendamos Cloudflare Pages para evitar esse problema.**

---

## 3. Edge Functions — Deploy no Supabase

Para cada função abaixo, acesse:
**Supabase Dashboard → Edge Functions → Deploy**

| Arquivo (neste zip)                              | Nome da função no Supabase     |
|--------------------------------------------------|-------------------------------|
| `supabase-functions-create-user.ts`              | `create-user`                 |
| `supabase-functions-delete-user.ts`              | `delete-user`                 |
| `supabase-functions-enviar-telegram.ts`          | `enviar-telegram`             |
| `supabase-functions-resumo-diario.ts`            | `resumo-diario`               |
| `supabase-functions-salvar-encerrado.ts`         | `salvar-encerrado`            |
| `supabase-functions-verificar-agendamentos.ts`   | `verificar-agendamentos`      |

---

## 4. Secrets das Edge Functions (OBRIGATÓRIO)

No Supabase Dashboard → Edge Functions → Secrets, configure:

| Secret                   | Valor                                        |
|--------------------------|----------------------------------------------|
| `TELEGRAM_BOT_TOKEN`     | Token do seu bot (ex: `123456:AABBcc...`)    |
| `GOOGLE_SERVICE_ACCOUNT` | JSON completo da conta de serviço Google     |

> **IMPORTANTE:** O token do Telegram foi REMOVIDO do código por segurança.
> Sem o Secret configurado, as funções `enviar-telegram`, `resumo-diario`
> e `verificar-agendamentos` vão falhar com erro de configuração.

---

## 5. Rotina Diária das 06:29 (pg_cron)

A função `resumo-diario` precisa ser chamada automaticamente todo dia às 06:29 BRT (09:29 UTC).

No Supabase Dashboard → SQL Editor, execute:

```sql
-- Instalar extensão (apenas uma vez)
create extension if not exists pg_cron;

-- Agendar a rotina diária às 06:29 BRT (= 09:29 UTC)
select cron.schedule(
  'resumo-diario-fibrasil',
  '29 9 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/resumo-diario',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

> Se preferir usar o Supabase Dashboard diretamente:
> Edge Functions → `resumo-diario` → Schedule → `29 9 * * *` (UTC)

---

## 6. Verificador de Agendamentos (a cada 5 min)

```sql
select cron.schedule(
  'verificar-agendamentos-fibrasil',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/verificar-agendamentos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

## 7. Checklist de Segurança Aplicado

- [x] JWT Bearer Token obrigatório em todas as Edge Functions sensíveis
- [x] `create-user` valida role e hierarquia do chamador no backend
- [x] `delete-user` valida hierarquia no backend (usuario não pode deletar ninguém)
- [x] Token do Telegram removido do código — usa apenas Secrets
- [x] `guardPage()` chamado uma única vez por página
- [x] RBAC: botão Gestão oculto para perfil `usuario` em todas as páginas
- [x] `escapeHtml()` e `escapeJs()` em dados renderizados na gestão
- [x] `limparTexto()` (anti-XSS) em todos os campos de formulário
- [x] Logout automático por inatividade (1 hora)
- [x] Delay progressivo em tentativas de login falhas
- [x] Todos os links de navegação corrigidos para estrutura V2

# Guia Completo: Como Lançar seu Projeto Num Novo Supabase

Passo a passo "à prova de erros". Siga as instruções na exata ordem em que aparecem.

Ao final, você terá o sistema inteiro rodando na internet.

---

## 🟢 Etapa 1: Criando o Banco e as Tabelas (SQL)

1. Acesse sua conta no site oficial: [supabase.com](https://supabase.com).
2. Clique no botão de criar **New Project**.
3. Escolha o nome, defina uma senha forte para o banco (guarde essa senha!) e selecione uma região próxima de você (ex: "São Paulo").
4. Aguarde de 2 a 3 minutos até o Supabase terminar de processar o servidor.
5. Quando o painel carregar, olhe o menu lateral esquerdo e clique no botão **"SQL Editor"** (ícone de código).
6. Clique no botão azul **"New Query"** (Nova Consulta).
7. Vá no seu projeto, abra a pasta `supabase` e copie todo o conteúdo do arquivo **`supabase/setup.sql`**.
8. Cole o conteúdo no campo branco do Supabase e aperte o botão verde **"Run"** (Canto inferior direito).

> ✅ **Resultado:** Se apareceu uma mensagem verde "Success", seu banco de dados, regras de segurança (RLS) e a tabela de `perfis`, `tickets` e `logs` foram criados simultaneamente!

---

## 🟢 Etapa 1.1: Tabela de Configuração do Telegram

1. Ainda no **SQL Editor**, clique em **"New Query"** novamente.
2. Copie o conteúdo do arquivo **`supabase/telegram_config.sql`** e cole no campo.
3. Aperte **"Run"**.

> ✅ **Resultado:** A tabela `telegram_config` foi criada! Ela armazena o token do bot e os IDs dos grupos do Telegram. Só o `admin_master` pode ver e editar esses dados (via aba "Telegram" na página de Gestão).

---

## 🟡 Etapa 2: Conectando o Front-end ao Novo Supabase

1. Volte ao menu lateral esquerdo do Supabase e clique na última opção: **Project Settings** (Ícone de engrenagem).
2. Clique na aba **"API"**.
3. Você verá dois campos importantes na tela:
   - **Project URL:** Copie e cole na linha 1 do seu arquivo `app/assets/js/supabase-config.js` (`const SUPABASE_URL = "SUA-URL-AQUI"`)
   - **Project API Keys (anon public):** Copie essa "chave gigantesca", e cole na linha 2 no mesmo arquivo (`const SUPABASE_KEY = "SUA-CHAVE-AQUI"`)
4. Salve o arquivo `supabase-config.js`.

> ✅ **Resultado:** Tudo que acontecer na sua tela de computador a partir de agora se comunicará com o novo banco de dados em tempo real.

---

## 🔵 Etapa 3: Criando o "Admin Master" (O seu usuário principal)

Você precisa da primeira conta para acessar a tela do Painel e criar outras contas para sua equipe.

1. No menu do Supabase, clique em **Authentication** (ícone de dois bonequinhos).
2. Aperte no botão verde no topo direito: **"Add User" -> "Create new user"**.
3. Preencha seu email oficial e uma senha segura. Clique em "Auto Confirm User".
4. Terminada a criação, no menu lateral esquerdo clique em **"Table Editor"**. Se você olhar a tabela `perfis`, verá seu E-mail lá dentro cadastrado automaticamente.
5. Mas atenção: você precisa dizer que "você" é o supremo administrador do aplicativo!
6. Ainda no **Table Editor**, clique na tabela `perfis`.
7. Na sua linha, na coluna `role`, clique nela duas vezes, mude de (usuario) para -> **`admin_master`**
8. Dê enter. 

> ✅ **Resultado:** Agora, você pode abrir o `index.html` do seu site, usar esse login que você gerou, entrar no painel e ver a sua Tela de Gestão para cadastrar toda a sua equipe, escolhendo se os próximos membros serão `usuario` (que atende ligações) ou `admin` (supervisores).

---

## 🟣 Etapa 4: Configurando o Telegram e Segredos

### Opção A — Via Interface (Recomendado) 🖥️

O Token do Bot e os IDs dos Grupos do Telegram podem ser configurados **diretamente pela aba "Telegram"** na página de Gestão do sistema (acessível apenas pelo `admin_master`).

1. Faça login no sistema como `admin_master`.
2. Acesse a página **Gestão** → aba **Telegram**.
3. Preencha o **Token do Bot** (obtido via @BotFather no Telegram).
4. Preencha os **Chat IDs** de cada grupo regional.
5. Clique em **"Salvar Configurações"**.

> ✅ Pronto! As Edge Functions lerão esses valores automaticamente do banco de dados.

### Opção B — Via Linha de Comando (Secrets) 💻

Se preferir configurar via terminal (método tradicional), instale o `Supabase CLI`:

1. Instale a ferramenta: visite a [documentação do CLI](https://supabase.com/docs/guides/cli/getting-started).
2. Faça login: `supabase login`
3. Vincule o projeto: `supabase link --project-ref [ID-DO-SEU-PROJETO]`
4. Defina os Segredos:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN="1234567:AAHeXXXX-sua-chave-do-bot-aqui"

supabase secrets set TELEGRAM_GROUP_SUL="-4669081387"
supabase secrets set TELEGRAM_GROUP_NORTE="-4987567355"
supabase secrets set TELEGRAM_GROUP_SERRA="-4813404862"
supabase secrets set TELEGRAM_GROUP_TAQUARI="-4812450134"
```

> 💡 **Nota:** Se ambos forem configurados (banco + Secrets), o sistema prioriza os valores do banco de dados.

### Segredos adicionais (apenas via CLI)

O Google Service Account para a planilha precisa ser configurado via CLI:

```bash
supabase secrets set GOOGLE_SPREADSHEET_ID="1Iap-MczsJ8NbrpvoFmIAJ_HwgF_CJkhmfJCgIYVnkSE"

supabase secrets set GOOGLE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"seu-projeto","private_key":"..."}'
```

---

## 🔴 Etapa 5: Subindo (Deploying) as Edge Functions para a Nuvem Deno

Com todos os Segredos configurados globalmente no servidor, você só precisa mandar os seus códigos para dentro deles! 

Dê o deploy (Envio à nuvem) de todas as cinco funções assim:

```bash
supabase functions deploy enviar-telegram --no-verify-jwt
supabase functions deploy salvar-encerrado --no-verify-jwt 
supabase functions deploy resumo-diario --no-verify-jwt
supabase functions deploy create-user --no-verify-jwt
supabase functions deploy delete-user --no-verify-jwt
```
> *(Obs: o `--no-verify-jwt` não retira a segurança do seu Auth, apenas diz para a nuvem não fazer verificações duplas em rotas que o código da aplicação já lida sozinho)*

**💥 Tudo concluído! 💥**
O banco de dados, regras de segurança, login blindado, formulário e bots do Telegram/Planilha estão rodando. Você pode hospedar o Front-End no GitHub Pages, Cloudflare Pages ou Vercel.

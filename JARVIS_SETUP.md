# 🤖 JARVIS v2.0 — Guia de Setup (passo a passo destrinchado)

> **Tempo estimado:** ~30 min se for a primeira vez. ~10 min se já fez antes.
> **Pré-requisito:** ter acesso ao painel da OpenAI Platform, ao n8n (`148.230.93.235:5678`), ao Hostinger (phpMyAdmin) e ao painel do UAZAPI.

---

## 📋 Os 3 workflows — entenda primeiro

> **Pergunta comum:** "Por que 3 JSONs? São 3 workspaces separados?"
>
> **Resposta:** Não. São **3 workflows separados dentro da mesma instância do n8n**. Cada um tem trigger e função distintas. Você importa os 3 e ativa os 3.

| Arquivo | Trigger | Função | Quando dispara |
|---|---|---|---|
| **`JARVIS_MAIN.json`** | Webhook (UAZAPI) | Chatbot principal — responde @Jarvis no WhatsApp | A cada mensagem com `@Jarvis` no grupo |
| **`JARVIS_DAILY.json`** | Cron | Briefing matinal nos 3 grupos | 8h BRT, segunda a sexta |
| **`JARVIS_OVERDUE_CHASE.json`** | Cron | Cobra tasks com prazo vencido | 9h, 13h, 17h, 21h BRT (dias úteis) |

Os 3 são independentes — não conversam entre si. Apenas leem/escrevem na mesma API do Cockpit e na mesma tabela MySQL.

---

# PASSO 1 — Aplicar a tabela MySQL no Hostinger

## 1.1 — Abre o phpMyAdmin do Hostinger

1. Loga no painel Hostinger
2. Vai em **Bases de Dados → phpMyAdmin** (ou MySQL → Manage)
3. Seleciona o database do Cockpit (deve ser algo tipo `u123456_cockpit`)

## 1.2 — Cola o SQL

1. Clica na aba **SQL** (no topo do phpMyAdmin)
2. Abre o arquivo `public/api/migrations/2026_04_jarvis_memory.sql` no seu editor
3. Copia **todo o conteúdo** e cola na caixa SQL do phpMyAdmin
4. Clica em **Executar** (canto inferior direito)

✅ Resultado esperado: 3 tabelas criadas — `jarvis_conversations`, `jarvis_message_log`, `jarvis_groups`. A última já vem com 3 linhas (os 3 grupos atuais).

> **Se der erro de "Table already exists":** tudo bem, o `IF NOT EXISTS` cuida disso. Pode ignorar.
> **Se der erro de FK ou collation:** me avisa o erro exato.

---

# PASSO 2 — Criar o Vector Store na OpenAI (UI)

> Aqui é o "cérebro de conhecimento" do Jarvis. Sobe os arquivos `.md` da pasta `knowledge/` e a OpenAI faz a indexação automática.

## 2.1 — Acessa a OpenAI Platform

1. Vai em **https://platform.openai.com**
2. Loga com a conta da Angel Fly
3. No menu lateral esquerdo, clica em **Storage** → **Vector stores**
4. Clica no botão **+ Create**

## 2.2 — Configura o Vector Store

- **Name:** `Jarvis Knowledge Base`
- **Expires after:** _Never_ (deixa em branco se não der opção)
- Clica **Create**

✅ Vai aparecer um ID começando com `vs_` (ex: `vs_abc123def456`). **Anota esse ID** — você vai usar no passo 3.3. Não precisa salvar em variável de ambiente.

## 2.3 — Sobe os 9 arquivos da pasta `knowledge/`

Ainda na tela do Vector Store recém-criado:

1. Clica em **+ Add files** (ou "Files" → "Upload")
2. Seleciona estes **9 arquivos** do projeto (segura Ctrl/Cmd para múltipla seleção):

```
knowledge/jarvis_assistant.md
knowledge/groups/angelfly.md
knowledge/groups/garlic.md
knowledge/groups/ernesto.md
knowledge/team/gabriel.md
knowledge/team/rodrigo.md
knowledge/company/stack.md
knowledge/company/workflow_pm.md
knowledge/company/tone_guide.md
```

3. Clica **Attach** (ou Upload)
4. Aguarda ~30s — o status de cada arquivo deve passar de _Processing_ para _Completed_ (verde) ✅

> **Se algum arquivo der erro:** geralmente é encoding. Reabrir, salvar como UTF-8 e re-subir.

---

# PASSO 3 — Criar o Assistant na OpenAI (UI)

## 3.1 — Acessa a tela de Assistants

1. Ainda em **https://platform.openai.com**
2. Menu lateral → **Assistants**
3. Clica **+ Create**

## 3.2 — Configurações básicas

| Campo | Valor |
|---|---|
| **Name** | `Jarvis PM` |
| **Model** | `gpt-4o` (importante — não use mini) |
| **Temperature** | `0.7` |
| **Top P** | `1` (default) |

## 3.3 — Instructions

1. Abre o arquivo `knowledge/jarvis_assistant.md` no seu editor
2. Copia **todo o conteúdo** (Ctrl+A / Cmd+A)
3. Cola no campo **Instructions** do Assistant

> Esse markdown é o "system prompt" do Jarvis — define personalidade, regras e exemplos.

## 3.4 — Tools — habilitar o `file_search`

Na seção **Tools**:

1. **Liga** o toggle **File search** (ON)
2. Em **Vector stores**, seleciona o vector store que você criou no passo 2.2 (`Jarvis Knowledge Base`)

## 3.5 — Tools — adicionar as 10 funções

Ainda em **Tools**, clica **+ Functions** e adiciona estas 10 (uma por uma — é trabalhoso mas só faz uma vez):

> 💡 **Atalho:** abre o arquivo `JARVIS_TOOLS_SCHEMAS.json` (gerado abaixo automaticamente — está incluído neste mesmo guia abaixo) e cola cada bloco JSON.

Para cada função, clica **+ Function** e cola o JSON dela:

<details>
<summary><b>1. create_task</b> — clique pra ver o JSON</summary>

```json
{
  "name": "create_task",
  "description": "Criar uma task no Cockpit",
  "parameters": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "description": { "type": "string" },
      "project_name": { "type": "string" },
      "priority": { "type": "string", "enum": ["low","medium","high"] },
      "deadline": { "type": "string", "description": "YYYY-MM-DD" },
      "assigned_to_name": { "type": "string" }
    },
    "required": ["title"]
  }
}
```
</details>

<details>
<summary><b>2. create_ticket</b></summary>

```json
{
  "name": "create_ticket",
  "description": "Criar um ticket (bug/problema) no Cockpit",
  "parameters": {
    "type": "object",
    "properties": {
      "subject": { "type": "string" },
      "description": { "type": "string" },
      "category": { "type": "string", "enum": ["bug","change_request","support","other"] },
      "priority": { "type": "string", "enum": ["low","medium","high"] },
      "client_name": { "type": "string" },
      "project_name": { "type": "string" }
    },
    "required": ["subject"]
  }
}
```
</details>

<details>
<summary><b>3. create_project</b></summary>

```json
{
  "name": "create_project",
  "description": "Criar um novo projeto no Cockpit",
  "parameters": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "client_name": { "type": "string" },
      "scope_description": { "type": "string" },
      "payment_type": { "type": "string", "enum": ["one-time","recurring"] },
      "total_budget": { "type": "number" }
    },
    "required": ["name","client_name"]
  }
}
```
</details>

<details>
<summary><b>4. create_payment_incoming</b></summary>

```json
{
  "name": "create_payment_incoming",
  "description": "Lançar pagamento que cliente fez ou deve",
  "parameters": {
    "type": "object",
    "properties": {
      "description": { "type": "string" },
      "amount": { "type": "number" },
      "client_name": { "type": "string" },
      "status": { "type": "string", "enum": ["pending","paid","overdue"] }
    },
    "required": ["amount","client_name"]
  }
}
```
</details>

<details>
<summary><b>5. create_payment_outgoing</b></summary>

```json
{
  "name": "create_payment_outgoing",
  "description": "Lançar pagamento que a Angel Fly deve a profissional/fornecedor",
  "parameters": {
    "type": "object",
    "properties": {
      "description": { "type": "string" },
      "amount": { "type": "number" },
      "recipient_name": { "type": "string" }
    },
    "required": ["amount","recipient_name"]
  }
}
```
</details>

<details>
<summary><b>6. create_quote</b></summary>

```json
{
  "name": "create_quote",
  "description": "Criar um orçamento/proposta",
  "parameters": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "description": { "type": "string" },
      "client_name": { "type": "string" },
      "amount": { "type": "number" },
      "valid_until": { "type": "string", "description": "YYYY-MM-DD" }
    },
    "required": ["title","client_name","amount"]
  }
}
```
</details>

<details>
<summary><b>7. list_projects</b></summary>

```json
{
  "name": "list_projects",
  "description": "Listar projetos ativos no Cockpit (para resolver nomes/contexto)",
  "parameters": { "type": "object", "properties": {} }
}
```
</details>

<details>
<summary><b>8. list_users</b></summary>

```json
{
  "name": "list_users",
  "description": "Listar membros da equipe (para atribuir tasks)",
  "parameters": { "type": "object", "properties": {} }
}
```
</details>

<details>
<summary><b>9. get_overdue_tasks</b></summary>

```json
{
  "name": "get_overdue_tasks",
  "description": "Listar tasks com deadline vencido",
  "parameters": {
    "type": "object",
    "properties": {
      "group_context": { "type": "string", "enum": ["angelfly","garlic","ernesto","all"] }
    }
  }
}
```
</details>

<details>
<summary><b>10. get_today_briefing</b></summary>

```json
{
  "name": "get_today_briefing",
  "description": "Resumo de tasks/tickets para hoje de um grupo",
  "parameters": {
    "type": "object",
    "properties": {
      "group_context": { "type": "string", "enum": ["angelfly","garlic","ernesto"] }
    },
    "required": ["group_context"]
  }
}
```
</details>

## 3.6 — Salvar e copiar o ID

1. No topo da tela, clica **Save** (ou _Create assistant_)
2. Vai aparecer um ID começando com `asst_` (ex: `asst_abc123def456`)
3. **Anota esse ID** — você vai precisar no Passo 4

✅ Assistant criado.

---

# PASSO 4 — Configurar o n8n

## 4.1 — Acessar o painel do n8n

1. Abre `http://148.230.93.235:5678` no navegador
2. Loga (você já tem a conta admin)

## 4.2 — Setar 2 variáveis de ambiente

> **Você só precisa setar 2 valores no n8n** — todos os outros tokens (Cockpit, UAZAPI) já estão hardcoded nos JSONs.

**Caminho A — via UI do n8n (se sua versão tem):**
1. Settings → Variables (ou Environment)
2. Adiciona:
   - `OPENAI_API_KEY` = (sua chave OpenAI — pega em https://platform.openai.com/api-keys)
   - `JARVIS_ASSISTANT_ID` = (o `asst_xxx` que você anotou no passo 3.6)

**Caminho B — via SSH no VPS (se Caminho A não existir):**

```bash
ssh root@148.230.93.235
# Localizar o docker-compose.yml do n8n
cd /root  # ou wherever o n8n está
nano docker-compose.yml
```

Adiciona dentro de `environment:` do serviço n8n:

```yaml
environment:
  - OPENAI_API_KEY=sk-proj-xxxxx
  - JARVIS_ASSISTANT_ID=asst_xxxxx
```

Salva (Ctrl+O, Enter, Ctrl+X) e:

```bash
docker compose up -d
```

✅ n8n reinicia com as novas variáveis.

## 4.3 — Importar os 3 workflows

Para **CADA** um dos 3 arquivos JSON:

1. No painel do n8n, clica em **Workflows** (menu lateral)
2. Botão **+ Add workflow** → **Import from file**
3. Escolhe o arquivo:
   - **Primeiro:** `n8n/JARVIS_MAIN.json`
   - **Segundo:** `n8n/JARVIS_DAILY.json`
   - **Terceiro:** `n8n/JARVIS_OVERDUE_CHASE.json`
4. **Importa**

## 4.4 — Ativar os 3 workflows

Para CADA workflow recém-importado:

1. Abre o workflow
2. No canto superior direito, **liga o toggle** "Active" (cinza → verde)
3. Salva (Ctrl+S)

✅ Os 3 workflows estão ativos. O DAILY e o OVERDUE_CHASE já vão começar a rodar nos horários programados. O MAIN espera o webhook chegar.

## 4.5 — Pegar a URL do Webhook do MAIN

Esse é o **passo mais importante** — é a URL que o UAZAPI vai chamar:

1. Abre o workflow **JARVIS_MAIN**
2. Clica no nó **"UAZAPI Webhook"** (o primeiro, à esquerda)
3. No painel à direita, vai aparecer **2 URLs**:
   - **Test URL** (só funciona quando você clica em "Listen for test event")
   - **Production URL** ← **essa é a que você quer**
4. Copia a **Production URL** — algo tipo:
   ```
   http://148.230.93.235:5678/webhook/jarvis-main
   ```
5. Guarda essa URL pro próximo passo

> **IMPORTANTE:** se o n8n estiver com domínio (ex: `n8n.angelfly.io`), use o domínio em vez do IP. Senão usa IP mesmo.

---

# PASSO 5 — Apontar o Webhook no UAZAPI

> Agora a gente faz o UAZAPI mandar todas as mensagens de WhatsApp pro novo webhook do Jarvis MAIN.

## 5.1 — Painel do UAZAPI

1. Acessa o painel do UAZAPI (https://angelfly.uazapi.com ou painel admin que vocês usam)
2. Vai em **Webhooks** (ou "Configurações de Webhook")
3. Encontra o webhook atual (do Jarvis v1) — vai estar apontando pra alguma URL antiga
4. **Edita** ou **substitui** pela Production URL que você copiou no passo 4.5

Se o painel UAZAPI for via API, manda este `curl`:

```bash
curl -X POST "https://angelfly.uazapi.com/webhook" \
  -H "token: a232b655-1733-46c1-b872-1f82782b9cbe" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://148.230.93.235:5678/webhook/jarvis-main",
    "events": ["messages"],
    "excludeMessages": ["fromMe"]
  }'
```

Substitua a URL pela que veio do passo 4.5.

✅ Pronto. UAZAPI agora manda toda mensagem nova pro Jarvis v2.

---

# PASSO 6 — Desativar o Jarvis v1 (importante!)

> Se não desativar, vai ter 2 Jarvis respondendo a mesma mensagem.

1. No n8n, encontra o workflow antigo (provavelmente nome "Jarvis v22.2" ou similar)
2. **Desliga o toggle Active** (verde → cinza)
3. Mesma coisa pra qualquer workflow daily antigo

> 💡 **NÃO DELETA** ainda — deixa desativado por uns 2-3 dias. Se algo der errado no v2, você reativa o v1 e volta a operar.

---

# PASSO 7 — Testar

No grupo do WhatsApp da Angel Fly, manda:

```
@Jarvis ping
```

⏱️ Em 3-8 segundos deve responder algo tipo:

```
Tô aqui, chefe. Operacional total. O que vai cair hoje?
```

Se respondeu ✅ — Jarvis v2 está vivo.

Próximos testes:

```
@Jarvis criar task pra ajustar o checkout do Garlic, atribui pro Rodrigo, prazo sexta
```

Resposta esperada:
```
Feito ✅
Task: "Ajustar checkout do Garlic"
Projeto: Garlic'n Lemons SaaS · Rodrigo · prazo 25/04
```

E confere no Cockpit em `https://cockpit.angelfly.io/admin/tasks` — a task tem que estar lá.

```
@Jarvis o que tem pra hoje?
```

Vai chamar o tool `get_today_briefing` e listar o que está pra hoje.

---

# 🆘 Troubleshooting

| Problema | Diagnóstico | Solução |
|---|---|---|
| Jarvis não responde **nada** | UAZAPI não tá enviando webhook | Verifica passo 5.1 — testa o webhook batendo manualmente com `curl -X POST` na URL |
| Responde mas **erra projeto** | Vector store desatualizado | Re-sobe `knowledge/groups/*.md` no Vector Store (passo 2.3) |
| **"Function call failed"** ou erro 500 | Cockpit API caiu OU token errado | Testa `curl -H "Authorization: Bearer 5415d97c..." https://cockpit.angelfly.io/api/projects` — se 401, token tá errado; se 500, API tá com bug |
| Polling fica preso (Run nunca termina) | Run da OpenAI travou | Cancela manualmente em platform.openai.com → Threads → encontra a thread |
| Erro **"Assistant ID not found"** | Var `JARVIS_ASSISTANT_ID` não setada ou errada | Volta passo 4.2 e confere |
| 2 respostas pra mesma mensagem | Jarvis v1 ainda ativo | Volta passo 6 e desativa o v1 |
| Tabela `jarvis_conversations` not found | Migration não rodou | Volta passo 1 |
| **"Authorization required"** ao tentar criar Assistant | OpenAI key sem permissão de Assistant | Verifica que sua org tem acesso a Assistants v2 |

Logs detalhados de cada execução: **n8n → Workflows → Jarvis Main → Executions** (filtra por timestamp).

---

# 🔄 Como atualizar o conhecimento depois

Quando quiser atualizar regras, novos clientes, novo membro de equipe etc:

1. Edita o `.md` em `knowledge/`
2. Vai no Vector Store (passo 2.1)
3. **Deleta** a versão antiga do arquivo
4. **Sobe** a nova versão

OU mais rápido: deletar tudo e re-subir os 9 (passo 2.3 inteiro). Demora 1 minuto.

---

# 📌 Resumo dos IDs/URLs que você vai colecionando

Anota num bloco de notas pra não perder:

```
✅ VECTOR_STORE_ID:    vs_____________________________
✅ ASSISTANT_ID:        asst____________________________
✅ N8N_WEBHOOK_URL:     http://148.230.93.235:5678/webhook/jarvis-main
✅ Cockpit API token:   5415d97c31b4ab3198a637234c4a76af86bd3d28ee9ebe9fe9c348f2f2c54c16
✅ UAZAPI token:        a232b655-1733-46c1-b872-1f82782b9cbe
```

---

*Setup v2.0 — Abril 2026 — Angel Fly Digital Solutions*

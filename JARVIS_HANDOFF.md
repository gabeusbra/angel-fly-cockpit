# 🤖 JARVIS v2.0 — Handoff de Treinamento Completo
## Angel Fly Digital Solutions — Gerente de Projetos IA Interno

> **Versão atual:** v2.0 (Abril 2026) — refatoração completa
> **Versão anterior:** v1.0 monolítica (33 nós, 1200+ linhas de JS inline) — substituída
> **Para subir do zero:** ver `JARVIS_SETUP.md`
> **Para entender personalidade/tom:** ver `knowledge/company/tone_guide.md`

---

## 1. Quem é o Jarvis

**Jarvis** é o gerente de projetos automatizado da **Angel Fly Digital Solutions**. Ele opera como um PM interno que vive em 3 grupos do WhatsApp, e tudo que for jogado lá com `@Jarvis` ele organiza, registra e empurra pro **Cockpit** (sistema interno de gestão).

**Personalidade central:** brasileiro informal, ~50% de humor, direto, inteligente. Nada de chapa-branca. Detalhes em `knowledge/company/tone_guide.md`.

---

## 2. Arquitetura v2.0 — Nova

```
┌──────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  WhatsApp        │     │  n8n              │     │  OpenAI            │
│  (3 grupos)      │────▶│  JARVIS_MAIN      │────▶│  Assistant API v2  │
│  via UAZAPI      │     │  (~18 nós)        │     │  + Vector Store    │
└──────────────────┘     └─────────┬─────────┘     │  (knowledge/*)     │
                                   │               └─────────┬──────────┘
                                   │                         │
                                   │   tool calls            │
                                   ▼                         ▼
                         ┌──────────────────┐     ┌────────────────────┐
                         │  Cockpit API     │◀────│  Function tools    │
                         │  (PHP/MySQL)     │     │  (10 funções)      │
                         └─────────┬────────┘     └────────────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │  jarvis_         │
                         │  conversations   │
                         │  (memória        │
                         │   persistente)   │
                         └──────────────────┘
```

**Mudanças v1 → v2:**

| Aspecto | v1 (antigo) | v2 (novo) |
|---|---|---|
| Workflow principal | 33 nós, 1440 linhas | ~18 nós, lógica modular |
| LLM | gpt-4o-mini, Chat Completions | **gpt-4o, Assistant API v2** |
| Conhecimento | Hardcoded no system prompt | **Vector Store nativo (file_search)** |
| Memória | n8n `staticData` (volátil) | **MySQL `jarvis_conversations` + thread persistente OpenAI** |
| Roteamento de intent | OpenAI + Parse + Override (3 camadas brigando) | **Function calling nativo (10 tools)** |
| Resolução de projeto/usuário | Fuzzy match em JS inline | Tools `list_projects` / `list_users` chamados pelo LLM |
| Cobrança de atrasados | ❌ não existia | ✅ Workflow `JARVIS_OVERDUE_CHASE` (a cada 4h) |
| Briefing matinal | Existe, hardcoded | Atualizado, lê de `jarvis_groups`, mais humor |
| Atribuição de tasks | Pouco confiável | Robusta via tool `list_users` + `assigned_to_name` |

---

## 3. Os 3 Workflows do n8n

### 3.1 — `n8n/JARVIS_MAIN.json`
- **Trigger:** Webhook do UAZAPI (mensagem chega no WhatsApp)
- **Função:** Conversa principal. Processa @menções, chama Assistant, executa tools, responde.
- **Fluxo simplificado:**
  1. Recebe webhook → parseia mensagem
  2. Filtra: só processa se `@Jarvis` mencionado
  3. Busca/cria thread persistente da OpenAI (via tabela MySQL)
  4. Manda mensagem pro thread, cria `run` do Assistant
  5. **Loop de polling** (Wait 2s → Get Status):
     - `requires_action` → Tool Dispatcher (Code) chama Cockpit API → submit outputs → loop
     - `completed` → pega última mensagem → envia pro WhatsApp
     - `failed` → manda mensagem de erro
  6. Persiste thread_id na tabela `jarvis_conversations`

### 3.2 — `n8n/JARVIS_DAILY.json`
- **Trigger:** Cron 8h BRT, segunda a sexta
- **Função:** Briefing matinal nos 3 grupos
- **Conteúdo:** Atrasadas, Hoje, Tickets recentes, Status geral
- **Personalidade:** rotação aleatória de saudações e fechamentos pra não soar robotizado

### 3.3 — `n8n/JARVIS_OVERDUE_CHASE.json` *(NOVO)*
- **Trigger:** Cron 9h/13h/17h/21h BRT, dias úteis
- **Função:** Cobra tasks com `deadline` vencido
- **Comportamento:** Pula grupo sem atrasados (não enche). Tom escala com dias de atraso (👀 → 🕸️ → 🚨 → 💀)

---

## 4. As 10 Tools do Assistant

Definidas em `JARVIS_SETUP.md` (passo 2.3). Resumo:

| Tool | Endpoint Cockpit | Quando usar |
|---|---|---|
| `create_task` | `POST /api/tasks` | Algo a fazer / desenvolver |
| `create_ticket` | `POST /api/tickets` | Bug ou problema reportado |
| `create_project` | `POST /api/projects` | Cliente novo / escopo grande |
| `create_payment_incoming` | `POST /api/payments_incoming` | Cliente pagou ou deve |
| `create_payment_outgoing` | `POST /api/payments_outgoing` | A gente deve pagar terceiro |
| `create_quote` | `POST /api/quotes` | Orçamento pra cliente |
| `list_projects` | `GET /api/projects` | Resolver "aquele projeto" |
| `list_users` | `GET /api/users` | Atribuir task a alguém |
| `get_overdue_tasks` | `GET /api/tasks` (filtra) | "O que tá atrasado?" |
| `get_today_briefing` | `GET /api/tasks + /api/tickets` | "O que tem pra hoje?" |

O **Tool Dispatcher** (Code node no JARVIS_MAIN) é quem traduz tool calls da OpenAI em chamadas HTTP pro Cockpit, e devolve o resultado pro Assistant continuar.

---

## 5. Knowledge Base (Vector Store)

Ficheiros em `knowledge/`. Anexados ao Vector Store da OpenAI no setup. O Assistant usa `file_search` automaticamente quando precisa.

```
knowledge/
├── jarvis_assistant.md           # Instructions do Assistant (system prompt)
├── groups/
│   ├── angelfly.md               # Grupo Angel Fly Marketing Geral
│   ├── garlic.md                 # Grupo Garlic'n Lemons
│   └── ernesto.md                # Grupo Ernesto's Pizza
├── team/
│   ├── gabriel.md                # Founder, dev backend
│   └── rodrigo.md                # Dev frontend
└── company/
    ├── stack.md                  # Stack técnico de cada projeto
    ├── workflow_pm.md            # Como a Angel Fly trabalha
    └── tone_guide.md             # Manual de tom/personalidade
```

**Atualizar conhecimento:**
1. Edite o `.md`
2. Re-suba pro Vector Store (script no `JARVIS_SETUP.md` passo 7)
3. Pronto — Assistant pega via `file_search` na próxima mensagem

---

## 6. Banco de Dados — Memória Persistente

Migration: `public/api/migrations/2026_04_jarvis_memory.sql`

3 tabelas:

### `jarvis_conversations`
- 1 linha por chat WhatsApp
- Guarda `openai_thread_id` (a thread persistente)
- `humor_level`, `last_project_id`, `pending_state_json` (multi-turno)

### `jarvis_message_log`
- Append-only, audit trail de todas as mensagens
- Útil pra debug e analytics

### `jarvis_groups`
- Mapeia `wa_chat_id` → `context_key` (angelfly/garlic/ernesto/...)
- Permite adicionar grupo novo sem editar workflow

Aplicar via:
```bash
curl -X GET "https://cockpit.angelfly.io/api/migrate" \
  -H "Authorization: Bearer 5415d97c31b4ab3198a637234c4a76af86bd3d28ee9ebe9fe9c348f2f2c54c16"
```
*(Atenção: o `migrate.php` precisa ser atualizado para incluir os colunas dessa migration. Ver código em `public/api/migrate.php`.)*

---

## 7. Variáveis de Ambiente do n8n

| Var | Valor |
|---|---|
| `OPENAI_API_KEY` | sua chave |
| `JARVIS_ASSISTANT_ID` | `asst_xxx` (criado no setup) |
| `JARVIS_VECTOR_STORE_ID` | `vs_xxx` |
| `COCKPIT_API_BASE` | `https://cockpit.angelfly.io/api` |
| `COCKPIT_API_TOKEN` | `5415d97c31b4ab3198a637234c4a76af86bd3d28ee9ebe9fe9c348f2f2c54c16` |
| `UAZAPI_BASE` | `https://angelfly.uazapi.com` |
| `UAZAPI_TOKEN` | `a232b655-1733-46c1-b872-1f82782b9cbe` |

⚠️ Tokens devem ficar **só** no n8n env, **nunca** em código.

---

## 8. Fluxo de Decisão (resumido)

Para cada mensagem com `@Jarvis`:

```
1. Mensagem chega
2. Identifica grupo → contexto (angelfly/garlic/ernesto)
3. Carrega thread persistente da OpenAI
4. Adiciona mensagem ao thread
5. Roda o Assistant (gpt-4o + vector store + tools)
6. Assistant decide:
   - Conversa fiada / informativo → responde direto
   - Ação registrável → chama tool(s) apropriado(s)
7. Tool Dispatcher chama Cockpit API
8. Output volta pro Assistant, que finaliza resposta
9. Resposta vai pro WhatsApp via UAZAPI
10. Estado salvo na tabela jarvis_conversations
```

---

## 9. Padrões de Comportamento

Documentados em `knowledge/company/tone_guide.md`. Resumo:

- **Curto** (3 frases ou menos)
- **Direto** (sem floreio)
- **Confirma o que fez** (com info verificável)
- **Antecipa próxima pergunta**
- **Humor natural** (~50%, calibrado pelo humor da pessoa)
- **Honesto quando não sabe** (não inventa)

Exemplos completos no `tone_guide.md` e em `knowledge/jarvis_assistant.md`.

---

## 10. Roadmap (próximas iterações)

Já implementado (v2.0):
- ✅ Vector Store / RAG nativo
- ✅ Memória persistente entre restarts
- ✅ Atribuição de tasks por nome
- ✅ Cobrança de atrasados (workflow novo)
- ✅ Briefing matinal melhorado
- ✅ Quotes/orçamentos como tool
- ✅ Pagamentos incoming + outgoing

Em consideração para v2.1+:
- ⏳ Integração direta com DB do Garlic (consultar pedidos do dia)
- ⏳ Integração com WooCommerce do Ernesto (orders, abandoned carts)
- ⏳ Notificações pra cliente direto (após approval)
- ⏳ Relatórios semanais agregados
- ⏳ Dashboard pessoal por usuário ("@Jarvis o que eu tenho hoje?" → DM individual)
- ⏳ Detecção de SLA em risco (alerta antes de vencer)
- ⏳ Sincronização Cockpit ↔ Notion ou Slack para clientes que pedirem

---

## 11. Quem mantém

- **Gabriel** — owner do código, infra, decisões de produto
- **Rodrigo** — frontend support
- **Jarvis IA** — execução, mas não auto-modificação

Para mudanças em personalidade ou comportamento → editar `knowledge/jarvis_assistant.md` ou `knowledge/company/tone_guide.md` + re-sync com Vector Store.

Para mudanças em workflow → editar JSON correspondente em `n8n/`, importar no painel do n8n.

---

## 12. Arquivos referenciados

- `JARVIS_SETUP.md` — guia passo a passo de subir do zero
- `BRAND_BOOK.md` — design system do Cockpit
- `AI_HANDOFF.md` — handoff geral do projeto Cockpit
- `knowledge/` — todo material de conhecimento do Vector Store
- `n8n/JARVIS_*.json` — os 3 workflows
- `public/api/migrations/2026_04_jarvis_memory.sql` — schema MySQL

---

*Jarvis v2.0 — Abril 2026 — Angel Fly Digital Solutions*
*Da agencia que construiu o Cockpit, pra agencia que usa o Cockpit.*

# 🛠️ Jarvis — As 10 Functions pra colar no Assistant da OpenAI

> Onde colar: **platform.openai.com → Assistants → Jarvis - AngelFly → seção Tools → botão `+ Functions`**
>
> Pra cada uma das 10:
> 1. Clica `+ Functions`
> 2. **Apaga** o exemplo `get_stock_price` que já vem
> 3. **Cola** o JSON da função abaixo
> 4. Clica **Add**
> 5. Repete pra próxima

⚠️ **Importante:** **NÃO** marca `"strict": true`. O n8n manda os argumentos com flexibilidade — strict pode quebrar.

---

## ⚡ Quickstart visual

Imagine que aparece a tela "Function · Definition" igual ao print que você mandou. Em vez do `get_stock_price`, você cola **uma** das 10 abaixo (em ordem ou em qualquer ordem — não importa):

---

## 1️⃣ create_task

```json
{
  "name": "create_task",
  "description": "Criar uma task no Cockpit. Use quando a mensagem fala em fazer/desenvolver/implementar/ajustar algo.",
  "parameters": {
    "type": "object",
    "properties": {
      "title": { "type": "string", "description": "Título curto da task" },
      "description": { "type": "string", "description": "Detalhes complementares" },
      "project_name": { "type": "string", "description": "Nome do projeto (use list_projects se houver dúvida)" },
      "priority": { "type": "string", "enum": ["low","medium","high"] },
      "deadline": { "type": "string", "description": "Formato YYYY-MM-DD" },
      "assigned_to_name": { "type": "string", "description": "Nome do membro da equipe (Gabriel, Rodrigo)" }
    },
    "required": ["title"]
  }
}
```

---

## 2️⃣ create_ticket

```json
{
  "name": "create_ticket",
  "description": "Criar um ticket no Cockpit. Use quando algo quebrou, deu erro, parou de funcionar (bug/support).",
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

---

## 3️⃣ create_project

```json
{
  "name": "create_project",
  "description": "Criar um novo projeto no Cockpit. Use para cliente novo ou escopo grande novo.",
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

---

## 4️⃣ create_payment_incoming

```json
{
  "name": "create_payment_incoming",
  "description": "Lançar pagamento que cliente fez ou deve à Angel Fly.",
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

---

## 5️⃣ create_payment_outgoing

```json
{
  "name": "create_payment_outgoing",
  "description": "Lançar pagamento que a Angel Fly deve a profissional/fornecedor externo.",
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

---

## 6️⃣ create_quote

```json
{
  "name": "create_quote",
  "description": "Criar um orçamento/proposta para cliente.",
  "parameters": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "description": { "type": "string" },
      "client_name": { "type": "string" },
      "amount": { "type": "number" },
      "valid_until": { "type": "string", "description": "Formato YYYY-MM-DD" }
    },
    "required": ["title","client_name","amount"]
  }
}
```

---

## 7️⃣ list_projects

```json
{
  "name": "list_projects",
  "description": "Listar todos os projetos ativos do Cockpit. Use para resolver 'aquele projeto X' ou validar nome antes de criar task/ticket.",
  "parameters": {
    "type": "object",
    "properties": {}
  }
}
```

---

## 8️⃣ list_users

```json
{
  "name": "list_users",
  "description": "Listar membros da equipe Angel Fly. Use para resolver atribuição quando alguém pede 'designar pro Rodrigo' etc.",
  "parameters": {
    "type": "object",
    "properties": {}
  }
}
```

---

## 9️⃣ get_overdue_tasks

```json
{
  "name": "get_overdue_tasks",
  "description": "Listar tasks com prazo (deadline) já vencido. Use quando perguntarem 'o que tá atrasado'.",
  "parameters": {
    "type": "object",
    "properties": {
      "group_context": {
        "type": "string",
        "enum": ["angelfly","garlic","ernesto","all"],
        "description": "Filtrar por grupo. Use 'all' para tudo."
      }
    }
  }
}
```

---

## 🔟 get_today_briefing

```json
{
  "name": "get_today_briefing",
  "description": "Resumo de tasks/tickets para hoje de um grupo específico. Use quando perguntarem 'o que tem pra hoje'.",
  "parameters": {
    "type": "object",
    "properties": {
      "group_context": {
        "type": "string",
        "enum": ["angelfly","garlic","ernesto"]
      }
    },
    "required": ["group_context"]
  }
}
```

---

## ✅ Conferência final

Depois de adicionar as 10, no card de Tools você deve ver:
- **File search** ✅ (com Vector Store anexado)
- **Functions** com **10 itens** listados:
  1. create_task
  2. create_ticket
  3. create_project
  4. create_payment_incoming
  5. create_payment_outgoing
  6. create_quote
  7. list_projects
  8. list_users
  9. get_overdue_tasks
  10. get_today_briefing

Depois de adicionar todas, clica **Save** no canto superior direito.

---

## 📎 Anexar o Vector Store ao Assistant

No mesmo painel do Assistant, ainda na seção **Tools**:

1. Liga o toggle **File search** (ON)
2. Clica em **+ Files** (ou no ícone de engrenagem ao lado de File search)
3. Escolhe **Use existing vector store**
4. Cola o ID: `vs_69e78be6ed1081919c99cf30e5aa4157`
5. Confirma

Agora o Assistant tem acesso aos 9 arquivos `.md` de conhecimento que você subiu.

---

## 🎯 Confirmar que tudo deu certo

Na visão geral do Assistant `Jarvis - AngelFly` (asst_M96rOKg3MHDDOdOlJwCNjC7y) você deve ver:
- **Model:** gpt-4o
- **Temperature:** 0.7
- **Instructions:** todo o conteúdo de `knowledge/jarvis_assistant.md` colado
- **Tools:** File search ✅ (1 vector store) + Functions (10)
- **Tool resources → File search → vector store_ids:** `["vs_69e78be6ed1081919c99cf30e5aa4157"]`

Se tudo isso bate ✅ — o Assistant tá pronto pra ser chamado pelo n8n.

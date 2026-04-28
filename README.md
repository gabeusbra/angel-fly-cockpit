# Angel Fly Cockpit

Sistema interno de gestão de projetos da **Angel Fly Digital Solutions**. Gerencia clientes, projetos, tasks, tickets e pagamentos. Integra com **Jarvis** — bot de PM no WhatsApp via n8n + OpenAI Assistant.

🌐 **Produção:** [cockpit.angelfly.io](https://cockpit.angelfly.io)

---

## 🏗️ Estrutura do projeto

```
.
├── src/                          ← React app (Vite + Tailwind + shadcn/ui)
│   ├── components/               ← UI components (Layout, Sidebar, etc.)
│   ├── pages/                    ← 28 páginas (Admin, Client, PM, Pro)
│   ├── api/                      ← Frontend API wrapper
│   ├── lib/                      ← Utilities, hooks, contexts
│   └── index.css                 ← Design tokens (8px grid, light/dark)
│
├── public/                       ← Static assets servidos pelo Vite
│   ├── api/                      ← Backend PHP (PDO MySQL, JWT)
│   │   ├── Entity.php            ← CRUD genérico baseado em tabela
│   │   ├── migrate.php           ← Migrações idempotentes
│   │   └── migrations/           ← SQL de migrações (jarvis_memory, etc.)
│   ├── branding/                 ← Logos
│   └── manifest.json             ← PWA
│
├── n8n/                          ← Workflows do Jarvis v2.0
│   ├── JARVIS_MAIN.json          ← Chatbot principal (webhook)
│   ├── JARVIS_DAILY.json         ← Briefing matinal (cron 8h)
│   └── JARVIS_OVERDUE_CHASE.json ← Cobrança de atrasados (cron 4h)
│
├── knowledge/                    ← Vector Store da OpenAI (Jarvis)
│   ├── jarvis_assistant.md       ← Instructions do Assistant
│   ├── groups/                   ← Memory cards dos 3 grupos WhatsApp
│   ├── team/                     ← Cards de Gabriel + Rodrigo
│   └── company/                  ← Stack, workflow PM, guia de tom
│
├── docs/                         ← Documentação e handoffs
│   ├── BRAND_BOOK.md             ← Design system completo (UI handoff)
│   ├── JARVIS_HANDOFF.md         ← Documentação do Jarvis v2.0
│   ├── JARVIS_SETUP.md           ← Setup passo-a-passo do Jarvis
│   ├── AI_HANDOFF.md             ← Handoff geral pra próximo dev/IA
│   ├── PROPOSTA_AF_*.pdf         ← Propostas comerciais
│   └── uazapi-openapi-spec.yaml  ← Spec da API UAZAPI
│
├── scripts/                      ← Scripts utilitários
│   ├── converter.py
│   ├── fix_workflow.py
│   └── test_script.js
│
├── legacy/                       ← Versões antigas (manter por referência)
│   ├── JARVIS_N8N_WORKFLOW_v1.json   ← Jarvis v1 (substituído pelo v2)
│   ├── JARVIS_DAILY_WORKFLOW_v1.json ← Daily v1 (substituído)
│   └── import_migracao_base44.sql    ← Migração legada do Base44
│
├── credentials/                  ← ⚠️ NÃO COMMITADO (gitignored)
│   └── google_oauth_client.json  ← Credenciais Google OAuth
│
├── data-backup/                  ← Exports CSV de backup do banco
│
├── .github/workflows/            ← CI/CD (deploy FTP pra Hostinger)
│
└── (configs root)                ← Vite, Tailwind, ESLint, etc.
```

---

## 🚀 Setup local

```bash
# 1. Clone
git clone https://github.com/gabeusbra/angel-fly-cockpit.git
cd angel-fly-cockpit

# 2. Instala deps
npm install

# 3. Configura env local
cat > .env.local <<EOF
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://cockpit.angelfly.io
EOF

# 4. Rode
npm run dev
```

---

## 📦 Deploy

Push pra `main` aciona automaticamente o GitHub Action em `.github/workflows/deploy.yml`, que faz build e envia via FTP pra Hostinger (`cockpit.angelfly.io`).

> ⚠️ Cliente faz mudanças diretas em produção — sempre **abrir PR** em vez de push direto pra main.

---

## 🤖 Jarvis (bot WhatsApp)

Documentação completa: [`docs/JARVIS_HANDOFF.md`](./docs/JARVIS_HANDOFF.md)
Setup passo-a-passo: [`docs/JARVIS_SETUP.md`](./docs/JARVIS_SETUP.md)
Brand Book / UI: [`docs/BRAND_BOOK.md`](./docs/BRAND_BOOK.md)

Stack: WhatsApp (UAZAPI) → n8n → OpenAI Assistant API + Vector Store → Cockpit API → MySQL

---

## 🛠️ Stack

| Camada | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + shadcn/ui + Lucide React |
| Backend | PHP 8.3 (LiteSpeed) + MySQL (PDO) |
| Auth | JWT Bearer |
| Pagamentos | Stripe |
| Auth Social | Google OAuth |
| Hospedagem | Hostinger (FTP via GitHub Actions) |
| Bot | n8n + OpenAI Assistant API |
| WhatsApp | UAZAPI |

---

## 👥 Equipe

- **Gabriel** ([gabriel@angelfly.io](mailto:gabriel@angelfly.io)) — Founder / Backend / Infra
- **Rodrigo** — Frontend / UI

Mais info em `knowledge/team/`.
